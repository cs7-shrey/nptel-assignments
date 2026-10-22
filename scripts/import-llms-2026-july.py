import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src_dir = root / "sources/large-language-models-2026-july"
raw = json.loads((src_dir / "question-bank.json").read_text())
course_id = raw["courseId"]
source_file = "sources/large-language-models-2026-july/question-bank.json"
source_url = "https://onlinecourses.nptel.ac.in/e-learning/preview/noc26_cs171"
expected = {4: 9, 5: 8, 6: 8, 7: 8, 8: 10, 9: 10, 10: 10, 11: 10}

by_week = {}
for index, row in enumerate(raw["questions"], 1):
    week = row["week"]
    assert week in expected, (index, week)
    assert row["prompt"].strip(), index
    options = [text.strip() for text in row.get("options", [])]
    answers = row.get("answers", [])
    numeric = row.get("numeric")
    if numeric is not None:
        assert not options and not answers, (index, "numeric rows carry no options or answers")
    else:
        assert 2 <= len(options) <= 5, (index, options)
        assert all(options), index
        assert len(set(options)) == len(options), (index, "duplicate options")
        assert answers and all(isinstance(a, int) and 0 <= a < len(options) for a in answers), (index, answers)
        assert len(set(answers)) == len(answers), (index, answers)
    by_week.setdefault(week, []).append(row)

weeks = []
for week in sorted(expected):
    rows = by_week.get(week, [])
    assert len(rows) == expected[week], (week, len(rows))
    questions = []
    for i, row in enumerate(rows, 1):
        assert row.get("number") == i, (week, i, row.get("number"))
        options = [dict(id=chr(65 + j), text=text) for j, text in enumerate(row.get("options", []))]
        answers = row.get("answers", [])
        correct = [options[j]["id"] for j in answers]
        numeric = row.get("numeric")
        question = dict(
            id=f"w{week:02}-q{i:02}",
            number=i,
            sourceNumber=i,
            type="numeric" if numeric is not None else "multiple-choice" if len(correct) > 1 else "single-choice",
            prompt=row["prompt"],
            options=options,
            correctOptionIds=correct if numeric is None else None,
            correctNumericAnswer=str(numeric) if numeric is not None else None,
            answerStatus="official",
            answerSource="assignment-solution-pdf",
            sourceAnswerText=", ".join(options[j]["text"] for j in answers) if numeric is None else str(numeric),
            reference=None,
            note=None,
        )
        for key in ("context", "code", "continuation", "contextTable"):
            if key in row:
                question[key] = row[key]
        questions.append(question)
    meta = raw["weeks"][str(week)]
    weeks.append(dict(
        week=week,
        title=f"Week {week}",
        topic=meta["topic"],
        sourceUrl=source_url,
        sourceFile=source_file,
        sourceNote=("Questions, options and official answers transcribed from the supplied July 2026 "
                    "assignment solution PDFs (weeks 4–11). Solution/explanation text is not imported."),
        questions=questions,
    ))

result = dict(
    course=raw["course"],
    courseId=course_id,
    collectedOn=raw["collectedOn"],
    schemaVersion=2,
    weeks=weeks,
)
(root / "data/large-language-models-2026-july.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
for week in weeks:
    print("Week", week["week"], ":", len(week["questions"]), "questions")
print("Total:", sum(len(w["questions"]) for w in weeks), "questions")
