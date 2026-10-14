'use client';
import Link from 'next/link';
import { weekPath } from '@/lib/courses';
import { hasAnswer, isChecked, isCorrect, resetWeekProgress } from '@/lib/study';
import { pad, useDesk } from './study-desk';

const slideOf = (reference: string | null) => reference?.match(/slide no\.?\s*([\d-]+)/i)?.[1];

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
    <div id="questions" tabIndex={-1} className="questions">{week.questions.map(q => {
      const choice = choices[q.id], keyed = hasAnswer(q), submitted = isChecked(q, choice, checked);
      const revealed = keyed && (showAnswers || submitted), slide = slideOf(q.reference);
      const numeric = q.type === 'numeric', multiple = q.type === 'multiple-choice';
      const selected = Array.isArray(choice) ? choice : choice ? [choice] : [];
      const validNumeric = typeof choice === 'string' && choice.trim() !== '' && Number.isFinite(Number(choice));
      return <article className="question" key={q.id} data-question-id={q.id}>
        <span className="question-number">{pad(q.number)}</span>
        <div>
          <h2 id={`${q.id}-prompt`}>{q.prompt}</h2>
          {q.contextTable && <div className="question-table"><table aria-label={`Question ${q.number} matching table`}><thead><tr>{q.contextTable.headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{q.contextTable.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
          {multiple && !/select all/i.test(q.prompt) && <p className="choice-hint">Select all that apply.</p>}
          {numeric ? <div className="numeric-answer">
            <label htmlFor={`${q.id}-input`}>Your answer</label>
            <input id={`${q.id}-input`} type="number" step="any" aria-describedby={`${q.id}-prompt`} value={typeof choice === 'string' ? choice : ''} disabled={submitted} onChange={e => setProgress(p => ({ ...p, choices: { ...p.choices, [q.id]: e.target.value } }))} />
          </div> : <div className="options" role="group" aria-labelledby={`${q.id}-prompt`}>{q.options.map(o => {
            const correctOption = revealed && !!q.correctOptionIds?.includes(o.id), wrongOption = revealed && selected.includes(o.id) && !correctOption;
            return <button key={o.id} aria-pressed={selected.includes(o.id)} disabled={submitted} className={`option ${selected.includes(o.id) ? 'selected' : ''} ${correctOption ? 'correct' : ''} ${wrongOption ? 'wrong' : ''}`} onClick={() => setProgress(p => {
              const current = p.choices[q.id];
              const values = Array.isArray(current) ? current : [];
              return { ...p, choices: { ...p.choices, [q.id]: multiple ? values.includes(o.id) ? values.filter(id => id !== o.id) : [...values, o.id] : o.id } };
            })}>
              <span className="option-letter">{o.id}</span><span className="option-text">{o.text}</span>
              {correctOption ? <span className="option-mark" aria-label="Correct answer">✓</span> : wrongOption ? <span className="option-mark" aria-label="Wrong">×</span> : null}
            </button>;
          })}</div>}
          {(numeric || multiple) && keyed && !submitted && <button className="check-answer" disabled={numeric ? !validNumeric : selected.length === 0} onClick={() => setProgress(p => ({ ...p, checked: { ...p.checked, [q.id]: true } }))}>Check answer</button>}
          {submitted && (numeric || multiple) && <p role="status" className={`answer-result ${isCorrect(q, choice) ? 'right' : 'incorrect'}`}>{isCorrect(q, choice) ? 'Correct.' : multiple ? 'Not quite. Select the full set of correct answers.' : 'Not quite.'}</p>}
          {revealed && numeric && <p className="numeric-key">Official answer: <strong>{q.correctNumericAnswer}</strong></p>}
          {revealed && slide && <p className="hint">See slide {slide}</p>}
        </div>
      </article>;
    })}</div>
    <nav className="pagination" aria-label="Other weeks">
      {prev ? <Link href={weekPath(course, prev.week)}>← Week {prev.week}</Link> : <span />}
      {next && <Link href={weekPath(course, next.week)}>Week {next.week} →</Link>}
    </nav>
  </>;
}
