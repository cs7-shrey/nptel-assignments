import { courses } from '@/lib/courses';

export function GET(request: Request) {
  const courseId = new URL(request.url).searchParams.get('course');
  const data = courseId ? courses.find(course => course.courseId === courseId) : { courses };
  if (!data) return Response.json({ error: 'Unknown course' }, { status: 404 });
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
