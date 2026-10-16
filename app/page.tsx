import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { courses, isResumePath, LAST_VISIT_COOKIE, weekPath } from '@/lib/courses';

// Resume the last visited week or quiz; first visits start at the first subject's first week.
export default async function Home() {
  const last = (await cookies()).get(LAST_VISIT_COOKIE)?.value;
  redirect(last && isResumePath(last) ? last : weekPath(courses[0], courses[0].weeks[0].week));
}
