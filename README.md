# Recall — Study Desk

A local Next.js assignment and revision site, with subject-neutral branding so more courses can be added over time.

The first included subject is NPTEL Psychology of Learning (`noc26_hs206`): 130 questions across Weeks 0–12. Course labels and export filenames come from the dataset. The current version displays one course; a subject selector can be added when the next subject is imported.

## Run

```sh
cd study-desk
npm install
npm run dev
```

Open http://127.0.0.1:3000. Dependencies are already installed in this checkout.

Pick a week and click an option to check it against the course key. **Show answers** reveals the whole week at once. The last week and your choices are saved in the browser's local storage and are never submitted to the course.

## Data

`data/assignments.json` contains all assignments and source provenance. View it at `/assignments.json`.

Each week contains `week`, `title`, `topic`, `sourceUrl`, `sourceFile`, `sourceNote`, and `questions`. Each question includes its stable `id`, display `number`, original `sourceNumber`, `prompt`, `options` (`id` and `text`), `correctOptionIds`, `answerStatus`, and answer provenance. Unreleased answers have `correctOptionIds: null` and `answerStatus: "not-released"`.

Collected 11 October 2026:

- Weeks 0–11 have 120 official answers from course-linked solutions or accepted answers shown on the course quiz.
- Week 7 uses the current quiz and accepted answers. Its linked solution PDF is from 2025 and differs from the current questions; that older PDF is retained only as a source record.
- Week 6, question 7: the PDF prints answer A but describes option D. The course quiz explicitly accepts D, which is used here.
- Week 12 has all ten questions, but its official key was not released at collection time. No answers were inferred from submitted choices. Update `sources/week-12.json` after the official key is available, then rebuild the aggregate.
- Week 1 repeats source question number 6; display numbers are normalized to 1–10 while preserving `sourceNumber`.

Sources are stored locally under `sources/`. Raw browser saves are ignored by Git and are not served by the app. Sanitized question-image copies are retained for Weeks 7 and 12. Source spelling and wording are retained, with whitespace and blank markers normalized.

## Rebuild data and verify

PDF text was extracted with `pdftotext -layout`. To recreate the aggregate from the extracted sources and curated current-quiz transcriptions:

```sh
python3 scripts/import-assignments.py
npm test
npm run build
```

The importer uses Python's standard library. `sources/quiz-verification.json` records live course checks for Weeks 6 and 11. Tests check completeness, valid answer references, the known source discrepancies, and absence of saved account/submission metadata.

Built with Next.js App Router, TypeScript, and locally bundled DM Sans and Manrope fonts. No external service is required at runtime.
