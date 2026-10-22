import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { hasAnswer, isCorrect, progressKey } from "../lib/study.ts";
import { createQuiz, quizKey, quizQuestions } from "../lib/quiz.ts";
const course = JSON.parse(
  readFileSync(
    new URL("../data/privacy-social-media.json", import.meta.url),
    "utf8",
  ),
);
const questions = course.weeks.flatMap((w) => w.questions);
const find = (id) => questions.find((q) => q.id === id);

test("Privacy includes exactly Weeks 1–11 and 110 complete official questions", () => {
  assert.equal(course.courseId, "noc26_cs141");
  assert.deepEqual(
    course.weeks.map((w) => w.week),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  assert.equal(new Set(questions.map((q) => q.id)).size, 110);
  for (const w of course.weeks) {
    assert.equal(w.questions.length, 10);
    for (const [i, q] of w.questions.entries()) {
      assert.equal(q.number, i + 1);
      assert.equal(q.sourceNumber, i + 1);
      assert(q.prompt.length > 10);
      assert.equal(q.options.length, q.id === "w11-q01" ? 3 : 4);
      assert(
        q.options.every(
          (o) =>
            o.text.trim() && !["0", "1", "[image option]"].includes(o.text),
        ),
      );
      assert.equal(q.answerStatus, "official");
      assert.equal(q.answerSource, "course-accepted-answer");
      assert(q.sourceAnswerText);
      assert(hasAnswer(q));
      for (const id of q.correctOptionIds)
        assert(q.options.some((o) => o.id === id));
      assert(
        isCorrect(
          q,
          q.type === "multiple-choice"
            ? q.correctOptionIds
            : q.correctOptionIds[0],
        ),
      );
    }
  }
});

test("image answers, table options, long answers and shared passages remain complete", () => {
  assert.deepEqual(find("w07-q01").correctOptionIds, ["C"]);
  assert.deepEqual(find("w09-q10").correctOptionIds, ["A", "B", "C", "D"]);
  assert(!isCorrect(find("w09-q10"), ["A", "B"]));
  assert(find("w09-q10").sourceAnswerText.endsWith("6,000 kilometers."));
  assert(find("w07-q03").code.endsWith('"now"]'));
  for (const n of [5, 6, 7])
    assert.match(
      find(`w03-q0${n}`).context,
      /Privacy in India.*PI_2012_Complete_Report.pdf/,
    );
  for (const n of [5, 6, 7])
    assert.match(find(`w04-q0${n}`).context, /expenses_array.*1900/);
  assert.match(find("w10-q01").context, /Inferring Home Location/);
  assert.match(find("w10-q04").context, /username change behavior/);
  assert.match(find("w10-q07").context, /Boston Marathon/);
  assert.match(
    find("w04-q08").options[0].text,
    /electronics \| 1630 \| 543.33/,
  );
  const images = questions.flatMap((q) => [
    ...(q.figures ?? []),
    ...q.options.flatMap((o) => (o.image ? [o.image] : [])),
  ]);
  assert.equal(images.length, 19);
  assert.equal(
    find("w06-q10").figures[0].src,
    "/questions/privacy-social-media/w06-q10.jpg",
  );
  for (const image of images) {
    assert(image.alt.length > 10);
    assert(image.src.startsWith("/questions/privacy-social-media/"));
    assert(existsSync(new URL(`../public${image.src}`, import.meta.url)));
  }
});

test("Privacy works in quiz mode with isolated storage and no excluded weeks", () => {
  const quiz = createQuiz(
    course,
    [0, ...course.weeks.map((w) => w.week), 12],
    null,
    () => 0,
  );
  assert.equal(quiz.questionIds.length, 110);
  const resolved = quizQuestions(course, quiz);
  assert(resolved.every((item) => item.week >= 1 && item.week <= 11));
  const imageQuestion = resolved.find(
    (item) => item.question.id === "w07-q01",
  ).question;
  assert.notDeepEqual(
    imageQuestion.options.map((o) => o.id),
    find("w07-q01").options.map((o) => o.id),
  );
  assert.deepEqual(
    imageQuestion.options.find((o) => o.id === "C").image,
    find("w07-q01").options.find((o) => o.id === "C").image,
  );
  assert(isCorrect(imageQuestion, "C"));
  assert.equal(progressKey(course.courseId), "recall:noc26_cs141");
  assert.equal(quizKey(course.courseId), "recall:quiz:noc26_cs141");
  const text = JSON.stringify(course);
  for (const fragment of [
    "Value:",
    "Your last recorded",
    "Score:",
    "You may submit",
    "@gmail.com",
    "[image option]",
  ])
    assert(!text.includes(fragment));
});
