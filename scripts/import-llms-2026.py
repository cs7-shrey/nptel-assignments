import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / 'sources/large-language-models-2026'
course_id = 'noc26_cs171'

raw = json.loads((src / 'question-bank.json').read_text())
topics = raw['weeks']
by_week = {}
for index, (week, prompt, options, answers) in enumerate(raw['questions'], 1):
    assert isinstance(week, int) and 1 <= week <= 12, (index, week)
    assert prompt.strip(), index
    assert 2 <= len(options) <= 5, (index, options)
    assert len(set(options)) == len(options), (index, 'duplicate options')
    assert answers and all(isinstance(a, int) and 0 <= a < len(options) for a in answers), (index, answers)
    assert len(set(answers)) == len(answers), (index, answers)
    by_week.setdefault(week, []).append(dict(prompt=prompt, options=options, answers=sorted(answers)))

weeks = []
for n in range(1, 13):
    raw_questions = by_week.get(n, [])
    assert raw_questions, n
    questions = []
    for i, q in enumerate(raw_questions, 1):
        options = [dict(id=chr(65 + j), text=text) for j, text in enumerate(q['options'])]
        correct = [options[j]['id'] for j in q['answers']]
        questions.append(dict(
            id=f'w{n:02}-q{i:02}', number=i, sourceNumber=i,
            type='multiple-choice' if len(correct) > 1 else 'single-choice',
            prompt=q['prompt'], options=options, correctOptionIds=correct,
            correctNumericAnswer=None, answerStatus='official', answerSource='practice-lab-answer-key',
            sourceAnswerText=', '.join(options[j]['text'] for j in q['answers']),
            reference=None, note=None,
        ))
    weeks.append(dict(
        week=n,
        title=f'Week {n}',
        topic=topics[str(n)],
        sourceUrl=f'https://onlinecourses.nptel.ac.in/e-learning/preview/{course_id}',
        sourceFile='sources/large-language-models-2026/question-bank.json',
        sourceNote=('Questions and answer key extracted from the supplied 2026 LLM Assignment Practice Lab question bank; '
                    'no course export, account, or submission data is involved.'),
        questions=questions,
    ))

result = dict(
    course='Introduction to Large Language Models (LLMs) \u00b7 2026',
    courseId=course_id,
    collectedOn='2026-10-21',
    schemaVersion=2,
    weeks=weeks,
)
(root / 'data/large-language-models-2026.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
for week in weeks:
    print('Week', week['week'], ':', len(week['questions']), 'questions')
print('Total:', sum(len(w['questions']) for w in weeks), 'questions')
