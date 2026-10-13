'use client';
import { useEffect, useState } from 'react';
import sourceData from '@/data/assignments.json';

type Option = {id:string;text:string};
type Question = {id:string;number:number;prompt:string;options:Option[];correctOptionIds:string[]|null;reference:string|null};
type Week = {week:number;topic:string;questions:Question[]};
const data=sourceData as unknown as {course:string;courseId:string;weeks:Week[]};
const pad=(n:number)=>String(n).padStart(2,'0');
const slideOf=(reference:string|null)=>reference?.match(/slide no\.?\s*([\d-]+)/i)?.[1];
// Question ids (w01-q03) repeat across courses, so progress is stored per course.
const STORAGE_KEY=`recall:${data.courseId}`;

export default function Home(){
 const [weekId,setWeekId]=useState(0),[showAnswers,setShowAnswers]=useState(false),[choices,setChoices]=useState<Record<string,string>>({}),[loaded,setLoaded]=useState(false);
 const week=data.weeks.find(w=>w.week===weekId)??data.weeks[0];
 const index=data.weeks.indexOf(week),prev=data.weeks[index-1],next=data.weeks[index+1];
 const hasKey=week.questions.some(q=>q.correctOptionIds);
 const answered=week.questions.filter(q=>choices[q.id]);
 const correct=answered.filter(q=>q.correctOptionIds?.includes(choices[q.id])).length;

 // Restore the last week and answers; saved after every change.
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)??'{}');if(data.weeks.some(w=>w.week===saved.week))setWeekId(saved.week);if(saved.choices)setChoices(saved.choices);}catch{}setLoaded(true);},[]);
 useEffect(()=>{if(loaded)try{localStorage.setItem(STORAGE_KEY,JSON.stringify({week:weekId,choices}));}catch{}},[loaded,weekId,choices]);
 useEffect(()=>{document.querySelector('.week-button[aria-current]')?.scrollIntoView({block:'nearest',inline:'center'});},[weekId,loaded]);

 function changeWeek(id:number){setWeekId(id);window.scrollTo({top:0,behavior:'instant'});}
 function toggleTheme(){const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('recall-theme',theme);}catch{}}
 function resetWeek(){setChoices(prev=>Object.fromEntries(Object.entries(prev).filter(([id])=>!week.questions.some(q=>q.id===id))));}

 return <div className={`study-shell ${loaded?'':'loading'}`}>
  <a className="skip-link" href="#questions">Skip to questions</a>
  <aside className="sidebar">
   <div className="wordmark"><span className="mark" aria-hidden="true">r.</span> recall</div>
   <p className="course">{data.course}</p>
   <nav aria-label="Weeks">{data.weeks.map(w=><button key={w.week} className="week-button" aria-current={w.week===weekId?'page':undefined} aria-label={`Week ${w.week}: ${w.topic}`} onClick={()=>changeWeek(w.week)}><span className="week-number">{pad(w.week)}</span><span className="week-label">{w.topic}</span></button>)}</nav>
   <button className="theme-toggle" aria-label="Toggle dark mode" onClick={toggleTheme}>
    <svg className="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    <svg className="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
   </button>
  </aside>
  <main>
   <header className="intro">
    <div><h1>Week {week.week}<span className="period">.</span></h1><p className="topic">{week.topic}</p></div>
    {hasKey?<div className="controls">
     {answered.length>0&&<span className="score">{correct}/{answered.length} correct <button onClick={resetWeek}>Reset</button></span>}
     <label className="answer-toggle"><input type="checkbox" role="switch" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)}/><span className="switch" aria-hidden="true"/>Show answers</label>
    </div>:<p className="pending">Answer key not released yet.</p>}
   </header>
   <div id="questions" tabIndex={-1} className="questions" key={week.week}>{week.questions.map(q=>{
    const choice=choices[q.id],answerKey=q.correctOptionIds,revealed=!!answerKey&&(showAnswers||!!choice),slide=slideOf(q.reference);
    return <article className="question" key={q.id}>
     <span className="question-number">{pad(q.number)}</span>
     <div>
      <h2>{q.prompt}</h2>
      <div className="options">{q.options.map(o=>{const isCorrect=revealed&&!!answerKey?.includes(o.id),isWrong=revealed&&choice===o.id&&!isCorrect;
       return <button key={o.id} aria-pressed={choice===o.id} disabled={!!answerKey&&!!choice} className={`option ${choice===o.id?'selected':''} ${isCorrect?'correct':''} ${isWrong?'wrong':''}`} onClick={()=>setChoices({...choices,[q.id]:o.id})}>
        <span className="option-letter">{o.id}</span><span className="option-text">{o.text}</span>
        {isCorrect?<span className="option-mark" aria-label="Correct answer">✓</span>:isWrong?<span className="option-mark" aria-label="Wrong">×</span>:null}
       </button>;})}</div>
      {revealed&&slide&&<p className="hint">See slide {slide}</p>}
     </div>
    </article>;})}</div>
   <nav className="pagination" aria-label="Other weeks">
    {prev?<button onClick={()=>changeWeek(prev.week)}>← Week {prev.week}</button>:<span/>}
    {next&&<button onClick={()=>changeWeek(next.week)}>Week {next.week} →</button>}
   </nav>
   <footer className="footer">Made with <svg className="heart" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="love"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.1 4 6.3 4c2.4 0 4 1.4 5.7 3.4C13.7 5.4 15.3 4 17.7 4 21.9 4 23.7 8.4 22 11.7 19.5 16.4 12 21 12 21z"/></svg> by <a href="https://x.com/atshrey" target="_blank" rel="noopener noreferrer">Shrey</a></footer>
  </main>
 </div>;
}
