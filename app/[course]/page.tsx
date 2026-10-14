import { notFound, redirect } from 'next/navigation';
import { findCourse, weekPath } from '@/lib/courses';

export default async function CoursePage({ params }: PageProps<'/[course]'>) {
  const course = findCourse((await params).course);
  if (!course) notFound();
  redirect(weekPath(course, course.weeks[0].week));
}
