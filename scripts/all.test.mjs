import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomSeed, seededRandom, seedFrom, shuffle } from '../lib/shuffle.ts';
import { resetAnswers, taggedQuestions } from '../lib/study.ts';
const ai = JSON.parse(readFileSync(new URL('../data/responsible-safe-ai.json', import.meta.url), 'utf8'));
const ids = course => course.weeks.flatMap(w => w.questions.map(q => q.id));

test('the all-weeks page holds every question, tagged with its week', () => {
  const tagged = taggedQuestions(ai);
  assert.deepEqual(tagged.map(t => t.question.id), ids(ai));
  for (const { question, week } of tagged) assert(ai.weeks.find(w => w.week === week).questions.includes(question));
});

test('one seed mixes the questions the same way on the server and in the browser', () => {
  const tagged = taggedQuestions(ai), seed = seedFrom(ai.courseId);
  const order = shuffle(tagged, seededRandom(seed)).map(t => t.question.id);
  assert.deepEqual(order, shuffle(tagged, seededRandom(seed)).map(t => t.question.id));
  assert.deepEqual([...order].sort(), [...ids(ai)].sort());
  // Shuffled means mixed: the page no longer runs week by week.
  assert.notDeepEqual(order, ids(ai));
  const weeks = new Map(tagged.map(t => [t.question.id, t.week]));
  assert(order.some((id, i) => i > 0 && weeks.get(id) !== weeks.get(order[i - 1])));
});

test('each course draws its own order, and a reshuffle draws a new one', () => {
  assert.equal(seedFrom('noc26_cs145'), seedFrom('noc26_cs145'));
  assert.notEqual(seedFrom('noc26_cs145'), seedFrom('noc26_hs206'));
  const seeds = new Set(Array.from({ length: 25 }, randomSeed));
  assert(seeds.size > 1);
  assert([...seeds].every(seed => seed > 0));
});

test('reset all clears the whole course and keeps unrelated answers', () => {
  const progress = { choices: { 'w01-q01': 'A', 'w99-q01': 'B' }, checked: { 'w01-q01': true } };
  const reset = resetAnswers(progress, ids(ai));
  assert.deepEqual(reset, { choices: { 'w99-q01': 'B' }, checked: {} });
  assert.deepEqual(progress.choices, { 'w01-q01': 'A', 'w99-q01': 'B' });
});
