# Recall — Study Desk

A local Next.js assignment and revision site, with subject-neutral branding so more courses can be added over time.

Switch subjects from the course name in the sidebar:

- Psychology of Learning (`noc26_hs206`): 130 questions across Weeks 0–12.
- Responsible & Safe AI Systems (`noc26_cs145`): 141 questions across Weeks 1–12.
- Privacy and Security in Online Social Media (`noc26_cs141`): 110 questions across Weeks 1–11; Weeks 0 and 12 are excluded.
- VLSI Design Flow: RTL to GDS (`noc23_ee137`): 120 questions across Weeks 1–12.
- Introduction to Large Language Models (LLMs) · 2025 (`noc25_cs45`): 109 questions across Weeks 1–12, with 7–10 per week.
- Introduction to Large Language Models (LLMs) · 2026 (`noc26_cs171`): 109 questions across Weeks 1–12, with 7–10 per week and 18 multi-select.

Every week has its own URL, such as `/responsible-safe-ai/week-3`; `/<subject>/all` puts every week's questions on one page, `/<subject>` opens its first week, and `/` reopens the last week, all-questions page, or quiz you visited (Psychology Week 0 on a first visit). Each course keeps its own answers and checked questions, so switching subjects preserves progress. Existing Psychology progress is restored without migration steps.

## Run

```sh
cd study-desk
npm install
npm run dev
```

Open http://127.0.0.1:3000. Dependencies are already installed in this checkout.

The subject picker remembers the week each course was last on, and a course that runs in more than one year (Introduction to LLMs) expands in place to a year picker that pre-selects the year opened last. The top-right calculator button opens a draggable scientific calculator powered by mathjs.

Pick a week and click a single-choice option to check it against the course key. For multiple-choice questions, select all your choices and click **Check answer**; only the exact full set counts as correct. Numeric questions accept equivalent number formats and use **Check answer** too. **Show answers** reveals the whole week at once, and **Reset** clears the current week. Progress is stored locally under `recall:<courseId>` and is never submitted to the course.

**All weeks** (`/<subject>/all`, first entry in the sidebar) shows every question in the subject on one page, mixed across weeks instead of grouped by week. Each card keeps its week label, and the order is seeded per course, so a reload draws the same mix until **Shuffle** is pressed. It reads and writes the same answers as the week pages, so a question answered here shows up in its week and the shared score counts both. **Reset all** clears the whole subject.

**Quiz** (`/<subject>/quiz`, bottom of the sidebar) mixes questions from the weeks you pick: all keyed questions from those weeks are shuffled and the first *max questions* kept (all by default). Each question's options are shuffled too, with "all of the given" kept last, and option letters follow the displayed order. Answers reveal on selection, **Reset** clears them, and **New quiz** draws a fresh set. Once every question is answered, **View incorrect answers** reviews the wrong ones. Each subject keeps one quiz under `recall:quiz:<courseId>`, separate from week progress. Weeks without a released key can't be picked.

## Data

`data/assignments.json` contains Psychology, `data/responsible-safe-ai.json` contains Responsible AI, `data/privacy-social-media.json` contains Privacy and Security in Online Social Media, `data/vlsi-design-flow.json` contains VLSI Design Flow, `data/large-language-models.json` contains the 2025 Introduction to Large Language Models export, and `data/large-language-models-2026.json` contains its 2026 question bank. All retain source provenance. `/assignments.json` returns `{ "courses": [...] }`; use `/assignments.json?course=noc26_cs145` (or `noc26_hs206`, `noc26_cs141`, `noc23_ee137`, `noc25_cs45`, `noc26_cs171`) for one course. An unknown course returns 404.

Each week contains `week`, `title`, `topic`, `sourceUrl`, `sourceFile`, `sourceNote`, and `questions`. Each question includes its stable `id`, display `number`, original `sourceNumber`, `prompt`, `options` (`id` and `text`), `correctOptionIds`, `answerStatus`, and answer provenance. Question types are `single-choice`, `multiple-choice`, and `numeric`. Numeric questions use `correctNumericAnswer` and an empty options array. An optional `contextTable` holds matching-question tables; optional `context`, `code`, `figures`, `image`, and `continuation` fields carry passages, code listings, figures, and text that follows a figure; options may include `code` or an `image`. Unreleased answers have null answer fields and `answerStatus: "not-released"`.

Psychology, collected 11 October 2026:

