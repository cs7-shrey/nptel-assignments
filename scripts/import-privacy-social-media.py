"""Import Weeks 1–11 from sanitized current-quiz captures and verified display assets."""
import itertools
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'sources/privacy-social-media'
TOPICS = ['Social media & Python setup', 'Social media APIs', 'Misinformation & privacy',
          'Privacy, pictures & data analysis', 'Policing & social media', 'E-crime & network analysis',
          'Link farming, nudges & phishing', 'Identity resolution & anonymous networks',
          'Location-based privacy', 'Location, usernames & misinformation', 'Course review']
CONTEXT_STARTS = ['Read through the report', "Suppose you're working on a project", 'Imagine you have a NumPy array', 'Please go through the following paper']

def clean(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse(week, overrides):
    events = []
    raw = (SRC / f'week-{week:02}.ax.txt').read_text()
    for line in raw.splitlines():
        m = re.match(r'\s*\d+ (text|radio button|Tick box)(?: \(disabled\))? (.*)', line)
        if m:
            events.append((m[1], m[2]))
        else:
            m = re.match(r'\s*\d+ link Description: (.*?), Value:', line)
            if m:
                events.append(('text', m[1].strip()))
    normalized = []
    for i, (kind, text) in enumerate(events):
        if kind == 'text':
            if text.startswith('Accepted answer is'):
                m = re.search(r' (\d+) \.(?: (.*))?$', text)
                if m:
                    normalized.extend([('text', text[:m.start()]), ('number', m[1])])
                    if m[2]: normalized.append(('text', m[2]))
                    continue
            m = re.fullmatch(r'(\d+)(?: \.(?: (.*))?)?', text)
            if m and ('.' in text or (i + 1 < len(events) and events[i + 1] == ('text', '.'))):
                normalized.append(('number', m[1]))
                if m[2]: normalized.append(('text', m[2]))
                continue
        normalized.append((kind, text))
    starts = [i for i, event in enumerate(normalized) if event[0] == 'number']
    questions, contexts = [], []
    for k, start in enumerate(starts):
        block = normalized[start + 1:starts[k + 1] if k + 1 < len(starts) else len(normalized)]
        number = int(normalized[start][1])
        assert number == k + 1, (week, number)
        qid = f'w{week:02}-q{number:02}'
        override = overrides.get(qid, {})
        point = next(i for i, (_, text) in enumerate(block) if re.fullmatch(r'\d+\s+Points?', text))
        prompt = clean(' '.join(text for kind, text in block[:point] if kind == 'text' and text != '.'))
        option_starts = [i for i, (kind, _) in enumerate(block) if kind in ('radio button', 'Tick box')]
        options = []
        for i in option_starts:
            end = next((j for j in range(i + 1, len(block)) if block[j][0] in ('radio button', 'Tick box') or block[j][1].startswith('Accepted answer is')), len(block))
            text = clean(' '.join(text for kind, text in block[i + 1:end] if kind == 'text')) or block[i][1]
            options.append({'id': chr(65 + len(options)), 'text': text})
        options = override.get('options', options)
        answer_index = next(i for i, (_, text) in enumerate(block) if text.startswith('Accepted answer is'))
        answer = clean(' '.join(text for kind, text in block[answer_index:] if kind == 'text').removeprefix('Accepted answer is'))
        for marker in CONTEXT_STARTS:
            if marker in answer:
                answer, context = answer.split(marker, 1)
                context = marker + context
                bounds = re.search(r'(\d+)\s*-\s*(\d+)', context)
                assert bounds, context
                contexts.append((int(bounds[1]), int(bounds[2]), context))
                answer = answer.strip()
                break
        answer = override.get('sourceAnswerText', answer)
        if 'correctOptionIds' in override:
            correct = override['correctOptionIds']
        else:
            matches = []
            for size in range(1, len(options) + 1):
                for combo in itertools.combinations(options, size):
                    if clean(', '.join(o['text'] for o in combo)) == answer:
                        matches.append([o['id'] for o in combo])
            assert len(matches) == 1, ('Answer mismatch', qid, answer, options)
            correct = matches[0]
        q = dict(id=qid, number=number, sourceNumber=number,
                 type='multiple-choice' if any(kind == 'Tick box' for kind, _ in block) else 'single-choice',
                 prompt=prompt, options=options, correctOptionIds=correct, answerStatus='official',
                 answerSource='course-accepted-answer', sourceAnswerText=answer, reference=None, note=None)
        q.update(override)
        questions.append(q)
    for first, last, context in contexts:
        for q in questions:
            if first <= q['number'] <= last: q['context'] = context
    if week == 10:
        for q in questions[:3]: q['context'] = 'Paper: “Beware of What You Share: Inferring Home Location in Social Networks”.'
    assert len(questions) == 10, (week, len(questions))
    assert all(q['prompt'] and q['options'] and all(o['text'] != '[image option]' for o in q['options']) for q in questions)
    return questions

if __name__ == '__main__':
    overrides = json.loads((SRC / 'question-overrides.json').read_text())
    links = json.loads((SRC / 'solution-links.json').read_text())
    weeks = []
    for week in range(1, 12):
        meta = json.loads((SRC / f'week-{week:02}.source.json').read_text())
        item = dict(week=week, title=f'Week {week}', topic=TOPICS[week - 1], sourceUrl=meta['url'],
                    sourceFile=f'sources/privacy-social-media/week-{week:02}.ax.txt', answersVerifiedOn=meta['collectedOn'],
                    sourceNote='Questions and official accepted answers captured from the current course quiz. Linked solutions and saved quiz HTML restore figures, tables and truncated text; see question-overrides.json and html-verification.json.',
                    questions=parse(week, overrides))
        if str(week) in links: item['solutionUrl'] = links[str(week)]
        weeks.append(item)
        print(f'Week {week}: {len(item["questions"])} questions with official answers')
    data = dict(course='Privacy and Security in Online Social Media', courseId='noc26_cs141',
                collectedOn='2026-10-17', schemaVersion=3, weeks=weeks)
    (ROOT / 'data/privacy-social-media.json').write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
