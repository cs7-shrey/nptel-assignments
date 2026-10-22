import psychology from '@/data/assignments.json';
import responsibleAI from '@/data/responsible-safe-ai.json';
import privacySocialMedia from '@/data/privacy-social-media.json';
import vlsi from '@/data/vlsi-design-flow.json';
import largeLanguageModels from '@/data/large-language-models.json';
import largeLanguageModels2026 from '@/data/large-language-models-2026.json';
import type { Course } from './study';

export type Subject = Course & { slug: string; year?: string; family?: string };

// The slug is the subject's URL: /<slug>/week-<n>.
export const courses: Subject[] = [
  { slug: 'psychology-of-learning', ...psychology },
  { slug: 'responsible-safe-ai', ...responsibleAI },
  { slug: 'privacy-social-media', ...privacySocialMedia },
  { slug: 'vlsi-design-flow', ...vlsi },
  { slug: 'large-language-models', ...largeLanguageModels, year: '2025', family: 'Introduction to Large Language Models (LLMs)' },
  { slug: 'large-language-models-2026', ...largeLanguageModels2026, year: '2026', family: 'Introduction to Large Language Models (LLMs)' },
];

// The same course in different years is one selector entry with a year picker.
export type SubjectGroup = { label: string; members: Subject[] };
export const subjectGroups: SubjectGroup[] = (() => {
  const groups = new Map<string, Subject[]>();
  for (const c of courses) {
    const label = c.family ?? c.course;
    groups.set(label, [...(groups.get(label) ?? []), c]);
  }
  return [...groups]
    .map(([label, members]) => ({ label, members: [...members].sort((a, b) => (a.year ?? '').localeCompare(b.year ?? '')) }))
    .sort((a, b) => a.label.localeCompare(b.label));
})();
export const findCourse = (slug: string) => courses.find(c => c.slug === slug);
export const weekSlug = (week: number) => `week-${week}`;
export const weekPath = (course: Subject, week: number) => `/${course.slug}/${weekSlug(week)}`;
// The week each subject was last left on, so the subject picker can reopen it instead of week 1.
export const lastWeekKey = (courseId: string) => `recall:last-week:${courseId}`;
export const findWeek = (course: Subject, segment: string | null) => course.weeks.find(w => weekSlug(w.week) === segment);
// Every week's questions on one page; the slug can't collide with "week-<n>".
export const allSlug = 'all';
export const allPath = (course: Subject) => `/${course.slug}/${allSlug}`;
// Remembered as a cookie so "/" can redirect on the server, before anything renders.
export const LAST_VISIT_COOKIE = 'recall-last';
export const quizPath = (course: Subject) => `/${course.slug}/quiz`;
export const isResumePath = (path: string | undefined) =>
  courses.some(c => quizPath(c) === path || allPath(c) === path || c.weeks.some(w => weekPath(c, w.week) === path));
