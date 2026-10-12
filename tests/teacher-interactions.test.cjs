const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const publicDir=path.join(__dirname,'../public');
function dashboard(saved,route='class/reading',standardsSaved){
  const dom=new JSDOM(fs.readFileSync(path.join(publicDir,'teacher.html'),'utf8'),{url:'https://preview.example/teacher.html'+(route?'#'+route:''),runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  if(saved)w.localStorage.setItem('educade.teacher.presentation.v1',JSON.stringify({version:1,...saved}));
  if(standardsSaved)w.localStorage.setItem('educade.teacher.standards.v1',JSON.stringify(standardsSaved));
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  for(const file of ['teacher-data.js','teacher-portraits.js','teacher-standards.js','teacher.js'])w.eval(fs.readFileSync(path.join(publicDir,file),'utf8'));
  const select=(selector,value)=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
  // jsdom queues navigation and hashchange on separate event-loop turns.
  return {dom,w,d:w.document,select,click,settle:()=>new Promise(resolve=>w.setTimeout(()=>w.setTimeout(resolve,0),0))};
}
test('Standards judgments require evidence and explicit consistency, independence and extension rather than score cutoffs',()=>{
 const {dom,w}=dashboard();
 try{
  const S=w.EDUCADE_STANDARDS,D=w.EDUCADE_DEMO,id=D.reading[0],original=JSON.stringify(D.students);
  const displayed=D.students.flatMap(student=>D.groups.flatMap(group=>group.skills.map(skill=>S.display(student.id,skill.id)?.level))).filter(Boolean);
  assert.ok(displayed.filter(level=>level==='beginning'||level==='approaching').length/displayed.length>.95);
  assert.equal(displayed.filter(level=>level==='exceeding').length,0);
  assert.equal(S.display('maya',id).level,'approaching');
  assert.equal(S.display('sofia',id).level,'approaching');
  for(const student of D.students)assert.equal(S.get(student.id,id),null);
  assert.equal(S.record('alex',id,{level:'meeting'}),false);
  assert.equal(S.record('alex',id,{level:'constructor'}),false);
  assert.equal(S.record('alex',id,{level:'meeting',consistent:'true',independent:'true'}),false);
  assert.equal(S.record('alex',id,{level:'meeting',consistent:true,independent:true}),true);
  assert.equal(S.record('alex',id,{level:'exceeding',consistent:true,independent:true,extension:true}),false);
  assert.equal(S.record('alex',id,{level:'exceeding',consistent:true,independent:true,extension:true,note:'Integrates several pieces of evidence on a more demanding text.'}),true);
  const missing=D.readingCatalogue.find(group=>group.key==='structure').skills[0].id;
  assert.equal(S.record('alex',missing,{level:'beginning'}),false);
  assert.equal(S.summary(D.students[0],'reading').counts.exceeding,1);
  assert.equal(S.summary(D.students[0],'reading').reviewed,1);
  assert.equal(S.summary(D.students[0],'reading').assessed,9);
  assert.equal(JSON.stringify(D.students),original);
  assert.equal(S.record('alex',id,{level:''}),true);assert.equal(S.get('alex',id),null);
 }finally{dom.window.close();}
});
test('Standards Progress keeps stages and full evidence in their original cells and survives view changes and reload',async()=>{
 const {dom,w,d,click,select,settle}=dashboard();let saved;
 try{
  const D=w.EDUCADE_DEMO,id=D.reading[0],original=JSON.stringify(D.students);
  click('[data-class-mode=standards]');
  assert.equal(d.querySelector('#class-standards-key').hidden,false);
  assert.equal(d.querySelectorAll('.class-table .hp-track,.class-table .heat-cell').length,0);
  assert.equal(d.querySelector('tr[data-student=alex] .standards-badge strong').textContent,'Beginning');
  click('button[aria-label="Show skill evidence for Alex Chen"]');click(`[data-expand-skill="${id}"]`);
  assert.equal(d.querySelectorAll(`tr[data-student=alex] [data-axis="${id}"] .compact-evidence`).length,1);
  click(`tr[data-student=alex] .score-cell[data-evidence="${id}"]`);
  assert.equal(d.querySelectorAll('.standards-attempts .attempt').length,20);
  select('[data-standards-review] [name=level]','beginning');
  d.querySelector('[data-standards-review]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(d.querySelector('.standards-save-status').textContent,'Level saved.');click('#close-evidence');
  assert.equal(d.querySelector('tr[data-student=alex] .standards-badge strong').textContent,'Beginning');
  assert.equal(d.querySelector('tr[data-student=alex] .standards-dots .active')!==null,true);
  click('[data-class-mode=heatmap]');assert.equal(d.querySelector('tr[data-student=alex] .heat-cell strong').textContent,'45%');
  click('[data-class-mode=bars]');assert.equal(d.querySelector('tr[data-student=alex] .hp-value').textContent,'45%');
  click('[data-class-mode=standards]');
  click('#class-tab-overall');await settle();
  assert.equal(d.querySelector('tr[data-student=alex] .standards-domain-summary strong').textContent,'9 skill levels');
  assert.equal(d.querySelector('tr[data-student=alex] .standards-distribution .beginning').textContent,'4');
  assert.equal(d.querySelector('tr[data-student=alex] .standards-distribution .meeting').textContent,'0');
  click('tr[data-student=alex] [data-standards-domain=reading]');await settle();
  assert.equal(d.querySelector('#class-tab-literacy').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('h1').textContent,'Teacher Dashboard');
  click('.profile-link[data-student=alex]');await settle();click('#tab-literacy');await settle();click('[data-mode=standards]');
  assert.equal(d.querySelectorAll('.standards-profile-skill').length,8);
  assert.equal(d.querySelector('.standards-badge strong').textContent,'Beginning');
  assert.equal(d.querySelectorAll('#skill-chart .hp-track,.radar-target').length,0);
  click('#tab-foundations');await settle();
  assert.equal(d.querySelectorAll('.standards-profile-skill').length,8);
  assert.ok(d.querySelector('#skill-chart').textContent.includes('No evidence yet'));
  assert.equal(d.querySelector('[data-mode=standards]').getAttribute('aria-pressed'),'true');
  saved=JSON.parse(w.localStorage.getItem('educade.teacher.standards.v1'));
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
 const next=dashboard({classView:'standards'},'class/reading/comprehension/overview',saved);
 try{assert.equal(next.d.querySelector('tr[data-student=alex] .standards-badge strong').textContent,'Beginning');}
 finally{next.dom.window.close();}
});
test('Invalid saved standards judgments are ignored and unavailable storage keeps a reviewed level for this visit',()=>{
 const malformed={version:1,judgments:{'alex:EDU.G5.READING.COMPREHENSION.INFERENCE.01':{level:'meeting',consistent:false,independent:true}}};
 const {dom,w}=dashboard(undefined,'class/reading',malformed);
 try{
  const S=w.EDUCADE_STANDARDS,id=w.EDUCADE_DEMO.reading[0];
  assert.equal(S.get('alex',id),null);
  w.Storage.prototype.setItem=()=>{throw new Error('blocked');};
  assert.equal(S.record('alex',id,{level:'approaching'}),true);
  assert.equal(S.storageAvailable,false);assert.equal(S.get('alex',id).level,'approaching');
 }finally{dom.window.close();}
});
test('Reading Foundations and Literacy are direct tabs with separate evidence scopes and compatible reading links',async()=>{
 const {dom,w,d,click,select,settle}=dashboard(undefined,'class/reading/foundations');
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students),labels=['Overall','Reading Foundations','Literacy','Writing','Grammar','Vocabulary'];
  assert.deepEqual([...d.querySelectorAll('[role=tab]')].map(tab=>tab.textContent),labels);
  assert.equal(d.querySelector('#class-tab-foundations').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('#class-panel').getAttribute('aria-labelledby'),'class-tab-foundations');
  assert.equal(d.querySelectorAll('.reading-sections,[data-class-section],[data-section]').length,0);
  assert.ok([...d.querySelectorAll('.skill-heading')].every(button=>button.dataset.expandSkill.includes('.FOUNDATIONS.')));
  const search=d.querySelector('#search-students');search.value='Alex';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  select('#portrait-style','vikings');click('[data-class-mode=heatmap]');
  click('#class-tab-literacy');await settle();
  assert.equal(d.querySelector('#search-students').value,'Alex');
  assert.equal(d.querySelector('#portrait-style').value,'vikings');
  assert.equal(d.querySelectorAll('.heat-cell').length,8);
  assert.ok([...d.querySelectorAll('.skill-heading')].every(button=>button.dataset.expandSkill.includes('.COMPREHENSION.')));
  click('[data-class-reading-group=craft]');await settle();
  click('#class-tab-foundations');await settle();
  d.querySelector('#class-tab-foundations').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await settle();
  assert.equal(d.activeElement.id,'class-tab-literacy');
  assert.equal(d.querySelector('[data-class-reading-group=craft]').getAttribute('aria-pressed'),'true');
  click('.profile-link[data-student=alex]');await settle();
  click('#tab-foundations');await settle();
  assert.equal(d.querySelector('#domain-panel').getAttribute('aria-labelledby'),'tab-foundations');
  assert.equal(d.querySelectorAll('#skill-chart .skill-row').length,8);
  assert.equal(d.querySelector('.profile-summary strong').textContent,'85%');
  assert.equal(d.querySelectorAll('.reading-sections,[data-reading-group]').length,0);
  click('#tab-literacy');await settle();
  assert.equal(d.querySelector('.radar-target')!==null,true);
  assert.equal(d.querySelectorAll('.radar-target').length,8);
  w.location.hash='student/alex/reading/comprehension/meaning';await settle();
  assert.equal(d.querySelector('#tab-literacy').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('[data-reading-group=meaning]').getAttribute('aria-pressed'),'true');
  w.location.hash='student/alex/reading/foundations';await settle();
  assert.equal(d.querySelector('#tab-foundations').getAttribute('aria-selected'),'true');
  assert.deepEqual([...d.querySelectorAll('[role=tab]')].map(tab=>tab.textContent),labels);
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Default Literacy class columns match all eight radar skills, scores and evidence in the same order',async()=>{
 const {dom,w,d,click,settle}=dashboard();
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students);
  const labels=['Inference','Vocabulary in context','Figurative language','Character analysis','Main idea','Cause and effect','Comparing perspectives','Theme'];
  assert.equal(d.querySelector('[data-class-reading-group=overview]').getAttribute('aria-pressed'),'true');
  assert.deepEqual([...d.querySelectorAll('.skill-heading-label')].map(label=>label.textContent),labels);
  const ids=[...d.querySelectorAll('.skill-heading')].map(button=>button.dataset.expandSkill);
  const scores=[...d.querySelectorAll('tr[data-student=alex] .hp-value')].map(score=>score.textContent);
  assert.deepEqual(scores,['45%','85%','60%','70%','80%','65%','65%','50%']);
  assert.ok(d.querySelector('.comparison-scroll-guide').textContent.includes('8 literacy skills'));
  click('button[aria-label="Show skill evidence for Alex Chen"]');
  assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence:not([hidden])').length,8);
  assert.equal(d.querySelectorAll('.compact-evidence .hp-track').length,0);
  assert.equal(d.querySelectorAll('#skill-headings th').length,10);
  assert.ok([...d.querySelectorAll('#student-rows>tr')].every(row=>row.children.length===10));
  click('button[aria-label="Show Theme evidence across the class"]');
  assert.equal(d.querySelectorAll('.expanded-skill-cell .compact-evidence').length,6);
  const theme=d.querySelector('tr[data-student=alex] .student-skill-cell:last-child');
  assert.equal(theme.querySelectorAll('.compact-evidence').length,1);
  assert.ok(theme.querySelector('.evidence-counts').textContent.includes('10/20'));
  click('.profile-link[data-student=alex]');await settle();click('#tab-literacy');await settle();
  assert.equal(d.querySelector('[data-reading-group=overview]').getAttribute('aria-pressed'),'true');
  const radar=[...d.querySelectorAll('.radar-skills button')];
  assert.deepEqual(radar.map(button=>button.dataset.evidence),ids);
  assert.deepEqual(radar.map(button=>button.querySelector('strong').textContent),scores);
  const stats=D.summarize(D.students[0].evidence.filter(record=>ids.includes(record.skillId)));
  assert.equal(stats.attempts,160);
  for(const key of ['independent','supported','hints'])assert.equal(d.querySelector(`[data-count="${key}"]`).textContent,String(stats[key]));
  click('[data-back-class]');await settle();assert.equal(d.querySelectorAll('.skill-heading').length,8);
  assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence:not([hidden])').length,8);
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Reading catalogue navigation exposes every skill with aligned evidence, scoped summaries and preserved class controls',async()=>{
 const {dom,w,d,click,select,settle}=dashboard();
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students),seen=new Set();
  assert.equal(d.querySelectorAll('[data-class-reading-group]').length,6);
  assert.ok(d.querySelector('[data-class-reading-group=meaning]').textContent.includes('3 of 6 skills assessed'));
  select('#portrait-style','vikings');select('#sort-students','support');
  for(const group of D.readingCatalogue){
   click(`[data-class-reading-group="${group.key}"]`);await settle();
   assert.equal(d.querySelector(`[data-class-reading-group="${group.key}"]`).getAttribute('aria-pressed'),'true');
   const axes=[...d.querySelectorAll('.skill-heading')].map(button=>button.dataset.expandSkill);
   assert.deepEqual(axes,Array.from(group.skills,skill=>skill.id));axes.forEach(id=>seen.add(id));
   assert.equal(d.querySelectorAll('#skill-headings th').length,group.skills.length+2);
   assert.ok([...d.querySelectorAll('#student-rows>tr')].every(row=>row.children.length===group.skills.length+2));
   const assessed=group.skills.filter(skill=>D.students.slice(0,6).some(student=>D.skillStats(student,skill.id).attempts)).length;
   assert.ok(d.querySelector('.reading-group-summary').textContent.includes(`${assessed} of ${group.skills.length} skills assessed`));
   assert.equal(d.querySelector('.group-score'),null);
   const summary=d.querySelector('.reading-group-overview').textContent;
   const search=d.querySelector('#search-students');search.value='Alex';search.dispatchEvent(new w.Event('input',{bubbles:true}));
   assert.equal(d.querySelector('.reading-group-overview').textContent,summary);
   click('button[aria-label="Show skill evidence for Alex Chen"]');
   assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence:not([hidden])').length,axes.length);
   assert.equal(d.querySelectorAll('.compact-evidence .hp-track').length,0);
   for(const cell of d.querySelectorAll('tr[data-student=alex] .student-skill-cell')){
    const stats=D.skillStats(D.students[0],cell.dataset.axis);
    if(stats.attempts){assert.equal(cell.querySelector('.hp-value').textContent,stats.score+'%');assert.ok(cell.querySelector('.evidence-counts').textContent.includes(stats.correct+'/'+stats.attempts));}
    else{assert.equal(cell.querySelector('.hp'),null);assert.ok(cell.textContent.includes('No evidence yet'));assert.ok(!cell.textContent.includes('0/0'));}
   }
   click('button[aria-label="Hide skill evidence for Alex Chen"]');
   search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
   assert.equal(d.querySelector('#portrait-style').value,'vikings');assert.equal(d.querySelector('#sort-students').value,'support');
  }
  assert.equal(seen.size,39);
  click('#class-tab-foundations');await settle();
  assert.equal(d.querySelectorAll('[data-class-reading-group]').length,0);
  assert.equal(d.querySelectorAll('.skill-heading').length,8);
  assert.ok([...d.querySelectorAll('.skill-heading')].every(button=>button.dataset.expandSkill.includes('.FOUNDATIONS.')));
  click('#class-tab-literacy');await settle();
  assert.equal(d.querySelector('[data-class-reading-group=comparing]').getAttribute('aria-pressed'),'true');
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Student catalogue shares the same groups, keeps leaf evidence and avoids combined group scores or recommendations without evidence',async()=>{
 const {dom,w,d,click,select,settle}=dashboard(undefined,'student/alex/reading/comprehension/meaning');
 try{
  const D=w.EDUCADE_DEMO,alex=D.students[0],seen=new Set(),original=JSON.stringify(D.students);
  for(const group of D.readingCatalogue){
   click(`[data-reading-group="${group.key}"]`);await settle();
   const skills=[...d.querySelectorAll('.reading-catalogue .individual-skill')];
   assert.deepEqual(skills.map(button=>button.dataset.evidence),Array.from(group.skills,skill=>skill.id));skills.forEach(button=>seen.add(button.dataset.evidence));
   assert.equal(d.querySelectorAll('.reading-catalogue .group-score').length,0);
   assert.equal(d.querySelector('.profile-summary>span').textContent,'Assessment coverage');
   const ids=group.skills.map(skill=>skill.id),assessed=group.skills.filter(skill=>D.skillStats(alex,skill.id).attempts);
   assert.equal(d.querySelector('.profile-summary>strong').textContent,`${assessed.length} of ${ids.length} skills`);
   const totals=D.summarize(alex.evidence.filter(record=>ids.includes(record.skillId)));
   for(const key of ['independent','supported','hints'])assert.equal(d.querySelector(`[data-count="${key}"]`).textContent,String(totals[key]));
   if(!assessed.length){
    assert.equal(d.querySelector('[data-mode=radar]').disabled,true);
    assert.equal(d.querySelector('.radar'),null);assert.equal(d.querySelector('#skill-chart .hp'),null);
    assert.ok([...d.querySelectorAll('.growth-item')].every(item=>item.dataset.focus===''&&item.querySelector('button')===null));
    click('.reading-catalogue .individual-skill');assert.equal(d.querySelectorAll('.attempt').length,0);click('#close-evidence');
   }else{
    for(const kind of ['glow','grow']){
     const target=d.querySelector(`.${kind} button`);assert.ok(ids.includes(target.dataset.evidence));
     click(`.${kind} button`);assert.equal(d.querySelector('.evidence-id').textContent,target.dataset.evidence);assert.ok(d.querySelectorAll('.attempt').length>0);click('#close-evidence');
    }
   }
  }
  assert.equal(seen.size,39);
  select('#switch-student','maya');await settle();
  assert.equal(d.querySelector('[data-reading-group=comparing]').getAttribute('aria-pressed'),'true');
  click('#tab-foundations');await settle();assert.equal(d.querySelectorAll('[data-reading-group]').length,0);
  assert.equal(d.querySelectorAll('.individual-skill').length,8);
  click('#tab-literacy');await settle();assert.equal(d.querySelector('[data-reading-group=comparing]').getAttribute('aria-pressed'),'true');
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Class recommendations open the correct reading group and profile round trips retain the selected class group',async()=>{
 const {dom,w,d,click,settle}=dashboard(undefined,'class/overall');
 try{
  const id=w.EDUCADE_DEMO.reading[2];
  click(`.whole-class-plan [data-review-class-skill="${id}"]`);await settle();
  assert.equal(w.location.hash,'#class/reading/comprehension/overview');
  assert.equal(d.querySelector('[data-class-reading-group=overview]').getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelectorAll('.expanded-skill-cell .compact-evidence').length,6);
  assert.equal(d.querySelectorAll('.compact-evidence .hp').length,0);
  click('.profile-link[data-student=alex]');await settle();assert.equal(d.querySelector('#tab-overall').getAttribute('aria-selected'),'true');
  click('[data-back-class]');await settle();assert.equal(d.querySelector('[data-class-reading-group=overview]').getAttribute('aria-pressed'),'true');
  w.location.hash='class/reading/comprehension/unknown';await settle();assert.equal(d.querySelector('[data-class-reading-group=overview]').getAttribute('aria-pressed'),'true');
 }finally{dom.window.close();}
});
test('Class evidence expands on both axes and survives display changes without changing records',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  const original=JSON.stringify(w.EDUCADE_DEMO.students),id=w.EDUCADE_DEMO.reading[0];
  assert.equal(d.querySelector('.demo-banner'),null);
  assert.ok(!d.body.textContent.includes('RPG HP bars'));
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,6);
  click('button[aria-label="Show Inference evidence across the class"]');
  assert.equal(d.querySelector(`.skill-heading[data-expand-skill="${id}"]`).getAttribute('aria-expanded'),'true');
  assert.ok(d.querySelector(`.skill-heading[data-expand-skill="${id}"]`).textContent.includes('Hide evidence'));
  assert.equal(d.querySelectorAll('.expanded-skill-cell .student-skill-evidence:not([hidden])').length,6);
  assert.equal(d.querySelectorAll('#skill-headings th').length,10);
  assert.ok(d.querySelector('tr[data-student=alex] .compact-evidence').textContent.includes('9/20'));
  click('button[aria-label="Show skill evidence for Alex Chen"]');
  assert.equal(d.querySelector('.learner-name').textContent,'Alex Chen');
  assert.equal(d.querySelector('.name-button[data-expand-student=alex]').getAttribute('aria-label'),'Hide skill evidence for Alex Chen');
  assert.ok([...d.querySelectorAll('tr[data-student=alex] .student-skill-evidence')].every(panel=>!panel.hidden));
  assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence').length,8);
  assert.equal(d.querySelectorAll('#student-rows>tr').length,6);
  assert.equal(d.querySelectorAll('.compact-evidence .hp').length,0);
  for(const panel of d.querySelectorAll('tr[data-student=alex] .student-skill-evidence'))assert.ok(panel.id.endsWith(panel.parentElement.dataset.axis));
  click('tr[data-student=alex] .student-skill-evidence .latest-response span');
  assert.equal(d.querySelector('.name-button[data-expand-student=alex]').getAttribute('aria-expanded'),'true');
  assert.equal(d.querySelector('tr[data-student=alex]').children.length,10);
  for(const id of d.querySelector('.name-button[data-expand-student=alex]').getAttribute('aria-controls').split(' '))assert.equal(d.getElementById(id).hidden,false);
  select('#portrait-style','vikings');click('[data-class-mode=heatmap]');
  assert.ok([...d.querySelectorAll('tr[data-student=alex] .student-skill-evidence')].every(panel=>!panel.hidden));
  assert.equal(d.querySelectorAll('.expanded-skill-cell .student-skill-evidence:not([hidden])').length,6);
  click('.name-button[data-expand-student=maya]');
  assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence:not([hidden])').length,1);
  assert.ok(d.querySelector('tr[data-student=alex] .expanded-skill-cell .student-skill-evidence'));
  assert.ok([...d.querySelectorAll('tr[data-student=maya] .student-skill-evidence')].every(panel=>!panel.hidden));
  click(`[data-expand-skill="${w.EDUCADE_DEMO.profileAxes.reading[4].id}"]`);
  assert.equal(d.querySelectorAll('#skill-headings th').length,10);
  click('tr[data-student=maya] .student-skill-evidence [data-evidence]');
  assert.equal(d.querySelector('#evidence-dialog').open,true);
  assert.ok(d.querySelector('#evidence-content').textContent.includes('Maya Patel'));
  click('#close-evidence');
  click('.profile-link[data-student=maya]');await settle();
  assert.equal(d.querySelector('h1').textContent,'Maya Patel');
  assert.equal(JSON.stringify(w.EDUCADE_DEMO.students),original);
 }finally{dom.window.close();}
});
test('Transitions evidence stays beneath its single score when row and category expansions overlap',()=>{
 const {dom,w,d,click}=dashboard(undefined,'class/writing');
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students),id=D.profileAxes.writing[0].id;
  const visible=()=>d.querySelectorAll('.student-skill-evidence:not([hidden])').length;
  const width=d.querySelector('.class-table').style.getPropertyValue('--comparison-width');
  const structure=()=>{
   assert.equal(d.querySelectorAll('#skill-headings th').length,8);
   assert.equal(d.querySelectorAll('#skill-columns col').length,8);
   assert.ok([...d.querySelectorAll('#student-rows>tr')].every(row=>row.children.length===8));
   assert.equal(d.querySelectorAll('.class-table .hp-track').length,36);
   assert.equal(d.querySelectorAll('.compact-evidence .hp-track,.student-evidence-row,.skill-evidence-cell').length,0);
   assert.equal(d.querySelector('.class-table').style.getPropertyValue('--comparison-width'),width);
  };
  structure();assert.equal(visible(),0);
  click('button[aria-label="Show Transitions evidence across the class"]');
  structure();assert.equal(visible(),6);
  const cell=d.querySelector(`tr[data-student=alex] [data-axis="${id}"]`);
  assert.equal(cell.querySelector('.hp-value').textContent,'40%');
  assert.equal(cell.querySelector('.evidence-counts').textContent,'8/20 correct · 5 hints');
  click('button[aria-label="Show skill evidence for Alex Chen"]');
  structure();assert.equal(visible(),11);
  assert.equal(d.querySelector(`tr[data-student=alex] [data-axis="${id}"]`).querySelectorAll('.compact-evidence').length,1);
  click('button[aria-label="Hide Transitions evidence across the class"]');
  structure();assert.equal(visible(),6);
  click('button[aria-label="Show Transitions evidence across the class"]');
  click('button[aria-label="Hide skill evidence for Alex Chen"]');
  structure();assert.equal(visible(),6);
  assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence:not([hidden])').length,1);
  click('button[aria-label="Hide Transitions evidence across the class"]');
  structure();assert.equal(visible(),0);
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Overall Explore skills expands every subject response inline for the selected learner',async()=>{
 const {dom,w,d,click,select,settle}=dashboard(undefined,'class/overall');
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students),alex=D.students.find(student=>student.id==='alex');
  click('button[aria-label="Show skill evidence for Alex Chen"]');
  for(const domain of Object.keys(D.domains)){
   const selector=`[data-expand-subject="${domain}"][data-learner=alex]`;
   click(selector);await settle();
   assert.equal(w.location.hash,'#class/overall');
   assert.equal(d.querySelector('h1').textContent,'Teacher Dashboard');
   assert.equal(d.querySelector('#class-tab-overall').getAttribute('aria-selected'),'true');
   const panel=d.getElementById(`subject-evidence-alex-${domain}`);
   assert.equal(panel.hidden,false);
   assert.equal(d.querySelector(selector).getAttribute('aria-expanded'),'true');
   assert.equal(d.querySelector(selector).getAttribute('aria-controls'),panel.id);
   const expected=alex.evidence.filter(record=>D.groups.find(group=>group.skills.some(skill=>skill.id===record.skillId)).domain===domain);
   const responses=[...panel.querySelectorAll('.subject-response')];
   assert.equal(responses.length,D.domainStats(alex,domain).attempts);
   assert.deepEqual(responses.map(response=>response.dataset.responseId).sort(),Array.from(expected,record=>record.id).sort());
   for(const record of expected){
    const response=responses.find(element=>element.dataset.responseId===record.id);
    assert.ok(response.textContent.includes(record.response));
    assert.ok(response.querySelector('.subject-response-meta').textContent.includes(record.supported?'Supported':'Independent'));
    assert.equal(Boolean(response.querySelector('.subject-hint')),record.hint);
   }
   const assessed=D.groups.filter(group=>group.domain===domain).flatMap(group=>group.skills).filter(skill=>D.skillStats(alex,skill.id).attempts);
   assert.equal(panel.querySelectorAll('.subject-evidence-skill').length,assessed.length);
   assert.equal(panel.querySelector('.hp-track'),null);
   assert.equal(d.querySelectorAll('.class-table .hp-track').length,24);
   assert.equal(d.querySelectorAll('#skill-headings th').length,6);
   assert.equal(d.querySelector('tr[data-student=alex]').children.length,6);
  }
  assert.deepEqual([...d.querySelectorAll('#subject-evidence-alex-reading .subject-evidence-section>h3')].map(h=>h.textContent),['Reading Foundations','Literacy']);
  const skill=d.querySelector('#subject-evidence-alex-reading .subject-evidence-skill');skill.open=true;
  const key=skill.dataset.subjectSkill;
  select('#portrait-style','vikings');click('[data-class-mode=heatmap]');
  assert.equal(d.querySelector(`[data-subject-skill="${key}"]`).open,true);
  assert.equal(d.querySelectorAll('.subject-evidence:not([hidden])').length,4);
  select('#sort-students','support');
  const search=d.querySelector('#search-students');search.value='no match';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  search.value='Alex';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(d.querySelector(`[data-subject-skill="${key}"]`).open,true);
  click('[data-class-mode=bars]');
  click('#class-tab-literacy');await settle();click('#class-tab-overall');await settle();
  assert.equal(d.querySelector(`[data-subject-skill="${key}"]`).open,true);
  click('[data-expand-subject=reading][data-learner=alex]');
  assert.equal(d.getElementById('subject-evidence-alex-reading').hidden,true);
  click('[data-expand-subject=reading][data-learner=alex]');
  assert.equal(d.querySelector(`[data-subject-skill="${key}"]`).open,true);
  click('.profile-link[data-student=alex]');await settle();
  assert.equal(d.querySelector('h1').textContent,'Alex Chen');
  click('[data-back-class]');await settle();
  assert.equal(d.querySelector(`[data-subject-skill="${key}"]`).open,true);
  const currentSearch=d.querySelector('#search-students');currentSearch.value='';currentSearch.dispatchEvent(new w.Event('input',{bubbles:true}));
  click('button[aria-label="Show skill evidence for Maya Patel"]');
  click('[data-expand-subject=reading][data-learner=maya]');
  const maya=D.students.find(student=>student.id==='maya'),mayaPanel=d.getElementById('subject-evidence-maya-reading');
  const mayaIds=maya.evidence.filter(record=>D.groups.some(group=>group.domain==='reading'&&group.skills.some(skill=>skill.id===record.skillId))).map(record=>record.id);
  assert.deepEqual([...mayaPanel.querySelectorAll('.subject-response')].map(response=>response.dataset.responseId).sort(),Array.from(mayaIds).sort());
  assert.equal(d.getElementById('subject-evidence-alex-reading'),null);
  assert.equal(d.querySelector('tr[data-student=maya] .profile-cue').textContent,'(Click to view profile)');
  assert.equal(d.querySelector('tr[data-student=maya] .profile-link').getAttribute('aria-label'),'View Maya Patel’s profile');
  assert.ok(!d.querySelector('.class-table').textContent.includes('Open full profile'));
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Full subject radars share scores with progress bars and their central portrait follows the selected style',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  click('.profile-link[data-student=alex]');await settle();
  for(const [domain,count] of [['reading',8],['writing',6],['grammar',6],['vocabulary',6]]){
   click('#tab-'+(domain==='reading'?'literacy':domain));await settle();click('[data-mode=radar]');
   assert.equal(d.querySelectorAll('.radar-target').length,count);
   assert.equal(d.querySelectorAll('.radar-skills button').length,count);
   assert.equal(d.querySelector('.radar-portrait [data-avatar-student]').dataset.avatarStudent,'alex');
   const axes=[...d.querySelectorAll('.radar-skills button')].map(b=>[b.dataset.evidence,b.querySelector('strong').textContent]);
   for(const [id,score] of axes)assert.equal(score,w.EDUCADE_DEMO.skillStats(w.EDUCADE_DEMO.students[0],id).score+'%');
   const point=d.querySelector('.radar-target');
   point.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   assert.equal(d.querySelector('#evidence-dialog').open,true);click('#close-evidence');
   click('[data-mode=bars]');
   const bars=[...d.querySelectorAll('#skill-chart .skill-row')].map(b=>[b.dataset.evidence,b.querySelector('.hp-value').textContent]);
   assert.deepEqual(bars,axes);
  }
  click('[data-mode=radar]');select('#portrait-style','vikings');
  assert.equal(d.querySelector('.radar-portrait image').getAttribute('href'),'assets/portraits/viking-adventurers.png');
  select('#portrait-style','initials');assert.equal(d.querySelector('.radar-portrait .avatar').textContent,'AC');
  click('#tab-literacy');await settle();click('#tab-foundations');await settle();
  assert.equal(d.querySelector('[data-mode=radar]').disabled,true);
  assert.ok(d.querySelector('#skill-chart').textContent.includes('No evidence yet'));
 }finally{dom.window.close();}
});
test('Missing skill evidence remains unassessed rather than becoming a zero or a misleading polygon',async()=>{
 const {dom,w,d,click,settle}=dashboard();
 try{
  const D=w.EDUCADE_DEMO,missing=D.profileAxes.reading[4].id;
  D.students[0].evidence=D.students[0].evidence.filter(r=>r.skillId!==missing);
  click('.profile-link[data-student=alex]');await settle();
  click('#tab-literacy');await settle();
  assert.equal(d.querySelectorAll('.radar-target').length,8);
  assert.equal(d.querySelector('polygon.radar-area'),null);
  assert.equal(d.querySelector('[data-mode=radar]').disabled,false);
  assert.equal(JSON.parse(w.localStorage.getItem('educade.teacher.presentation.v1'))?.studentView||'radar','radar');
  assert.ok(d.querySelector(`.radar-target[data-evidence="${missing}"]`).textContent.includes('No evidence yet')||d.querySelector(`.radar-target[data-evidence="${missing}"]`).getAttribute('aria-label').includes('No evidence yet'));
  const unassessed=d.querySelector(`.reading-catalogue [data-evidence="${missing}"]`);
  assert.ok(unassessed.textContent.includes('No evidence yet'));
  assert.equal(unassessed.querySelector('.hp'),null);
  click(`.reading-catalogue [data-evidence="${missing}"]`);
  assert.equal(d.querySelectorAll('.attempt').length,0);
  assert.ok(d.querySelector('#evidence-content').textContent.includes('No evidence yet'));
 }finally{dom.window.close();}
});
test('Header classes are independent and the hamburger menu provides working settings and help',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  assert.ok(d.querySelector('.page-heading #class-select'));
  assert.ok(d.querySelector('.toolbar #portrait-style'));
  assert.equal(d.querySelector('#skill-headings th').textContent,'#');
  assert.deepEqual([...d.querySelectorAll('tr[data-student] .row-number')].map(c=>c.textContent),['1','2','3','4','5','6']);
  select('#sort-students','support');assert.equal(d.querySelector('tr[data-student]').dataset.student,'noah');
  assert.equal(d.querySelector('tr[data-student] .row-number').textContent,'1');
  const search=d.querySelector('#search-students');search.value='Ella';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(d.querySelectorAll('tr[data-student]').length,1);assert.equal(d.querySelector('.row-number').textContent,'1');
  search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  click('#dashboard-menu-button');assert.equal(d.querySelector('#dashboard-menu-options').hidden,false);
  assert.equal(d.activeElement.dataset.utility,'settings');
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
  assert.equal(d.activeElement.dataset.utility,'help');
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(d.querySelector('#dashboard-menu-options').hidden,true);
  click('#dashboard-menu-button');click('[data-utility=settings]');
  assert.equal(d.querySelector('#utility-dialog').open,true);
  select('[data-setting=portrait]','vikings');select('[data-setting=classView]','heatmap');
  assert.equal(d.querySelector('#portrait-style').value,'vikings');
  assert.equal(d.querySelectorAll('.heat-cell').length,48);click('#close-utility');
  select('#class-select','5b');await settle();
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,3);
  assert.equal(d.querySelector('tr[data-student=alex]'),null);
  assert.ok(d.querySelector('tr[data-student=finn]'));
  click('.profile-link[data-student=finn]');await settle();
  assert.equal(d.querySelector('h1').textContent,'Finn Larsen');
  assert.equal(d.querySelectorAll('#switch-student option').length,3);
  assert.equal(d.querySelector('.radar-portrait .avatar').textContent,'FL');
  select('#class-select','5a');await settle();
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,6);
  click('#dashboard-menu-button');click('[data-utility=help]');
  assert.ok(d.querySelector('#utility-content').textContent.includes('skill heading'));click('#close-utility');
  click('#dashboard-menu-button');click('[data-utility=account]');
  assert.ok(d.querySelector('#utility-content').textContent.includes('no connected teacher account'));
  assert.equal(d.querySelector('#utility-content input'),null);
 }finally{dom.window.close();}
});
test('Sidebar class menus keep rosters, profiles, settings and focus in the selected class',async()=>{
 const {dom,w,d,click,select,settle}=dashboard(undefined,'class/overall');
 try{
  const original=JSON.stringify(w.EDUCADE_DEMO.students);
  click('#nav-class');
  assert.equal(d.querySelector('#sidebar-classes').hidden,false);
  assert.deepEqual([...d.querySelectorAll('[data-class-overview]')].map(button=>button.textContent),['Class 5A','Class 5B']);
  assert.equal(d.querySelector('#class-menu-5b').hidden,true);
  click('[data-class-menu="5b"]');
  assert.equal(d.querySelector('[data-class-menu="5b"]').getAttribute('aria-expanded'),'true');
  click('[data-class-profiles="5b"]');await settle();
  assert.equal(d.querySelector('#class-select').value,'5b');
  assert.equal(d.querySelector('#utility-title').textContent,'Class 5B · Student profiles');
  assert.deepEqual([...d.querySelectorAll('[data-open-profile] strong')].map(label=>label.textContent),['Amara Okafor','Finn Larsen','Oliver Reed']);
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,3);
  click('[data-open-profile="amara"]');await settle();
  assert.equal(d.querySelector('#utility-dialog').open,false);
  assert.equal(d.querySelector('h1').textContent,'Amara Okafor');
  assert.equal(d.querySelectorAll('#switch-student option').length,3);
  assert.equal(d.querySelector('[data-class-profiles="5b"]').getAttribute('aria-current'),'page');
  click('#nav-class');
  click('[data-class-settings="5b"]');await settle();
  assert.equal(d.querySelector('#utility-title').textContent,'Class 5B · Settings');
  assert.ok(d.querySelector('.class-settings-summary').textContent.includes('3 learners'));
  select('[data-setting=classView]','heatmap');
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,3);
  click('#close-utility');
  assert.equal(d.activeElement.dataset.classSettings,'5b');
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(d.querySelector('#class-menu-5b').hidden,true);
  assert.equal(d.activeElement.dataset.classMenu,'5b');
  click('[data-class-overview="5a"]');await settle();
  assert.equal(d.querySelector('#class-select').value,'5a');
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,6);
  assert.equal(d.querySelector('[data-class-overview="5a"]').getAttribute('aria-current'),'page');
  assert.equal(JSON.stringify(w.EDUCADE_DEMO.students),original);
 }finally{dom.window.close();}
});
test('Sidebar class management entries describe their account requirement without pretending to save a roster',()=>{
 const {dom,d,click}=dashboard();
 try{
  click('#nav-class');
  for(const action of ['import','create']){
   click(`[data-class-action="${action}"]`);
   assert.equal(d.querySelector('#utility-dialog').open,true);
   assert.ok(d.querySelector('.class-setup-notice').textContent.includes('when teacher accounts are connected'));
   assert.equal(d.querySelector('#utility-content input'),null);
   click('#close-utility');
   assert.equal(d.activeElement.dataset.classAction,action);
  }
 }finally{dom.window.close();}
});
test('Teaching suggestions remain class-wide during filtering and link to the correct evidence',async()=>{
 const {dom,w,d,select,click,settle}=dashboard(undefined,'class/reading/comprehension/craft');
 try{
  const D=w.EDUCADE_DEMO,figurative=D.reading[2];
  assert.equal(d.querySelector('#search-students').placeholder,'Search students');
  assert.ok(!/\bsample\b|\bfictional\b|\bdemo\b/i.test(d.body.textContent));
  assert.equal(d.querySelector('.whole-class-plan').dataset.planSkill,figurative);
  assert.ok(d.querySelector('.plan-basis').textContent.includes('4 of 6'));
  assert.ok(d.querySelector('.plan-basis').textContent.includes('61% (73/120'));
  const initial=d.querySelector('.class-next-steps').textContent;
  const search=d.querySelector('#search-students');search.value='Ella';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  select('#sort-students','support');select('#portrait-style','initials');click('[data-class-mode=heatmap]');
  assert.equal(d.querySelector('.class-next-steps').textContent,initial);
  click('.individual-intervention[data-individual=ella] [data-evidence]');
  assert.equal(d.querySelector('#evidence-dialog').open,true);
  assert.equal(d.querySelector('.evidence-id').textContent,figurative);
  assert.ok(d.querySelector('#evidence-content').textContent.includes('Ella Brown'));
  assert.ok(!/\bsample\b|\bfictional\b|\bdemo\b/i.test(d.querySelector('#evidence-content').textContent));
  click('#close-evidence');search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  click('.whole-class-plan [data-review-class-skill]');
  assert.equal(d.querySelector('.skill-heading[aria-expanded=true]').dataset.expandSkill,figurative);
  assert.equal(d.querySelectorAll('.expanded-skill-cell .student-skill-evidence:not([hidden])').length,6);
  assert.equal(d.querySelector('tr.current-learner').dataset.student,'ella');
  assert.equal(d.querySelector('#portrait-style').value,'initials');
  select('#class-select','5b');await settle();
  assert.ok(d.querySelector('.plan-basis').textContent.includes('2 of 3'));
  assert.ok(d.querySelector('.class-next-steps').textContent.includes('Finn'));
  assert.ok(!d.querySelector('.class-next-steps').textContent.includes('Alex'));
  click('.profile-link[data-student=finn]');await settle();
  for(const domain of ['reading','writing','grammar','vocabulary']){
   click('#tab-'+(domain==='reading'?'literacy':domain));await settle();
   assert.ok(!/\bsample\b|\bfictional\b|\bdemo\b/i.test(d.querySelector('#dashboard').textContent));
  }
 }finally{dom.window.close();}
});

