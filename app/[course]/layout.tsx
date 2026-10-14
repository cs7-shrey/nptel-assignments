import { notFound } from 'next/navigation';
import StudyDesk from '@/components/study-desk';
import { courses, findCourse } from '@/lib/courses';

export const dynamicParams = false;
export const generateStaticParams = () => courses.map(c => ({ course: c.slug }));

export default async function CourseLayout({ children, params }: LayoutProps<'/[course]'>) {
  const course = findCourse((await params).course);
  if (!course) notFound();
  // Keyed so switching subjects never saves one course's answers under another's key.
  return <StudyDesk key={course.slug} course={course}>{children}</StudyDesk>;
}
