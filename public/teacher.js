(() => {
  'use strict';
  const D=window.EDUCADE_DEMO, root=document.querySelector('#dashboard'), dialog=document.querySelector('#evidence-dialog');
  const preferenceKey='educade.teacher.presentation.v1';
  const defaults={portrait:'photos',classView:'bars',studentView:'radar'};
  let preferences={...defaults},storageAvailable=true;
  try {
    const saved=JSON.parse(localStorage.getItem(preferenceKey));
    if(saved?.version===1){
      for(const [key,choices] of Object.entries({portrait:['photos','vikings','initials'],classView:['heatmap','bars'],studentView:['radar','bars']})){
        if(choices.includes(saved[key]))preferences[key]=saved[key];
      }
    }
  } catch { /* Malformed or unavailable storage must not stop the dashboard. */ }
  const controls=document.querySelector('.presentation-controls'),portraitPicker=document.querySelector('.portrait-picker');
  let framework='ccss';
  try{const saved=localStorage.getItem('educade.teacher.curriculum.v1');if(window.EDUCADE_ALIGNMENT.frameworks[saved])framework=saved;}catch{}
  const state={classId:'5a',student:'alex',domain:'overall',section:'comprehension',search:'',sort:'name',selectedSkill:null,expandedSkill:null,expandedStudent:null};
  let evidenceOpener=null;
  let nextFocus=null;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentClass=()=>D.classes.find(c=>c.id===state.classId)||D.classes[0];
  const classStudents=()=>currentClass().studentIds.map(id=>D.students.find(s=>s.id===id));
  const studentById=id=>D.students.find(s=>s.id===id)||classStudents()[0];
  const avatar=(s,large=false)=>`<span class="avatar ${large?'profile-avatar':''}" data-avatar-student="${s.id}" data-tone="${s.index%3}" aria-hidden="true">${portraitContent(s)}</span>`;
  function portraitContent(student){
    const sheet=window.EDUCADE_PORTRAITS?.[preferences.portrait],frame=sheet?.frames[student.id];
    if(!sheet?.available||!frame)return escape(student.initials);
    const [x,y,w,h]=frame,size=Math.min(w,h);
    return `<svg class="portrait-image" viewBox="${x+(w-size)/2} ${y} ${size} ${size}" aria-hidden="true" focusable="false"><image href="${escape(sheet.src)}" width="${sheet.width}" height="${sheet.height}"/></svg>`;
  }
  function savePreferences(){
    try{localStorage.setItem(preferenceKey,JSON.stringify({version:1,...preferences}));storageAvailable=true;}
    catch{storageAvailable=false;}
    document.querySelector('#preference-status').textContent=storageAvailable?'Presentation choices stay in this browser. No account is connected.':'Browser storage is unavailable. Choices will stay for this visit.';
  }
  function setPortrait(style){
    if(!['photos','vikings','initials'].includes(style))return;
    preferences.portrait=style;savePreferences();
    // Replace portraits only: current learner, expanded groups and evidence stay intact.
    document.querySelectorAll('[data-avatar-student]').forEach(el=>el.innerHTML=portraitContent(studentById(el.dataset.avatarStudent)));
  }
  const hp=(score,label)=>score===null?'<span class="no-evidence">No evidence yet</span>':`<div class="hp" role="img" aria-label="${escape(label)}: ${score} percent"><div class="hp-track"><span class="hp-fill ${score<50?'low':score<70?'mid':''}" style="--value:${score}%"></span></div><span class="hp-value">${score}%</span></div>`;
  const groupSkills=id=>D.groups.find(g=>g.id===id);
  const groupForSkill=id=>D.groups.find(g=>g.skills.some(s=>s.id===id));
  const currentGroups=()=>D.groups.filter(g=>(state.domain==='overall'||g.domain===state.domain)&&(state.domain!=='reading'||g.section===state.section));
  const scopedRecords=student=>student.evidence.filter(r=>currentGroups().some(g=>g.skills.some(s=>s.id===r.skillId)));
  const readingScores=s=>D.reading.map(id=>D.skillStats(s,id).score);
  const needSupport=s=>readingScores(s).some(score=>score!==null&&score<50);
  function goStudent(id,domain='overall',section='comprehension'){location.hash=`student/${id}/${domain}/${section}`;}
  function renderClass(){
    document.querySelector('#nav-class').classList.add('active');document.querySelector('#nav-profile').classList.remove('active');
    const headings=['Inference','Vocabulary in context','Figurative language','Character thoughts & motivations'];
    root.innerHTML=`<header class="page-heading"><div><div class="eyebrow">${escape(currentClass().name.toUpperCase())} / TEACHER DASHBOARD</div><h1>Class overview</h1><p class="subtitle">Grade 5 <span aria-hidden="true">·</span> Viking Quest</p></div><div class="header-controls-slot"></div></header>
      <section class="stats" aria-label="Demo class summary"><article class="stat"><div class="stat-icon" aria-hidden="true">♧</div><div><strong>${classStudents().length}</strong><p>learners</p></div></article><article class="stat"><div class="stat-icon" aria-hidden="true">▥</div><div><strong>4</strong><p>sample reading skills</p></div></article><article class="stat warm"><div class="stat-icon" aria-hidden="true">!</div><div><strong>${classStudents().filter(needSupport).length}</strong><p>with a skill below 50%</p></div></article></section>
      <section class="card"><div class="card-heading"><div><h2>Reading skills at a glance</h2><p>Expand a skill across the class or a learner beneath their row.</p></div><div class="legend"><span><i class="orange"></i> More practice</span><span><i></i> Building strength</span></div></div>
      <div class="toolbar"><label class="field search">Find a learner<input id="search-students" type="search" placeholder="Search fictional students" value="${escape(state.search)}"></label><label class="field sort">Sort learners<select id="sort-students"><option value="name">Name A–Z</option><option value="support">Needs practice first</option></select></label><div class="portrait-controls-slot"></div></div>
      <div class="data-view-row"><span>Data view</span><div class="chart-toggle" role="group" aria-label="Class data view"><button type="button" data-class-mode="bars" aria-pressed="${preferences.classView==='bars'}">Progress Bars</button><button type="button" data-class-mode="heatmap" aria-pressed="${preferences.classView==='heatmap'}">Class heatmap</button></div></div>
      <p id="heatmap-key" class="heatmap-key" ${preferences.classView==='heatmap'?'':'hidden'}><span><i class="heat-low"></i>0–49%</span><span><i class="heat-mid"></i>50–69%</span><span><i class="heat-high"></i>70–100%</span> Select a cell for its skill evidence.</p>
      <div class="table-scroll" role="region" aria-label="Class skill comparison" tabindex="0"><table class="class-table ${preferences.classView==='heatmap'?'heatmap-table':''}"><caption class="sr-only">Fictional ${escape(currentClass().name)} learners and four demo reading skill scores. Each score is based on 20 sample responses.</caption><thead id="skill-headings"></thead><tbody id="student-rows"></tbody></table></div><p id="empty-class" class="empty-state" hidden>No learners match your search. Try another name.</p><p class="table-note">Demo scores: correct sample responses ÷ attempts. Every shown skill has 20 fictional responses. These are illustrative practice results, not grades or a validated assessment.</p></section>
      <div class="lower-grid"><section class="card"><h2>Recent learning evidence</h2><p class="small-copy">From the same fictional records shown in learner profiles.</p>${[0,1,2].map((i)=>{const s=classStudents()[i],id=D.reading[i],r=s.evidence.filter(r=>r.skillId===id).at(-1);return evidenceLink(s,r);}).join('')}</section>
      <section class="card support-card"><h2>Suggested next steps</h2><div class="support-item"><span class="symbol" aria-hidden="true">◎</span><div><h3>Start with the skills that need practice.</h3><p>${classStudents().filter(needSupport).map(s=>escape(s.name.split(' ')[0])).join(', ')} have a sample reading skill below 50%. Open a profile and look at its evidence before choosing the next challenge.</p></div></div><div class="support-item"><span class="symbol" aria-hidden="true">✦</span><div><h3>Look beyond the percentage.</h3><p>Compare independent answers, supported answers and hint use. A low score does not say why a learner found a challenge difficult.</p></div></div></section></div>`;
    document.querySelector('#sort-students').value=state.sort;
    renderRows();
  }
  const classHeadings=['Inference','Vocabulary in context','Figurative language','Character thoughts & motivations'];
  function compactEvidence(student,skillId){
    const stats=D.skillStats(student,skillId),sample=D.samples[skillId];
    const latest=student.evidence.filter(r=>r.skillId===skillId).at(-1);
    return `<div class="compact-evidence">${hp(stats.score,sample?.title||'Skill progress')}<p class="evidence-counts"><strong>${stats.correct}/${stats.attempts}</strong> correct · ${stats.hints} hints</p><p class="evidence-support">${stats.independent} independent · ${stats.supported} supported</p>${latest?`<p class="latest-response"><strong>Week ${latest.week} · ${latest.correct?'Correct':'Try again'} · ${latest.supported?'Supported':'Independent'}</strong><span>${escape(latest.response)}</span></p>`:'<p class="no-evidence">No evidence yet</p>'}<button class="text-button" type="button" data-evidence="${skillId}" data-learner="${student.id}">View questions and responses →</button></div>`;
  }
  function renderRows(){
    const expandedIndex=D.reading.indexOf(state.expandedSkill);
    const expanded=expandedIndex>=0;
    document.querySelector('.class-table').classList.toggle('has-skill-evidence',expanded);
    document.querySelector('#skill-headings').innerHTML=`<tr><th class="row-number-heading" scope="col">#</th><th class="student-heading" scope="col">Student</th>${classHeadings.map((h,i)=>`<th scope="col"><button class="skill-heading" type="button" data-expand-skill="${D.reading[i]}" aria-expanded="${state.expandedSkill===D.reading[i]}" aria-controls="student-rows">${escape(h)}<span aria-hidden="true">${state.expandedSkill===D.reading[i]?'−':'+'}</span></button></th>${state.expandedSkill===D.reading[i]?`<th class="expanded-heading" scope="col">${escape(h)} evidence<button type="button" class="collapse-evidence" data-expand-skill="${D.reading[i]}" aria-label="Collapse ${escape(h)} evidence">✕</button></th>`:''}`).join('')}</tr>`;
    const students=classStudents().filter(s=>s.name.toLowerCase().includes(state.search.toLowerCase())).slice().sort((a,b)=>state.sort==='support'?Math.min(...readingScores(a))-Math.min(...readingScores(b))||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
    document.querySelector('#student-rows').innerHTML=students.map((student,rowIndex)=>{
      const open=state.expandedStudent===student.id;
      const cells=readingScores(student).map((score,i)=>`<td><button class="score-cell ${preferences.classView==='heatmap'?'heat-cell '+(score===null?'heat-empty':score<50?'heat-low':score<70?'heat-mid':'heat-high'):''}" type="button" data-evidence="${D.reading[i]}" data-learner="${student.id}" aria-label="${escape(student.name)}, ${escape(classHeadings[i])}: ${score===null?'No evidence yet':score+' percent'}. View evidence">${preferences.classView==='heatmap'?`<strong>${score===null?'No evidence yet':score+'%'}</strong><span>View evidence →</span>`:hp(score,classHeadings[i])}</button></td>${state.expandedSkill===D.reading[i]?`<td class="skill-evidence-cell">${compactEvidence(student,D.reading[i])}</td>`:''}`).join('');
      return `<tr data-student="${student.id}" class="${student.id===state.student?'current-learner':''} ${open?'expanded-learner':''}"><td class="row-number">${rowIndex+1}</td><th scope="row" class="student-name-cell"><div class="learner">${avatar(student)}<div><button class="name-button" data-expand-student="${student.id}" aria-expanded="${open}" aria-controls="student-evidence-${student.id}" type="button">${escape(student.name)}<small>${open?'− Hide skill evidence':'+ Show skill evidence'}</small></button><button class="profile-link" type="button" data-student="${student.id}">Open full profile →</button></div></div></th>${cells}</tr><tr class="student-evidence-row" id="student-evidence-${student.id}" ${open?'':'hidden'}><td colspan="${expanded?7:6}"><section class="student-evidence-panel" aria-label="${escape(student.name)} skill evidence"><div class="inline-evidence-heading"><h3>${escape(student.name)} · Reading evidence</h3><button class="text-button" type="button" data-expand-student="${student.id}">Collapse ↑</button></div><div class="student-evidence-grid">${D.reading.map((id,i)=>`<article><h4>${escape(classHeadings[i])}</h4>${compactEvidence(student,id)}</article>`).join('')}</div></section></td></tr>`;
    }).join('');
    document.querySelector('#empty-class').hidden=students.length>0;
  }
  function toggleClassExpansion(kind,id){
    const key=kind==='skill'?'expandedSkill':'expandedStudent';
    state[key]=state[key]===id?null:id;
    if(kind==='student')state.student=id;
    renderRows();markSelectedSkill();
    const selector=kind==='skill'?`[data-expand-skill="${id}"]`:`.name-button[data-expand-student="${id}"]`;
    root.querySelector(selector)?.focus({preventScroll:true});
  }
  function evidenceLink(student,record){
    return `<button class="evidence-link" type="button" data-evidence="${escape(record.skillId)}" data-learner="${student.id}">${avatar(student)}<div><strong>${escape(student.name)} · ${escape(D.samples[record.skillId].title)}</strong><p>${record.supported?'Supported answer':'Independent answer'}${record.hint?' · Hint used':''} · Demo Week ${record.week}</p></div><span class="arrow" aria-hidden="true">→</span></button>`;
  }
  function profileSkills(groups){
    if(state.domain==='overall')return Object.entries(D.domains).filter(([key])=>key!=='overall').map(([id,d])=>({id,label:d.name,domain:id}));
    const ids=new Set(groups.flatMap(group=>group.skills.map(skill=>skill.id)));
    return (D.profileAxes[state.domain]||[]).filter(axis=>ids.has(axis.id));
  }
  function axisStats(student,axis){return axis.domain?D.summarize(student.evidence.filter(r=>D.groups.some(g=>g.domain===axis.domain&&g.skills.some(s=>s.id===r.skillId)))):D.skillStats(student,axis.id);}
  function canShowRadar(student,groups){
    return profileSkills(groups).filter(axis=>axisStats(student,axis).score!==null).length>=3;
  }
  function summaryChart(student,groups){
    const axes=profileSkills(groups);
    if(preferences.studentView==='radar'&&canShowRadar(student,groups)){
      const count=axes.length,cx=280,cy=210,radius=138;
      const point=(i,r)=>[cx+Math.sin(i*2*Math.PI/count)*r,cy-Math.cos(i*2*Math.PI/count)*r];
      const polygon=r=>axes.map((axis,i)=>point(i,r).join(',')).join(' ');
      const scores=axes.map(axis=>axisStats(student,axis).score);
      const labelLines=label=>{
        const words=label.split(' '),lines=[''];
        words.forEach(word=>{const i=lines.length-1;if((lines[i]+' '+word).trim().length>20&&lines[i])lines.push(word);else lines[i]=(lines[i]+' '+word).trim();});
        return lines;
      };
      // Missing results are never positioned at zero or bridged by a polygon.
      const areas=scores.every(score=>score!==null)?`<polygon class="radar-area" points="${scores.map((score,i)=>point(i,radius*score/100).join(',')).join(' ')}"/>`:scores.map((score,i)=>{
        const next=(i+1)%count;if(score===null||scores[next]===null)return '';
        return `<line class="radar-area" x1="${point(i,radius*score/100)[0]}" y1="${point(i,radius*score/100)[1]}" x2="${point(next,radius*scores[next]/100)[0]}" y2="${point(next,radius*scores[next]/100)[1]}"/>`;
      }).join('');
      return `<div class="radar-stage"><svg class="radar" viewBox="0 0 560 430" role="group" aria-label="${escape(D.domains[state.domain].name)} skill profile. Select a labelled skill point or the buttons below for evidence."><title>${escape(student.name)} · ${escape(D.domains[state.domain].name)} skill progress</title>${[.25,.5,.75,1].map(n=>`<polygon class="radar-grid" points="${polygon(radius*n)}"/>`).join('')}${axes.map((axis,i)=>{const end=point(i,radius);return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}"/>`;}).join('')}${areas}${axes.map((axis,i)=>{
        const score=scores[i],dot=point(i,radius*(score??100)/100),label=point(i,radius+42),lines=labelLines(axis.label);
        return `<g class="radar-target" role="button" tabindex="0" ${axis.domain?`data-domain="${axis.domain}"`:`data-evidence="${axis.id}" data-learner="${student.id}"`} aria-label="${escape(axis.label)}: ${score===null?'No evidence yet':score+' percent'}. View evidence"><circle class="radar-hit" cx="${dot[0]}" cy="${dot[1]}" r="17"/><circle class="radar-point ${score===null?'unassessed-point':''}" cx="${dot[0]}" cy="${dot[1]}" r="5"/><text class="radar-label" x="${label[0]}" y="${label[1]}" text-anchor="middle">${lines.map((line,n)=>`<tspan x="${label[0]}" dy="${n?14:-(lines.length-1)*7}">${escape(line)}</tspan>`).join('')}</text></g>`;
      }).join('')}<text class="radar-scale" x="${cx+8}" y="${cy-radius-7}">100%</text><text class="radar-scale" x="${cx+8}" y="${cy-radius*.5-5}">50%</text></svg><div class="radar-portrait">${avatar(student,true)}</div></div><div class="radar-skills">${axes.map(axis=>{const stats=axisStats(student,axis);return `<button type="button" ${axis.domain?`data-domain="${axis.domain}"`:`data-evidence="${axis.id}" data-learner="${student.id}"`}><span>${escape(axis.label)}</span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong></button>`;}).join('')}</div>`;
    }
    // Progress Bars use the exact same individual skills and records as Radar.
    const skills=axes.length?axes:groups.flatMap(group=>group.skills.map(skill=>({id:skill.id,label:skill.name})));
    return skills.map(axis=>{const stats=axisStats(student,axis);return `<button class="skill-row" ${axis.domain?`data-domain="${axis.domain}"`:`data-evidence="${axis.id}" data-learner="${student.id}"`} type="button"><div class="skill-meta"><strong>${escape(axis.label)}</strong><small>${stats.attempts?stats.attempts+' responses':'No evidence yet'}</small></div>${hp(stats.score,axis.label)}</button>`;}).join('');
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
    return `<section class="card curriculum-card"><div class="card-heading"><div><h2>Explore the skill groups</h2><p>Expand a group, then choose an individual skill to view its learning evidence.</p></div><span class="curriculum-count">${groups.flatMap(g=>g.skills).filter(s=>D.skillStats(student,s.id).attempts).length} of ${groups.flatMap(g=>g.skills).length} skills assessed</span></div><div class="curriculum-groups">${groups.map(g=>{const stats=D.groupStats(student,g),measured=g.skills.filter(s=>D.skillStats(student,s.id).attempts).length;return `<details class="skill-group" id="group-${state.domain==='overall'?g.domain+'-':''}${g.key}"><summary><span><strong>${escape(g.name)}</strong><small>${measured}/${g.skills.length} individual skills assessed</small></span><span class="group-score ${stats.score===null?'unassessed':''}">${stats.score===null?'No evidence yet':stats.score+'%'}</span></summary><div class="individual-skills">${g.skills.map(s=>{const stat=D.skillStats(student,s.id);return `<button type="button" class="individual-skill" data-evidence="${s.id}" data-learner="${student.id}"><strong>${escape(s.name)}</strong><span class="skill-id">${s.id}</span><span class="mapping-status">${escape(mappingLabel(s.id))}</span>${hp(stat.score,s.name)}<span class="individual-action">${stat.attempts?stat.attempts+' sample responses · View evidence →':'No sample responses · View skill →'}</span></button>`;}).join('')}</div></details>`;}).join('')}</div><p class="score-note">Coverage scaffold informed by your supplied Grade 5 lists; not a complete or validated curriculum. Unassessed skills are excluded from scores and charts.</p></section>`;
  }
  function curriculumSelector(){
    const F=window.EDUCADE_ALIGNMENT.frameworks;
    return `<section class="curriculum-toolbar" aria-label="Curriculum alignment"><label class="field">Curriculum view<select id="curriculum-framework">${Object.entries(F).map(([key,f])=>`<option value="${key}" ${framework===key?'selected':''}>${escape(f.name)}</option>`).join('')}</select></label><div><strong>${escape(F[framework].band)}</strong><p>Curriculum view changes the objective links, not the learner’s score. Year labels are not equivalence claims.</p></div></section>`;
  }
  function mappingLabel(id){const m=window.EDUCADE_ALIGNMENT.lookup(id,framework);return m?`${m.code||m.area} · ${m.status}`:'Objective mapping awaiting review';}
  function alignmentCard(id){
    const A=window.EDUCADE_ALIGNMENT,F=A.frameworks[framework],m=A.lookup(id,framework);
    return `<section class="curriculum-alignment"><h3>${escape(F.name)} · ${escape(F.band)}</h3>${m?`<strong>${escape(m.code||m.area)}</strong><p>${escape(m.objective)}</p><span class="alignment-badge">${escape(m.status)}</span>`:'<p>No objective-level mapping reviewed for this skill yet.</p>'}<p>${framework==='cambridge'?'Cambridge stage-specific objective codes await review against the current school curriculum framework. ':''}Partial prototype alignment; practice evidence does not certify curriculum mastery.</p><a href="${F.source}" target="_blank" rel="noopener noreferrer">View curriculum source ↗</a></section>`;
  }
  function glow(student,groups){
    const ranked=groups.flatMap(g=>g.skills).filter(s=>D.skillStats(student,s.id).attempts).sort((a,b)=>D.skillStats(student,b.id).score-D.skillStats(student,a.id).score),best=ranked[0];
    return `<div class="support-item glow-item"><span class="symbol glow-symbol" aria-hidden="true">💎</span><div><h3>${best?'Glow: '+escape(best.name):'Gather a first sample'}</h3><p>${best?`${D.skillStats(student,best.id).score}% correct sample responses. Keep building this strength across fresh passages.`:'These skills have not been assessed.'}</p>${best?`<p class="mapping-status">${escape(mappingLabel(best.id))}</p><button type="button" class="text-button" data-evidence="${best.id}" data-learner="${student.id}">See the evidence →</button>`:''}</div></div>`;
  }
  function readingLevel(student){
    const A=window.EDUCADE_ALIGNMENT,r=A.readingLevels[student.id],delta=r.current-r.start;
    return `<section class="reading-level-card" aria-label="Provisional EDUCADE reading level"><div><div class="eyebrow">ADAPTIVE READING · ILLUSTRATIVE PLACEMENT</div><h2>EDUCADE Reading Level <span class="level-number">${r.current}</span></h2><p>Provisional demo band · ${delta>0?'+'+delta:delta} from starting level ${r.start}</p><p class="small-copy">Internal bands 1–8. These are neither Lexile measures nor grade equivalents.</p></div><div class="reading-level-detail"><strong>Next text: ${escape(r.next)}</strong><p>Difficulty responds to a pattern of answers. Reported levels change after consistent independent evidence.</p><details><summary>Placement and adaptation preview</summary><p>A short opening quest would establish a provisional band. Several strong independent answers prompt harder text; repeated difficulty prompts easier text and support. A single mistake does not lower the reported level.</p><div class="passage-choices"><button class="button" type="button" data-reading-preview="supported">Supported text</button><button class="button" type="button" data-reading-preview="stretch">Stretch text</button></div><blockquote id="reading-preview">${escape(A.passages.supported)}</blockquote><p class="score-note">Illustrative wording only. Placement, live adaptation and validated Lexile assessment are future features.</p></details></div></section>`;
  }
  function renderProfile(){
    const student=studentById(state.student),groups=currentGroups(),records=scopedRecords(student),stats=D.summarize(records);
    const assessedGroups=groups.filter(g=>D.groupStats(student,g).attempts>0),canRadar=canShowRadar(student,groups);
    document.querySelector('#nav-profile').classList.add('active');document.querySelector('#nav-class').classList.remove('active');
    const weakest=assessedGroups.slice().sort((a,b)=>D.groupStats(student,a).score-D.groupStats(student,b).score)[0];
    const label=state.domain==='reading'?(state.section==='foundations'?'Reading Foundations':'Reading Comprehension'):D.domains[state.domain].name;
    root.innerHTML=`<header class="page-heading profile-heading"><div class="profile-id">${avatar(student,true)}<div><div class="eyebrow">${escape(currentClass().name.toUpperCase())} / STUDENT PROFILE</div><h1>${escape(student.name)}</h1><p class="subtitle">Grade 5 · Viking Quest</p></div></div><div class="profile-actions"><div class="header-controls-slot"></div><div class="profile-navigation"><label class="field">Switch learner<select id="switch-student">${classStudents().map(s=>`<option value="${s.id}" ${s.id===student.id?'selected':''}>${s.name}</option>`).join('')}</select></label><button class="button" type="button" data-back-class>← Back to class</button></div></div></header>
      ${curriculumSelector()}${readingLevel(student)}
      <div class="category-tabs" role="tablist" aria-label="Learning domains">${Object.entries(D.domains).map(([key,d])=>`<button id="tab-${key}" type="button" role="tab" aria-controls="domain-panel" aria-selected="${state.domain===key}" tabindex="${state.domain===key?'0':'-1'}" data-domain="${key}">${d.name}</button>`).join('')}</div>
      <section id="domain-panel" role="tabpanel" aria-labelledby="tab-${state.domain}">${state.domain==='reading'?`<div class="reading-sections" role="group" aria-label="Reading curriculum sections">${D.domains.reading.sections.map(s=>`<button type="button" data-section="${s.id}" aria-pressed="${state.section===s.id}">${s.name}</button>`).join('')}</div>`:''}
      <div class="profile-grid"><section class="card profile-chart-card"><div class="card-heading"><div><h2>${label} profile</h2><p>Individual skills · Select a skill to see its evidence</p></div><div class="chart-toggle" role="group" aria-label="Student data view"><button type="button" data-mode="bars" aria-pressed="${preferences.studentView==='bars'||!canRadar}">Progress Bars</button><button type="button" data-mode="radar" aria-pressed="${preferences.studentView==='radar'&&canRadar}" ${!canRadar?'disabled title="A radar chart needs at least three assessed skills"':''}>Radar chart</button></div></div><div class="profile-summary"><span>Overall demo score</span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong></div><div id="skill-chart">${summaryChart(student,groups)}</div>${state.domain==='overall'?'<p class="future-domain">Speaking &amp; listening · Not yet assessed. These skills will appear when suitable assessment evidence is available.</p>':''}<p class="skill-action">Select a skill point or progress bar to view its evidence.</p><p class="score-note">${!canRadar?'A radar chart needs at least three assessed skills. Showing progress bars here; your saved chart choice stays the same. ':''}Scores reflect correct fictional responses, not a live assessment.</p></section>
      <section class="card progress-card"><div class="card-heading"><div><h2>Progress over four weeks</h2><p>Cumulative accuracy (%) for ${label.toLowerCase()}.</p></div></div><div class="legend"><span><i></i> Independent</span><span><i class="orange"></i> Supported</span></div>${progressChart(records)}<p class="score-note">Correct responses ÷ responses in each support type. An illustrative demo trend, not a prediction.</p></section>
      <section class="card latest-evidence-card"><h2>Latest learning evidence</h2><p class="small-copy">Choose a sample to inspect the skill and challenge.</p>${assessedGroups.slice(0,3).map(g=>{const id=g.skills.find(s=>D.skillStats(student,s.id).attempts).id;const record=student.evidence.filter(r=>r.skillId===id).at(-1);return evidenceLink(student,record);}).join('')||'<p class="empty-state">No evidence yet</p>'}</section>      <section class="card support-card glows-card"><h2>Glows &amp; Grows</h2>${glow(student,groups)}<div class="support-item"><span class="symbol grow-symbol" aria-hidden="true">🎯</span><div><h3>${weakest?'Take a closer look at '+escape(weakest.name.toLowerCase())+'.':'Collect evidence before making a judgement.'}</h3><p>${weakest?`This group has a ${D.groupStats(student,weakest).score}% demo score. Open its sample challenges to understand the responses and support used.`:'No responses have been recorded for these demo skills.'}</p>${weakest?`<p class="mapping-status">${escape(mappingLabel(weakest.skills.find(s=>D.skillStats(student,s.id).attempts).id))}</p><button class="text-button" type="button" data-open-group="${weakest.id}">Explore the skill group →</button>`:''}</div></div><div class="support-totals"><div class="support-total"><strong data-count="independent">${stats.independent}</strong><p>independent<br>answers</p></div><div class="support-total"><strong data-count="supported">${stats.supported}</strong><p>supported<br>answers</p></div><div class="support-total"><strong data-count="hints">${stats.hints}</strong><p>answers with<br>a hint</p></div></div><div class="support-meter" style="--independent:${stats.attempts?stats.independent/stats.attempts*100:0}%" aria-hidden="true"><span></span></div><p class="support-note">${stats.attempts} fictional responses in this section. Hint use is part of supported answers, not an additional answer count.</p></section>
</div>${curriculum(student,groups)}</section>`;
  }
  function showEvidence(studentId,skillId,opener){
    const student=studentById(studentId),group=groupForSkill(skillId);if(!group)return;
    const skill=group.skills.find(s=>s.id===skillId),stats=D.skillStats(student,skillId),mapping=D.mappings[skillId],sample=D.samples[skillId];
    // Include both a successful response and a retry when available, from real demo records.
    const records=student.evidence.filter(r=>r.skillId===skillId).slice().reverse();
    const selection=[];if(records.length){selection.push(records[0]);const alternative=records.find(r=>r.correct!==records[0].correct);if(alternative)selection.push(alternative);}
    document.querySelector('#evidence-content').innerHTML=`<div class="eyebrow">${D.domains[group.domain].name}${group.section?' / '+D.domains.reading.sections.find(s=>s.id===group.section).name:''} / ${escape(group.name)}</div><h2 class="evidence-title" id="evidence-title">${escape(skill.name)}</h2><p class="small-copy">${escape(student.name)} · Fictional learning evidence</p><p class="skill-id evidence-id">${skill.id}</p><div class="evidence-stat"><span><strong>${stats.attempts}</strong> responses</span><span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong> demo score</span><span><strong>${stats.hints}</strong> answers with a hint</span></div>
      <div class="standard legacy-ccss" ${framework==='ccss'?'':'hidden'}>${mapping?`<a href="${mapping.source}#${mapping.code.replace('LITERACY','Literacy')}" target="_blank" rel="noopener noreferrer">${mapping.code}</a><p>${escape(mapping.description)}</p><p><strong>Prototype alignment · CCSS reference text checked.</strong> This sample practices part of the standard; the demo score is not a mastery claim. The linked text is a published reference mirror.</p>`:'<strong>CCSS mapping not reviewed yet.</strong><p>This coverage skill has an EDUCADE ID but no verified standards alignment.</p>'}</div>
      ${alignmentCard(skill.id)}
      ${selection.length?selection.map(r=>`<article class="attempt"><div class="attempt-heading"><strong>${escape(sample.title)}</strong><span>Demo Week ${r.week} · Attempt ${(r.week-1)*5+r.day}</span></div><blockquote>${escape(sample.prompt)}</blockquote><dl><dt>Response</dt><dd>${escape(r.response)}</dd><dt>Example</dt><dd>${escape(sample.answer)}</dd></dl><div class="attempt-support"><span class="outcome ${r.correct?'':'retry'}">${r.correct?'Correct sample response':'Needs another try'}</span><span>${r.supported?'Supported':'Independent'}</span><span>${r.hint?'Hint used':'No hint used'}</span></div>${r.hint?`<p class="hint-copy"><strong>Hint shown:</strong> ${escape(sample.hint)}</p>`:''}</article>`).join(''):'<div class="empty-state"><h3>No evidence yet</h3><p>This individual skill is in the coverage scaffold but has not been assessed in the demo. No score or progress is inferred.</p></div>'}`;
    state.student=student.id;state.selectedSkill={student:student.id,skill:skill.id};markSelectedSkill();
    evidenceOpener=opener;dialog.showModal();document.querySelector('#close-evidence').focus();
  }
  function markSelectedSkill(){
    root.querySelectorAll('tr[data-student]').forEach(row=>row.classList.toggle('current-learner',row.dataset.student===state.student));
    root.querySelectorAll('[data-evidence]').forEach(el=>{
      const selected=el.dataset.evidence===state.selectedSkill?.skill&&el.dataset.learner===state.selectedSkill?.student;
      el.classList.toggle('selected-skill',selected);el.setAttribute('aria-pressed',String(selected));
    });
  }
  function closeEvidence(){
    dialog.close();
    const opener=evidenceOpener?.isConnected?evidenceOpener:root.querySelector(`[data-evidence="${state.selectedSkill?.skill}"][data-learner="${state.selectedSkill?.student}"]`);
    opener?.focus({preventScroll:true});
  }
  function setStudentView(mode){
    if(!['bars','radar'].includes(mode))return;
    preferences.studentView=mode;savePreferences();
    const groups=currentGroups(),canRadar=canShowRadar(studentById(state.student),groups);
    document.querySelector('#skill-chart').innerHTML=summaryChart(studentById(state.student),groups);
    markSelectedSkill();
    root.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===(canRadar?mode:'bars'))));
  }
  function setClassView(mode){
    if(!['bars','heatmap'].includes(mode))return;
    preferences.classView=mode;savePreferences();
    document.querySelector('.class-table').classList.toggle('heatmap-table',mode==='heatmap');
    document.querySelector('#heatmap-key').hidden=mode!=='heatmap';
    root.querySelectorAll('[data-class-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.classMode===mode)));
    renderRows();markSelectedSkill();
  }
  function parseRoute(){
    const [view,id,domain,section]=location.hash.slice(1).split('/');
    if(view==='student'){
      state.student=studentById(id).id;state.classId=D.classes.find(c=>c.studentIds.includes(state.student))?.id||state.classId;state.domain=D.domains[domain]?domain:'overall';state.section=section==='foundations'?'foundations':'comprehension';renderProfile();
    }else renderClass();
    root.querySelector('.header-controls-slot').append(controls);
    if(root.querySelector('.portrait-controls-slot'))root.querySelector('.portrait-controls-slot').append(portraitPicker);
    else controls.insertBefore(portraitPicker,controls.querySelector('.dashboard-menu'));
    document.querySelector('#class-select').value=state.classId;
    markSelectedSkill();
    document.title=`${view==='student'?studentById(state.student).name+' · '+D.domains[state.domain].name:'Class overview'} · EDUCADE demo`;
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button,[data-evidence],tr[data-student]');if(!target)return;
    if(target.dataset.expandSkill){toggleClassExpansion('skill',target.dataset.expandSkill);return;}
    if(target.dataset.expandStudent){toggleClassExpansion('student',target.dataset.expandStudent);return;}
    if(target.matches('tr[data-student]')){toggleClassExpansion('student',target.dataset.student);return;}
    if(target.dataset.evidence){showEvidence(target.dataset.learner,target.dataset.evidence,target);return;}
    if(target.dataset.student){goStudent(target.dataset.student);return;}
    if(target.hasAttribute('data-back-class')){location.hash='class';return;}
    if(target.dataset.domain){nextFocus=`#tab-${target.dataset.domain}`;goStudent(state.student,target.dataset.domain,state.section);return;}
    if(target.dataset.section){nextFocus=`[data-section="${target.dataset.section}"]`;goStudent(state.student,'reading',target.dataset.section);return;}
    if(target.dataset.readingPreview){document.querySelector('#reading-preview').textContent=window.EDUCADE_ALIGNMENT.passages[target.dataset.readingPreview];return;}
    if(target.dataset.mode){setStudentView(target.dataset.mode);return;}
    if(target.dataset.classMode){setClassView(target.dataset.classMode);return;}
    if(target.dataset.openGroup){const group=groupSkills(target.dataset.openGroup),details=document.querySelector(`#group-${state.domain==='overall'?group.domain+'-':''}${group.key}`);details.open=true;details.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});details.querySelector('.individual-skill').focus({preventScroll:true});}
  });
  root.addEventListener('input',event=>{if(event.target.id==='search-students'){state.search=event.target.value;renderRows();markSelectedSkill();}});
  root.addEventListener('change',event=>{if(event.target.id==='curriculum-framework'){framework=event.target.value;try{localStorage.setItem('educade.teacher.curriculum.v1',framework);}catch{}parseRoute();document.querySelector('#curriculum-framework').focus();return;}if(event.target.id==='sort-students'){state.sort=event.target.value;renderRows();markSelectedSkill();}if(event.target.id==='switch-student'){nextFocus='#switch-student';goStudent(event.target.value,state.domain,state.section);}});
  root.addEventListener('keydown',event=>{
    const point=event.target.closest('.radar-target');
    if(point&&['Enter',' '].includes(event.key)&&point.dataset.domain){event.preventDefault();goStudent(state.student,point.dataset.domain,state.section);return;}
    if(point&&['Enter',' '].includes(event.key)){event.preventDefault();showEvidence(point.dataset.learner,point.dataset.evidence,point);return;}
    const tab=event.target.closest('[role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const keys=Object.keys(D.domains),i=keys.indexOf(state.domain),next=event.key==='Home'?0:event.key==='End'?keys.length-1:(i+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
    goStudent(state.student,keys[next],state.section);requestAnimationFrame(()=>document.querySelector(`#tab-${keys[next]}`)?.focus());
  });
  document.querySelector('#nav-class').addEventListener('click',()=>location.hash='class');
  document.querySelector('#nav-profile').addEventListener('click',()=>goStudent(state.student,state.domain,state.section));
  document.querySelector('#close-evidence').addEventListener('click',closeEvidence);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeEvidence();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeEvidence();}});
  const classSelect=document.querySelector('#class-select');
  classSelect.innerHTML=D.classes.map(c=>`<option value="${c.id}">${escape(c.name)}</option>`).join('');
  classSelect.addEventListener('change',()=>{
    if(!D.classes.some(c=>c.id===classSelect.value))return;
    state.classId=classSelect.value;state.student=classStudents()[0].id;
    state.expandedStudent=null;state.expandedSkill=null;state.selectedSkill=null;state.search='';
    if(location.hash==='#class'||!location.hash)parseRoute();else location.hash='class';
    document.querySelector('#class-select').focus();
  });
  const menuButton=document.querySelector('#dashboard-menu-button'),menu=document.querySelector('#dashboard-menu-options');
  function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');}
  menuButton.addEventListener('click',()=>{
    menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));
    if(!menu.hidden)menu.querySelector('button').focus();
  });
  document.addEventListener('click',event=>{if(!event.target.closest('.dashboard-menu'))closeMenu();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden){event.preventDefault();closeMenu();menuButton.focus();}
  });
  menu.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const buttons=[...menu.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
    buttons[next].focus();
  });
  const utilityDialog=document.querySelector('#utility-dialog');
  function closeUtility(){utilityDialog.close();menuButton.focus({preventScroll:true});}
  function openUtility(panel){
    closeMenu();
    document.querySelector('#utility-title').textContent={settings:'Settings',help:'Dashboard help',account:'My Account'}[panel];
    const content=document.querySelector('#utility-content');
    if(panel==='settings'){
      content.innerHTML=`<p class="small-copy">Choose how you see the learning. These preferences are saved in this browser.</p><div class="settings-fields"><label class="field">Portrait style<select data-setting="portrait"><option value="photos">Photos</option><option value="vikings">Viking avatars</option><option value="initials">Initials</option></select></label><label class="field">Class chart<select data-setting="classView"><option value="bars">Progress Bars</option><option value="heatmap">Class heatmap</option></select></label><label class="field">Student chart<select data-setting="studentView"><option value="radar">Radar chart</option><option value="bars">Progress Bars</option></select></label></div>`;
      content.querySelectorAll('[data-setting]').forEach(select=>select.value=preferences[select.dataset.setting]);
    }else if(panel==='help'){
      content.innerHTML='<div class="help-copy"><h3>Explore a skill across the class</h3><p>Select a skill heading to open an evidence column beside it.</p><h3>Explore one learner</h3><p>Select their name to expand evidence beneath their row. Open full profile shows their subject charts.</p><h3>Look behind a percentage</h3><p>Select a progress bar, heatmap cell or radar point to read the question, response and support used.</p><h3>Switch your view</h3><p>Use the class and portrait menus above. Photos, game avatars and initials change presentation without changing results.</p></div>';
    }else content.innerHTML='<div class="help-copy"><h3>Teacher account</h3><p>This prototype has no connected teacher account. School sign-in, class imports and account management will be available when secure account access is implemented.</p><p>The classes and responses shown here are fictional examples.</p></div>';
    document.querySelector('#preference-status').hidden=panel!=='settings';
    utilityDialog.showModal();document.querySelector('#close-utility').focus();
  }
  menu.addEventListener('click',event=>{const action=event.target.closest('[data-utility]');if(action)openUtility(action.dataset.utility);});
  document.querySelector('#close-utility').addEventListener('click',closeUtility);
  utilityDialog.addEventListener('cancel',event=>{event.preventDefault();closeUtility();});
  utilityDialog.addEventListener('change',event=>{
    const setting=event.target.dataset.setting,value=event.target.value;
    if(setting==='portrait'){setPortrait(value);document.querySelector('#portrait-style').value=value;}
    if(setting==='classView'){preferences.classView=value;savePreferences();if(root.querySelector('.class-table'))setClassView(value);}
    if(setting==='studentView'){preferences.studentView=value;savePreferences();if(root.querySelector('#skill-chart'))setStudentView(value);}
  });
  const portraitSelect=document.querySelector('#portrait-style');
  for(const [style,sheet] of Object.entries(window.EDUCADE_PORTRAITS||{})){
    if(sheet.available){const option=portraitSelect.querySelector(`[value="${style}"]`);option.disabled=false;option.textContent=style==='photos'?'Photos':'Viking avatars';}
  }
  portraitSelect.value=preferences.portrait;
  portraitSelect.addEventListener('change',event=>setPortrait(event.target.value));
  savePreferences();
  addEventListener('hashchange',()=>{if(dialog.open)dialog.close();parseRoute();scrollTo(0,0);if(nextFocus){document.querySelector(nextFocus)?.focus({preventScroll:true});nextFocus=null;}});parseRoute();
})();
