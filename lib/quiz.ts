import { shuffle } from './shuffle.ts';
import { hasAnswer, restoreProgress } from './study.ts';
import type { Course, Progress, Question } from './study.ts';

// A quiz is a fixed, shuffled question list (with shuffled options) plus its own answers, separate from week progress.
export type Quiz = Progress & { weeks: number[]; max: number | null; questionIds: string[]; optionOrder: Record<string, string[]> };
export const quizKey = (courseId: string) => `recall:quiz:${courseId}`;

// Only questions with a released key can be revealed, so only those are quizzed.
export const quizzable = (course: Course, weeks: number[]) =>
  course.weeks.filter(w => weeks.includes(w.week)).flatMap(w => w.questions.filter(hasAnswer));

export function createQuiz(course: Course, weeks: number[], max: number | null, random = Math.random): Quiz {
  const pool = shuffle(quizzable(course, weeks).map(q => q.id), random);
  return { weeks: [...weeks].sort((a, b) => a - b), max, questionIds: pool.slice(0, Math.min(max ?? pool.length, pool.length)), choices: {}, checked: {} };
}

export function restoreQuiz(course: Course, raw: string | null): Quiz | null {
  try {
    const saved = JSON.parse(raw ?? 'null');
    if (!saved || !Array.isArray(saved.questionIds)) return null;
    const keyed = new Set(quizzable(course, course.weeks.map(w => w.week)).map(q => q.id));
    const questionIds = saved.questionIds.filter((id: unknown) => typeof id === 'string' && keyed.has(id));
    if (!questionIds.length) return null;
    const weeks = Array.isArray(saved.weeks) ? saved.weeks.filter((w: unknown) => course.weeks.some(cw => cw.week === w)) : [];
    const max = Number.isInteger(saved.max) && saved.max > 0 ? saved.max : null;
    // An order is kept only if it is a permutation of the question's current options.
    const optionOrder: Record<string, string[]> = {};
    for (const { question: q } of quizQuestions(course, { questionIds, optionOrder: {} })) {
      const order = saved.optionOrder?.[q.id];
      if (Array.isArray(order) && order.length === q.options.length && new Set(order).size === order.length && q.options.every(o => order.includes(o.id))) optionOrder[q.id] = order;
    }
    return { weeks, max, questionIds, optionOrder, ...restoreProgress(course, raw) };
  } catch { return null; }
}

// Questions in quiz order, each with its options in the quiz's shuffled order.
export function quizQuestions(course: Course, quiz: Pick<Quiz, 'questionIds' | 'optionOrder'>) {
  const byId = new Map<string, { question: Question; week: number }>();
  for (const w of course.weeks) for (const q of w.questions) byId.set(q.id, { question: q, week: w.week });
  return quiz.questionIds.flatMap(id => {
    const found = byId.get(id), order = quiz.optionOrder[id];
    if (!found || !order) return found ?? [];
    const options = order.flatMap(oid => found.question.options.find(o => o.id === oid) ?? []);
    return { ...found, question: { ...found.question, options } };
  });
}
