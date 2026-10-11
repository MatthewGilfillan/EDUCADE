const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const publicDir=path.join(__dirname,'../public');
function dashboard(saved){
  const dom=new JSDOM(fs.readFileSync(path.join(publicDir,'teacher.html'),'utf8'),{url:'https://preview.example/teacher.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  if(saved)w.localStorage.setItem('educade.teacher.presentation.v1',JSON.stringify({version:1,...saved}));
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  for(const file of ['teacher-data.js','teacher-portraits.js','teacher.js'])w.eval(fs.readFileSync(path.join(publicDir,file),'utf8'));
  const select=(selector,value)=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
  return {dom,w,d:w.document,select,click,settle:()=>new Promise(resolve=>w.setTimeout(resolve,10))};
}
test('Class evidence expands on both axes and survives display changes without changing records',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  const original=JSON.stringify(w.EDUCADE_DEMO.students),id=w.EDUCADE_DEMO.reading[0];
  assert.equal(d.querySelector('.demo-banner'),null);
  assert.ok(!d.body.textContent.includes('RPG HP bars'));
  assert.equal(d.querySelectorAll('#student-rows tr[data-student]').length,6);
  click(`[data-expand-skill="${id}"]`);
  assert.equal(d.querySelectorAll('.skill-evidence-cell').length,6);
  assert.equal(d.querySelectorAll('#skill-headings th').length,7);
  assert.ok(d.querySelector('tr[data-student=alex] .compact-evidence').textContent.includes('9/20'));
  click('.name-button[data-expand-student=alex]');
  assert.equal(d.querySelector('#student-evidence-alex').hidden,false);
  assert.equal(d.querySelectorAll('#student-evidence-alex article').length,4);
  assert.equal(d.querySelector('#student-evidence-alex td').colSpan,7);
  select('#portrait-style','vikings');click('[data-class-mode=heatmap]');
  assert.equal(d.querySelector('#student-evidence-alex').hidden,false);
  assert.equal(d.querySelectorAll('.skill-evidence-cell').length,6);
  click('.name-button[data-expand-student=maya]');
  assert.equal(d.querySelector('#student-evidence-alex').hidden,true);
  assert.equal(d.querySelector('#student-evidence-maya').hidden,false);
  click(`[data-expand-skill="${w.EDUCADE_DEMO.reading[1]}"]`);
  assert.equal(d.querySelectorAll('#skill-headings th').length,7);
  click('#student-evidence-maya [data-evidence]');
  assert.equal(d.querySelector('#evidence-dialog').open,true);
  assert.ok(d.querySelector('#evidence-content').textContent.includes('Maya Patel'));
  click('#close-evidence');
  click('.profile-link[data-student=maya]');await settle();
  assert.equal(d.querySelector('h1').textContent,'Maya Patel');
  assert.equal(JSON.stringify(w.EDUCADE_DEMO.students),original);
 }finally{dom.window.close();}
});
test('Full subject radars share scores with progress bars and their central portrait follows the selected style',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  click('.profile-link[data-student=alex]');await settle();
  for(const [domain,count] of [['reading',8],['writing',6],['grammar',6],['vocabulary',6]]){
   click('#tab-'+domain);await settle();click('[data-mode=radar]');
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
  click('#tab-reading');await settle();click('[data-section=foundations]');await settle();
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
  click('#tab-reading');await settle();
  assert.equal(d.querySelectorAll('.radar-target').length,8);
  assert.equal(d.querySelector('polygon.radar-area'),null);
  assert.ok(d.querySelector(`.radar-skills [data-evidence="${missing}"]`).textContent.includes('No evidence yet'));
  d.querySelector(`.radar-target[data-evidence="${missing}"]`).dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true}));
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
  assert.equal(d.querySelectorAll('.heat-cell').length,24);click('#close-utility');
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
test('Teaching suggestions remain class-wide during filtering and link to the correct evidence',async()=>{
 const {dom,w,d,select,click,settle}=dashboard();
 try{
  const D=w.EDUCADE_DEMO,figurative=D.reading[2];
  assert.equal(d.querySelector('#search-students').placeholder,'Search students');
  assert.ok(!/\bsample\b|\bfictional\b/i.test(d.body.textContent));
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
  assert.ok(!/\bsample\b|\bfictional\b/i.test(d.querySelector('#evidence-content').textContent));
  click('#close-evidence');search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  click('[data-review-class-skill]');
  assert.equal(d.querySelector('.skill-heading[aria-expanded=true]').dataset.expandSkill,figurative);
  assert.equal(d.querySelectorAll('.skill-evidence-cell').length,6);
  assert.equal(d.querySelector('tr.current-learner').dataset.student,'ella');
  assert.equal(d.querySelector('#portrait-style').value,'initials');
  select('#class-select','5b');await settle();
  assert.ok(d.querySelector('.plan-basis').textContent.includes('2 of 3'));
  assert.ok(d.querySelector('.class-next-steps').textContent.includes('Finn'));
  assert.ok(!d.querySelector('.class-next-steps').textContent.includes('Alex'));
  click('.profile-link[data-student=finn]');await settle();
  for(const domain of ['reading','writing','grammar','vocabulary']){
   click('#tab-'+domain);await settle();
   assert.ok(!/\bsample\b|\bfictional\b/i.test(d.querySelector('#dashboard').textContent));
  }
 }finally{dom.window.close();}
});

test('Profiles open on Overall radar, use the original subject evidence and keep separate saved chart choices',async()=>{
 const {dom,w,d,select,click,settle}=dashboard({studentView:'bars',portrait:'vikings'});
 try{
  const D=w.EDUCADE_DEMO,original=JSON.stringify(D.students);
  click('.profile-link[data-student=alex]');await settle();
  assert.deepEqual([...d.querySelectorAll('[role=tab]')].map(tab=>tab.textContent),['Overall','Reading','Writing','Grammar','Vocabulary']);
  assert.equal(d.querySelector('[role=tab][aria-selected=true]').id,'tab-overall');
  assert.equal(d.querySelector('[data-mode=radar]').getAttribute('aria-pressed'),'true');
  const scores=[...d.querySelectorAll('.radar-skills button')].map(button=>[button.dataset.domain,button.querySelector('strong').textContent]);
  assert.equal(scores.length,4);
  for(const [domain,score] of scores)assert.equal(score,D.domainStats(D.students[0],domain).score+'%');
  for(const key of ['independent','supported','hints'])assert.equal(d.querySelector(`[data-count=${key}]`).textContent,String(D.summarize(D.students[0].evidence)[key]));
  d.querySelector('.radar-target[data-domain=reading]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await settle();
  assert.equal(d.querySelector('[role=tab][aria-selected=true]').id,'tab-reading');
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
 }finally{dom.window.close();}
});
