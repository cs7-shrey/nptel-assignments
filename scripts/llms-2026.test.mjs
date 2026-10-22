import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hasAnswer, isCorrect } from '../lib/study.ts';

const bank = JSON.parse(readFileSync(new URL('../data/large-language-models-2026.json', import.meta.url), 'utf8'));
const source = JSON.parse(readFileSync(new URL('../sources/large-language-models-2026/question-bank.json', import.meta.url), 'utf8'));
const questions = bank.weeks.flatMap(w => w.questions);

test('the 2026 LLM bank includes all twelve weeks', () => {
  assert.equal(bank.course, 'Introduction to Large Language Models (LLMs) \u00b7 2026');
  assert.equal(bank.courseId, 'noc26_cs171');
  assert.deepEqual(bank.weeks.map(w => w.week), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(bank.weeks.map(w => w.questions.length), [10, 8, 10, 8, 8, 8, 7, 10, 10, 10, 10, 10]);
  assert.equal(questions.length, 109);
  assert.equal(new Set(questions.map(q => q.id)).size, 109);
  assert.equal(bank.weeks[0].topic, 'Language & semantics');
  assert.equal(bank.weeks[11].topic, 'Bias, safety & responsibility');
  for (const week of bank.weeks) for (const [i, q] of week.questions.entries()) {
    const n = String(week.week).padStart(2, '0'), k = String(i + 1).padStart(2, '0');
    assert.equal(q.id, `w${n}-q${k}`);
    assert.equal(q.number, i + 1);
    assert.equal(q.sourceNumber, i + 1);
    assert(q.prompt.trim().length > 10);
    assert.equal(q.options.length, new Set(q.options.map(o => o.text)).size);
    assert(q.options.length >= 2 && q.options.length <= 5);
    assert.equal(q.answerStatus, 'official');
    assert.equal(q.answerSource, 'practice-lab-answer-key');
    assert(hasAnswer(q));
    assert(q.correctOptionIds.length >= 1);
    for (const id of q.correctOptionIds) assert(q.options.some(o => o.id === id));
    assert.equal(q.type, q.correctOptionIds.length > 1 ? 'multiple-choice' : 'single-choice');
    assert(isCorrect(q, q.type === 'multiple-choice' ? q.correctOptionIds : q.correctOptionIds[0]));
    assert.equal(q.sourceAnswerText, q.correctOptionIds.map(id => q.options.find(o => o.id === id).text).join(', '));
  }
  for (const week of bank.weeks) {
    assert.equal(week.sourceFile, 'sources/large-language-models-2026/question-bank.json');
    assert.match(week.sourceUrl, /noc26_cs171$/);
  }
});

test('every row of the supplied question bank is represented exactly', () => {
  const byWeek = new Map();
  for (const [week, prompt, options, answers] of source.questions) {
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week).push({ prompt, options, answers });
  }
  for (let week = 1; week <= 12; week++) {
    const rows = byWeek.get(week);
    assert.equal(bank.weeks[week - 1].questions.length, rows.length);
    rows.forEach((row, index) => {
      const q = bank.weeks[week - 1].questions[index];
      assert.equal(q.prompt, row.prompt);
      assert.deepEqual(q.options.map(o => o.text), row.options);
      assert.deepEqual(q.correctOptionIds, row.answers.map(i => String.fromCharCode(65 + i)));
    });
  }
});

test('multi-select keys are exact sets', () => {
  const multi = questions.filter(q => q.type === 'multiple-choice');
  assert.equal(multi.length, 18);
  for (const q of multi) {
    assert(q.correctOptionIds.length > 1);
    assert(isCorrect(q, q.correctOptionIds));
    assert(!isCorrect(q, q.correctOptionIds.slice(0, -1)));
  }
  assert.deepEqual(questions.find(q => q.id === 'w01-q09').correctOptionIds, ['B', 'C']);
  assert.deepEqual(questions.find(q => q.id === 'w10-q03').correctOptionIds, ['A', 'B', 'C']);
});

test('the 2026 data keeps only the questions and answers', () => {
  const text = JSON.stringify(bank);
  for (const fragment of ['const Q', '<script', 'localStorage', 'document.getElementById', 'answer review', 'LLM Practice Lab']) assert(!text.includes(fragment));
});
