'use client';
import { useEffect, useState } from 'react';
import { createQuiz, quizKey, quizQuestions, restoreQuiz } from '@/lib/quiz';
import type { Quiz } from '@/lib/quiz';
import { isChecked, isCorrect } from '@/lib/study';
import QuestionCard from './question-card';
import QuizDialog from './quiz-dialog';
import { useDesk } from './study-desk';

export default function QuizView() {
  const { course } = useDesk();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);

  // No saved quiz opens the form straight away.
  useEffect(() => {
    let saved: Quiz | null = null;
    try { saved = restoreQuiz(course, localStorage.getItem(quizKey(course.courseId))); } catch { /* Storage is optional. */ }
    setQuiz(saved);
    setCreating(!saved);
    setLoaded(true);
  }, [course]);
  useEffect(() => {
    if (loaded && quiz) try { localStorage.setItem(quizKey(course.courseId), JSON.stringify(quiz)); } catch { /* Storage is optional. */ }
  }, [loaded, course.courseId, quiz]);

  if (!loaded) return null;
  const questions = quiz ? quizQuestions(course, quiz) : [];
  const answered = quiz ? questions.filter(({ question: q }) => isChecked(q, quiz.choices[q.id], quiz.checked)) : [];
  const correct = quiz ? answered.filter(({ question: q }) => isCorrect(q, quiz.choices[q.id])).length : 0;
  const reset = () => setQuiz(q => q && { ...q, choices: {}, checked: {} });
  const newQuizButton = <button className="primary-button" onClick={() => setCreating(true)}>New quiz</button>;

  return <>
    <header className="intro">
      <div>
        <h1>Quiz<span className="period">.</span></h1>
        {quiz && <p className="topic">{quiz.weeks.length === 1 ? 'Week' : 'Weeks'} {quiz.weeks.join(', ')} · {questions.length} questions</p>}
      </div>
      {quiz && <div className="controls">
        {answered.length > 0 && <span className="score">{correct}/{answered.length} correct <button onClick={reset}>Reset</button></span>}
        {newQuizButton}
      </div>}
    </header>
    {quiz ? <>
      <div id="questions" tabIndex={-1} className="questions">{questions.map(({ question: q, week }, i) =>
        <QuestionCard key={q.id} q={q} number={i + 1} source={`Week ${week}`} choice={quiz.choices[q.id]} checked={quiz.checked}
          onChange={choice => setQuiz(qz => qz && { ...qz, choices: { ...qz.choices, [q.id]: choice } })}
          onCheck={() => setQuiz(qz => qz && { ...qz, checked: { ...qz.checked, [q.id]: true } })} />)}</div>
      <div className="pagination quiz-end">
        <span className="score">{answered.length}/{questions.length} answered{answered.length > 0 && ` · ${correct} correct`}</span>
        {newQuizButton}
      </div>
    </> : <div id="questions" className="questions quiz-empty"><p>No quiz yet.</p>{newQuizButton}</div>}
    <QuizDialog open={creating} course={course} initial={quiz} onClose={() => setCreating(false)} onCreate={(weeks, max) => {
      setQuiz(createQuiz(course, weeks, max));
      setCreating(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }} />
  </>;
}
