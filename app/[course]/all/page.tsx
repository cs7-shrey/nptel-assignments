import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AllView from '@/components/all-view';
import { courses, findCourse } from '@/lib/courses';

export const dynamicParams = false;
export const generateStaticParams = () => courses.map(c => ({ course: c.slug }));

export async function generateMetadata({ params }: PageProps<'/[course]/all'>): Promise<Metadata> {
  const course = findCourse((await params).course);
  if (!course) notFound();
  return { title: `All weeks · ${course.course}` };
}

export default function AllPage() {
  return <AllView />;
}
