'use client';
import Link from 'next/link';
import { weekPath } from '@/lib/courses';
import { hasAnswer, isChecked, isCorrect, resetWeekProgress } from '@/lib/study';
import QuestionCard from './question-card';
import { useDesk } from './study-desk';
import WeekSummary from './week-summary';

export default function WeekView({ weekId }: { weekId: number }) {
  const { course, progress, setProgress, showAnswers, setShowAnswers } = useDesk();
  const { choices, checked } = progress;
  const week = course.weeks.find(w => w.week === weekId)!;
  const index = course.weeks.indexOf(week), prev = course.weeks[index - 1], next = course.weeks[index + 1];
  const hasKey = week.questions.some(hasAnswer);
  const answered = week.questions.filter(q => isChecked(q, choices[q.id], checked));
  const correct = answered.filter(q => isCorrect(q, choices[q.id])).length;

  return <>
    <header className="intro">
      <div><h1>Week {week.week}<span className="period">.</span></h1><p className="topic">{week.topic}</p></div>
      {hasKey ? <div className="controls">
        {answered.length > 0 && <span className="score">{correct}/{answered.length} correct <button onClick={() => setProgress(p => resetWeekProgress(p, week))}>Reset</button></span>}
        <label className="answer-toggle"><input type="checkbox" role="switch" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} /><span className="switch" aria-hidden="true" />Show answers</label>
      </div> : <p className="pending">Answer key not released yet.</p>}
    </header>
    <WeekSummary key={`${course.courseId}:${week.week}`} course={course} week={week} />
    <div id="questions" tabIndex={-1} className="questions">{week.questions.map(q =>
      <QuestionCard key={q.id} q={q} number={q.number} choice={choices[q.id]} checked={checked} showAnswers={showAnswers}
        onChange={choice => setProgress(p => ({ ...p, choices: { ...p.choices, [q.id]: choice } }))}
        onCheck={() => setProgress(p => ({ ...p, checked: { ...p.checked, [q.id]: true } }))} />)}</div>
    <nav className="pagination" aria-label="Other weeks">
      {prev ? <Link href={weekPath(course, prev.week)}>← Week {prev.week}</Link> : <span />}
      {next && <Link href={weekPath(course, next.week)}>Week {next.week} →</Link>}
    </nav>
  </>;
}
