import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / 'sources/large-language-models'
course_id = 'noc25_cs45'


def option_ids(texts):
    ids = [chr(65 + i) for i in range(len(texts))]
    assert len(set(texts)) == len(texts), ('duplicate options', texts)
    return ids


weeks = []
for n in range(1, 13):
    raw = json.loads((src / f'week-{n:02}.json').read_text())
    assert raw['week'] == n, (n, raw['week'])
    assert raw['questions'], n
    questions = []
    for i, q in enumerate(raw['questions'], 1):
        numeric = q.get('numeric', False)
        options = [dict(id=oid, text=text) for oid, text in zip(option_ids(q['options']), q['options'])]
        if numeric:
            assert not options and len(q['accepted']) == 1, (n, i)
            correct_ids, correct_numeric, kind = None, q['accepted'][0], 'numeric'
        else:
            hits = [o['id'] for o in options if o['text'] in q['accepted']]
            assert len(hits) == len(q['accepted']) and len(set(hits)) == len(hits), (n, i, q['accepted'], options)
            correct_ids = sorted(hits)
            correct_numeric = None
            kind = 'multiple-choice' if len(correct_ids) > 1 else 'single-choice'
        question = dict(id=f'w{n:02}-q{i:02}', number=i, sourceNumber=i, type=kind, prompt=q['prompt'])
        if 'image' in q:
            image = q['image']
            assert image['src'].startswith('/') and image['alt'].strip(), (n, i)
            assert (root / 'public' / image['src'].lstrip('/')).is_file(), (n, i, image['src'])
            question['image'] = image
        if 'continuation' in q:
            question['continuation'] = q['continuation']
        if 'code' in q:
            question['code'] = q['code']
        question.update(
            options=options,
            correctOptionIds=correct_ids,
            correctNumericAnswer=correct_numeric,
            answerStatus='official',
            answerSource='course-accepted-answer',
            sourceAnswerText=', '.join(q['accepted']),
            reference=None,
            note=q.get('note'),
        )
        questions.append(question)
    weeks.append(dict(
        week=n,
        title=f'Week {n}',
        topic=raw['topic'],
        sourceUrl=f'https://onlinecourses.nptel.ac.in/{course_id}/preview',
        sourceFile='sources/large-language-models/assignments-jan-2025.pdf',
        sourceNote=(f'Questions and accepted answers transcribed from the {raw["title"]} page of the course export '
                    f'(due {raw["due"]}). Saved submission state and account details from the export are excluded.'),
        questions=questions,
    ))

result = dict(
    course='Introduction to Large Language Models (LLMs)',
    courseId=course_id,
    collectedOn='2026-10-21',
    schemaVersion=2,
    weeks=weeks,
)
(root / 'data/large-language-models.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
for week in weeks:
    print('Week', week['week'], ':', len(week['questions']), 'questions')
print('Total:', sum(len(w['questions']) for w in weeks), 'questions')
