import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { hasAnswer, isCorrect } from '../lib/study.ts';

const llm = JSON.parse(readFileSync(new URL('../data/large-language-models.json', import.meta.url), 'utf8'));
const questions = llm.weeks.flatMap(w => w.questions);

test('Introduction to LLMs includes all twelve assignments', () => {
  assert.equal(llm.course, 'Introduction to Large Language Models (LLMs) \u00b7 2025');
  assert.equal(llm.courseId, 'noc25_cs45');
  assert.deepEqual(llm.weeks.map(w => w.week), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(llm.weeks.map(w => w.questions.length), [10, 8, 10, 7, 8, 8, 8, 10, 10, 10, 10, 10]);
  assert.equal(questions.length, 109);
  assert.equal(new Set(questions.map(q => q.id)).size, 109);
  for (const week of llm.weeks) for (const [i, q] of week.questions.entries()) {
    const n = String(week.week).padStart(2, '0'), k = String(i + 1).padStart(2, '0');
    assert.equal(q.id, `w${n}-q${k}`);
    assert.equal(q.number, i + 1);
    assert.equal(q.sourceNumber, i + 1);
    assert(q.prompt.trim().length > 10);
    assert.equal(q.answerStatus, 'official');
    assert.equal(q.answerSource, 'course-accepted-answer');
    assert(hasAnswer(q));
    if (q.type === 'numeric') {
      assert.equal(q.options.length, 0);
      assert.equal(q.correctOptionIds, null);
      assert.equal(q.correctNumericAnswer, '23');
      assert(isCorrect(q, '23'));
    } else {
      assert.equal(q.options.length, new Set(q.options.map(o => o.text)).size);
      assert(q.options.length >= 2 && q.options.length <= 5);
      assert(q.correctOptionIds.length >= 1);
      for (const id of q.correctOptionIds) assert(q.options.some(o => o.id === id));
      assert.equal(q.type, q.correctOptionIds.length > 1 ? 'multiple-choice' : 'single-choice');
      assert(isCorrect(q, q.type === 'multiple-choice' ? q.correctOptionIds : q.correctOptionIds[0]));
    }
    assert.equal(q.sourceAnswerText, q.type === 'numeric' ? '23' : q.correctOptionIds.map(id => q.options.find(o => o.id === id).text).join(', '));
  }
  for (const week of llm.weeks) {
    assert(week.topic.trim().length > 3);
    assert.equal(week.sourceFile, 'sources/large-language-models/assignments-jan-2025.pdf');
    assert.match(week.sourceUrl, /^https:\/\/onlinecourses\.nptel\.ac\.in\/noc25_cs45/);
  }
});

test('the published key spreads across all four options', () => {
  const letters = questions.flatMap(q => q.correctOptionIds ?? []);
  for (const letter of 'ABCD') assert(letters.filter(l => l === letter).length >= 15, letter);
});

test('figure, code, note and multi-select questions keep their structure', () => {
  const matrix = questions.filter(q => q.image);
  assert.deepEqual(matrix.map(q => q.id), ['w04-q05', 'w04-q06']);
  for (const q of matrix) {
    assert.equal(q.image.src, '/large-language-models/week-04-matrix.png');
    assert(q.image.alt.length > 30);
    assert.equal(q.image.width, 2040);
    assert(existsSync(new URL(`../public${q.image.src}`, import.meta.url)));
    assert.match(q.continuation, /cosine similarity/);
  }
  const einsum = questions.find(q => q.id === 'w07-q08');
  assert.match(einsum.code, /einsum/);
  assert.equal(questions.filter(q => q.type === 'multiple-choice').length, 21);
  assert(questions.find(q => q.id === 'w01-q02').correctOptionIds.length === 4);
  assert.match(questions.find(q => q.id === 'w06-q05').note, /two unmasked attention scores/);
});

test('the export carries no account or submission state', () => {
  const text = JSON.stringify(llm);
  for (const fragment of ['No, the answer is incorrect', 'Score:', 'reviewer', '@nptel', 'Due on', 'submitted this assignment']) assert(!text.includes(fragment));
});
