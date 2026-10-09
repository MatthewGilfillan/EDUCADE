(() => {
  'use strict';
  const D=window.EDUCADE_DEMO, root=document.querySelector('#dashboard'), dialog=document.querySelector('#evidence-dialog');
  const state={student:'alex',domain:'reading',section:'comprehension',mode:'bars',search:'',sort:'name'};
  let evidenceOpener=null;
  let nextFocus=null;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const studentById=id=>D.students.find(s=>s.id===id)||D.students[0];
  const avatar=s=>`<span class="avatar" data-tone="${s.index%3}" aria-hidden="true">${escape(s.initials)}</span>`;
  const hp=(score,label)=>score===null?'<span class="no-evidence">No evidence yet</span>':`<div class="hp" role="img" aria-label="${escape(label)}: ${score} percent"><div class="hp-track"><span class="hp-fill ${score<50?'low':score<70?'mid':''}" style="--value:${score}%"></span></div><span class="hp-value">${score}%</span></div>`;
  const groupSkills=id=>D.groups.find(g=>g.id===id);
  const groupForSkill=id=>D.groups.find(g=>g.skills.some(s=>s.id===id));
  const currentGroups=()=>D.groups.filter(g=>g.domain===state.domain&&(state.domain!=='reading'||g.section===state.section));
  const scopedRecords=student=>student.evidence.filter(r=>currentGroups().some(g=>g.skills.some(s=>s.id===r.skillId)));
  const readingScores=s=>D.reading.map(id=>D.skillStats(s,id).score);
  const needSupport=s=>readingScores(s).some(score=>score!==null&&score<50);
  function goStudent(id,domain='reading',section='comprehension'){location.hash=`student/${id}/${domain}/${section}`;}
  function renderClass(){
    document.querySelector('#nav-class').classList.add('active');document.querySelector('#nav-profile').classList.remove('active');
    const headings=['Inference','Vocabulary in context','Figurative language','Character thoughts & motivations'];
    root.innerHTML=`<header class="page-heading"><div><div class="eyebrow">CLASS 5A / TEACHER DASHBOARD</div><h1>Class overview</h1><p class="subtitle">Grade 5 <span aria-hidden="true">·</span> Viking Quest</p></div><div class="class-tag">Class 5A <span>Fictional demo class</span></div></header>
      <section class="stats" aria-label="Demo class summary"><article class="stat"><div class="stat-icon" aria-hidden="true">♧</div><div><strong>6</strong><p>fictional learners</p></div></article><article class="stat"><div class="stat-icon" aria-hidden="true">▥</div><div><strong>4</strong><p>sample reading skills</p></div></article><article class="stat warm"><div class="stat-icon" aria-hidden="true">!</div><div><strong>${D.students.filter(needSupport).length}</strong><p>with a skill below 50%</p></div></article></section>
      <section class="card"><div class="card-heading"><div><h2>Reading skills at a glance</h2><p>Choose a learner to explore their profile.</p></div><div class="legend"><span><i class="orange"></i> More practice</span><span><i></i> Building strength</span></div></div>
      <div class="toolbar"><label class="field search">Find a learner<input id="search-students" type="search" placeholder="Search fictional students" value="${escape(state.search)}"></label><label class="field sort">Sort learners<select id="sort-students"><option value="name">Name A–Z</option><option value="support">Needs practice first</option></select></label></div>
      <table class="class-table"><caption class="sr-only">Fictional Class 5A learners and four demo reading skill scores. Each score is based on 20 sample responses.</caption><thead><tr><th scope="col">Student</th>${headings.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody id="student-rows"></tbody></table><p id="empty-class" class="empty-state" hidden>No learners match your search. Try another name.</p><p class="table-note">Demo scores: correct sample responses ÷ attempts. Every shown skill has 20 fictional responses. These are illustrative practice results, not grades or a validated assessment.</p></section>
      <div class="lower-grid"><section class="card"><h2>Recent learning evidence</h2><p class="small-copy">From the same fictional records shown in learner profiles.</p>${[0,1,2].map((i)=>{const s=D.students[i],id=D.reading[i],r=s.evidence.filter(r=>r.skillId===id).at(-1);return evidenceLink(s,r);}).join('')}</section>
      <section class="card support-card"><h2>Suggested next steps</h2><div class="support-item"><span class="symbol" aria-hidden="true">◎</span><div><h3>Start with the skills that need practice.</h3><p>${D.students.filter(needSupport).map(s=>escape(s.name.split(' ')[0])).join(', ')} have a sample reading skill below 50%. Open a profile and look at its evidence before choosing the next challenge.</p></div></div><div class="support-item"><span class="symbol" aria-hidden="true">✦</span><div><h3>Look beyond the percentage.</h3><p>Compare independent answers, supported answers and hint use. A low score does not say why a learner found a challenge difficult.</p></div></div></section></div>`;
    document.querySelector('#sort-students').value=state.sort;
    renderRows();
  }
  function renderRows(){
    const headings=['Inference','Vocabulary in context','Figurative language','Character thoughts & motivations'];
    const students=D.students.filter(s=>s.name.toLowerCase().includes(state.search.toLowerCase())).slice().sort((a,b)=>state.sort==='support'?Math.min(...readingScores(a))-Math.min(...readingScores(b))||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
    document.querySelector('#student-rows').innerHTML=students.map(s=>`<tr data-student="${s.id}"><td><div class="learner">${avatar(s)}<button class="name-button" data-student="${s.id}" type="button">${escape(s.name)}<small>Open student profile →</small></button></div></td>${readingScores(s).map((score,i)=>`<td><span class="mobile-label">${escape(headings[i])}</span>${hp(score,headings[i])}</td>`).join('')}</tr>`).join('');
    document.querySelector('#empty-class').hidden=students.length>0;
  }
  function evidenceLink(student,record){
    return `<button class="evidence-link" type="button" data-evidence="${escape(record.skillId)}" data-learner="${student.id}">${avatar(student)}<div><strong>${escape(student.name)} · ${escape(D.samples[record.skillId].title)}</strong><p>${record.supported?'Supported answer':'Independent answer'}${record.hint?' · Hint used':''} · Demo Week ${record.week}</p></div><span class="arrow" aria-hidden="true">→</span></button>`;
  }
  function summaryChart(student,groups){
    const assessed=groups.filter(g=>D.groupStats(student,g).attempts>0);
    // Only assessed groups are plotted. No missing score is converted to zero.
    if(state.mode==='radar'&&assessed.length>=3){
      const count=assessed.length,cx=220,cy=166,radius=115;
      const point=(i,r)=>[cx+Math.sin(i*2*Math.PI/count)*r,cy-Math.cos(i*2*Math.PI/count)*r];
      const polygon=r=>assessed.map((g,i)=>point(i,r).join(',')).join(' ');
      const points=assessed.map((g,i)=>point(i,radius*D.groupStats(student,g).score/100).join(',')).join(' ');
      return `<svg class="radar" viewBox="0 0 440 335" role="img" aria-label="${escape(D.domains[state.domain].name)} demo group scores; exact values and skill links are listed below"><title>Assessed skill-group scores</title>${[.25,.5,.75,1].map(n=>`<polygon class="radar-grid" points="${polygon(radius*n)}"/>`).join('')}${assessed.map((g,i)=>{const end=point(i,radius);return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}"/>`;}).join('')}<polygon class="radar-area" points="${points}"/>${assessed.map((g,i)=>{const dot=point(i,radius*D.groupStats(student,g).score/100),label=point(i,radius+23);return `<circle class="radar-point" cx="${dot[0]}" cy="${dot[1]}" r="5"/><text class="radar-label" x="${label[0]}" y="${label[1]}" text-anchor="middle">${i+1}</text>`;}).join('')}<text class="radar-scale" x="226" y="49">100%</text></svg><div class="radar-skills">${assessed.map((g,i)=>`<button type="button" data-open-group="${g.id}"><span>${i+1}. ${escape(g.name)}</span><strong>${D.groupStats(student,g).score}%</strong></button>`).join('')}</div>`;
    }
    return assessed.map(g=>{const stats=D.groupStats(student,g);return `<button class="skill-row" data-open-group="${g.id}" type="button"><div class="skill-meta"><strong>${escape(g.name)}</strong><small>${g.skills.filter(s=>D.skillStats(student,s.id).attempts).length}/${g.skills.length} skills assessed</small></div>${hp(stats.score,g.name)}</button>`;}).join('')||'<p class="empty-state">No evidence yet for this part of the curriculum.</p>';
  }
  function progressChart(records){
    const values=Array.from({length:4},(_,i)=>{
      const upto=records.filter(r=>r.week<=i+1);
      const independent=D.summarize(upto.filter(r=>!r.supported)),supported=D.summarize(upto.filter(r=>r.supported));
      return {week:i+1,independent:independent.score,supported:supported.score};
    });
    const x=i=>50+i*150,y=v=>188-v*1.5;
    const line=type=>values.filter(v=>v[type]!==null).map(v=>`${x(v.week-1)},${y(v[type])}`).join(' ');
    return `<svg class="progress-chart" viewBox="0 0 550 225" role="img" aria-label="Cumulative independent and supported accuracy across four demo weeks; exact values available below"><title>Demo practice progress, cumulative correct answers</title>${[0,25,50,75,100].map(n=>`<line class="progress-grid" x1="50" y1="${y(n)}" x2="510" y2="${y(n)}"/><text class="progress-label" x="38" y="${y(n)+4}" text-anchor="end">${n}</text>`).join('')}<polyline class="progress-line independent" points="${line('independent')}"/><polyline class="progress-line supported" points="${line('supported')}"/>${values.map(v=>`<text class="progress-label" x="${x(v.week-1)}" y="214" text-anchor="middle">Week ${v.week}</text>${['independent','supported'].map(type=>v[type]===null?'':`<circle class="progress-dot" cx="${x(v.week-1)}" cy="${y(v[type])}" r="5" fill="${type==='independent'?'#1680e8':'#ff6b27'}"/>`).join('')}`).join('')}</svg>
      <details class="chart-values"><summary>View chart values</summary><table><thead><tr><th scope="col">Demo week</th><th scope="col">Independent</th><th scope="col">Supported</th></tr></thead><tbody>${values.map(v=>`<tr><th scope="row">Week ${v.week}</th><td>${v.independent===null?'No evidence':v.independent+'%'}</td><td>${v.supported===null?'No evidence':v.supported+'%'}</td></tr>`).join('')}</tbody></table></details>`;
  }
  function curriculum(student,groups){
    return `<section class="card curriculum-card"><div class="card-heading"><div><h2>Explore the skill groups</h2><p>Expand a group, then choose an individual skill to view its learning evidence.</p></div><span class="curriculum-count">${groups.flatMap(g=>g.skills).filter(s=>D.skillStats(student,s.id).attempts).length} of ${groups.flatMap(g=>g.skills).length} skills assessed</span></div><div class="curriculum-groups">${groups.map(g=>{const stats=D.groupStats(student,g),measured=g.skills.filter(s=>D.skillStats(student,s.id).attempts).length;return `<details class="skill-group" id="group-${g.key}"><summary><span><strong>${escape(g.name)}</strong><small>${measured}/${g.skills.length} individual skills assessed</small></span><span class="group-score ${stats.score===null?'unassessed':''}">${stats.score===null?'No evidence yet':stats.score+'%'}</span></summary><div class="individual-skills">${g.skills.map(s=>{const stat=D.skillStats(student,s.id);return `<button type="button" class="individual-skill" data-evidence="${s.id}" data-learner="${student.id}"><strong>${escape(s.name)}</strong><span class="skill-id">${s.id}</span>${hp(stat.score,s.name)}<span class="individual-action">${stat.attempts?stat.attempts+' sample responses · View evidence →':'No sample responses · View skill →'}</span></button>`;}).join('')}</div></details>`;}).join('')}</div><p class="score-note">Coverage scaffold informed by your supplied Grade 5 lists; not a complete or validated curriculum. Unassessed skills are excluded from scores and charts.</p></section>`;
  }
  function renderProfile(){
    const student=studentById(state.student),groups=currentGroups(),records=scopedRecords(student),stats=D.summarize(records);
    const assessedGroups=groups.filter(g=>D.groupStats(student,g).attempts>0);
    if(assessedGroups.length<3)state.mode='bars';
    document.querySelector('#nav-profile').classList.add('active');document.querySelector('#nav-class').classList.remove('active');
    const weakest=assessedGroups.slice().sort((a,b)=>D.groupStats(student,a).score-D.groupStats(student,b).score)[0];
    const label=state.domain==='reading'?(state.section==='foundations'?'Reading Foundations':'Reading Comprehension'):D.domains[state.domain].name;
    root.innerHTML=`<header class="page-heading profile-heading"><div class="profile-id"><span class="avatar profile-avatar" data-tone="${student.index%3}" aria-hidden="true">${student.initials}</span><div><div class="eyebrow">CLASS 5A / FICTIONAL LEARNER</div><h1>${escape(student.name)}</h1><p class="subtitle">Grade 5 · Viking Quest</p></div></div><div class="profile-actions"><label class="field">Switch learner<select id="switch-student">${D.students.map(s=>`<option value="${s.id}" ${s.id===student.id?'selected':''}>${s.name}</option>`).join('')}</select></label><button class="button" type="button" data-back-class>← Back to class</button></div></header>
      <div class="category-tabs" role="tablist" aria-label="Learning domains">${Object.entries(D.domains).map(([key,d])=>`<button id="tab-${key}" type="button" role="tab" aria-controls="domain-panel" aria-selected="${state.domain===key}" tabindex="${state.domain===key?'0':'-1'}" data-domain="${key}">${d.name}</button>`).join('')}</div>
      <section id="domain-panel" role="tabpanel" aria-labelledby="tab-${state.domain}">${state.domain==='reading'?`<div class="reading-sections" role="group" aria-label="Reading curriculum sections">${D.domains.reading.sections.map(s=>`<button type="button" data-section="${s.id}" aria-pressed="${state.section===s.id}">${s.name}</button>`).join('')}</div>`:''}
      <div class="profile-grid"><section class="card"><div class="card-heading"><div><h2>${label} profile</h2><p>Assessed skill groups only · Demo scores</p></div><div class="chart-toggle" role="group" aria-label="Skill chart type"><button type="button" data-mode="bars" aria-pressed="${state.mode==='bars'}">HP bars</button><button type="button" data-mode="radar" aria-pressed="${state.mode==='radar'}" ${assessedGroups.length<3?'disabled title="A radar chart needs at least three assessed groups"':''}>Radar chart</button></div></div><div class="profile-summary"><span>Overall demo score</span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong></div><div id="skill-chart">${summaryChart(student,groups)}</div><p class="skill-action">Select a group to explore its individual skills ↓</p><p class="score-note">${assessedGroups.length<3?'A radar chart needs at least three assessed groups. ':''}Scores reflect correct fictional responses, not a live assessment.</p></section>
      <section class="card support-card"><h2>What to explore next</h2><div class="support-item"><span class="symbol" aria-hidden="true">◎</span><div><h3>${weakest?'Take a closer look at '+escape(weakest.name.toLowerCase())+'.':'Collect evidence before making a judgement.'}</h3><p>${weakest?`This group has a ${D.groupStats(student,weakest).score}% demo score. Open its sample challenges to understand the responses and support used.`:'No responses have been recorded for these demo skills.'}</p>${weakest?`<button class="text-button" type="button" data-open-group="${weakest.id}">Explore the skill group →</button>`:''}</div></div><div class="support-totals"><div class="support-total"><strong data-count="independent">${stats.independent}</strong><p>independent<br>answers</p></div><div class="support-total"><strong data-count="supported">${stats.supported}</strong><p>supported<br>answers</p></div><div class="support-total"><strong data-count="hints">${stats.hints}</strong><p>answers with<br>a hint</p></div></div><div class="support-meter" style="--independent:${stats.attempts?stats.independent/stats.attempts*100:0}%" aria-hidden="true"><span></span></div><p class="support-note">${stats.attempts} fictional responses in this section. Hint use is part of supported answers, not an additional answer count.</p></section>
      <section class="card progress-card"><div class="card-heading"><div><h2>Progress over four weeks</h2><p>Cumulative accuracy (%) for ${label.toLowerCase()}.</p></div></div><div class="legend"><span><i></i> Independent</span><span><i class="orange"></i> Supported</span></div>${progressChart(records)}<p class="score-note">Correct responses ÷ responses in each support type. An illustrative demo trend, not a prediction.</p></section>
      <section class="card"><h2>Latest learning evidence</h2><p class="small-copy">Choose a sample to inspect the skill and challenge.</p>${assessedGroups.slice(0,3).map(g=>{const id=g.skills.find(s=>D.skillStats(student,s.id).attempts).id;const record=student.evidence.filter(r=>r.skillId===id).at(-1);return evidenceLink(student,record);}).join('')||'<p class="empty-state">No evidence yet</p>'}</section></div>${curriculum(student,groups)}</section>`;
  }
  function showEvidence(studentId,skillId,opener){
    const student=studentById(studentId),group=groupForSkill(skillId);if(!group)return;
    const skill=group.skills.find(s=>s.id===skillId),stats=D.skillStats(student,skillId),mapping=D.mappings[skillId],sample=D.samples[skillId];
    // Include both a successful response and a retry when available, from real demo records.
    const records=student.evidence.filter(r=>r.skillId===skillId).slice().reverse();
    const selection=[];if(records.length){selection.push(records[0]);const alternative=records.find(r=>r.correct!==records[0].correct);if(alternative)selection.push(alternative);}
    document.querySelector('#evidence-content').innerHTML=`<div class="eyebrow">${D.domains[group.domain].name}${group.section?' / '+D.domains.reading.sections.find(s=>s.id===group.section).name:''} / ${escape(group.name)}</div><h2 class="evidence-title" id="evidence-title">${escape(skill.name)}</h2><p class="small-copy">${escape(student.name)} · Fictional learning evidence</p><p class="skill-id evidence-id">${skill.id}</p><div class="evidence-stat"><span><strong>${stats.attempts}</strong> responses</span><span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong> demo score</span><span><strong>${stats.hints}</strong> answers with a hint</span></div>
      <div class="standard">${mapping?`<a href="${mapping.source}#${mapping.code.replace('LITERACY','Literacy')}" target="_blank" rel="noopener noreferrer">${mapping.code}</a><p>${escape(mapping.description)}</p><p><strong>Candidate alignment — verification pending.</strong> EDUCADE IDs identify the skill independently of CCSS. Mapping review is separate from demo scores.</p>`:'<strong>CCSS mapping not reviewed yet.</strong><p>This coverage skill has an EDUCADE ID but no verified standards alignment.</p>'}</div>
      ${selection.length?selection.map(r=>`<article class="attempt"><div class="attempt-heading"><strong>${escape(sample.title)}</strong><span>Demo Week ${r.week} · Attempt ${(r.week-1)*5+r.day}</span></div><blockquote>${escape(sample.prompt)}</blockquote><dl><dt>Response</dt><dd>${escape(r.response)}</dd><dt>Example</dt><dd>${escape(sample.answer)}</dd></dl><div class="attempt-support"><span class="outcome ${r.correct?'':'retry'}">${r.correct?'Correct sample response':'Needs another try'}</span><span>${r.supported?'Supported':'Independent'}</span><span>${r.hint?'Hint used':'No hint used'}</span></div>${r.hint?`<p class="hint-copy"><strong>Hint shown:</strong> ${escape(sample.hint)}</p>`:''}</article>`).join(''):'<div class="empty-state"><h3>No evidence yet</h3><p>This individual skill is in the coverage scaffold but has not been assessed in the demo. No score or progress is inferred.</p></div>'}`;
    evidenceOpener=opener;dialog.showModal();document.querySelector('#close-evidence').focus();
  }
  function closeEvidence(){dialog.close();if(evidenceOpener?.isConnected)evidenceOpener.focus();}
  function parseRoute(){
    const [view,id,domain,section]=location.hash.slice(1).split('/');
    if(view==='student'){
      state.student=studentById(id).id;state.domain=D.domains[domain]?domain:'reading';state.section=section==='foundations'?'foundations':'comprehension';renderProfile();
    }else renderClass();
    document.title=`${view==='student'?studentById(state.student).name+' · '+D.domains[state.domain].name:'Class overview'} · EDUCADE demo`;
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button,tr[data-student]');if(!target)return;
    if(target.dataset.evidence){showEvidence(target.dataset.learner,target.dataset.evidence,target);return;}
    if(target.dataset.student){goStudent(target.dataset.student);return;}
    if(target.hasAttribute('data-back-class')){location.hash='class';return;}
    if(target.dataset.domain){nextFocus=`#tab-${target.dataset.domain}`;goStudent(state.student,target.dataset.domain,state.section);return;}
    if(target.dataset.section){nextFocus=`[data-section="${target.dataset.section}"]`;goStudent(state.student,'reading',target.dataset.section);return;}
    if(target.dataset.mode){state.mode=target.dataset.mode;renderProfile();root.querySelector(`[data-mode="${state.mode}"]`).focus();return;}
    if(target.dataset.openGroup){const group=groupSkills(target.dataset.openGroup),details=document.querySelector(`#group-${group.key}`);details.open=true;details.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});details.querySelector('.individual-skill').focus({preventScroll:true});}
  });
  root.addEventListener('input',event=>{if(event.target.id==='search-students'){state.search=event.target.value;renderRows();}});
  root.addEventListener('change',event=>{if(event.target.id==='sort-students'){state.sort=event.target.value;renderRows();}if(event.target.id==='switch-student'){nextFocus='#switch-student';goStudent(event.target.value,state.domain,state.section);}});
  root.addEventListener('keydown',event=>{
    const tab=event.target.closest('[role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const keys=Object.keys(D.domains),i=keys.indexOf(state.domain),next=event.key==='Home'?0:event.key==='End'?keys.length-1:(i+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
    goStudent(state.student,keys[next],state.section);requestAnimationFrame(()=>document.querySelector(`#tab-${keys[next]}`)?.focus());
  });
  document.querySelector('#nav-class').addEventListener('click',()=>location.hash='class');
  document.querySelector('#nav-profile').addEventListener('click',()=>goStudent(state.student));
  document.querySelector('#close-evidence').addEventListener('click',closeEvidence);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeEvidence();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeEvidence();}});
  addEventListener('hashchange',()=>{if(dialog.open)dialog.close();parseRoute();scrollTo(0,0);if(nextFocus){document.querySelector(nextFocus)?.focus({preventScroll:true});nextFocus=null;}});parseRoute();
})();