test('Profiles open on Overall radar, use the original subject evidence and keep separate saved chart choices',async()=>{
 const {dom,w,d,select,click,settle}=dashboard({studentView:'bars',portrait:'vikings'});
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students);
  click('.profile-link[data-student=alex]');await settle();
  assert.deepEqual([...d.querySelectorAll('[role=tab]')].map(tab=>tab.textContent),['Overall','Reading Foundations','Literacy','Writing','Grammar','Vocabulary']);
  assert.equal(d.querySelector('[role=tab][aria-selected=true]').id,'tab-overall');
  assert.equal(d.querySelector('[data-mode=radar]').getAttribute('aria-pressed'),'true');
  const scores=[...d.querySelectorAll('.radar-skills button')].map(button=>[button.dataset.domain,button.querySelector('strong').textContent]);
  assert.equal(scores.length,4);
  for(const [domain,score] of scores)assert.equal(score,D.domainStats(D.students[0],domain).score+'%');
  for(const key of ['independent','supported','hints'])assert.equal(d.querySelector(`[data-count=${key}]`).textContent,String(D.summarize(D.students[0].evidence)[key]));
  d.querySelector('.radar-target[data-domain=reading]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await settle();
  assert.equal(d.querySelector('[role=tab][aria-selected=true]').id,'tab-literacy');
  assert.equal(d.querySelector('[data-mode=bars]').getAttribute('aria-pressed'),'true');
  click('#tab-overall');await settle();
  assert.equal(d.querySelector('[data-mode=radar]').getAttribute('aria-pressed'),'true');
  click('[data-mode=bars]');
  assert.deepEqual([...d.querySelectorAll('#skill-chart .skill-row')].map(button=>[button.dataset.domain,button.querySelector('.hp-value').textContent]),scores);
  select('#portrait-style','initials');select('#switch-student','maya');await settle();
  assert.equal(d.querySelector('#tab-overall').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('[data-mode=bars]').getAttribute('aria-pressed'),'true');
  const saved=JSON.parse(w.localStorage.getItem('educade.teacher.presentation.v1'));
  assert.equal(saved.overallView,'bars');assert.equal(saved.studentView,'bars');
  click('[data-mode=radar]');click('.radar-skills [data-domain=writing]');await settle();
  assert.equal(d.querySelector('#tab-writing').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('h1').textContent,'Maya Patel');
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
test('Unassessed Overall subjects show no evidence and do not become zero scores',async()=>{
 const {dom,w,d,click,settle}=dashboard();
 try{
  const D=w.EDUCADE_DEMO,grammarIds=new Set(D.groups.filter(g=>g.domain==='grammar').flatMap(g=>g.skills.map(s=>s.id)));
  D.students[0].evidence=D.students[0].evidence.filter(record=>!grammarIds.has(record.skillId));
  click('.profile-link[data-student=alex]');await settle();
  assert.equal(d.querySelector('polygon.radar-area'),null);
  assert.ok(d.querySelector('.radar-skills [data-domain=grammar]').textContent.includes('No evidence yet'));
  click('.radar-target[data-domain=grammar]');await settle();
  assert.equal(d.querySelector('#tab-grammar').getAttribute('aria-selected'),'true');
  assert.ok(d.querySelector('#skill-chart').textContent.includes('No evidence yet'));
  assert.deepEqual([...d.querySelectorAll('.growth-item h3')].map(h=>h.textContent),['No evidence yet','No evidence yet']);
  assert.equal(d.querySelectorAll('.growth-result,.growth-item button').length,0);
  w.location.hash='class/overall';await settle();
  click('button[aria-label="Show skill evidence for Alex Chen"]');
  click('[data-expand-subject=grammar][data-learner=alex]');
  const panel=d.getElementById('subject-evidence-alex-grammar');
  assert.equal(panel.hidden,false);
  assert.ok(panel.textContent.includes('No evidence yet'));
  assert.equal(panel.querySelectorAll('.subject-evidence-skill,.subject-response').length,0);
 }finally{dom.window.close();}
});

test('Glows and Grows identify assessed strengths and targets and open the matching evidence',async()=>{
 const {dom,w,d,click,settle}=dashboard();
 try{
  const original=JSON.stringify(w.EDUCADE_DEMO.students);
  click('.profile-link[data-student=alex]');await settle();
  assert.equal(d.querySelector('.profile-next-card h2').textContent,'Glows & Grows');
  assert.equal(d.querySelector('.glow').dataset.focus,'vocabulary');
  assert.equal(d.querySelector('.glow .growth-result strong').textContent,'68% correct');
  assert.equal(d.querySelector('.grow').dataset.focus,'writing');
  assert.equal(d.querySelector('.grow .growth-result strong').textContent,'62% correct');
  click('.grow button');await settle();
  assert.equal(d.querySelector('#tab-writing').getAttribute('aria-selected'),'true');
  click('#tab-overall');await settle();click('.glow button');await settle();
  assert.equal(d.querySelector('#tab-vocabulary').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('.glow h3').textContent,'Idioms and adages');
  assert.equal(d.querySelector('.glow .growth-result strong').textContent,'90% correct');
  assert.equal(d.querySelector('.grow h3').textContent,'Prefixes and suffixes');
  assert.equal(d.querySelector('.grow .growth-result strong').textContent,'40% correct');
  assert.ok(d.querySelector('.grow').textContent.includes(w.EDUCADE_DEMO.samples['EDU.G5.VOCABULARY.AFFIXES.01'].hint));
  click('.grow button');
  assert.equal(d.querySelector('#group-affixes').open,true);
  assert.equal(d.activeElement.dataset.evidence,'EDU.G5.VOCABULARY.AFFIXES.01');
  click('#group-affixes .individual-skill');
  assert.equal(d.querySelector('#evidence-dialog').open,true);click('#close-evidence');
  click('.glow button');assert.equal(d.querySelector('#group-idioms').open,true);
  assert.equal(JSON.stringify(w.EDUCADE_DEMO.students),original);
 }finally{dom.window.close();}
});

test('Class dashboard starts with Overall and subject tabs preserve the learner and presentation controls',async()=>{
 const {dom,w,d,select,click,settle}=dashboard(undefined,'');
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students);
  assert.equal(d.querySelector('h1').textContent,'Teacher Dashboard');
  assert.equal(d.querySelector('.class-title').textContent,'Class 5A');
  assert.equal(d.querySelector('.stats'),null);
  assert.ok(!d.querySelector('#dashboard').textContent.includes('Reading skills at a glance'));
  assert.deepEqual([...d.querySelectorAll('[role=tab]')].map(tab=>tab.textContent),['Overall','Reading Foundations','Literacy','Writing','Grammar','Vocabulary']);
  assert.equal(d.querySelector('#class-tab-overall').getAttribute('aria-selected'),'true');
  assert.deepEqual([...d.querySelectorAll('tr[data-student=alex] .score-cell .hp-value')].map(value=>value.textContent),Object.keys(D.domains).map(domain=>D.domainStats(D.students[0],domain).score+'%'));
  click('[data-expand-skill=reading]');
  assert.equal(d.querySelectorAll('.expanded-skill-cell .student-skill-evidence:not([hidden])').length,6);
  assert.ok(d.querySelector('tr[data-student=alex] .compact-evidence').textContent.includes('180'));
  click('.name-button[data-expand-student=alex]');
  assert.ok([...d.querySelectorAll('tr[data-student=alex] .student-skill-evidence')].every(panel=>!panel.hidden));
  for(const domain of ['writing','grammar','vocabulary']){
   click('#class-tab-'+domain);await settle();
   assert.equal(d.querySelector('[role=tab][aria-selected=true]').dataset.classDomain,domain);
   assert.ok([...d.querySelectorAll('tr[data-student=alex] .student-skill-evidence')].every(panel=>!panel.hidden));
   assert.equal(d.querySelectorAll('tr[data-student=alex] .student-skill-evidence').length,6);
   assert.equal(d.querySelectorAll('tr[data-student=alex] .compact-evidence .hp').length,0);
   assert.equal(d.querySelector('tr[data-student=alex]').children.length,8);
   const axes=D.profileAxes[domain],cells=[...d.querySelectorAll('tr[data-student=alex] .score-cell')];
   assert.equal(cells.length,6);
   cells.forEach((cell,index)=>assert.equal(cell.querySelector('.hp-value').textContent,D.skillStats(D.students[0],axes[index].id).score+'%'));
   click(`[data-expand-skill="${axes[0].id}"]`);
   assert.equal(d.querySelector('tr[data-student=alex]').children.length,8);
   click('tr[data-student=alex] .score-cell');
   assert.equal(d.querySelector('.evidence-id').textContent,axes[0].id);click('#close-evidence');
  }
  const search=d.querySelector('#search-students');search.value='Alex';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  select('#sort-students','support');select('#portrait-style','vikings');click('[data-class-mode=heatmap]');
  click('#class-tab-overall');await settle();
  assert.equal(d.querySelector('#search-students').value,'Alex');
  assert.equal(d.querySelector('#sort-students').value,'support');
  assert.equal(d.querySelector('#portrait-style').value,'vikings');
  assert.equal(d.querySelectorAll('.heat-cell').length,4);
  assert.ok([...d.querySelectorAll('tr[data-student=alex] .student-skill-evidence')].every(panel=>!panel.hidden));
  click('tr[data-student=alex] .score-cell[data-profile-domain=grammar]');await settle();
  assert.equal(d.querySelector('#tab-grammar').getAttribute('aria-selected'),'true');
  click('[data-back-class]');await settle();
  assert.equal(d.querySelector('#class-tab-overall').getAttribute('aria-selected'),'true');
  click('[data-review-class-skill]');await settle();
  assert.equal(d.querySelector('#class-tab-literacy').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('.skill-heading[aria-expanded=true]').dataset.expandSkill,D.reading[2]);
  assert.equal(JSON.stringify(D.students),original);
 }finally{dom.window.close();}
});
