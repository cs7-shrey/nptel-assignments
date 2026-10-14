import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../data/assignments.json',import.meta.url),'utf8'));
test('all 13 weeks are present, each with ten uniquely identified questions',()=>{
 assert.deepEqual(data.weeks.map(w=>w.week),Array.from({length:13},(_,i)=>i));
 const ids=new Set();for(const week of data.weeks){assert.equal(week.questions.length,10);for(const [i,q] of week.questions.entries()){assert.equal(q.number,i+1);assert(!ids.has(q.id));ids.add(q.id);assert(q.prompt.trim().length>10);assert([2,4].includes(q.options.length));assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);assert(q.options.every(o=>o.text.trim()));}}
 assert.equal(ids.size,130);
});
test('verified answers refer to real choices; unreleased answers are never guessed',()=>{
 for(const week of data.weeks)for(const q of week.questions){if(q.answerStatus==='official'){assert(q.correctOptionIds?.length);for(const id of q.correctOptionIds)assert(q.options.some(o=>o.id===id));}else assert.equal(q.correctOptionIds,null);}
 const finalWeek=data.weeks.find(w=>w.week===12);
 assert.deepEqual(finalWeek.questions.map(q=>q.correctOptionIds),[...'CDDBCDDAAB'].map(id=>[id]));
 assert(finalWeek.questions.every(q=>q.answerSource==='course-accepted-answer'));
 assert.equal(data.weeks.flatMap(w=>w.questions).filter(q=>q.answerStatus==='official').length,130);
});
test('known source discrepancies are resolved with provenance',()=>{
 const q=data.weeks[6].questions[6];assert.deepEqual(q.correctOptionIds,['D']);assert.equal(q.sourceAnswerLabel,'A');assert.equal(q.answerSource,'course-accepted-answer');
 assert.equal(data.weeks[1].questions[6].number,7);assert.equal(data.weeks[1].questions[6].sourceNumber,6);
 assert.deepEqual(data.weeks[7].questions.map(q=>q.correctOptionIds[0]),[...'CDDDAADDBB']);
 assert.equal(data.weeks[7].questions[5].options.length,2);
 assert.match(data.weeks[7].questions[5].prompt,/sharing of results/);
});
test('export contains course questions only, with no saved submission/account data',()=>{
 const text=JSON.stringify(data);for(const value of ['last recorded submission','@gmail.com','Your last','SS','Score:'])assert(!text.includes(value));
});
