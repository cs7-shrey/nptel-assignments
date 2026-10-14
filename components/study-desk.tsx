'use client';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { findWeek, LAST_VISIT_COOKIE, weekPath } from '@/lib/courses';
import type { Subject } from '@/lib/courses';
import { progressKey, restoreProgress } from '@/lib/study';
import type { Progress } from '@/lib/study';
import Footer from './footer';
import SubjectSwitcher from './subject-switcher';
import ThemeToggle from './theme-toggle';

export const pad = (n: number) => String(n).padStart(2, '0');

type Desk = {
  course: Subject;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  showAnswers: boolean;
  setShowAnswers: (show: boolean) => void;
};
const DeskContext = createContext<Desk | null>(null);
export function useDesk() {
  const desk = useContext(DeskContext);
  if (!desk) throw new Error('useDesk must be used inside StudyDesk');
  return desk;
}

// Lives in the course layout, so progress and the sidebar persist while the week changes.
export default function StudyDesk({ course, children }: { course: Subject; children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>({ choices: {}, checked: {} });
  const [showAnswers, setShowAnswers] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const currentWeek = findWeek(course, useSelectedLayoutSegment())?.week;

  useEffect(() => {
    try { setProgress(restoreProgress(course, localStorage.getItem(progressKey(course.courseId)))); } catch { /* Storage is optional. */ }
    setLoaded(true);
  }, [course]);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(progressKey(course.courseId), JSON.stringify(progress)); } catch { /* Storage is optional. */ }
  }, [loaded, course.courseId, progress]);
  useEffect(() => {
    if (currentWeek === undefined) return;
    document.cookie = `${LAST_VISIT_COOKIE}=${weekPath(course, currentWeek)}; path=/; max-age=31536000; samesite=lax`;
    document.querySelector('.week-button[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [course, currentWeek]);

  return <DeskContext value={{ course, progress, setProgress, showAnswers, setShowAnswers }}>
    <div className={`study-shell ${loaded ? '' : 'loading'}`}>
      <a className="skip-link" href="#questions">Skip to questions</a>
      <aside className="sidebar">
        <div className="wordmark"><span className="mark" aria-hidden="true">r.</span> recall</div>
        <SubjectSwitcher course={course} />
        <nav aria-label="Weeks">{course.weeks.map(w => <Link key={w.week} href={weekPath(course, w.week)} className="week-button" aria-current={w.week === currentWeek ? 'page' : undefined} aria-label={`Week ${w.week}: ${w.topic}`}><span className="week-number">{pad(w.week)}</span><span className="week-label">{w.topic}</span></Link>)}</nav>
        <ThemeToggle />
      </aside>
      <main>
        {children}
        <Footer />
      </main>
    </div>
  </DeskContext>;
}
