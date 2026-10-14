import re,json,itertools
from pathlib import Path
root=Path(__file__).resolve().parent.parent
src=root/'sources/responsible-safe-ai'
def clean(s):return re.sub(r'\s+',' ',s).strip()
def parse(path):
 week=int(path.name[5:7]);raw=path.read_text();events=[]
 for line in raw.splitlines():
  m=re.match(r'\s*\d+ (text|radio button|Tick box)(?: \(disabled\))? (.*)',line)
  if m:events.append((m[1],m[2]))
 # Normalize separate and merged question number markers, including markers joined to answers.
 out=[]
 for ei,(typ,text) in enumerate(events):
  if typ=='text':
   if text.startswith('Accepted answer is'):
    m=re.search(r' (\d+) \.(?: (.*))?$',text)
    if m:
     out.append((typ,text[:m.start()]));out.append(('number',m[1]));
     if m[2]:out.append(('text',m[2]))
     continue
   m=re.match(r'^(\d+)(?: \.(?: (.*))?)?$',text)
   if m and ('.' in text or (ei+1<len(events) and events[ei+1]==('text','.'))):
    out.append(('number',m[1]));
    if m[2]:out.append(('text',m[2]))
    continue
  out.append((typ,text))
 starts=[i for i,e in enumerate(out) if e[0]=='number'];qs=[]
 for k,i in enumerate(starts):
  block=out[i+1:starts[k+1] if k+1<len(starts) else len(out)]
  point=next(j for j,e in enumerate(block) if re.fullmatch(r'\d+\s+Points?',e[1]))
  prompt=clean(' '.join(t for typ,t in block[:point] if typ=='text' and t!='.'))
  optstarts=[j for j,(typ,t) in enumerate(block) if typ in ('radio button','Tick box')]
  opts=[]
  for j in optstarts:
   # Option controls may contain a summarized label; child text preserves maths.
   stop=next((z for z in range(j+1,len(block)) if block[z][0] in ('radio button','Tick box') or block[z][1].startswith('Accepted answer is')),len(block))
   children=[t for typ,t in block[j+1:stop] if typ=='text']
   opts.append({'id':chr(65+len(opts)),'text':clean(' '.join(children)) or clean(block[j][1])})
  ai=next((j for j,e in enumerate(block) if e[1].startswith('Accepted answer is')),None)
  ans=clean(' '.join(t for typ,t in block[ai:] if typ=='text').removeprefix('Accepted answer is')) if ai is not None else None
  matches=[]
  numeric=re.fullmatch(r'Type: Numeric:\s*(.+)',ans or '')
  if ans and not numeric:
   for r in range(1,len(opts)+1):
    for combo in itertools.combinations(opts,r):
     if clean(', '.join(o['text'] for o in combo))==ans:matches.append([o['id'] for o in combo])
   assert len(matches)==1,('ANSWER MISMATCH',week,k+1,ans,opts)
  qs.append(dict(id=f'w{week:02}-q{k+1:02}',number=k+1,sourceNumber=int(out[i][1]),type='numeric' if numeric else 'multiple-choice' if any(typ=='Tick box' for typ,t in block) else 'single-choice',prompt=prompt,options=opts,correctOptionIds=matches[0] if len(matches)==1 else None,correctNumericAnswer=numeric[1] if numeric else None,answerStatus='official' if numeric or len(matches)==1 else 'needs-verification' if ans else 'not-released',answerSource='course-accepted-answer' if ans else None,sourceAnswerText=ans,reference=None,note=None))
 return qs
if __name__=='__main__':
 topics=['AI capabilities & risks','Robustness & alignment','Machine unlearning','Bias & its sources','Bias in vision-language models','Data privacy','Differential privacy & fairness','Interpretability','AI policies & AGI','AI policy: expert discussion','AI governance & moral consistency','Graph explanations & representation surgery']
 weeks=[]
 overrides=json.loads((src/'question-overrides.json').read_text())
 for n in range(1,13):
  p=src/f'week-{n:02}.ax.txt'; qs=parse(p)
  assert len(qs)==(12 if n<=10 else 11 if n==11 else 10)
  for q in qs:
   if q['id'] in overrides:q.update(overrides[q['id']])
   # Matching answers mix "1 ->" and "2->"; show them uniformly after answers are matched.
   for o in q['options']:o['text']=re.sub(r'\s*->\s*',' → ',o['text'])
  meta=json.loads((src/f'week-{n:02}.source.json').read_text())
  weeks.append(dict(week=n,title=f'Week {n}',topic=topics[n-1],sourceUrl=meta['url'],sourceFile=str(p.relative_to(root)),sourceNote='Captured from current course quiz; official answers not yet released.' if n==12 else 'Questions and accepted answers captured from the current course quiz.',questions=qs))
  print('Week',n,':',len(qs),'questions')
 result=dict(course='Responsible & Safe AI Systems',courseId='noc26_cs145',collectedOn='2026-10-14',schemaVersion=2,weeks=weeks)
 (root/'data/responsible-safe-ai.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
