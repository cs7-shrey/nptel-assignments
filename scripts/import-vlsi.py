import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / 'sources/vlsi-design-flow'
course_id = 'noc23_ee137'


def only(hits, label):
    assert len(hits) == 1, (label, hits)
    return hits[0]


weeks = []
for n in range(1, 13):
    raw = json.loads((src / f'week-{n:02}.json').read_text())
    assert raw['week'] == n, (n, raw['week'])
    assert len(raw['questions']) == 10, (n, len(raw['questions']))
    questions = []
    for i, q in enumerate(raw['questions'], 1):
        options = [dict(id=chr(65 + j), text=text) for j, text in enumerate(q['options'])]
        assert len(options) == 4 and len({o['text'] for o in options}) == 4, (n, i, options)
        correct = only([o for o in options if o['text'] == q['accepted']], (n, i))
        question = dict(id=f'w{n:02}-q{i:02}', number=i, sourceNumber=i, type='single-choice', prompt=q['prompt'])
        if 'image' in q:
            image = q['image']
            assert image['src'].startswith('/') and image['alt'].strip(), (n, i)
            assert (root / 'public' / image['src'].lstrip('/')).is_file(), (n, i, image['src'])
            question['image'] = image
        if 'continuation' in q:
            question['continuation'] = q['continuation']
        if 'code' in q:
            question['code'] = q['code']
        question.update(options=options, correctOptionIds=[correct['id']], correctNumericAnswer=None,
                        answerStatus='official', answerSource='course-accepted-answer',
                        sourceAnswerText=q['accepted'], reference=None, note=None)
        questions.append(question)
    weeks.append(dict(
        week=n,
        title=f'Week {n}',
        topic=raw['topic'],
        sourceUrl=f'https://onlinecourses.nptel.ac.in/e-learning/course/{course_id}',
        sourceFile='sources/vlsi-design-flow/Assignment_5.pdf',
        sourceNote=(f'Questions and accepted answers transcribed from the {raw["title"]} page of the course export '
                    f'(due {raw["due"]}). Saved submission state and account details from the export are excluded.'),
        questions=questions,
    ))

result = dict(
    course='VLSI Design Flow: RTL to GDS',
    courseId=course_id,
    collectedOn='2026-10-17',
    schemaVersion=2,
    weeks=weeks,
)
(root / 'data/vlsi-design-flow.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
for week in weeks:
    print('Week', week['week'], ':', len(week['questions']), 'questions')
print('Total:', sum(len(w['questions']) for w in weeks), 'questions')
