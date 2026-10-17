'use client';
import { hasAnswer, isChecked, isCorrect } from '@/lib/study';
import type { Choice, Question } from '@/lib/study';

export const pad = (n: number) => String(n).padStart(2, '0');
const slideOf = (reference: string | null) => reference?.match(/slide no\.?\s*([\d-]+)/i)?.[1];

type Props = {
  q: Question;
  number: number;
  source?: string;
  choice: Choice | undefined;
  checked: Record<string, boolean>;
  showAnswers?: boolean;
  onChange: (choice: Choice) => void;
  onCheck: () => void;
};

export default function QuestionCard({ q, number, source, choice, checked, showAnswers = false, onChange, onCheck }: Props) {
  const keyed = hasAnswer(q), submitted = isChecked(q, choice, checked);
  const revealed = keyed && (showAnswers || submitted), slide = slideOf(q.reference);
  const numeric = q.type === 'numeric', multiple = q.type === 'multiple-choice';
  const selected = Array.isArray(choice) ? choice : choice ? [choice] : [];
  const validNumeric = typeof choice === 'string' && choice.trim() !== '' && Number.isFinite(Number(choice));
  function choose(id: string) {
    onChange(multiple ? selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id] : id);
  }
  return <article className="question" data-question-id={q.id}>
    <span className="question-number">{pad(number)}</span>
    <div>
      {source && <p className="question-source">{source}</p>}
      {q.context && <p className="question-context">{q.context}</p>}
      <h2 id={`${q.id}-prompt`}>{q.prompt}</h2>
      {q.image && <img className="question-image" src={q.image.src} alt={q.image.alt} width={q.image.width} height={q.image.height} loading="lazy" decoding="async" />}
      {q.continuation && <p id={`${q.id}-more`} className="question-more">{q.continuation}</p>}
      {q.code && <pre className="question-code"><code>{q.code}</code></pre>}
      {q.contextTable && <div className="question-table"><table aria-label={`Question ${number} matching table`}><thead><tr>{q.contextTable.headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{q.contextTable.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
      {multiple && !/select all/i.test(q.prompt) && <p className="choice-hint">Select all that apply.</p>}
      {numeric ? <div className="numeric-answer">
        <label htmlFor={`${q.id}-input`}>Your answer</label>
        <input id={`${q.id}-input`} type="number" step="any" aria-describedby={`${q.id}-prompt`} value={typeof choice === 'string' ? choice : ''} disabled={submitted} onChange={e => onChange(e.target.value)} />
      </div> : <div className="options" role="group" aria-labelledby={`${q.id}-prompt${q.continuation ? ` ${q.id}-more` : ''}`}>{q.options.map(o => {
        const correctOption = revealed && !!q.correctOptionIds?.includes(o.id), wrongOption = revealed && selected.includes(o.id) && !correctOption;
        // Letters follow display order, which a quiz shuffles.
        return <button key={o.id} aria-pressed={selected.includes(o.id)} disabled={submitted} className={`option ${selected.includes(o.id) ? 'selected' : ''} ${correctOption ? 'correct' : ''} ${wrongOption ? 'wrong' : ''}`} onClick={() => choose(o.id)}>
          <span className="option-letter">{String.fromCharCode(65 + i)}</span><span className="option-text">{o.image ? <img className="option-image" src={o.image.src} alt={o.image.alt} loading="lazy" /> : o.code ? <code className="option-code">{o.text}</code> : o.text}</span>
          {correctOption ? <span className="option-mark" aria-label="Correct answer">✓</span> : wrongOption ? <span className="option-mark" aria-label="Wrong">×</span> : null}
        </button>;
      })}</div>}
      {(numeric || multiple) && keyed && !submitted && <button className="check-answer" disabled={numeric ? !validNumeric : selected.length === 0} onClick={onCheck}>Check answer</button>}
      {submitted && (numeric || multiple) && <p role="status" className={`answer-result ${isCorrect(q, choice) ? 'right' : 'incorrect'}`}>{isCorrect(q, choice) ? 'Correct.' : multiple ? 'Not quite. Select the full set of correct answers.' : 'Not quite.'}</p>}
      {revealed && numeric && <p className="numeric-key">Official answer: <strong>{q.correctNumericAnswer}</strong></p>}
      {revealed && slide && <p className="hint">See slide {slide}</p>}
    </div>
  </article>;
}
