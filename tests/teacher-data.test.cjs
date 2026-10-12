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
test('Activity summaries show encountered sub-skills and distinguish successful recognition from words actually used',()=>{
 const student=D.students[0],before=JSON.stringify(D.students),axes=D.profileAxes;
 for(const domain of Object.keys(axes))for(const axis of axes[domain]){
  assert.ok(D.samples[axis.id].focus.encountered.length);
  assert.ok(D.skillSummary(student,axis.id).encountered.length);
 }
 const conjunctions=D.skillSummary(student,axes.grammar[0].id);
 assert.ok(conjunctions.encountered.includes('Subordinating conjunctions'));
 assert.equal(conjunctions.label,'Recognised successfully');assert.deepEqual(conjunctions.successful,['because']);
 const perfect=D.skillSummary(student,axes.grammar[1].id);
 assert.deepEqual(perfect.encountered,['Past perfect tense','Sequencing past events']);
 assert.equal(perfect.label,'Used successfully');assert.deepEqual(perfect.successful,['had secured']);
 const consistent=D.skillSummary(student,axes.grammar[2].id);
 assert.ok(consistent.encountered.includes('Simple past tense'));
 assert.deepEqual(consistent.successful,['carried','checked']);
 assert.ok(!consistent.successful.includes('will check'));
 assert.equal(JSON.stringify(D.students),before);
});
test('Unassessed skills and incorrect answers cannot create successful examples',()=>{
 const student=D.students[0],id=D.profileAxes.grammar[1].id;
 const allIncorrect={...student,evidence:student.evidence.filter(record=>record.skillId===id).map(record=>({...record,correct:false,response:'had secured'}))};
 assert.deepEqual(D.skillSummary(allIncorrect,id).successful,[]);
 assert.ok(D.skillSummary(allIncorrect,id).encountered.includes('Past perfect tense'));
 const unknown=D.readingCatalogue.find(group=>group.key==='structure').skills[0].id;
 assert.deepEqual(D.skillSummary(student,unknown).encountered,[]);
 assert.deepEqual(D.skillSummary(student,unknown).successful,[]);
 const agreement=D.profileAxes.grammar[4].id;
 const embedded={...student,evidence:[{skillId:agreement,correct:true,response:'carefully'}]};
 assert.ok(!D.skillSummary(embedded,agreement).successful.includes('are'));
});
test('The five reading navigation groups cover each comprehension skill once and keep foundations and text contexts separate',()=>{
 assert.deepEqual(D.readingCatalogue.map(group=>group.name),['Meaning and evidence','Characters and events','Author’s craft','Structure and features','Comparing and evaluating']);
 const catalogue=D.readingCatalogue.flatMap(group=>group.skills),ids=catalogue.map(skill=>skill.id);
 const contexts=D.readingContexts.flatMap(group=>group.skills).map(skill=>skill.id);
 const comprehension=D.groups.filter(group=>group.domain==='reading'&&group.section==='comprehension'&&!D.readingContexts.includes(group)).flatMap(group=>group.skills);
 assert.equal(catalogue.length,39);assert.equal(new Set(ids).size,39);
 assert.deepEqual(ids.slice().sort(),comprehension.map(skill=>skill.id).sort());
 assert.ok(!contexts.some(id=>ids.includes(id)));
 assert.equal(D.readingSkills().length,47);
 assert.equal(D.readingSkills().filter(skill=>skill.id.includes('.FOUNDATIONS.')).length,8);
 for(const group of D.readingCatalogue)assert.ok(group.skills.every(skill=>D.groups.some(original=>original.skills.includes(skill))));
 for(const id of ['EDU.G5.READING.COMPREHENSION.EVIDENCE.01','EDU.G5.READING.COMPREHENSION.STORY.04','EDU.G5.READING.COMPREHENSION.INTEGRATING.01']){
  assert.ok(ids.includes(id));assert.equal(D.mappings[id],undefined);
  assert.ok(D.students.every(student=>D.skillStats(student,id).score===null));
 }
});
test('Reading plans stay within the selected catalogue group and exclude unassessed skills',()=>{
 const learners=D.students.slice(0,6),before=JSON.stringify(learners);
 for(const group of D.readingCatalogue){
  const ids=group.skills.map(skill=>skill.id),plan=D.readingPlan(learners,ids);
  const priorities=[plan.wholeClass,...plan.smallGroups,...plan.individuals.map(member=>member.skill)].filter(Boolean);
  assert.ok(priorities.every(priority=>ids.includes(priority.id)));
  assert.ok(priorities.every(priority=>learners.some(student=>D.skillStats(student,priority.id).attempts)));
  if(['structure','comparing'].includes(group.key)){assert.equal(plan.wholeClass,null);assert.equal(priorities.length,0);}
 }
 assert.equal(JSON.stringify(learners),before);
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

test('Overall subject scores count responses once, include both reading sections and exclude unassessed skills',()=>{
 for(const student of D.students){
  const totals=Object.keys(D.domains).map(domain=>D.domainStats(student,domain));
  assert.equal(totals.reduce((total,stats)=>total+stats.attempts,0),student.evidence.length);
  assert.equal(totals.reduce((total,stats)=>total+stats.correct,0),student.evidence.filter(record=>record.correct).length);
  const readingIds=new Set(D.groups.filter(group=>group.domain==='reading').flatMap(group=>group.skills.map(skill=>skill.id)));
  assert.deepEqual(D.domainStats(student,'reading'),D.summarize(student.evidence.filter(record=>readingIds.has(record.skillId))));
 }
 const comprehension=D.reading[0],foundation=D.groups.find(group=>group.section==='foundations').skills[0].id;
 const uneven={evidence:[{skillId:comprehension,correct:true,supported:false,hint:false},...Array.from({length:9},()=>({skillId:foundation,correct:false,supported:true,hint:false}))]};
 assert.equal(D.domainStats(uneven,'reading').score,10);
 assert.equal(D.domainStats(uneven,'writing').score,null);
});
