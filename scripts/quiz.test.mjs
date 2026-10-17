import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createQuiz, quizKey, quizQuestions, quizzable, restoreQuiz, shuffleOptions } from '../lib/quiz.ts';
const ai = JSON.parse(readFileSync(new URL('../data/responsible-safe-ai.json', import.meta.url), 'utf8'));

test('a quiz shuffles every keyed question from the chosen weeks, capped at max', () => {
  const pool = quizzable(ai, [7, 8, 12]).map(q => q.id);
  const all = createQuiz(ai, [12, 7, 8], null);
  assert.deepEqual(all.weeks, [7, 8, 12]);
  assert.deepEqual([...all.questionIds].sort(), [...pool].sort());
  const capped = createQuiz(ai, [7, 8, 12], 5);
  assert.equal(capped.questionIds.length, 5);
  assert(capped.questionIds.every(id => pool.includes(id)));
  assert.equal(createQuiz(ai, [1], 999).questionIds.length, quizzable(ai, [1]).length);
  assert.notDeepEqual(createQuiz(ai, [1, 2, 3], null, () => 0).questionIds, quizzable(ai, [1, 2, 3]).map(q => q.id));
});

test('saved quizzes restore their questions and answers, and drop unknown data', () => {
  const quiz = createQuiz(ai, [3], 4);
  const [first] = quiz.questionIds;
  const saved = JSON.stringify({ ...quiz, questionIds: [...quiz.questionIds, 'w99-q01'], choices: { [first]: 'A', bogus: 'B' } });
  const restored = restoreQuiz(ai, saved);
  assert.deepEqual(restored.questionIds, quiz.questionIds);
  assert.deepEqual(restored.choices, quizQuestions(ai, quiz)[0].question.type === 'single-choice' ? { [first]: 'A' } : {});
  assert.equal(restored.max, 4);
  for (const raw of [null, '{bad', '{}', JSON.stringify({ questionIds: ['nope'] })]) assert.equal(restoreQuiz(ai, raw), null);
  assert.equal(quizKey(ai.courseId), 'recall:quiz:noc26_cs145');
});

test('a quiz shuffles each question\'s options, keeping "all of the given" last', () => {
  const quiz = createQuiz(ai, [1, 2, 3], null);
  for (const { question: q } of quizQuestions(ai, quiz)) {
    const original = quizzable(ai, [1, 2, 3]).find(o => o.id === q.id);
    assert.deepEqual(q.options.map(o => o.id).sort(), original.options.map(o => o.id).sort());
  }
  const q = quizzable(ai, [1, 2, 3]).find(q => q.options.length > 2);
  assert.notDeepEqual(shuffleOptions(q, () => 0), q.options.map(o => o.id));
  const given = { options: [{ id: 'A', text: 'x' }, { id: 'B', text: 'y' }, { id: 'C', text: 'All of the given' }] };
  assert.equal(shuffleOptions(given, () => 0).at(-1), 'C');
  const restored = restoreQuiz(ai, JSON.stringify(quiz));
  assert.deepEqual(restored.optionOrder, quiz.optionOrder);
  const [first] = quiz.questionIds;
  assert.deepEqual(restoreQuiz(ai, JSON.stringify({ ...quiz, optionOrder: { [first]: ['Z'] } })).optionOrder, {});
});
