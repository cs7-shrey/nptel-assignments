import psychology from '@/data/assignments.json';
import responsibleAI from '@/data/responsible-safe-ai.json';
import vlsi from '@/data/vlsi-design-flow.json';
import type { Course } from './study';

export type Subject = Course & { slug: string };

// The slug is the subject's URL: /<slug>/week-<n>.
export const courses: Subject[] = [
  { slug: 'psychology-of-learning', ...psychology },
  { slug: 'responsible-safe-ai', ...responsibleAI },
  { slug: 'vlsi-design-flow', ...vlsi },
];
export const findCourse = (slug: string) => courses.find(c => c.slug === slug);
export const weekSlug = (week: number) => `week-${week}`;
export const weekPath = (course: Subject, week: number) => `/${course.slug}/${weekSlug(week)}`;
export const findWeek = (course: Subject, segment: string | null) => course.weeks.find(w => weekSlug(w.week) === segment);
// Every week's questions on one page; the slug can't collide with "week-<n>".
export const allSlug = 'all';
export const allPath = (course: Subject) => `/${course.slug}/${allSlug}`;
// Remembered as a cookie so "/" can redirect on the server, before anything renders.
export const LAST_VISIT_COOKIE = 'recall-last';
export const quizPath = (course: Subject) => `/${course.slug}/quiz`;
export const isResumePath = (path: string | undefined) =>
  courses.some(c => quizPath(c) === path || allPath(c) === path || c.weeks.some(w => weekPath(c, w.week) === path));
