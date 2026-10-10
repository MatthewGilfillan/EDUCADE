const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../public/teacher-data.js');
const D=window.EDUCADE_DEMO;
test('Every curriculum skill has a unique EDUCADE ID and no invented score',()=>{
 const skills=D.groups.flatMap(g=>g.skills),ids=skills.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(ids.every(id=>id.startsWith('EDU.G5.')));
 for(const student of D.students){
  for(const skill of skills){
   const records=student.evidence.filter(r=>r.skillId===skill.id),stats=D.skillStats(student,skill.id);
   assert.equal(stats.attempts,records.length);
   assert.equal(stats.score,records.length?Math.round(records.filter(r=>r.correct).length/records.length*100):null);
   assert.ok(stats.hints<=stats.supported);
   assert.equal(stats.independent+stats.supported,stats.attempts);
  }
 }
 assert.ok(skills.some(s=>D.students.every(student=>D.skillStats(student,s.id).score===null)));
});
test('Class comparison and profile evidence use the same six learners and reading scores',()=>{
 const expected=[[45,85,60,70],[80,70,90,65],[60,40,60,80],[90,75,70,55],[30,60,50,70],[70,90,35,80]];
 const class5a=D.classes.find(c=>c.id==='5a').studentIds.map(id=>D.students.find(s=>s.id===id));
 assert.equal(class5a.length,6);
 assert.equal(new Set(D.students.map(s=>s.id)).size,D.students.length);
 class5a.forEach((student,i)=>assert.deepEqual(D.reading.map(id=>D.skillStats(student,id).score),expected[i]));
 assert.equal(D.classes.find(c=>c.id==='5b').studentIds.length,3);
 assert.equal(new Set(D.classes.flatMap(c=>c.studentIds)).size,D.students.length);
});
test('Evidence is internally coherent across weeks, support and challenge responses',()=>{
 for(const student of D.students){
  assert.equal(new Set(student.evidence.map(r=>r.id)).size,student.evidence.length);
  for(const record of student.evidence){
   assert.ok(D.groups.some(g=>g.skills.some(s=>s.id===record.skillId)));
   assert.ok(record.week>=1&&record.week<=4);
   assert.ok(!record.hint||record.supported);
   assert.equal(record.response,record.correct?D.samples[record.skillId].answer:D.samples[record.skillId].retry);
  }
 }
});
test('Standards references are checked separately; prototype alignments remain candidates',()=>{
 for(const [id,mapping] of Object.entries(D.mappings)){
  assert.ok(D.samples[id]);
  assert.ok(mapping.code.startsWith('CCSS.ELA-LITERACY.'));
  assert.equal(mapping.status,'candidate');
  assert.equal(mapping.checked,'2026-10-09');
  assert.equal(mapping.sourceType,'published reference mirror');
 }
});
