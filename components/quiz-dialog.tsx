'use client';
import { useEffect, useRef, useState } from 'react';
import type { Subject } from '@/lib/courses';
import { quizzable } from '@/lib/quiz';
import type { Quiz } from '@/lib/quiz';
import { hasAnswer } from '@/lib/study';
import { pad } from './question-card';

type Props = { open: boolean; course: Subject; initial: Quiz | null; onClose: () => void; onCreate: (weeks: number[], max: number | null) => void };

// A native modal dialog: it traps focus, closes on Escape, and renders above the page.
export default function QuizDialog({ open, course, initial, onClose, onCreate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return <dialog ref={dialog} className="quiz-dialog" aria-labelledby="quiz-dialog-title" onClose={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    {open && <QuizForm course={course} initial={initial} onClose={onClose} onCreate={onCreate} />}
  </dialog>;
}

function QuizForm({ course, initial, onClose, onCreate }: Omit<Props, 'open'>) {
  const keyedWeeks = course.weeks.filter(w => w.questions.some(hasAnswer)).map(w => w.week);
  const [weeks, setWeeks] = useState<number[]>(() => initial?.weeks.filter(w => keyedWeeks.includes(w)) ?? []);
  const [max, setMax] = useState(initial?.max?.toString() ?? '');
  const available = quizzable(course, weeks).length;
  const maxNumber = max.trim() === '' ? null : Number(max);
  const validMax = maxNumber === null || (Number.isInteger(maxNumber) && maxNumber > 0);
  const allSelected = weeks.length === keyedWeeks.length;
  const toggle = (week: number) => setWeeks(ws => ws.includes(week) ? ws.filter(w => w !== week) : [...ws, week]);

  return <form method="dialog" onSubmit={e => { e.preventDefault(); if (weeks.length && validMax) onCreate(weeks, maxNumber); }}>
    <h2 id="quiz-dialog-title">New quiz<span className="period">.</span></h2>
    <div className="field-head">
      <span id="quiz-weeks-label" className="field-label">Weeks</span>
      <button type="button" className="text-button" onClick={() => setWeeks(allSelected ? [] : keyedWeeks)}>{allSelected ? 'Clear' : 'Select all'}</button>
    </div>
    <div className="week-chips" role="group" aria-labelledby="quiz-weeks-label">{course.weeks.map(w => {
      const keyed = keyedWeeks.includes(w.week);
      return <button type="button" key={w.week} className="week-chip" aria-pressed={weeks.includes(w.week)} disabled={!keyed}
        aria-label={`Week ${w.week}: ${w.topic}${keyed ? '' : ' (answer key not released)'}`} title={keyed ? w.topic : 'Answer key not released yet'} onClick={() => toggle(w.week)}>{pad(w.week)}</button>;
    })}</div>
    <label className="field-label" htmlFor="quiz-max">Max questions <span className="optional">optional</span></label>
    <input id="quiz-max" className="quiz-max" type="number" min="1" step="1" inputMode="numeric" placeholder={available ? `All ${available}` : 'All'} value={max} onChange={e => setMax(e.target.value)} aria-invalid={!validMax} />
    <p className="field-hint">{!validMax ? 'Enter a whole number above 0.' : weeks.length ? `${Math.min(maxNumber ?? available, available)} of ${available} questions, shuffled.` : 'Pick at least one week.'}</p>
    <div className="dialog-actions">
      <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
      <button type="submit" className="primary-button" disabled={!weeks.length || !validMax}>Create quiz</button>
    </div>
  </form>;
}
