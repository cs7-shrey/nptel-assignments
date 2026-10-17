export type QuestionImage = { src: string; alt: string };
export type Option = { id: string; text: string; code?: boolean; image?: QuestionImage };
export type Question = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  context?: string;
  code?: string;
  figures?: QuestionImage[];
  options: Option[];
  correctOptionIds: string[] | null;
  correctNumericAnswer?: string | null;
  reference: string | null;
  contextTable?: { headers: string[]; rows: string[][] };
  // Some questions carry a figure, a code listing, or text that follows the figure.
  image?: { src: string; alt: string; width: number; height: number };
  continuation?: string;
  code?: string;
};
export type Week = { week: number; topic: string; questions: Question[] };
export type Course = { course: string; courseId: string; weeks: Week[] };
export type Choice = string | string[];
// The URL owns the current week; storage only keeps answers.
export type Progress = { choices: Record<string, Choice>; checked: Record<string, boolean> };
export const progressKey = (courseId: string) => `recall:${courseId}`;
export const hasAnswer = (q: Question) => !!q.correctOptionIds?.length || q.correctNumericAnswer != null;
export function isCorrect(q: Question, choice: Choice | undefined) {
  if (q.type === 'numeric') {
    return typeof choice === 'string' && choice.trim() !== '' && q.correctNumericAnswer != null &&
      Number.isFinite(Number(choice)) && Number(choice) === Number(q.correctNumericAnswer);
  }
  const selected = Array.isArray(choice) ? choice : choice ? [choice] : [];
  return !!q.correctOptionIds?.length && selected.length === q.correctOptionIds.length &&
    q.correctOptionIds.every(id => selected.includes(id));
}
export function isChecked(q: Question, choice: Choice | undefined, checked: Record<string, boolean>) {
  return hasAnswer(q) && (q.type === 'single-choice' ? !!choice : checked[q.id] === true);
}
export function restoreProgress(course: Course, raw: string | null): Progress {
  const empty: Progress = { choices: {}, checked: {} };
  try {
    const saved = JSON.parse(raw ?? '{}');
    if (!saved || typeof saved !== 'object') return empty;
    for (const q of course.weeks.flatMap(w => w.questions)) {
      const value = saved.choices?.[q.id];
      const valid = (id: unknown) => typeof id === 'string' && q.options.some(o => o.id === id);
      if (q.type === 'multiple-choice' && Array.isArray(value)) {
        empty.choices[q.id] = [...new Set(value.filter(valid))] as string[];
      } else if (q.type === 'numeric' && typeof value === 'string') {
        empty.choices[q.id] = value;
      } else if (q.type === 'single-choice' && valid(value)) {
        empty.choices[q.id] = value;
      }
      const choice = empty.choices[q.id];
      if (saved.checked?.[q.id] === true && (Array.isArray(choice) ? choice.length > 0 : !!choice?.trim())) {
        empty.checked[q.id] = true;
      }
    }
  } catch { /* Invalid or unavailable storage starts with empty progress. */ }
  return empty;
}
export function resetWeekProgress(progress: Progress, week: Week): Progress {
  return resetAnswers(progress, week.questions.map(q => q.id));
}
// Clears the given questions and leaves every other answer alone.
export function resetAnswers(progress: Progress, questionIds: Iterable<string>): Progress {
  const ids = new Set(questionIds);
  return {
    choices: Object.fromEntries(Object.entries(progress.choices).filter(([id]) => !ids.has(id))),
    checked: Object.fromEntries(Object.entries(progress.checked).filter(([id]) => !ids.has(id))),
  };
}
// Every question in the course, tagged with the week it came from.
export function taggedQuestions(course: Course) {
  return course.weeks.flatMap(w => w.questions.map(question => ({ question, week: w.week })));
}
