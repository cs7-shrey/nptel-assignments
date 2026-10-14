import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrect, isChecked, hasAnswer, progressKey, resetWeekProgress, restoreProgress } from '../lib/study.ts';
const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const ai = load('responsible-safe-ai'), psychology = load('assignments');
const find = id => ai.weeks.flatMap(w => w.questions).find(q => q.id === id);

test('AI dataset preserves all twelve weeks, 141 questions, and 141 published keys', () => {
  assert.deepEqual(ai.weeks.map(w => w.week), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(ai.weeks.map(w => w.questions.length), [...Array(10).fill(12), 11, 10]);
  const questions = ai.weeks.flatMap(w => w.questions);
  assert.equal(new Set(questions.map(q => q.id)).size, 141);
  assert.equal(questions.filter(hasAnswer).length, 141);
  assert.equal(questions.filter(q => q.type === 'numeric').length, 3);
  for (const w of ai.weeks) for (const [i, q] of w.questions.entries()) {
    assert.equal(q.sourceNumber, i + 1);
    assert(q.prompt.length > 15);
    if (q.type === 'numeric') { assert.equal(q.options.length, 0); assert(Number.isFinite(Number(q.correctNumericAnswer))); }
    else { assert(q.options.length >= 2); assert.equal(new Set(q.options.map(o => o.id)).size, q.options.length); }
    for (const id of q.correctOptionIds ?? []) assert(q.options.some(o => o.id === id));
    assert(q.options.every(o => o.text.trim().length > 0));
    assert.equal(q.answerStatus, 'official');
  }
  const serialized = JSON.stringify(ai);
  for (const fragment of ['Value:', 'Your last recorded', 'Score:', 'You may submit', '@gmail.com']) assert(!serialized.includes(fragment));
  assert.equal(find('w03-q01').contextTable.rows.length, 4);
  assert.equal(find('w06-q09').options[0].text, 'e^ε');
  assert.match(find('w07-q06').options[1].text, /ε \/ \(2δ\)/);
});

test('multiple choice requires the exact full set and explicit checking', () => {
  const q = find('w01-q07');
  assert.deepEqual(q.correctOptionIds, ['A', 'C', 'D']);
  assert(isCorrect(q, ['D', 'A', 'C']));
  assert(!isCorrect(q, ['A']));
  assert(!isCorrect(q, ['A', 'B', 'C', 'D']));
  assert(!isChecked(q, ['A', 'C', 'D'], {}));
  assert(isChecked(q, ['A', 'C', 'D'], { [q.id]: true }));
});

test('numeric answers accept equivalent numbers, reject blanks, and await checking', () => {
  const q = find('w05-q09');
  for (const value of ['2', '2.0', '2e0']) assert(isCorrect(q, value));
  for (const value of ['', ' ', '3', 'NaN', 'Infinity']) assert(!isCorrect(q, value));
  assert(!isChecked(q, '2', {}));
  assert(isChecked(q, '2', { [q.id]: true }));
  assert(!hasAnswer({ ...q, correctNumericAnswer: null, correctOptionIds: null, answerStatus: 'not-released' }));
});

test('Week 12 published keys include the complete accepted multi-select sets', () => {
  const week = ai.weeks.find(w => w.week === 12);
  assert.deepEqual(week.questions.map(q => q.correctOptionIds), [
    ['D'], ['B'], ['A'], ['B'], ['C'], ['B'], ['C'], ['B', 'D', 'E'], ['D'], ['A', 'D', 'E'],
  ]);
  assert(week.questions.every(q => q.answerSource === 'course-accepted-answer'));
  for (const q of week.questions) {
    assert(hasAnswer(q));
    assert(isCorrect(q, q.type === 'multiple-choice' ? q.correctOptionIds : q.correctOptionIds[0]));
    if (q.type === 'multiple-choice') assert(!isCorrect(q, q.correctOptionIds.slice(0, -1)));
  }
});

test('legacy Psychology progress survives and course storage keys are isolated', () => {
  const legacy = JSON.stringify({ week: 3, choices: { 'w03-q01': 'B' } });
  const restored = restoreProgress(psychology, legacy);
  assert.deepEqual(restored, { choices: { 'w03-q01': 'B' }, checked: {} });
  assert.equal(progressKey(psychology.courseId), 'recall:noc26_hs206');
  assert.notEqual(progressKey(psychology.courseId), progressKey(ai.courseId));
  assert.deepEqual(restoreProgress(ai, '{invalid'), restoreProgress(ai, null));
  const draft = restoreProgress(ai, JSON.stringify({ week: 999, choices: { 'w01-q07': ['A', 'A', 'Z'], unknown: 'A' } }));
  assert.deepEqual(draft.choices, { 'w01-q07': ['A'] });
});

test('reset clears only the selected week, including checks and numeric drafts', () => {
  const progress = { choices: { 'w01-q07': ['A'], 'w05-q09': '2' }, checked: { 'w01-q07': true, 'w05-q09': true } };
  const reset = resetWeekProgress(progress, ai.weeks[0]);
  assert.deepEqual(reset.choices, { 'w05-q09': '2' });
  assert.deepEqual(reset.checked, { 'w05-q09': true });
  assert.deepEqual(progress.choices['w01-q07'], ['A']);
});
