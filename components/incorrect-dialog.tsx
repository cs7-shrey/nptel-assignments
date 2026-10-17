'use client';
import { useEffect, useRef } from 'react';
import type { Quiz } from '@/lib/quiz';
import type { Question } from '@/lib/study';
import QuestionCard from './question-card';

type Props = { open: boolean; quiz: Quiz; incorrect: { question: Question; week: number; number: number }[]; onClose: () => void };

// Read-only review of the questions answered wrong, in the same native modal as the quiz form.
export default function IncorrectDialog({ open, quiz, incorrect, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return <dialog ref={dialog} className="quiz-dialog review-dialog" aria-labelledby="review-dialog-title" onClose={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    {open && <>
      <div className="review-head">
        <h2 id="review-dialog-title">Incorrect answers<span className="period">.</span></h2>
        <button type="button" className="secondary-button" onClick={onClose} autoFocus>Close</button>
      </div>
      {incorrect.length ? <div className="questions">{incorrect.map(({ question: q, week, number }) =>
        <QuestionCard key={q.id} q={q} number={number} source={`Week ${week}`} choice={quiz.choices[q.id]} checked={quiz.checked} showAnswers
          onChange={() => {}} onCheck={() => {}} />)}</div>
        : <p className="review-empty">None. Every answer was correct.</p>}
    </>}
  </dialog>;
}
