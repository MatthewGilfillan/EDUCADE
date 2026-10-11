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
test('Teaching priorities use the selected class and the same skill evidence as the dashboard',()=>{
 const class5a=D.classes[0].studentIds.map(id=>D.students.find(s=>s.id===id));
 const original=JSON.stringify(class5a),plan=D.readingPlan(class5a);
 assert.equal(plan.wholeClass.id,D.reading[2]);
 assert.equal(plan.wholeClass.stats.score,61);
 assert.equal(plan.wholeClass.stats.correct,73);
 assert.equal(plan.wholeClass.stats.attempts,120);
 assert.deepEqual(plan.wholeClass.belowPractice.map(m=>m.student.id),['alex','leo','noah','ella']);
 assert.deepEqual(plan.smallGroups.map(g=>[g.id,g.belowPractice.map(m=>m.student.id)]),[[D.reading[0],['alex','leo','noah']],[D.reading[1],['leo','noah']]]);
 assert.deepEqual(plan.individuals.map(m=>[m.student.id,m.skill.id,m.stats.score]),[['noah',D.reading[0],30],['ella',D.reading[2],35],['leo',D.reading[1],40],['alex',D.reading[0],45]]);
 for(const member of plan.individuals){
  const records=member.student.evidence.filter(r=>r.skillId===member.skill.id);
  assert.deepEqual(member.independent,D.summarize(records.filter(r=>!r.supported)));
  assert.deepEqual(member.supported,D.summarize(records.filter(r=>r.supported)));
 }
 assert.equal(JSON.stringify(class5a),original);
 const class5b=D.classes[1].studentIds.map(id=>D.students.find(s=>s.id===id));
 const other=D.readingPlan(class5b);
 assert.equal(other.wholeClass.stats.score,65);
 assert.equal(other.wholeClass.stats.attempts,60);
 assert.deepEqual(other.wholeClass.belowPractice.map(m=>m.student.id),['finn','oliver']);
 assert.equal(other.individuals.length,0);
});
test('Planning excludes missing evidence and does not recommend reteaching an all-correct class',()=>{
 const learners=D.students.slice(0,6).map(s=>({...s,evidence:s.evidence.map(r=>({...r}))}));
 learners[5].evidence=learners[5].evidence.filter(r=>r.skillId!==D.reading[2]);
 const plan=D.readingPlan(learners);
 const figurative=[plan.wholeClass,...plan.smallGroups].find(p=>p?.id===D.reading[2]);
 assert.equal(figurative.members.length,5);
 assert.equal(figurative.stats.attempts,100);
 assert.equal(figurative.belowPractice.some(m=>m.student.id==='ella'),false);
 assert.equal(plan.individuals.some(m=>m.student.id==='ella'),false);
 const missing=D.readingPlan(learners.map(s=>({...s,evidence:[]})));
 assert.equal(missing.wholeClass,null);assert.equal(missing.smallGroups.length,0);assert.equal(missing.individuals.length,0);
 const strong=D.readingPlan(learners.map(s=>({...s,evidence:s.evidence.map(r=>({...r,correct:true}))})));
 assert.equal(strong.wholeClass,null);assert.equal(strong.smallGroups.length,0);assert.equal(strong.individuals.length,0);
});