- Weeks 0–12 have 130 official answers from course-linked solutions or accepted answers shown on the course quiz.
- Week 7 uses the current quiz and accepted answers. Its linked solution PDF is from 2025 and differs from the current questions; that older PDF is retained only as a source record.
- Week 6, question 7: the PDF prints answer A but describes option D. The course quiz explicitly accepts D, which is used here.
- Week 12’s ten official accepted answers were verified on 15 October 2026. `sources/week-12.json` retains the key and links to its sanitized quiz capture; no answers were inferred from submitted choices.
- Week 1 repeats source question number 6; display numbers are normalized to 1–10 while preserving `sourceNumber`.

Responsible AI, collected 14 October 2026:

- Weeks 1–10 contain 12 questions each, Week 11 contains 11, and Week 12 contains 10. The course outline has no Week 0 assignment.
- Weeks 1–12 have 141 published accepted answers, including three numeric questions. Week 12’s ten keys, including two multi-select answers, were verified on 15 October 2026.
- Questions and accepted answers were captured from the current course quiz accessibility text. Saved selections and submission metadata are excluded. Mathematical notation is normalized for readability; source answer text remains available for auditing.
- The Week 3 matching table and Weeks 6–7 exponents/fractions were recovered or verified against course-linked solution PDFs. `sources/responsible-safe-ai/question-overrides.json` records these display corrections; official answer choices are not inferred or changed.

Privacy and Security in Online Social Media, collected 17 October 2026:

- Weeks 1–11 contain ten questions each, all with official accepted answers. Week 0 and Week 12 are intentionally excluded. Its URL is `/privacy-social-media/week-1`, and it also supports quiz mode.
- Sanitized quiz captures, linked solutions and provenance live in `sources/privacy-social-media/`. Some linked documents are labelled 2023; they supplement matching figures, code and tables while the current quiz supplies the keys.
- `html-verification.json` records the image-based Week 7 Q1 accepted answer, the full Week 7 Q3 list, and the full Week 9 Q10 key truncated in the accessibility text. `question-overrides.json` preserves these corrections and readable code/table formatting.
- Sixteen question figures and three image options live in `public/questions/privacy-social-media/`. Shared passages stay with each related question when quiz mode shuffles them. Figures open at full size when clicked.
- Questions may include `context`, `code`, and `figures`; options may include `code` or an `image`.

VLSI Design Flow, collected 17 October 2026:

- Weeks 1–12 contain ten questions each. The course outline has no Week 0 assignment. Assignments ran from 9 August to 18 October 2023.
- The source is `Assignment_5.pdf`, a twelve-page browser export of the closed assignments (`sources/vlsi-design-flow/Assignment_5.pdf`). The export is image-only, so questions, options, and accepted answers were transcribed page by page into `sources/vlsi-design-flow/week-NN.json`. Account details, scores, and saved submission state from the export are excluded; accepted answers are kept as printed.
- Six questions reference a figure and three include a Verilog or SDC listing. Figures were cropped from the export into `public/vlsi-design-flow/`; code listings are stored as text and shown in a code block. The Week 5 ROBDD question renders its formula as `f = ab(a' + b')`.
- Source spelling and wording are retained, including `create_toggle` as a distractor and `Starling Netlist` in the LVS question. Only whitespace and stray marks were normalized.

Introduction to Large Language Models · 2025, collected 21 October 2026:

