"""Parse downloaded, course-linked solution PDFs (text extracted with pdftotext -layout)."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
TOPICS=['Getting started','Psychology of Learning','Major Theories of Learning','Memory & Cognition','Thinking & Cognition','Motivation of Learning','Emotional Intelligence & Learning','Learning & Instruction','Learning & Pedagogy','Psychology of E-Learning','Effective Learning: Assessment & Feedback','Learning & Social Cognition','Learning for Sustainability']
def clean(s):return re.sub(r'\s+',' ',s).strip()
def norm(s):return re.sub(r'[^a-z0-9]','',s.lower())
ids=json.loads((ROOT/'sources/drive-files.json').read_text());weeks=[]
for week in range(12):
 text=(ROOT/f'sources/week-{week:02}-solution.txt').read_text()
 text=re.sub(r'^.*(?:NPTEL Online Certification Courses|Indian Institute of Technology Kharagpur|QUESTION \d+:).*$', '',text,flags=re.M)
 starts=list(re.finditer(r'^\s*(\d{1,2})\)\s*',text,re.M));questions=[]
 for i,m in enumerate(starts):
  block=text[m.end():starts[i+1].start() if i+1<len(starts) else len(text)]
  answer=re.search(r'Ans\.\s*([a-dA-D]?)\s*=\s*(.*?)(?=\s*Solution:|\*{3,}|$)',block,re.S)
  assert answer,(week,i,block)
  body=block[:answer.start()]; opts=list(re.finditer(r'^\s*([A-Da-d])\.\s*',body,re.M));assert len(opts) in (2,4),(week,i)
  prompt=clean(body[:opts[0].start()]);options=[{'id':o[1].upper(),'text':clean(body[o.end():opts[j+1].start() if j+1<len(opts) else len(body)])} for j,o in enumerate(opts)]
  letter=answer[1].upper();answer_text=clean(answer[2]);matching=[o['id'] for o in options if norm(o['text'])==norm(answer_text)]
  conflict=bool(letter and matching and letter not in matching)
  accepted=[letter] if letter else matching
  if conflict:accepted=[]
  note=None
  if conflict:note=f'The linked solution is inconsistent: it labels the answer {letter}, but its answer text is "{answer_text}" (option {matching[0]}). Awaiting quiz-page verification.'
  if not letter:note='The solution omits the answer letter; matched its answer text to the option.'
  solution=re.search(r'Solution:\s*(.*?)(?=\*{3,}|$)',block,re.S)
  questions.append({'id':f'w{week:02}-q{i+1:02}','number':i+1,'sourceNumber':int(m[1]),'type':'single-choice','prompt':prompt,'options':options,'correctOptionIds':accepted or None,'answerStatus':'needs-verification' if conflict else 'official','answerSource':'course-linked-solution','sourceAnswerLabel':letter or None,'sourceAnswerText':answer_text,'reference':clean(solution[1]) if solution else None,'note':note})
 assert len(questions)==10,(week,len(questions))
 weeks.append({'week':week,'title':f'Week {week}'+(' · Practice' if week==0 else ''),'topic':TOPICS[week],'sourceUrl':f'https://drive.google.com/file/d/{ids[str(week)]}/view','sourceFile':f'sources/week-{week:02}-solution.pdf','sourceNote':'Linked by the current course; PDF cover says July 2025.' if week==7 else None,'questions':questions})
weeks[7]=json.loads((ROOT/'sources/week-07.json').read_text())
weeks.append(json.loads((ROOT/'sources/week-12.json').read_text()))
verifications=json.loads((ROOT/'sources/quiz-verification.json').read_text())
for w in weeks:
 if str(w['week']) in verifications:
  v=verifications[str(w['week'])]
  w['quizUrl']=v['url']
  for q,a in zip(w['questions'],v['answers']):
   if q['answerStatus']=='needs-verification':q['note']='The solution PDF prints A but describes option D. The course quiz explicitly accepts D; that verified key is used here.'
   q['correctOptionIds']=[a]
   q['answerStatus']='official'
   q['answerSource']='course-accepted-answer'
output={'course':'Psychology of Learning','courseId':'noc26_hs206','collectedOn':'2026-10-11','schemaVersion':1,'weeks':weeks}
(ROOT/'data/assignments.json').write_text(json.dumps(output,indent=2,ensure_ascii=False)+'\n')
print('Parsed',sum(len(w['questions']) for w in weeks),'questions across',len(weeks),'weeks')
for w in weeks:
 for q in w['questions']:
  if q.get('note'):print(w['week'],q['number'],q['note'])
