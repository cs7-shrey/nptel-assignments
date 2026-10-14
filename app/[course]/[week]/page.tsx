import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WeekView from '@/components/week-view';
import { courses, findCourse, findWeek, weekSlug } from '@/lib/courses';

export const dynamicParams = false;
export const generateStaticParams = () => courses.flatMap(c => c.weeks.map(w => ({ course: c.slug, week: weekSlug(w.week) })));

async function resolve(params: PageProps<'/[course]/[week]'>['params']) {
  const { course: slug, week: segment } = await params;
  const course = findCourse(slug), week = course && findWeek(course, segment);
  if (!course || !week) notFound();
  return { course, week };
}

export async function generateMetadata({ params }: PageProps<'/[course]/[week]'>): Promise<Metadata> {
  const { course, week } = await resolve(params);
  return { title: `Week ${week.week}: ${week.topic} · ${course.course}` };
}

export default async function WeekPage({ params }: PageProps<'/[course]/[week]'>) {
  const { week } = await resolve(params);
  return <WeekView weekId={week.week} />;
}
