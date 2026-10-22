'use client';
import { useMemo, useState } from 'react';
import { randomSeed, seededRandom, seedFrom, shuffle } from '@/lib/shuffle';
import { isChecked, isCorrect, resetAnswers, taggedQuestions } from '@/lib/study';
import QuestionCard from './question-card';
import { useDesk } from './study-desk';

// The whole course on one page: every week's questions mixed together, with the same answers as the week views.
export default function AllView() {
  const { course, progress, setProgress, showAnswers, setShowAnswers } = useDesk();
  const { choices, checked } = progress;
  const questions = useMemo(() => taggedQuestions(course), [course]);
  // Seed 0 is the stable order, so the first render matches on the server and in the browser; Shuffle draws a new seed.
  const [seed, setSeed] = useState(0);
  const mixed = useMemo(() => shuffle(questions, seededRandom(seed || seedFrom(course.courseId))), [questions, seed, course.courseId]);
  const weeks = course.weeks.map(w => w.week);
  const answered = mixed.filter(({ question: q }) => isChecked(q, choices[q.id], checked));
  const correct = answered.filter(({ question: q }) => isCorrect(q, choices[q.id])).length;

  function reshuffle() {
    setSeed(randomSeed());
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return <>
    <header className="intro">
      <div>
        <h1>All weeks<span className="period">.</span></h1>
        <p className="topic">{questions.length} questions · Weeks {Math.min(...weeks)}–{Math.max(...weeks)} · shuffled</p>
      </div>
      <div className="controls">
        {answered.length > 0 && <span className="score">{correct}/{answered.length} correct <button onClick={() => setProgress(p => resetAnswers(p, questions.map(({ question: q }) => q.id)))}>Reset all</button></span>}
        <label className="answer-toggle"><input type="checkbox" role="switch" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} /><span className="switch" aria-hidden="true" />Show answers</label>
      </div>
    </header>
    <div id="questions" tabIndex={-1} className="questions">{mixed.map(({ question: q, week }, i) =>
      <QuestionCard key={q.id} q={q} number={i + 1} source={`Week ${week}`} choice={choices[q.id]} checked={checked} showAnswers={showAnswers}
        onChange={choice => setProgress(p => ({ ...p, choices: { ...p.choices, [q.id]: choice } }))}
        onCheck={() => setProgress(p => ({ ...p, checked: { ...p.checked, [q.id]: true } }))} />)}</div>
    <div className="pagination quiz-end">
      <span className="score">{answered.length}/{questions.length} answered{answered.length > 0 && ` · ${correct} correct`}</span>
      <button className="primary-button" onClick={reshuffle}>Shuffle</button>
    </div>
  </>;
}
