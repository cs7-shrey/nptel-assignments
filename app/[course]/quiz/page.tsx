import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QuizView from '@/components/quiz-view';
import { findCourse } from '@/lib/courses';

export async function generateMetadata({ params }: PageProps<'/[course]/quiz'>): Promise<Metadata> {
  const course = findCourse((await params).course);
  if (!course) notFound();
  return { title: `Quiz · ${course.course}` };
}

export default function QuizPage() {
  return <QuizView />;
}
