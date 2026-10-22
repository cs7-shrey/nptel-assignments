import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { hasAnswer, isCorrect } from '../lib/study.ts';

const vlsi = JSON.parse(readFileSync(new URL('../data/vlsi-design-flow.json', import.meta.url), 'utf8'));
const questions = vlsi.weeks.flatMap(w => w.questions);

test('VLSI Design Flow has all twelve assignments with ten keyed questions each', () => {
  assert.equal(vlsi.course, 'VLSI Design Flow: RTL to GDS');
  assert.equal(vlsi.courseId, 'noc23_ee137');
  assert.deepEqual(vlsi.weeks.map(w => w.week), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(questions.length, 120);
  assert.equal(new Set(questions.map(q => q.id)).size, 120);
  for (const week of vlsi.weeks) for (const [i, q] of week.questions.entries()) {
    const n = String(week.week).padStart(2, '0'), k = String(i + 1).padStart(2, '0');
    assert.equal(q.id, `w${n}-q${k}`);
    assert.equal(q.number, i + 1);
    assert.equal(q.sourceNumber, i + 1);
    assert.equal(q.type, 'single-choice');
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(o => o.text)).size, 4);
    assert.equal(q.correctOptionIds.length, 1);
    assert(q.options.some(o => o.id === q.correctOptionIds[0]));
    assert(q.options.some(o => o.text === q.sourceAnswerText));
    assert.equal(q.answerStatus, 'official');
    assert.equal(q.answerSource, 'course-accepted-answer');
    assert(hasAnswer(q));
    assert(isCorrect(q, q.correctOptionIds[0]));
    assert(q.prompt.trim().length > 10);
    assert(q.options.every(o => o.text.trim().length > 0));
  }
  for (const week of vlsi.weeks) {
    assert(week.topic.trim().length > 3);
    assert.equal(week.sourceFile, 'sources/vlsi-design-flow/Assignment_5.pdf');
    assert.match(week.sourceUrl, /^https:\/\//);
  }
});

test('the published key spreads across all four options', () => {
  const letters = questions.map(q => q.correctOptionIds[0]);
  for (const letter of 'ABCD') assert(letters.filter(l => l === letter).length >= 20, letter);
});

test('figures and code listings come with accessible, served assets', () => {
  const figures = questions.filter(q => q.image);
  assert.equal(figures.length, 6);
  for (const q of figures) {
    assert.match(q.image.src, /^\/vlsi-design-flow\/[a-z0-9-]+\.png$/);
    assert(existsSync(new URL(`../public${q.image.src}`, import.meta.url)), q.image.src);
    assert(q.image.alt.length > 30);
    assert(q.image.width > 0 && q.image.height > 0);
  }
  assert.deepEqual(questions.filter(q => q.code).map(q => q.id), ['w04-q05', 'w04-q06', 'w08-q08']);
  assert(questions.filter(q => q.code).every(q => q.code.includes('\n')));
  assert.deepEqual(questions.filter(q => q.continuation).map(q => q.id), ['w07-q09', 'w08-q08']);
});

test('the export carries no account or submission state', () => {
  const text = JSON.stringify(vlsi);
  for (const fragment of ['No, the answer is incorrect', 'Score', 'reviewer', '@nptel', 'Due on', 'submitted this assignment']) assert(!text.includes(fragment));
});
