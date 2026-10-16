import { hasAnswer, restoreProgress } from './study.ts';
import type { Course, Progress, Question } from './study.ts';

// A quiz is a fixed, shuffled question list plus its own answers, separate from week progress.
export type Quiz = Progress & { weeks: number[]; max: number | null; questionIds: string[] };
export const quizKey = (courseId: string) => `recall:quiz:${courseId}`;

// Only questions with a released key can be revealed, so only those are quizzed.
export const quizzable = (course: Course, weeks: number[]) =>
  course.weeks.filter(w => weeks.includes(w.week)).flatMap(w => w.questions.filter(hasAnswer));

export function createQuiz(course: Course, weeks: number[], max: number | null, random = Math.random): Quiz {
  const pool = quizzable(course, weeks).map(q => q.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
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
    return { weeks, max, questionIds, ...restoreProgress(course, raw) };
  } catch { return null; }
}

export function quizQuestions(course: Course, quiz: Quiz) {
  const byId = new Map<string, { question: Question; week: number }>();
  for (const w of course.weeks) for (const q of w.questions) byId.set(q.id, { question: q, week: w.week });
  return quiz.questionIds.flatMap(id => byId.get(id) ?? []);
}