- Weeks 1–12 contain 7–10 questions each (109 in total), with official accepted answers. Assignments ran from 5 February to 16 April 2025. Week counts and multi-select keys follow the export.
- The source is a twelve-page PDF export of the closed assignments (`sources/large-language-models/assignments-jan-2025.pdf`). Questions, options, and accepted answers were transcribed page by page into `sources/large-language-models/week-NN.json`; saved submission state and account details are excluded.
- The export mixes question types: 87 single-choice, 21 multiple-choice, and one numeric question (Week 7's `numpy.einsum` question, answer 23). Week 4's word-word matrix is shared by two questions and is served as an image from `public/large-language-models/`; Week 7's einsum call is stored as a code listing.
- Source quirks are kept: Week 6 Q5 prints only two unmasked attention scores although its accepted weights cover three positions, and that is recorded in the question's `note`. The Jan 2025 course code is `noc25_cs45`; the assignment export itself does not print a course code.

Introduction to Large Language Models · 2026, collected 21 October 2026:

- Weeks 1–12 contain 7–10 questions each (109 in total), 18 of them multi-select. The bank was supplied as a standalone HTML practice lab.
- Only its questions and answer key were imported — the practice lab's selector, timer-free test flow, scoring screens and review UI are not part of the app; the existing Recall week, all-weeks and quiz views are used instead.
- The source of record is `sources/large-language-models-2026/question-bank.json`, a verbatim extraction of the HTML's `Q` array together with its `weekNames` topics. `scripts/import-llms-2026.py` groups it into weeks and derives option ids from the stored answer indices.
- Answers are the practice lab's key, recorded as `answerSource: "practice-lab-answer-key"`. `scripts/llms-2026.test.mjs` re-checks every bank row against the generated data. The 2026 course code is `noc26_cs171`.

Sources are stored locally under `sources/`, with the Privacy sources under `sources/privacy-social-media/`, the VLSI export and its per-week transcript under `sources/vlsi-design-flow/`, and the LLM sources under `sources/large-language-models/` (2025 export) and `sources/large-language-models-2026/` (2026 question bank). Raw browser saves are ignored by Git and are not served by the app. Sanitized question-image copies are retained for Weeks 7 and 12 of Psychology; Privacy figures and options are served from `public/questions/privacy-social-media/`, the VLSI figures from `public/vlsi-design-flow/`, and the LLM matrix from `public/large-language-models/`. Source spelling and wording are retained, with whitespace and blank markers normalized.

## AI theory summaries

Each week page has a summary box directly below the week heading and topic. It is generated on demand from that week's question text, context, code, figures' alt text, and options using the Gemini API. The prompt explicitly asks for a deep explanation of the underlying theory and forbids answering the questions or naming a correct option; answer-key fields are deliberately left out of the request. Generation uses the model's high thinking level, streams the response, and sets `store: false`.

Open **Settings** (the gear beside the theme toggle) or visit `/settings` to add one or more Gemini API keys. Each key has a name, a key, and a model; the active key is used for summaries. Free AI Studio keys and free-tier models such as Gemini 3.8 Flash work, and a custom model id can be entered. The settings page links to the [Google AI Studio API keys console](https://aistudio.google.com/apikey), can test a key, and can clear cached summaries.

Keys are stored only in this browser under `recall:gemini-keys` and are sent directly from the browser to `generativelanguage.googleapis.com`; they never pass through a Recall server. Anyone with access to the browser profile can read a saved key.

Summaries are cached per course and week under `recall:summary:<courseId>:week-<n>:v1`. The card shows the model and generation date, can be expanded or collapsed in place, and can be regenerated. **Maximize** opens a floating, nearly full-screen reading card with a close X; expand/collapse remains an inline control. The summary box appears only on week pages — the all-weeks and quiz views are unchanged. Free-tier rate limits and data-use terms are set by Google.

## Rebuild data and verify

PDF text was extracted with `pdftotext -layout`. To recreate the aggregate from the extracted sources and curated current-quiz transcriptions:

```sh
python3 scripts/import-assignments.py
python3 scripts/import-responsible-ai.py
python3 scripts/import-privacy-social-media.py
python3 scripts/import-vlsi.py
python3 scripts/import-llms.py
python3 scripts/import-llms-2026.py
npm test
npm run build
```

The importers use Python's standard library. `sources/quiz-verification.json` records live course checks for Weeks 6 and 11. Tests check completeness, valid answer references, the known source discrepancies, and absence of saved account/submission metadata.

Tests also cover Responsible AI completeness, exact-set and numeric grading, legacy Psychology progress, per-course storage keys, week-only resets, the all-weeks mix (every question kept, stable per seed, reset all), Privacy image/table/code completeness and quiz isolation, VLSI completeness, figure assets, and code listings, the 2025 LLM export (multi-select keys, the numeric einsum answer, the shared matrix figure), and the 2026 LLM bank (every supplied row reproduced exactly, multi-select keys, no practice-lab UI state).

`scripts/gemini.test.mjs` checks that the summary prompt includes the week's question text and options but never answer-key fields, that the stream reader accumulates text and ignores thought summaries, that the request asks for high thinking with `store: false`, and that API errors map to actionable messages.

To add another subject, add its dataset to `data/`, register it with a URL slug in `lib/courses.ts`, and include its source provenance and checks. `/all` and the week routes follow from the new slug.

Built with Next.js App Router, TypeScript, and locally bundled DM Sans and Manrope fonts. The study app needs no external service at runtime; the optional AI theory summaries call Gemini directly from the browser with the reader's own API key. Vercel Web Analytics reports page views when deployed on Vercel.
