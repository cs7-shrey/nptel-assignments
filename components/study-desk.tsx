'use client';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { allPath, allSlug, findWeek, LAST_VISIT_COOKIE, quizPath, weekPath } from '@/lib/courses';
import type { Subject } from '@/lib/courses';
import { progressKey, restoreProgress } from '@/lib/study';
import type { Progress } from '@/lib/study';
import Footer from './footer';
import { pad } from './question-card';
import SubjectSwitcher from './subject-switcher';
import ThemeToggle from './theme-toggle';

type Desk = {
  course: Subject;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  showAnswers: boolean;
  setShowAnswers: (show: boolean) => void;
};
const DeskContext = createContext<Desk | null>(null);
// Set once someone has seen or used the quiz, so the "new" callout shows only on first visits.
const QUIZ_INTRO_KEY = 'recall:quiz-intro-seen';

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
  const [quizIntro, setQuizIntro] = useState(false);
  const segment = useSelectedLayoutSegment();
  const currentWeek = findWeek(course, segment)?.week, onQuiz = segment === 'quiz', onAll = segment === allSlug;

  useEffect(() => {
    try { setProgress(restoreProgress(course, localStorage.getItem(progressKey(course.courseId)))); } catch { /* Storage is optional. */ }
    setLoaded(true);
  }, [course]);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(progressKey(course.courseId), JSON.stringify(progress)); } catch { /* Storage is optional. */ }
  }, [loaded, course.courseId, progress]);
  useEffect(() => {
    try {
      if (onQuiz) localStorage.setItem(QUIZ_INTRO_KEY, '1');
      setQuizIntro(!localStorage.getItem(QUIZ_INTRO_KEY));
    } catch { /* Storage is optional. */ }
  }, [onQuiz]);
  function dismissQuizIntro() {
    setQuizIntro(false);
    try { localStorage.setItem(QUIZ_INTRO_KEY, '1'); } catch { /* Storage is optional. */ }
  }
  useEffect(() => {
    const path = onQuiz ? quizPath(course) : onAll ? allPath(course) : currentWeek !== undefined ? weekPath(course, currentWeek) : null;
    if (path) document.cookie = `${LAST_VISIT_COOKIE}=${path}; path=/; max-age=31536000; samesite=lax`;
    document.querySelector('.week-button[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [course, currentWeek, onQuiz, onAll]);

  return <DeskContext value={{ course, progress, setProgress, showAnswers, setShowAnswers }}>
    <div className={`study-shell ${loaded ? '' : 'loading'}`}>
      <a className="skip-link" href="#questions">Skip to questions</a>
      <aside className="sidebar">
        <div className="wordmark"><span className="mark" aria-hidden="true">r.</span> recall</div>
        <SubjectSwitcher course={course} />
        <nav aria-label="Assignments">
          <Link href={allPath(course)} className="week-button all-button" aria-current={onAll ? 'page' : undefined} aria-label={`All weeks: every question from ${course.weeks.length} weeks in one shuffled page`}><span className="week-number">ALL</span><span className="week-label">All weeks</span></Link>
          {course.weeks.map(w => <Link key={w.week} href={weekPath(course, w.week)} className="week-button" aria-current={w.week === currentWeek ? 'page' : undefined} aria-label={`Week ${w.week}: ${w.topic}`}><span className="week-number">{pad(w.week)}</span><span className="week-label">{w.topic}</span></Link>)}
        </nav>
        <div className="quiz-slot">
          {quizIntro && <div className="quiz-intro" role="status">
            <p><strong>New: Quiz.</strong> Mix questions from any weeks into a shuffled quiz.</p>
            <div className="quiz-intro-actions">
              <Link href={quizPath(course)} onClick={dismissQuizIntro}>Try it →</Link>
              <button className="text-button" onClick={dismissQuizIntro}>Dismiss</button>
            </div>
          </div>}
          <Link href={quizPath(course)} className="quiz-link" aria-current={onQuiz ? 'page' : undefined} onClick={dismissQuizIntro}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
            Quiz
            {quizIntro && <span className="new-dot" aria-label="New" />}
          </Link>
        </div>
        <ThemeToggle />
      </aside>
      <main>
        {children}
        <Footer />
      </main>
    </div>
  </DeskContext>;
}
