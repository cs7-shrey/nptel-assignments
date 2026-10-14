# Recall — Study Desk

A local Next.js assignment and revision site, with subject-neutral branding so more courses can be added over time.

Switch subjects from the course name in the sidebar:

- Psychology of Learning (`noc26_hs206`): 130 questions across Weeks 0–12.
- Responsible & Safe AI Systems (`noc26_cs145`): 141 questions across Weeks 1–12.

Every week has its own URL, such as `/responsible-safe-ai/week-3`; `/<subject>` opens its first week, and `/` reopens the last week you visited (Psychology Week 0 on a first visit). Each course keeps its own answers and checked questions, so switching subjects preserves progress. Existing Psychology progress is restored without migration steps.

## Run

```sh
cd study-desk
npm install
npm run dev
```

Open http://127.0.0.1:3000. Dependencies are already installed in this checkout.

Pick a week and click a single-choice option to check it against the course key. For multiple-choice questions, select all your choices and click **Check answer**; only the exact full set counts as correct. Numeric questions accept equivalent number formats and use **Check answer** too. **Show answers** reveals the whole week at once, and **Reset** clears the current week. Progress is stored locally under `recall:<courseId>` and is never submitted to the course.

## Data

`data/assignments.json` contains Psychology, and `data/responsible-safe-ai.json` contains Responsible AI. Both retain source provenance. `/assignments.json` returns `{ "courses": [...] }`; use `/assignments.json?course=noc26_cs145` (or `noc26_hs206`) for one course. An unknown course returns 404.

Each week contains `week`, `title`, `topic`, `sourceUrl`, `sourceFile`, `sourceNote`, and `questions`. Each question includes its stable `id`, display `number`, original `sourceNumber`, `prompt`, `options` (`id` and `text`), `correctOptionIds`, `answerStatus`, and answer provenance. Question types are `single-choice`, `multiple-choice`, and `numeric`. Numeric questions use `correctNumericAnswer` and an empty options array. An optional `contextTable` holds matching-question tables. Unreleased answers have null answer fields and `answerStatus: "not-released"`.

Psychology, collected 11 October 2026:

- Weeks 0–11 have 120 official answers from course-linked solutions or accepted answers shown on the course quiz.
- Week 7 uses the current quiz and accepted answers. Its linked solution PDF is from 2025 and differs from the current questions; that older PDF is retained only as a source record.
- Week 6, question 7: the PDF prints answer A but describes option D. The course quiz explicitly accepts D, which is used here.
- Week 12 has all ten questions, but its official key was not released at collection time. No answers were inferred from submitted choices. Update `sources/week-12.json` after the official key is available, then rebuild the aggregate.
- Week 1 repeats source question number 6; display numbers are normalized to 1–10 while preserving `sourceNumber`.

Responsible AI, collected 14 October 2026:

- Weeks 1–10 contain 12 questions each, Week 11 contains 11, and Week 12 contains 10. The course outline has no Week 0 assignment.
- Weeks 1–11 have 131 published accepted answers, including three numeric questions. Week 12’s key was not released when collected; its due date is 14 October 2026.
- Questions and accepted answers were captured from the current course quiz accessibility text. Saved selections and submission metadata are excluded. Mathematical notation is normalized for readability; source answer text remains available for auditing.
- The Week 3 matching table and Weeks 6–7 exponents/fractions were recovered or verified against course-linked solution PDFs. `sources/responsible-safe-ai/question-overrides.json` records these display corrections; official answer choices are not inferred or changed.

Sources are stored locally under `sources/`. Raw browser saves are ignored by Git and are not served by the app. Sanitized question-image copies are retained for Weeks 7 and 12. Source spelling and wording are retained, with whitespace and blank markers normalized.

## Rebuild data and verify

PDF text was extracted with `pdftotext -layout`. To recreate the aggregate from the extracted sources and curated current-quiz transcriptions:

```sh
python3 scripts/import-assignments.py
python3 scripts/import-responsible-ai.py
npm test
npm run build
```

Both importers use Python's standard library. `sources/quiz-verification.json` records live course checks for Weeks 6 and 11. Tests check completeness, valid answer references, the known source discrepancies, and absence of saved account/submission metadata.

Tests also cover Responsible AI completeness, exact-set and numeric grading, legacy Psychology progress, per-course storage keys, and week-only resets.

To add another subject, add its dataset to `data/`, register it with a URL slug in `lib/courses.ts`, and include its source provenance and checks.

Built with Next.js App Router, TypeScript, and locally bundled DM Sans and Manrope fonts. No external service is required at runtime; Vercel Web Analytics reports page views when deployed on Vercel.
