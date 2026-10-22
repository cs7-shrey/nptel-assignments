import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { hasAnswer, isCorrect } from '../lib/study.ts';

const bank = JSON.parse(readFileSync(new URL('../data/large-language-models-2026-july.json', import.meta.url), 'utf8'));
const source = JSON.parse(readFileSync(new URL('../sources/large-language-models-2026-july/question-bank.json', import.meta.url), 'utf8'));
const questions = bank.weeks.flatMap(w => w.questions);

test('the July 2026 LLM edition covers the supplied weeks 4-11', () => {
  assert.equal(bank.course, 'Introduction to Large Language Models (LLMs) \u00b7 2026 (July)');
  assert.equal(bank.courseId, 'noc26_cs171_july');
  assert.deepEqual(bank.weeks.map(w => w.week), [4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(bank.weeks.map(w => w.questions.length), [9, 8, 8, 8, 10, 10, 10, 10]);
  assert.equal(questions.length, 73);
  assert.equal(new Set(questions.map(q => q.id)).size, 73);
  assert.equal(bank.weeks[0].topic, 'Embeddings & tokenization');
  assert.equal(bank.weeks[7].topic, 'KG embeddings & hierarchies');
  for (const week of bank.weeks) for (const [i, q] of week.questions.entries()) {
    const n = String(week.week).padStart(2, '0'), k = String(i + 1).padStart(2, '0');
    assert.equal(q.id, `w${n}-q${k}`);
    assert.equal(q.number, i + 1);
    assert.equal(q.sourceNumber, i + 1);
    assert(q.prompt.trim().length > 10);
    assert.equal(q.answerStatus, 'official');
    assert.equal(q.answerSource, 'assignment-solution-pdf');
    assert(hasAnswer(q));
    if (q.type === 'numeric') {
      assert.equal(q.options.length, 0);
      assert.equal(q.correctOptionIds, null);
      assert(q.correctNumericAnswer.trim() !== '');
      assert(isCorrect(q, q.correctNumericAnswer));
    } else {
      assert.equal(q.options.length, new Set(q.options.map(o => o.text)).size);
      assert(q.options.length >= 2 && q.options.length <= 5);
      assert(q.correctOptionIds.length >= 1);
      for (const id of q.correctOptionIds) assert(q.options.some(o => o.id === id));
      assert.equal(q.type, q.correctOptionIds.length > 1 ? 'multiple-choice' : 'single-choice');
      assert(isCorrect(q, q.type === 'multiple-choice' ? q.correctOptionIds : q.correctOptionIds[0]));
    }
    assert.equal(q.sourceAnswerText, q.type === 'numeric'
      ? q.correctNumericAnswer
      : q.correctOptionIds.map(id => q.options.find(o => o.id === id).text).join(', '));
  }
  for (const week of bank.weeks) {
    assert(week.topic.trim().length > 3);
    assert.equal(week.sourceFile, 'sources/large-language-models-2026-july/question-bank.json');
    assert.match(week.sourceUrl, /^https:\/\/onlinecourses\.nptel\.ac\.in\//);
  }
});

test('every row of the supplied July source bank is represented exactly', () => {
  const byWeek = new Map();
  for (const row of source.questions) {
    if (!byWeek.has(row.week)) byWeek.set(row.week, []);
    byWeek.get(row.week).push(row);
  }
  for (const week of bank.weeks) {
    const rows = byWeek.get(week.week) ?? [];
    assert.equal(week.questions.length, rows.length);
    rows.forEach((row, index) => {
      const q = week.questions[index];
      assert.equal(q.prompt, row.prompt);
      assert.deepEqual(q.options.map(o => o.text), row.options);
      if (row.numeric != null) {
        assert.equal(q.type, 'numeric');
        assert.equal(q.correctNumericAnswer, String(row.numeric));
        assert.equal(q.correctOptionIds, null);
      } else {
        assert.deepEqual(q.correctOptionIds, row.answers.map(i => String.fromCharCode(65 + i)));
      }
      if (row.context) assert.equal(q.context, row.context);
      if (row.contextTable) assert.deepEqual(q.contextTable, row.contextTable);
      if (row.code) assert.equal(q.code, row.code);
    });
  }
  for (const [week, meta] of Object.entries(source.weeks)) {
    const built = bank.weeks.find(w => String(w.week) === week);
    assert.equal(built.topic, meta.topic);
    assert(existsSync(new URL(`../sources/large-language-models-2026-july/pdfs/${meta.pdf}`, import.meta.url)));
  }
});

test('tables, formulas and the numeric question keep their structure', () => {
  const table = questions.find(q => q.id === 'w04-q06');
  assert.match(table.context, /count matrix/);
  assert.equal(table.prompt, 'Compute the cosine similarity between w1 and w2.');
  assert.deepEqual(table.contextTable.headers, ['', 'c1', 'c2', 'c3', 'c4', 'c5']);
  assert.deepEqual(table.contextTable.rows, [
    ['w1', '2', '0', '3', '1', '4'],
    ['w2', '1', '3', '0', '2', '2'],
    ['w3', '4', '1', '2', '0', '3'],
  ]);
  const formula = questions.find(q => q.id === 'w06-q08');
  assert.match(formula.code, /PE\(p, 2i\)/);
  assert.match(formula.code, /PE\(p, 2i\+1\)/);
  const numeric = questions.find(q => q.id === 'w07-q08');
  assert.equal(numeric.type, 'numeric');
  assert.equal(numeric.correctNumericAnswer, '38');
  assert.match(numeric.prompt, /A = \[\[4, -2\], \[3, 1\]\]/);
  assert.match(numeric.prompt, /B = \[\[5, 2\], \[-3, 6\]\]/);
  assert.equal(numeric.code, "numpy.einsum('ij,ji->', A, B)");
  assert(isCorrect(numeric, '38'));
});

test('multi-select answer sets match the printed keys', () => {
  assert.deepEqual(questions.find(q => q.id === 'w07-q07').correctOptionIds, ['A', 'B', 'D']);
  assert.deepEqual(questions.find(q => q.id === 'w08-q01').correctOptionIds, ['A', 'B', 'D']);
  assert.deepEqual(questions.find(q => q.id === 'w09-q02').correctOptionIds, ['A', 'B']);
  assert.deepEqual(questions.find(q => q.id === 'w11-q01').correctOptionIds, ['B', 'C']);
  assert.equal(questions.filter(q => q.type === 'multiple-choice').length, 15);
  assert.equal(questions.filter(q => q.type === 'numeric').length, 1);
});

test('the July bank carries no account or submission state', () => {
  const text = JSON.stringify(bank);
  for (const value of ['last recorded submission', '@gmail.com', 'Your last', 'Score:']) assert(!text.includes(value));
});
