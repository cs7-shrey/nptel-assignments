import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hasAnswer, isCorrect, progressKey } from '../lib/study.ts';
import { createQuiz, quizQuestions, quizKey } from '../lib/quiz.ts';
const course = JSON.parse(readFileSync(new URL('../data/conservation-geography.json', import.meta.url), 'utf8'));
const questions = course.weeks.flatMap(w => w.questions);

test('Conservation Geography has all 13 assignments with complete source-backed questions', () => {
  assert.equal(course.courseId, 'noc26_ge82');
  assert.deepEqual(course.weeks.map(w => w.week), Array.from({ length: 13 }, (_, i) => i));
  assert.equal(new Set(questions.map(q => q.id)).size, 130);
  for (const w of course.weeks) {
    const source = JSON.parse(readFileSync(new URL(`../${w.sourceFile}`, import.meta.url), 'utf8'));
    assert.equal(w.questions.length, 10);
    for (const [i, q] of w.questions.entries()) {
      assert.equal(q.number, i + 1);
      assert.equal(q.prompt, source.questions[i].prompt);
      assert.deepEqual(q.options.map(o => o.text), source.questions[i].options);
      assert.equal(q.options.length, 4);
      assert(hasAnswer(q));
      assert.equal(q.answerStatus, 'official');
      assert.equal(q.answerSource, 'course-accepted-answer');
      assert.equal(q.options.filter(o => q.correctOptionIds.includes(o.id)).map(o => o.text).join(', '), source.questions[i].acceptedAnswer);
      assert(isCorrect(q, q.correctOptionIds[0]));
    }
  }
});

test('Conservation quiz includes released practice keys and isolates progress', () => {
  const quiz = createQuiz(course, course.weeks.map(w => w.week), null, () => 0);
  assert.equal(quiz.questionIds.length, 130);
  const practiceQuiz = createQuiz(course, [0], null, () => 0);
  assert.equal(practiceQuiz.questionIds.length, 10);
  assert(quizQuestions(course, practiceQuiz).every(q => q.week === 0 && hasAnswer(q.question)));
  assert(quizQuestions(course, quiz).every(q => q.week >= 0 && q.week <= 12));
  assert.equal(progressKey(course.courseId), 'recall:noc26_ge82');
  assert.equal(quizKey(course.courseId), 'recall:quiz:noc26_ge82');
  for (const fragment of ['Your last recorded', 'Score:', 'Value:', '@gmail.com']) assert(!JSON.stringify(course).includes(fragment));
});
