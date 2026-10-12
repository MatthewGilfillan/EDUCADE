(() => {
  'use strict';
  const D=window.EDUCADE_DEMO, root=document.querySelector('#dashboard'), dialog=document.querySelector('#evidence-dialog');
  const preferenceKey='educade.teacher.presentation.v1';
  const profileDomains={overall:{name:'Overall'},...D.domains};
  const defaults={portrait:'photos',classView:'bars',studentView:'radar',overallView:'radar'};
  const chartPreference=()=>state.domain==='overall'?'overallView':'studentView';
  let preferences={...defaults},storageAvailable=true;
  try {
    const saved=JSON.parse(localStorage.getItem(preferenceKey));
    if(saved?.version===1){
      for(const [key,choices] of Object.entries({portrait:['photos','vikings','initials'],classView:['heatmap','bars'],studentView:['radar','bars'],overallView:['radar','bars']})){
        if(choices.includes(saved[key]))preferences[key]=saved[key];
      }
    }
  } catch { /* Malformed or unavailable storage must not stop the dashboard. */ }
  const controls=document.querySelector('.presentation-controls'),portraitPicker=document.querySelector('.portrait-picker');
  const state={classId:'5a',classDomain:'overall',classSection:'comprehension',classReadingGroup:'overview',readingGroup:'overview',pendingClassReview:null,student:'alex',domain:'overall',section:'comprehension',search:'',sort:'name',selectedSkill:null,expandedSkill:null,expandedStudent:null,expandedSubjects:new Set(),expandedSubjectSkills:new Set()};
  let evidenceOpener=null;
  let nextFocus=null;
  let utilityOpener=null;
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
    const status=document.querySelector('#preference-status');
    status.textContent=storageAvailable?'':'Browser storage is unavailable. Choices will stay for this visit.';
    status.hidden=storageAvailable;
  }
  function setPortrait(style){
    if(!['photos','vikings','initials'].includes(style))return;
    preferences.portrait=style;savePreferences();
    // Replace portraits only: current learner, expanded groups and evidence stay intact.
    document.querySelectorAll('[data-avatar-student]').forEach(el=>el.innerHTML=portraitContent(studentById(el.dataset.avatarStudent)));
  }
  const hp=(score,label)=>score===null?'<span class="no-evidence">No evidence yet</span>':`<div class="hp" role="img" aria-label="${escape(label)}: ${score} percent"><div class="hp-track"><span class="hp-fill ${score<50?'low':score<70?'mid':''}" style="--value:${score}%"></span></div><span class="hp-value">${score}%</span></div>`;
  const readingOverview={id:'EDU.G5.READING.OVERVIEW',key:'overview',name:'Reading overview',description:'Eight focus skills shared by the class comparison and student radar. Browse the five catalogue groups for every comprehension skill.',skills:D.profileAxes.reading.map(axis=>D.groups.flatMap(group=>group.skills).find(skill=>skill.id===axis.id))};
  const groupSkills=id=>[...D.groups,...D.readingCatalogue,readingOverview].find(g=>g.id===id);
  const groupForSkill=id=>D.groups.find(g=>g.skills.some(s=>s.id===id));
  const readingGroup=key=>D.readingCatalogue.find(group=>group.key===key)||readingOverview;
  const readingGroups=(section,key)=>section==='foundations'?D.groups.filter(group=>group.domain==='reading'&&group.section==='foundations'):[readingGroup(key)];
  const currentGroups=()=>state.domain==='reading'?readingGroups(state.section,state.readingGroup):D.groups.filter(g=>state.domain==='overall'||g.domain===state.domain);
  const scopedRecords=student=>student.evidence.filter(r=>currentGroups().some(g=>g.skills.some(s=>s.id===r.skillId)));
  const readingLabel=skill=>D.profileAxes.reading.find(axis=>axis.id===skill.id)?.label||({'EDU.G5.READING.COMPREHENSION.MAINIDEA.02':'Summary','EDU.G5.READING.COMPREHENSION.EVIDENCE.01':'Supporting evidence','EDU.G5.READING.COMPREHENSION.EVIDENCE.02':'Explaining evidence'}[skill.id])||skill.name;
  function classAxes(){
    if(state.classDomain==='overall')return Object.entries(D.domains).map(([domain,info])=>({id:domain,domain,label:info.name}));
    if(state.classDomain==='reading')return state.classSection==='comprehension'&&state.classReadingGroup==='overview'?D.profileAxes.reading:readingGroups(state.classSection,state.classReadingGroup).flatMap(group=>group.skills.map(skill=>({id:skill.id,label:readingLabel(skill)})));
    return D.profileAxes[state.classDomain];
  }
  const comparisonScores=student=>classAxes().map(axis=>axisStats(student,axis).score).filter(score=>score!==null);
  const practicePriority=student=>Math.min(...comparisonScores(student));
  function goClass(domain=state.classDomain,section=state.classSection,key=state.classReadingGroup){location.hash=`class/${domain}${domain==='reading'?`/${section}${section==='comprehension'?'/'+readingGroup(key).key:''}`:''}`;}
  function goStudent(id,domain='overall',section='comprehension',key=state.readingGroup){location.hash=`student/${id}/${domain}/${section}${domain==='reading'&&section==='comprehension'?'/'+readingGroup(key).key:''}`;}
  function readingNavigation(learners,isClass=false){
    const section=isClass?state.classSection:state.section,key=isClass?state.classReadingGroup:state.readingGroup;
    return `<div class="reading-navigation"><div class="reading-sections" role="group" aria-label="Reading curriculum sections">${D.domains.reading.sections.map(s=>`<button type="button" ${isClass?'data-class-section':'data-section'}="${s.id}" aria-pressed="${section===s.id}">${s.name}</button>`).join('')}</div>${section==='comprehension'?`<div class="reading-catalogue-nav" role="group" aria-label="Reading overview and comprehension groups">${[readingOverview,...D.readingCatalogue].map(group=>{const count=group.skills.filter(skill=>learners.some(student=>D.skillStats(student,skill.id).attempts)).length;return `<button type="button" ${isClass?'data-class-reading-group':'data-reading-group'}="${group.key}" aria-pressed="${key===group.key}"><strong>${escape(group.name)}</strong><span>${count} of ${group.skills.length} skills assessed</span></button>`;}).join('')}</div>`:''}</div>`;
  }
  function readingGroupOverview(group,learners){
    const results=group.skills.map(skill=>({skill,stats:D.summarize(learners.flatMap(student=>student.evidence.filter(record=>record.skillId===skill.id)))}));
    const assessed=results.filter(result=>result.stats.attempts),ranked=assessed.slice().sort((a,b)=>a.stats.score-b.stats.score||a.skill.id.localeCompare(b.skill.id));
    const strength=ranked.at(-1),priority=ranked.find(result=>result.stats.score<70);
    const learnersWithEvidence=learners.filter(student=>group.skills.some(skill=>D.skillStats(student,skill.id).attempts)).length;
    const evidenceAction=(result,label)=>result?`<button type="button" class="text-button" ${learners.length===1?`data-evidence="${result.skill.id}" data-learner="${learners[0].id}"`:`data-review-class-skill="${result.skill.id}"`}>${escape(readingLabel(result.skill))} · ${result.stats.score}% ${label}</button>`:'';
    return `<section class="reading-group-overview" aria-label="${escape(group.name)} overview"><div class="reading-group-heading"><h2>${escape(group.name)}</h2><p>${escape(group.description)}</p></div><dl class="reading-group-summary"><div><dt>Assessment coverage</dt><dd><strong>${assessed.length} of ${group.skills.length} skills assessed</strong><span>${learners.length===1?'Based on this learner’s recorded responses.':`${learnersWithEvidence} of ${learners.length} learners have responses.`}</span></dd></div><div><dt>Strongest recorded skill</dt><dd>${strength?evidenceAction(strength,'→'):'<strong>No evidence yet</strong>'}<span>${strength?`${strength.stats.correct}/${strength.stats.attempts} correct responses`:'Collect a response to identify a strength.'}</span></dd></div><div><dt>Teaching priority</dt><dd>${priority?evidenceAction(priority,'→'):`<strong>${assessed.length?'Check a fresh response':'Collect learning evidence'}</strong>`}<span>${priority?'Review the response and support used before choosing instruction.':assessed.length?'No assessed skill is below the practice threshold.':'Unassessed skills remain available below.'}</span></dd></div></dl><p class="reading-summary-note">Accuracy identifies evidence to review; it is not an achievement-stage judgment. Unassessed skills are kept separate.</p></section>`;
  }
  function readingContextNote(){
    return `<details class="reading-contexts"><summary>Reading contexts</summary><p>These are text types for practising the skills above, rather than separate achievement scores.</p><div>${D.readingContexts.map(group=>`<section><h3>${escape(group.name)}</h3><ul>${group.skills.map(skill=>`<li>${escape(skill.name)}</li>`).join('')}</ul></section>`).join('')}</div></details>`;
  }
  function renderClass(){
    rememberSubjectSkills();
    const overall=state.classDomain==='overall',axes=classAxes(),scope=state.classDomain==='reading'?(state.classSection==='foundations'?'Reading Foundations':readingGroup(state.classReadingGroup).name):profileDomains[state.classDomain].name;
    root.innerHTML=`<header class="page-heading class-dashboard-heading"><div><h1>Teacher Dashboard</h1><h2 class="class-title">${escape(currentClass().name)}</h2><p class="subtitle">Grade 5 <span aria-hidden="true">·</span> Viking Quest</p></div><div class="header-controls-slot"></div></header>
      <section class="card class-comparison">
      <div class="toolbar class-toolbar"><label class="field search">Find a learner<input id="search-students" type="search" placeholder="Search students" value="${escape(state.search)}"></label><label class="field sort">Sort learners<select id="sort-students"><option value="name">Name A–Z</option><option value="support">Needs practice first</option></select></label><div class="portrait-controls-slot"></div></div>
      <div class="category-tabs class-tabs" role="tablist" aria-label="Class learning domains">${Object.entries(profileDomains).map(([key,info])=>`<button id="class-tab-${key}" type="button" role="tab" aria-controls="class-panel" aria-selected="${state.classDomain===key}" tabindex="${state.classDomain===key?'0':'-1'}" data-class-domain="${key}">${info.name}</button>`).join('')}</div>
      <section id="class-panel" role="tabpanel" aria-labelledby="class-tab-${state.classDomain}">
      ${state.classDomain==='reading'?readingNavigation(classStudents(),true):''}
      <div class="data-view-row"><div class="legend"><span><i class="orange"></i> More practice</span><span><i></i> Building strength</span></div><div class="chart-toggle" role="group" aria-label="Class data view"><button type="button" data-class-mode="bars" aria-pressed="${preferences.classView==='bars'}">Progress Bars</button><button type="button" data-class-mode="heatmap" aria-pressed="${preferences.classView==='heatmap'}">Class heatmap</button></div></div>
      <p id="heatmap-key" class="heatmap-key" ${preferences.classView==='heatmap'?'':'hidden'}><span><i class="heat-low"></i>0–49%</span><span><i class="heat-mid"></i>50–69%</span><span><i class="heat-high"></i>70–100%</span> ${overall?'Select a subject to explore its skills.':'Select a cell for its skill evidence.'}</p>
      <p class="comparison-scroll-guide">${axes.length} ${overall?'subjects':escape(profileDomains[state.classDomain].name.toLowerCase())+' skills'}</p>
      <div class="comparison-scroll-wrap"><div class="table-scroll" role="region" aria-label="${escape(scope)} class comparison" tabindex="0"><table class="class-table ${preferences.classView==='heatmap'?'heatmap-table':''}"><caption class="sr-only">${escape(currentClass().name)} learners and ${axes.length} ${overall?'subject':scope.toLowerCase()+' skill'} scores, based on recorded responses.</caption><colgroup id="skill-columns"></colgroup><thead id="skill-headings"></thead><tbody id="student-rows"></tbody></table></div><button class="skill-scroll-jump" type="button" data-scroll-skills="end" aria-label="Show remaining columns" title="Show remaining columns" hidden><svg viewBox="0 0 32 40" aria-hidden="true" focusable="false"><path d="M4 6 18 20 4 34"/><path d="M14 6 28 20 14 34"/></svg></button></div><p id="empty-class" class="empty-state" hidden>No learners match your search. Try another name.</p><p class="table-note">${overall?'Subject scores: correct responses ÷ attempts. Reading includes Foundations and Comprehension. Select a subject to explore its skills.':'Scores: correct responses ÷ attempts. Select a skill to compare independent answers, supported answers and hint use.'}${state.classDomain==='reading'?' Scroll horizontally to compare every individual skill; student names stay visible.':''}</p>${state.classDomain==='reading'&&state.classSection==='comprehension'?readingGroupOverview(readingGroup(state.classReadingGroup),classStudents())+readingContextNote():''}</section></section>
      ${['overall','reading'].includes(state.classDomain)?renderNextSteps():''}<section class="card recent-class-evidence"><h2>Recent learning evidence</h2><p class="small-copy">Explore the questions and responses behind ${overall?'the student profiles':scope.toLowerCase()+' skills'}.</p><div class="recent-evidence-grid">${classStudents().slice(0,3).map((student,index)=>{const records=student.evidence.filter(record=>axes.some(axis=>axis.domain?groupForSkill(record.skillId)?.domain===axis.domain:record.skillId===axis.id));const record=overall?records.at(-1):records.filter(record=>record.skillId===axes[index%axes.length].id).at(-1);return record?evidenceLink(student,record):'<p class="empty-state">No evidence yet</p>';}).join('')}</div></section>`;
    document.querySelector('#sort-students').value=state.sort;
    renderRows();
  }
  function renderNextSteps(){
    const scoped=state.classDomain==='reading',plan=D.readingPlan(classStudents(),scoped?classAxes().map(axis=>axis.id):D.reading),whole=plan.wholeClass;
    const learners=members=>members.map(member=>`<button class="learner-evidence-chip" type="button" data-evidence="${member.skillId}" data-learner="${member.student.id}">${escape(member.student.name.split(' ')[0])} · ${member.stats.score}%</button>`).join('');
    return `<section class="card support-card class-next-steps" aria-labelledby="next-steps-title"><div class="card-heading"><div><h2 id="next-steps-title">Suggested next steps</h2><p>${scoped?`Based on recorded responses in ${escape(state.classSection==='foundations'?'Reading Foundations':readingGroup(state.classReadingGroup).name)}.`:`Based on ${escape(currentClass().name)}’s four assessed reading focus skills.`}</p></div><span class="planning-label">Reading focus</span></div>
      ${whole?`<article class="whole-class-plan" data-plan-skill="${whole.id}"><div class="eyebrow">WHOLE CLASS</div><h3>${escape(whole.name)}</h3><p class="plan-basis"><strong>${whole.belowPractice.length} of ${whole.members.length} learners below ${plan.practiceThreshold}%</strong> · Class result ${whole.stats.score}% (${whole.stats.correct}/${whole.stats.attempts} correct responses).</p><div class="lesson-steps">${[['Model',whole.model],['Practise together',whole.practice],['Check independently',whole.check]].map(([title,copy],i)=>`<div><span class="lesson-step-number" aria-hidden="true">${i+1}</span><h4>${title}</h4><p>${escape(copy)}</p></div>`).join('')}</div><button class="text-button" type="button" data-review-class-skill="${whole.id}">Review ${escape(whole.label.toLowerCase())} evidence across the class →</button></article>`:'<p class="empty-state">No shared whole-class teaching priority yet. Review individual evidence before choosing a class lesson.</p>'}
      <div class="intervention-grid"><section aria-labelledby="small-group-title"><h3 id="small-group-title">Small-group practice</h3><p class="small-copy">Target a shared skill after the class lesson.</p>${plan.smallGroups.map(group=>`<article class="group-intervention" data-group-skill="${group.id}"><h4>${escape(group.name)}</h4><div class="learner-evidence-chips">${learners(group.belowPractice.map(member=>({...member,skillId:group.id})))}</div><p>${escape(group.intervention)}</p><p class="intervention-check">Finish with a new response without a hint.</p></article>`).join('')||'<p class="small-copy">No additional shared skill below the practice threshold.</p>'}</section>
      <section aria-labelledby="individual-title"><h3 id="individual-title">Individual check-ins</h3><p class="small-copy">Start with each learner’s lowest reading skill below ${plan.individualThreshold}%.</p>${plan.individuals.map(member=>`<article class="individual-intervention" data-individual="${member.student.id}"><button class="individual-evidence-link" type="button" data-evidence="${member.skill.id}" data-learner="${member.student.id}"><strong>${escape(member.student.name)}</strong><span>${escape(member.skill.label)} · ${member.stats.score}% <span aria-hidden="true">→</span></span></button><p>${escape(member.skill.intervention)}</p><p class="intervention-evidence">Independent: ${member.independent.correct}/${member.independent.attempts} correct · Supported: ${member.supported.correct}/${member.supported.attempts} correct · ${member.stats.hints} answers with a hint.</p></article>`).join('')||'<p class="small-copy">No learner has a reading skill below the individual check-in threshold.</p>'}</section></div><p class="planning-note">Practice groups use results below ${plan.practiceThreshold}%; check-ins use each learner’s lowest skill below ${plan.individualThreshold}%. These are planning cues. Confirm the need with a fresh independent response and review the support used.</p></section>`;
  }
  function compactEvidence(student,skillId){
    const stats=D.skillStats(student,skillId);
    if(!stats.attempts)return `<div class="compact-evidence"><p class="no-evidence">No evidence yet</p><p class="small-copy">This skill has not been assessed yet.</p><button class="text-button" type="button" data-evidence="${skillId}" data-learner="${student.id}">View skill →</button></div>`;
    const latest=student.evidence.filter(r=>r.skillId===skillId).at(-1);
    return `<div class="compact-evidence"><p class="evidence-counts"><strong>${stats.correct}/${stats.attempts}</strong> correct · ${stats.hints} hints</p><p class="evidence-support">${stats.independent} independent · ${stats.supported} supported</p>${latest?`<p class="latest-response"><strong>Week ${latest.week} · ${latest.correct?'Correct':'Try again'} · ${latest.supported?'Supported':'Independent'}</strong><span>${escape(latest.response)}</span></p>`:'<p class="no-evidence">No evidence yet</p>'}<button class="text-button" type="button" data-evidence="${skillId}" data-learner="${student.id}">View questions and responses →</button></div>`;
  }
  function compactDomain(student,axis){
    const stats=D.domainStats(student,axis.domain),open=state.expandedSubjects.has(`${student.id}:${axis.domain}`),evidenceId=`subject-evidence-${student.id}-${axis.domain}`;
    return `<div class="compact-evidence"><p class="evidence-counts"><strong>${stats.correct}/${stats.attempts}</strong> correct · ${stats.hints} hints</p><p class="evidence-support">${stats.independent} independent · ${stats.supported} supported</p><p class="small-copy">${axis.domain==='reading'?'Includes Foundations and Comprehension.':'Based on assessed '+axis.label.toLowerCase()+' skills.'}</p><button class="text-button" type="button" data-expand-subject="${axis.domain}" data-learner="${student.id}" aria-expanded="${open}" aria-controls="${evidenceId}" aria-label="${open?'Hide':'Show'} all ${axis.label.toLowerCase()} evidence for ${escape(student.name)}">${open?'Hide':'Explore'} ${axis.label.toLowerCase()} skills ${open?'↑':'→'}</button><div class="subject-evidence" id="${evidenceId}" role="region" aria-label="${escape(student.name)} · ${axis.label} skills and responses" ${open?'':'hidden'}>${open?subjectEvidence(student,axis.domain):''}</div></div>`;
  }
  function rememberSubjectSkills(){
    root.querySelectorAll('.subject-evidence-skill').forEach(details=>{
      if(details.open)state.expandedSubjectSkills.add(details.dataset.subjectSkill);
      else state.expandedSubjectSkills.delete(details.dataset.subjectSkill);
    });
  }
  function subjectEvidence(student,domain){
    const groups=domain==='reading'?[...D.groups.filter(group=>group.domain==='reading'&&group.section==='foundations'),...D.readingCatalogue]:D.groups.filter(group=>group.domain===domain),sections=D.domains[domain].sections||[{id:null,name:D.domains[domain].name+' skills'}];
    const assessed=groups.flatMap(group=>group.skills).filter(skill=>D.skillStats(student,skill.id).attempts);
    if(!assessed.length)return '<p class="no-evidence">No evidence yet</p>';
    return `<p class="subject-evidence-intro">${assessed.length} assessed skills · ${D.domainStats(student,domain).attempts} responses. Expand a skill to review all its responses.</p>${sections.map(section=>{
      const collected=groups.filter(group=>group.section===section.id).map(group=>{
        const skills=group.skills.filter(skill=>D.skillStats(student,skill.id).attempts);
        return skills.length?`<div class="subject-evidence-group"><h4>${escape(group.name)}</h4>${skills.map(skill=>{
          const stats=D.skillStats(student,skill.id),sample=D.samples[skill.id],key=`${student.id}:${skill.id}`;
          const records=student.evidence.filter(record=>record.skillId===skill.id).slice().sort((a,b)=>b.week-a.week||b.day-a.day);
          return `<details class="subject-evidence-skill" data-subject-skill="${key}" ${state.expandedSubjectSkills.has(key)?'open':''}><summary><strong>${escape(skill.name)}</strong><span>${stats.correct}/${stats.attempts} correct · ${stats.hints} hints</span></summary><p class="evidence-support">${stats.independent} independent · ${stats.supported} supported</p><div class="subject-question"><strong>${escape(sample.title)}</strong><p>${escape(sample.prompt)}</p><p><strong>Example response:</strong> ${escape(sample.answer)}</p></div><div class="subject-response-history" role="region" aria-label="All ${records.length} responses for ${escape(student.name)}: ${escape(skill.name)}" tabindex="0">${records.map(record=>`<article class="subject-response" data-response-id="${escape(record.id)}"><h5>Week ${record.week} · Attempt ${(record.week-1)*5+record.day}</h5><p class="subject-response-meta">${record.correct?'Correct':'Try again'} · ${record.supported?'Supported':'Independent'} · ${record.hint?'Hint used':'No hint used'}</p><p><strong>Response:</strong> ${escape(record.response)}</p>${record.hint?`<p class="subject-hint"><strong>Hint shown:</strong> ${escape(sample.hint)}</p>`:''}</article>`).join('')}</div></details>`;
        }).join('')}</div>`:'';
      }).join('');
      return collected?`<section class="subject-evidence-section"><h3>${escape(section.name)}</h3>${collected}</section>`:'';
    }).join('')}`;
  }
  function renderRows(){
    rememberSubjectSkills();
    const axes=classAxes(),expanded=axes.some(axis=>axis.id===state.expandedSkill),overall=state.classDomain==='overall';
    const comparison=student=>axes.map(axis=>({axis,stats:axisStats(student,axis)}));
    const compact=(student,axis)=>axis.domain?compactDomain(student,axis):compactEvidence(student,axis.id);
    const table=document.querySelector('.class-table');
    table.style.setProperty('--comparison-width',`${state.classDomain==='reading'&&state.classSection==='comprehension'&&state.classReadingGroup==='overview'?1992:930+Math.max(0,axes.length-4)*160}px`);
    document.querySelector('#skill-columns').innerHTML=`<col class="row-number-column"><col class="student-name-column">${axes.map(()=>'<col>').join('')}`;
    document.querySelector('#skill-headings').innerHTML=`<tr><th class="row-number-heading" scope="col">#</th><th class="student-heading" scope="col">Student</th>${axes.map(axis=>`<th scope="col"><button class="skill-heading" type="button" data-expand-skill="${axis.id}" aria-expanded="${state.expandedSkill===axis.id}" aria-controls="student-rows" aria-label="${state.expandedSkill===axis.id?'Hide':'Show'} ${escape(axis.label)} evidence across the class"><span class="skill-heading-label">${escape(axis.label)}</span><span class="heading-evidence-action"><span class="expand-icon" aria-hidden="true">${state.expandedSkill===axis.id?'−':'+'}</span>${state.expandedSkill===axis.id?'Hide evidence':'Show evidence'}</span></button></th>`).join('')}</tr>`;
    const students=classStudents().filter(student=>student.name.toLowerCase().includes(state.search.toLowerCase())).slice().sort((a,b)=>(state.sort==='support'?practicePriority(a)-practicePriority(b):0)||a.name.localeCompare(b.name));
    document.querySelector('#student-rows').innerHTML=students.map((student,rowIndex)=>{
      const open=state.expandedStudent===student.id;
      const evidenceIds=axes.map(axis=>`student-evidence-${student.id}-${axis.id}`).join(' ');
      const cells=comparison(student).map(({axis,stats})=>{
        const score=stats.score,evidenceId=`student-evidence-${student.id}-${axis.id}`,axisOpen=state.expandedSkill===axis.id,showEvidence=open||axisOpen;
        return `<td class="student-skill-cell ${axisOpen?'expanded-skill-cell':''}" data-axis="${axis.id}"><button class="score-cell ${preferences.classView==='heatmap'?'heat-cell '+(score===null?'heat-empty':score<50?'heat-low':score<70?'heat-mid':'heat-high'):''}" type="button" ${axis.domain?`data-student="${student.id}" data-profile-domain="${axis.domain}"`:`data-evidence="${axis.id}"`} data-learner="${student.id}" aria-label="${escape(student.name)}, ${escape(axis.label)}: ${score===null?'No evidence yet':score+' percent'}. ${overall?'Explore subject':'View evidence'}">${preferences.classView==='heatmap'?`<strong>${score===null?'No evidence yet':score+'%'}</strong><span>${overall?'Explore subject':'View evidence'} →</span>`:hp(score,axis.label)}</button><div class="student-skill-evidence" id="${evidenceId}" aria-label="${escape(student.name)} · ${escape(axis.label)} evidence" ${showEvidence?'':'hidden'}>${showEvidence?compact(student,axis):''}</div></td>`;
      }).join('');
      return `<tr data-student="${student.id}" class="${student.id===state.student?'current-learner':''} ${open?'expanded-learner':''} ${open||expanded?'evidence-learner':''}"><td class="row-number">${rowIndex+1}</td><th scope="row" class="student-name-cell"><div class="learner">${avatar(student)}<div><button class="profile-link learner-profile" type="button" data-student="${student.id}" aria-label="View ${escape(student.name)}’s profile"><strong class="learner-name">${escape(student.name)}</strong><span class="profile-cue">(Click to view profile)</span></button><button class="name-button learner-evidence-toggle" data-expand-student="${student.id}" aria-expanded="${open}" aria-controls="${evidenceIds}" aria-label="${open?'Hide':'Show'} skill evidence for ${escape(student.name)}" type="button"><span class="expand-icon" aria-hidden="true">${open?'−':'+'}</span><span>${open?'Hide skill evidence':'Show skill evidence'}</span></button></div></div></th>${cells}</tr>`;
    }).join('');
    document.querySelector('#empty-class').hidden=students.length>0;
    syncScrollControls();
  }
  function syncScrollControls(){
    const scroll=root.querySelector('.table-scroll');if(!scroll)return;
    const jump=root.querySelector('.skill-scroll-jump');if(!jump)return;
    const wrap=scroll.closest('.comparison-scroll-wrap');
    // Compare with the full wrapper width before reserving space for the arrow.
    // Remove the gutter again when a wider viewport can fit every column.
    wrap.classList.toggle('has-horizontal-scroll',scroll.scrollWidth>wrap.clientWidth+1);
    const maximum=scroll.scrollWidth-scroll.clientWidth,box=scroll.getBoundingClientRect();
    const columnLabel=state.classDomain==='overall'?'subjects':`${profileDomains[state.classDomain].name.toLowerCase()} skills`;
    const guide=root.querySelector('.comparison-scroll-guide');
    if(guide)guide.textContent=`${classAxes().length} ${columnLabel}${maximum>1?' · Use the large arrow or scroll sideways to see every column.':''}`;
    const visibleTop=Math.max(12,box.top),visibleBottom=Math.min(innerHeight-12,box.bottom);
    jump.hidden=maximum<=1||visibleBottom-visibleTop<96;
    const atEnd=scroll.scrollLeft>=maximum-1;
    jump.dataset.scrollSkills=atEnd?'start':'end';
    const label=`Show ${atEnd?'first':'remaining'} ${columnLabel}`;
    jump.setAttribute('aria-label',label);jump.title=label;
    jump.style.top=`${(visibleTop+visibleBottom)/2-box.top-jump.offsetHeight/2}px`;
  }
  function scrollSkills(direction){
    const scroll=root.querySelector('.table-scroll');if(!scroll)return;
    scroll.scrollTo({left:direction==='start'?0:scroll.scrollWidth-scroll.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function reviewClassSkill(id){
    const source=groupForSkill(id),category=D.readingCatalogue.find(group=>group.skills.some(skill=>skill.id===id));
    const section=source?.section==='foundations'?'foundations':'comprehension',key=state.classReadingGroup==='overview'&&D.profileAxes.reading.some(axis=>axis.id===id)?'overview':category?.key||state.classReadingGroup;
    state.expandedSkill=id;
    if(state.classDomain!=='reading'||state.classSection!==section||(section==='comprehension'&&state.classReadingGroup!==key)){state.pendingClassReview=id;goClass('reading',section,key);return;}
    renderRows();markSelectedSkill();
    root.querySelector(`.skill-heading[data-expand-skill="${id}"]`)?.focus({preventScroll:true});
    document.querySelector('.table-scroll').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function toggleClassExpansion(kind,id){
    const key=kind==='skill'?'expandedSkill':'expandedStudent';
    state[key]=state[key]===id?null:id;
    if(kind==='student')state.student=id;
    renderRows();markSelectedSkill();
    const selector=kind==='skill'?`[data-expand-skill="${id}"]`:`.name-button[data-expand-student="${id}"]`;
    root.querySelector(selector)?.focus({preventScroll:true});
  }
  function toggleSubjectEvidence(studentId,domain){
    if(!D.domains[domain])return;
    const key=`${studentId}:${domain}`;
    if(state.expandedSubjects.has(key))state.expandedSubjects.delete(key);else state.expandedSubjects.add(key);
    state.student=studentId;renderRows();markSelectedSkill();
    root.querySelector(`[data-expand-subject="${domain}"][data-learner="${studentId}"]`)?.focus({preventScroll:true});
  }
  function evidenceLink(student,record){
    return `<button class="evidence-link" type="button" data-evidence="${escape(record.skillId)}" data-learner="${student.id}">${avatar(student)}<div><strong>${escape(student.name)} · ${escape(D.samples[record.skillId].title)}</strong><p>${record.supported?'Supported answer':'Independent answer'}${record.hint?' · Hint used':''} · Week ${record.week}</p></div><span class="arrow" aria-hidden="true">→</span></button>`;
  }
  function profileSkills(groups){
    if(state.domain==='overall')return Object.entries(D.domains).map(([domain,info])=>({id:domain,domain,label:info.name}));
    if(state.domain==='reading'&&state.section==='comprehension'&&state.readingGroup==='overview')return D.profileAxes.reading;
    if(state.domain==='reading'&&state.section==='comprehension')return groups.flatMap(group=>group.skills).filter(skill=>D.skillStats(studentById(state.student),skill.id).attempts).map(skill=>({id:skill.id,label:readingLabel(skill)}));
    const ids=new Set(groups.flatMap(group=>group.skills.map(skill=>skill.id)));
    return (D.profileAxes[state.domain]||[]).filter(axis=>ids.has(axis.id));
  }
  const axisStats=(student,axis)=>axis.domain?D.domainStats(student,axis.domain):D.skillStats(student,axis.id);
  const axisAction=(student,axis)=>axis.domain?`data-domain="${axis.domain}"`:`data-evidence="${axis.id}" data-learner="${student.id}"`;
  function canShowRadar(student,groups){
    return profileSkills(groups).filter(axis=>axisStats(student,axis).score!==null).length>=3;
  }
  function summaryChart(student,groups){
    const axes=profileSkills(groups);
    if(state.domain==='reading'&&state.section==='comprehension'&&!axes.length)return '<div class="empty-state"><h3>No evidence yet</h3><p>No skills in this group have recorded responses. Explore the individual skill catalogue below.</p></div>';
    if(preferences[chartPreference()]==='radar'&&canShowRadar(student,groups)){
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
      return `<div class="radar-stage"><svg class="radar" viewBox="0 0 560 430" role="group" aria-label="${escape(profileDomains[state.domain].name)} profile. ${state.domain==='overall'?'Select a subject to explore its skills.':'Select a labelled skill point or the buttons below for evidence.'}"><title>${escape(student.name)} · ${escape(profileDomains[state.domain].name)} progress</title>${[.25,.5,.75,1].map(n=>`<polygon class="radar-grid" points="${polygon(radius*n)}"/>`).join('')}${axes.map((axis,i)=>{const end=point(i,radius);return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}"/>`;}).join('')}${areas}${axes.map((axis,i)=>{
        const score=scores[i],dot=point(i,radius*(score??100)/100),label=point(i,radius+42),lines=labelLines(axis.label);
        return `<g class="radar-target" role="button" tabindex="0" ${axisAction(student,axis)} aria-label="${escape(axis.label)}: ${score===null?'No evidence yet':score+' percent'}. ${axis.domain?'Explore subject':'View evidence'}"><circle class="radar-hit" cx="${dot[0]}" cy="${dot[1]}" r="17"/><circle class="radar-point ${score===null?'unassessed-point':''}" cx="${dot[0]}" cy="${dot[1]}" r="5"/><text class="radar-label" x="${label[0]}" y="${label[1]}" text-anchor="middle">${lines.map((line,n)=>`<tspan x="${label[0]}" dy="${n?14:-(lines.length-1)*7}">${escape(line)}</tspan>`).join('')}</text></g>`;
      }).join('')}<text class="radar-scale" x="${cx+8}" y="${cy-radius-7}">100%</text><text class="radar-scale" x="${cx+8}" y="${cy-radius*.5-5}">50%</text></svg><div class="radar-portrait">${avatar(student,true)}</div></div><div class="radar-skills">${axes.map(axis=>{const stats=axisStats(student,axis);return `<button type="button" ${axisAction(student,axis)}><span>${escape(axis.label)}</span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong></button>`;}).join('')}</div>`;
    }
    // Progress Bars use the same axes and response records as Radar.
    const skills=axes.length?axes:groups.flatMap(group=>group.skills.map(skill=>({id:skill.id,label:skill.name})));
    return skills.map(axis=>{const stats=axisStats(student,axis);return `<button class="skill-row" ${axisAction(student,axis)} type="button"><div class="skill-meta"><strong>${escape(axis.label)}</strong><small>${stats.attempts?stats.attempts+' responses':'No evidence yet'}</small></div>${hp(stats.score,axis.label)}</button>`;}).join('');
  }
  function progressChart(records){
    const values=Array.from({length:4},(_,i)=>{
      const upto=records.filter(r=>r.week<=i+1);
      const independent=D.summarize(upto.filter(r=>!r.supported)),supported=D.summarize(upto.filter(r=>r.supported));
      return {week:i+1,independent:independent.score,supported:supported.score};
    });
    const x=i=>50+i*150,y=v=>188-v*1.5;
    const line=type=>values.filter(v=>v[type]!==null).map(v=>`${x(v.week-1)},${y(v[type])}`).join(' ');
    return `<svg class="progress-chart" viewBox="0 0 550 225" role="img" aria-label="Cumulative independent and supported accuracy across four weeks; exact values available below"><title>Practice progress, cumulative correct answers</title>${[0,25,50,75,100].map(n=>`<line class="progress-grid" x1="50" y1="${y(n)}" x2="510" y2="${y(n)}"/><text class="progress-label" x="38" y="${y(n)+4}" text-anchor="end">${n}</text>`).join('')}<polyline class="progress-line independent" points="${line('independent')}"/><polyline class="progress-line supported" points="${line('supported')}"/>${values.map(v=>`<text class="progress-label" x="${x(v.week-1)}" y="214" text-anchor="middle">Week ${v.week}</text>${['independent','supported'].map(type=>v[type]===null?'':`<circle class="progress-dot" cx="${x(v.week-1)}" cy="${y(v[type])}" r="5" fill="${type==='independent'?'#1680e8':'#ff6b27'}"/>`).join('')}`).join('')}</svg>
      <details class="chart-values"><summary>View chart values</summary><table><thead><tr><th scope="col">Week</th><th scope="col">Independent</th><th scope="col">Supported</th></tr></thead><tbody>${values.map(v=>`<tr><th scope="row">Week ${v.week}</th><td>${v.independent===null?'No evidence':v.independent+'%'}</td><td>${v.supported===null?'No evidence':v.supported+'%'}</td></tr>`).join('')}</tbody></table></details>`;
  }
  function curriculum(student,groups){
    const catalogue=state.domain==='reading'&&state.section==='comprehension';
    return `<section class="card curriculum-card ${catalogue?'reading-catalogue':''}"><div class="card-heading"><div><h2>${catalogue?'Individual skill catalogue':'Explore the skill groups'}</h2><p>${catalogue?'Every skill in this group remains available, including those without responses.':'Expand a group, then choose an individual skill to view its learning evidence.'}</p></div><span class="curriculum-count">${groups.flatMap(g=>g.skills).filter(s=>D.skillStats(student,s.id).attempts).length} of ${groups.flatMap(g=>g.skills).length} skills assessed</span></div><div class="curriculum-groups">${groups.map(g=>{const stats=D.groupStats(student,g),measured=g.skills.filter(s=>D.skillStats(student,s.id).attempts).length;return `<details class="skill-group" id="group-${g.key}" ${catalogue?'open':''}><summary><span><strong>${escape(g.name)}</strong><small>${measured}/${g.skills.length} individual skills assessed</small></span>${catalogue?'':`<span class="group-score ${stats.score===null?'unassessed':''}">${stats.score===null?'No evidence yet':stats.score+'%'}</span>`}</summary><div class="individual-skills">${g.skills.map(s=>{const stat=D.skillStats(student,s.id);return `<button type="button" class="individual-skill" data-evidence="${s.id}" data-learner="${student.id}"><strong>${escape(s.name)}</strong><span class="skill-id">${s.id}</span>${hp(stat.score,s.name)}<span class="individual-action">${stat.attempts?stat.attempts+' responses · View evidence →':'No responses · View skill →'}</span></button>`;}).join('')}</div></details>`;}).join('')}</div><p class="score-note">${catalogue?'The five navigation groups organise 39 comprehension skills. Skills retain their own evidence; a group is not given a combined achievement stage.':'Coverage scaffold informed by your supplied Grade 5 lists.'} CCSS references are available where reviewed. Unassessed skills are excluded from scores.</p>${catalogue?readingContextNote():''}</section>`;
  }
  function domainOverview(student){
    return `<section class="card curriculum-card"><div class="card-heading"><div><h2>Explore the subjects</h2><p>Choose a subject, then expand a skill group to explore individual skills and learning evidence.</p></div></div><div class="curriculum-groups">${Object.entries(D.domains).map(([domain,info])=>{const stats=D.domainStats(student,domain),skills=domain==='reading'?D.readingSkills():D.groups.filter(group=>group.domain===domain).flatMap(group=>group.skills);return `<button class="individual-skill domain-overview" type="button" data-domain="${domain}"><strong>${info.name}</strong><p class="small-copy">${domain==='reading'?'Reading Foundations and Reading Comprehension':info.name+' skill groups'}</p>${hp(stats.score,info.name)}<span class="individual-action">${skills.filter(skill=>D.skillStats(student,skill.id).attempts).length}/${skills.length} skills assessed · Explore subject →</span></button>`;}).join('')}</div><p class="score-note">Subject scores use correct responses ÷ attempts across assessed skills. Reading includes Foundations and Comprehension. Unassessed skills are excluded.</p></section>`;
  }
  function glowsAndGrows(student,groups){
    const overall=state.domain==='overall',catalogue=state.domain==='reading'&&state.section==='comprehension';
    const choices=(overall?Object.entries(D.domains).map(([id,info])=>({id,name:info.name,stats:D.domainStats(student,id)})):catalogue?groups.flatMap(group=>group.skills.map(skill=>({id:skill.id,name:readingLabel(skill),skill,stats:D.skillStats(student,skill.id)}))):groups.map(group=>({id:group.id,name:group.name,group,stats:D.groupStats(student,group)}))).filter(choice=>choice.stats.attempts);
    const ranked=choices.sort((a,b)=>a.stats.score-b.stats.score||a.id.localeCompare(b.id));
    const glow=ranked.at(-1),grow=ranked[0];
    const icon=kind=>kind==='glow'?`<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 5l4.4 10.6L36 20l-11.6 4.4L20 35l-4.4-10.6L4 20l11.6-4.4z" fill="currentColor"/><path d="M33 3v7M29.5 6.5h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`:`<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="18" cy="22" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="18" cy="22" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="18" cy="22" r="2.5" fill="currentColor"/><path d="M18 22L33 7m-1-4v6h6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return ['glow','grow'].map(kind=>{
      const choice=kind==='glow'?glow:grow;
      let action='';
      if(choice){
        if(kind==='glow')action=choice.stats.score>=70?'A strength to celebrate in the assessed skills.':'Progress to build on in the assessed skills.';
        else if(choice.stats.score===100)action='Try a fresh independent challenge to extend this strength.';
        else if(overall)action='Choose one skill in this subject, practise it together, then check a fresh response independently.';
        else{
          const skill=choice.skill||choice.group.skills.filter(skill=>D.skillStats(student,skill.id).attempts).sort((a,b)=>D.skillStats(student,a.id).score-D.skillStats(student,b.id).score)[0];
          action=`Start with this cue: ${D.samples[skill.id].hint} Then check a fresh response independently.`;
        }
      }
      return `<article class="growth-item ${kind}" data-focus="${choice?.id||''}"><span class="growth-icon">${icon(kind)}</span><div><div class="growth-label">${kind==='glow'?'Glows':'Grows'}</div><h3>${choice?escape(choice.name):'No evidence yet'}</h3>${choice?`<p class="growth-result"><strong>${choice.stats.score}% correct</strong> · ${choice.stats.correct}/${choice.stats.attempts} responses</p><p>${escape(action)}</p><button class="text-button" type="button" ${overall?`data-domain="${choice.id}"`:catalogue?`data-evidence="${choice.id}" data-learner="${student.id}"`:`data-open-group="${choice.id}"`}>${kind==='glow'?'Explore this strength':'Explore this target'} →</button>`:`<p>${kind==='glow'?'Collect a response to identify a strength.':'Collect a response before choosing a practice target.'}</p>`}</div></article>`;
    }).join('');
  }
  function renderProfile(){
    rememberSubjectSkills();
    const student=studentById(state.student),groups=currentGroups(),records=scopedRecords(student),stats=D.summarize(records);
    const assessedGroups=groups.filter(g=>D.groupStats(student,g).attempts>0),canRadar=canShowRadar(student,groups);
    const overall=state.domain==='overall',catalogue=state.domain==='reading'&&state.section==='comprehension',view=preferences[chartPreference()];
    const label=state.domain==='reading'?(state.section==='foundations'?'Reading Foundations':readingGroup(state.readingGroup).name):profileDomains[state.domain].name;
    root.innerHTML=`<header class="page-heading profile-heading"><div class="profile-id">${avatar(student,true)}<div><div class="eyebrow">${escape(currentClass().name.toUpperCase())} / STUDENT PROFILE</div><h1>${escape(student.name)}</h1><p class="subtitle">Grade 5 · Viking Quest</p></div></div><div class="profile-actions"><div class="header-controls-slot"></div><div class="profile-navigation"><label class="field">Switch learner<select id="switch-student">${classStudents().map(s=>`<option value="${s.id}" ${s.id===student.id?'selected':''}>${s.name}</option>`).join('')}</select></label><button class="button" type="button" data-back-class>← Back to class</button></div></div></header>
      <div class="category-tabs" role="tablist" aria-label="Learning domains">${Object.entries(profileDomains).map(([key,d])=>`<button id="tab-${key}" type="button" role="tab" aria-controls="domain-panel" aria-selected="${state.domain===key}" tabindex="${state.domain===key?'0':'-1'}" data-domain="${key}">${d.name}</button>`).join('')}</div>
      <section id="domain-panel" role="tabpanel" aria-labelledby="tab-${state.domain}">${state.domain==='reading'?readingNavigation([student])+(catalogue?readingGroupOverview(readingGroup(state.readingGroup),[student]):''):''}
      <div class="profile-grid"><section class="card"><div class="card-heading"><div><h2>${label} profile</h2><p>${overall?'Four subjects · Select a subject to explore its skills':'Individual skills · Select a skill to see its evidence'}</p></div><div class="chart-toggle" role="group" aria-label="Student data view"><button type="button" data-mode="bars" aria-pressed="${view==='bars'||!canRadar}">Progress Bars</button><button type="button" data-mode="radar" aria-pressed="${view==='radar'&&canRadar}" ${!canRadar?`disabled title="A radar chart needs at least three assessed ${overall?'subjects':'skills'}"`:''}>Radar chart</button></div></div><div class="profile-summary"><span>${catalogue?'Assessment coverage':'Overall score'}</span><strong>${catalogue?groups.flatMap(g=>g.skills).filter(skill=>D.skillStats(student,skill.id).attempts).length+' of '+groups.flatMap(g=>g.skills).length+' skills':stats.score===null?'No evidence yet':stats.score+'%'}</strong></div><div id="skill-chart">${summaryChart(student,groups)}</div><p class="skill-action">${overall?'Select a subject point or progress bar to explore its skills.':catalogue&&!stats.attempts?'Choose an individual skill below to explore its coverage.':'Select a skill point or progress bar to view its evidence.'}</p><p class="score-note">${!canRadar?`A radar chart needs at least three assessed ${overall?'subjects':'skills'}. ${catalogue&&!stats.attempts?'Your saved chart choice stays the same.':'Showing progress bars here; your saved chart choice stays the same.'} `:''}${overall?'Subject scores use correct responses ÷ attempts. Reading includes Foundations and Comprehension. Unassessed skills are excluded.':catalogue?(state.readingGroup==='overview'?'The same eight focus skills appear in the class table. A missing result is marked No evidence yet.':'Charts show assessed individual skills. The catalogue below includes skills with no evidence.'):'Scores reflect correct responses across the assessed skills.'}</p></section>
      <div class="profile-insights">
      <section class="card progress-card"><div class="card-heading"><div><h2>Progress over four weeks</h2><p>Cumulative accuracy (%) ${overall?'across all four subjects':'for '+label.toLowerCase()}.</p></div></div><div class="legend"><span><i></i> Independent</span><span><i class="orange"></i> Supported</span></div>${progressChart(records)}<p class="score-note">Correct responses ÷ responses in each support type. </p></section>
      <section class="card support-card profile-next-card"><h2>Glows &amp; Grows</h2><div class="glows-grows">${glowsAndGrows(student,groups)}</div><div class="support-totals"><div class="support-total"><strong data-count="independent">${stats.independent}</strong><p>independent<br>answers</p></div><div class="support-total"><strong data-count="supported">${stats.supported}</strong><p>supported<br>answers</p></div><div class="support-total"><strong data-count="hints">${stats.hints}</strong><p>answers with<br>a hint</p></div></div><div class="support-meter" style="--independent:${stats.attempts?stats.independent/stats.attempts*100:0}%" aria-hidden="true"><span></span></div><p class="support-note">${stats.attempts} responses in this section. Hint use is part of supported answers, not an additional answer count.</p></section>
      </div>
      <section class="card"><h2>Latest learning evidence</h2><p class="small-copy">Choose a response to inspect the skill and challenge.</p>${assessedGroups.slice(0,3).map(g=>{const id=g.skills.find(s=>D.skillStats(student,s.id).attempts).id;const record=student.evidence.filter(r=>r.skillId===id).at(-1);return evidenceLink(student,record);}).join('')||'<p class="empty-state">No evidence yet</p>'}</section></div>${overall?domainOverview(student):curriculum(student,groups)}</section>`;
  }
  function showEvidence(studentId,skillId,opener){
    const student=studentById(studentId),group=groupForSkill(skillId);if(!group)return;
    const skill=group.skills.find(s=>s.id===skillId),stats=D.skillStats(student,skillId),mapping=D.mappings[skillId],sample=D.samples[skillId];
    // Include both a successful response and a retry when available, from the evidence records.
    const records=student.evidence.filter(r=>r.skillId===skillId).slice().reverse();
    const selection=[];if(records.length){selection.push(records[0]);const alternative=records.find(r=>r.correct!==records[0].correct);if(alternative)selection.push(alternative);}
    document.querySelector('#evidence-content').innerHTML=`<div class="eyebrow">${D.domains[group.domain].name}${group.section?' / '+D.domains.reading.sections.find(s=>s.id===group.section).name:''} / ${escape(group.name)}</div><h2 class="evidence-title" id="evidence-title">${escape(skill.name)}</h2><p class="small-copy">${escape(student.name)} · Learning evidence</p><p class="skill-id evidence-id">${skill.id}</p><div class="evidence-stat"><span><strong>${stats.attempts}</strong> responses</span><span><strong>${stats.score===null?'No evidence yet':stats.score+'%'}</strong> score</span><span><strong>${stats.hints}</strong> answers with a hint</span></div>
      <div class="standard">${mapping?`<a href="${mapping.source}#${mapping.code.replace('LITERACY','Literacy')}" target="_blank" rel="noopener noreferrer">${mapping.code}</a><p>${escape(mapping.description)}</p><p><strong>CCSS reference text checked.</strong> This challenge practices part of the standard; the score is not a mastery claim. The linked text is a published reference mirror.</p>`:'<strong>CCSS mapping not reviewed yet.</strong><p>This coverage skill has an EDUCADE ID but no verified standards alignment.</p>'}</div>
      ${selection.length?selection.map(r=>`<article class="attempt"><div class="attempt-heading"><strong>${escape(sample.title)}</strong><span>Week ${r.week} · Attempt ${(r.week-1)*5+r.day}</span></div><blockquote>${escape(sample.prompt)}</blockquote><dl><dt>Response</dt><dd>${escape(r.response)}</dd><dt>Example</dt><dd>${escape(sample.answer)}</dd></dl><div class="attempt-support"><span class="outcome ${r.correct?'':'retry'}">${r.correct?'Correct response':'Needs another try'}</span><span>${r.supported?'Supported':'Independent'}</span><span>${r.hint?'Hint used':'No hint used'}</span></div>${r.hint?`<p class="hint-copy"><strong>Hint shown:</strong> ${escape(sample.hint)}</p>`:''}</article>`).join(''):'<div class="empty-state"><h3>No evidence yet</h3><p>This skill has not been assessed yet.</p></div>'}`;
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
    preferences[chartPreference()]=mode;savePreferences();
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
    const [view,id,domain,section,key]=location.hash.slice(1).split('/');
    if(view==='student'){
      state.student=studentById(id).id;state.classId=D.classes.find(c=>c.studentIds.includes(state.student))?.id||state.classId;state.domain=profileDomains[domain]?domain:'overall';state.section=section==='foundations'?'foundations':'comprehension';if(state.domain==='reading'&&state.section==='comprehension')state.readingGroup=readingGroup(key||state.readingGroup).key;renderProfile();
    }else{state.classDomain=profileDomains[id]?id:'overall';if(state.classDomain==='reading'){state.classSection=domain==='foundations'?'foundations':'comprehension';if(state.classSection==='comprehension')state.classReadingGroup=readingGroup(section||state.classReadingGroup).key;}if(!classAxes().some(axis=>axis.id===state.expandedSkill))state.expandedSkill=null;renderClass();}
    root.querySelector('.header-controls-slot').append(controls);
    if(root.querySelector('.portrait-controls-slot'))root.querySelector('.portrait-controls-slot').append(portraitPicker);
    else controls.insertBefore(portraitPicker,controls.querySelector('.dashboard-menu'));
    document.querySelector('#class-select').value=state.classId;
    syncSidebar();
    markSelectedSkill();
    document.title=`${view==='student'?studentById(state.student).name+' · '+profileDomains[state.domain].name:'Teacher Dashboard · '+currentClass().name} · EDUCADE`;
    syncScrollControls();
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button,[data-evidence],[data-domain],tr[data-student]');if(!target)return;
    if(target.dataset.scrollSkills){scrollSkills(target.dataset.scrollSkills);return;}
    if(target.dataset.expandSkill){toggleClassExpansion('skill',target.dataset.expandSkill);return;}
    if(target.dataset.expandStudent){toggleClassExpansion('student',target.dataset.expandStudent);return;}
    if(target.dataset.expandSubject){toggleSubjectEvidence(target.dataset.learner,target.dataset.expandSubject);return;}
    if(target.matches('tr[data-student]')){if(!event.target.closest('.student-skill-evidence'))toggleClassExpansion('student',target.dataset.student);return;}
    if(target.dataset.evidence){showEvidence(target.dataset.learner,target.dataset.evidence,target);return;}
    if(target.dataset.reviewClassSkill){reviewClassSkill(target.dataset.reviewClassSkill);return;}
    if(target.dataset.classSection){nextFocus=`[data-class-section="${target.dataset.classSection}"]`;goClass('reading',target.dataset.classSection);return;}
    if(target.dataset.classReadingGroup){nextFocus=`[data-class-reading-group="${target.dataset.classReadingGroup}"]`;goClass('reading','comprehension',target.dataset.classReadingGroup);return;}
    if(target.dataset.readingGroup){nextFocus=`[data-reading-group="${target.dataset.readingGroup}"]`;goStudent(state.student,'reading','comprehension',target.dataset.readingGroup);return;}
    if(target.dataset.classDomain){nextFocus=`#class-tab-${target.dataset.classDomain}`;goClass(target.dataset.classDomain);return;}
    if(target.dataset.student){goStudent(target.dataset.student,target.dataset.profileDomain||'overall');return;}
    if(target.hasAttribute('data-back-class')){goClass();return;}
    if(target.dataset.domain){nextFocus=`#tab-${target.dataset.domain}`;goStudent(state.student,target.dataset.domain,target.matches('[role=tab]')?state.section:'comprehension');return;}
    if(target.dataset.section){nextFocus=`[data-section="${target.dataset.section}"]`;goStudent(state.student,'reading',target.dataset.section);return;}
    if(target.dataset.mode){setStudentView(target.dataset.mode);return;}
    if(target.dataset.classMode){setClassView(target.dataset.classMode);return;}
    if(target.dataset.openGroup){const group=groupSkills(target.dataset.openGroup),details=document.querySelector(`#group-${group.key}`);details.open=true;details.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});details.querySelector('.individual-skill').focus({preventScroll:true});}
  });
  root.addEventListener('scroll',event=>{if(event.target.matches('.table-scroll'))syncScrollControls();},true);
  window.addEventListener('resize',syncScrollControls);
  window.addEventListener('scroll',syncScrollControls,{passive:true});
  root.addEventListener('input',event=>{if(event.target.id==='search-students'){state.search=event.target.value;renderRows();markSelectedSkill();}});
  root.addEventListener('change',event=>{if(event.target.id==='sort-students'){state.sort=event.target.value;renderRows();markSelectedSkill();}if(event.target.id==='switch-student'){nextFocus='#switch-student';goStudent(event.target.value,state.domain,state.section);}});
  root.addEventListener('keydown',event=>{
    const point=event.target.closest('.radar-target');
    if(point&&['Enter',' '].includes(event.key)){event.preventDefault();if(point.dataset.domain){nextFocus=`#tab-${point.dataset.domain}`;goStudent(state.student,point.dataset.domain);}else showEvidence(point.dataset.learner,point.dataset.evidence,point);return;}
    const tab=event.target.closest('[role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const keys=Object.keys(profileDomains),isClass=Boolean(tab.dataset.classDomain),i=keys.indexOf(isClass?state.classDomain:state.domain),next=event.key==='Home'?0:event.key==='End'?keys.length-1:(i+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
    nextFocus=`#${isClass?'class-tab-':'tab-'}${keys[next]}`;
    if(isClass)goClass(keys[next]);else goStudent(state.student,keys[next],state.section);
  });
  const sidebarNav=document.querySelector('.sidebar-nav'),classesToggle=document.querySelector('#nav-class'),sidebarClasses=document.querySelector('#sidebar-classes');
  const chevron='<svg class="nav-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  document.querySelector('#sidebar-class-list').innerHTML=D.classes.map(c=>`<div class="sidebar-class" data-sidebar-class="${c.id}"><div class="sidebar-class-row"><button type="button" class="class-overview" data-class-overview="${c.id}" aria-label="Open ${escape(c.name)} overview"><span class="class-indicator" aria-hidden="true"></span>${escape(c.name)}</button><button type="button" class="class-menu-toggle" data-class-menu="${c.id}" aria-expanded="false" aria-controls="class-menu-${c.id}" aria-label="Show ${escape(c.name)} menu">${chevron}</button></div><div id="class-menu-${c.id}" class="class-submenu" hidden><button type="button" data-class-profiles="${c.id}">Student profiles</button><button type="button" data-class-settings="${c.id}">Settings</button></div></div>`).join('');
  function closeClasses(){sidebarClasses.hidden=true;classesToggle.setAttribute('aria-expanded','false');}
  if(matchMedia('(max-width:900px)').matches)closeClasses();
  function syncSidebar(){
    const profile=Boolean(root.querySelector('#domain-panel'));
    sidebarNav.querySelectorAll('[data-sidebar-class]').forEach(item=>{
      const selected=item.dataset.sidebarClass===state.classId;
      item.classList.toggle('is-current',selected);
      item.querySelector('[data-class-overview]').setAttribute('aria-current',selected&&!profile?'page':'false');
      item.querySelector('[data-class-profiles]').setAttribute('aria-current',selected&&profile?'page':'false');
    });
  }
  function changeClass(id){
    if(!D.classes.some(c=>c.id===id)||id===state.classId)return;
    state.classId=id;state.student=classStudents()[0].id;
    state.expandedStudent=null;state.expandedSkill=null;state.selectedSkill=null;state.search='';state.expandedSubjects.clear();state.expandedSubjectSkills.clear();
  }
  function showClass(id){
    changeClass(id);
    if(root.querySelector('.class-table'))parseRoute();else goClass();
  }
  classesToggle.addEventListener('click',()=>{
    sidebarClasses.hidden=!sidebarClasses.hidden;
    classesToggle.setAttribute('aria-expanded',String(!sidebarClasses.hidden));
  });
  sidebarNav.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button===classesToggle)return;
    if(button.dataset.classMenu){
      const submenu=document.querySelector(`#class-menu-${button.dataset.classMenu}`);
      submenu.hidden=!submenu.hidden;button.setAttribute('aria-expanded',String(!submenu.hidden));
      button.setAttribute('aria-label',`${submenu.hidden?'Show':'Hide'} ${D.classes.find(c=>c.id===button.dataset.classMenu).name} menu`);
      return;
    }
    if(button.dataset.classOverview){showClass(button.dataset.classOverview);if(matchMedia('(max-width:900px)').matches){closeClasses();classesToggle.focus();}return;}
    if(button.dataset.classProfiles){showClass(button.dataset.classProfiles);openUtility('profiles',button);return;}
    if(button.dataset.classSettings){showClass(button.dataset.classSettings);openUtility('settings',button,true);return;}
    if(button.dataset.classAction)openUtility(button.dataset.classAction,button);
  });
  sidebarNav.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const submenu=event.target.closest('.class-submenu');
    if(submenu){
      const toggle=sidebarNav.querySelector(`[aria-controls="${submenu.id}"]`);
      submenu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',`Show ${D.classes.find(c=>c.id===toggle.dataset.classMenu).name} menu`);toggle.focus();
    }else if(!sidebarClasses.hidden){closeClasses();classesToggle.focus();}
  });
  document.addEventListener('click',event=>{if(matchMedia('(max-width:900px)').matches&&!event.target.closest('.sidebar-nav,#utility-dialog'))closeClasses();});
  document.querySelector('#close-evidence').addEventListener('click',closeEvidence);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeEvidence();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeEvidence();}});
  const classSelect=document.querySelector('#class-select');
  classSelect.innerHTML=D.classes.map(c=>`<option value="${c.id}">${escape(c.name)}</option>`).join('');
  classSelect.addEventListener('change',()=>{
    if(!D.classes.some(c=>c.id===classSelect.value))return;
    showClass(classSelect.value);
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
  function closeUtility(){utilityDialog.close();(utilityOpener?.isConnected?utilityOpener:menuButton).focus({preventScroll:true});}
  function openUtility(panel,opener=menuButton,classSettings=false){
    utilityOpener=opener;
    closeMenu();
    document.querySelector('#utility-title').textContent=panel==='profiles'?`${currentClass().name} · Student profiles`:classSettings?`${currentClass().name} · Settings`:{settings:'Settings',help:'Dashboard help',account:'My Account',import:'Import class',create:'Create new class'}[panel];
    const content=document.querySelector('#utility-content');
    if(panel==='settings'){
      content.innerHTML=`${classSettings?`<p class="class-settings-summary">Grade 5 · ${classStudents().length} learners</p>`:''}<p class="small-copy">Choose how you see the learning. These display preferences apply across your dashboard and are saved in this browser.</p><div class="settings-fields"><label class="field">Portrait style<select data-setting="portrait"><option value="photos">Photos</option><option value="vikings">Viking avatars</option><option value="initials">Initials</option></select></label><label class="field">Class chart<select data-setting="classView"><option value="bars">Progress Bars</option><option value="heatmap">Class heatmap</option></select></label><label class="field">Overall chart<select data-setting="overallView"><option value="radar">Radar chart</option><option value="bars">Progress Bars</option></select></label><label class="field">Subject charts<select data-setting="studentView"><option value="radar">Radar chart</option><option value="bars">Progress Bars</option></select></label></div>`;
      content.querySelectorAll('[data-setting]').forEach(select=>select.value=preferences[select.dataset.setting]);
    }else if(panel==='profiles'){
      content.innerHTML=`<p class="small-copy">Choose a learner to view their profile and learning evidence.</p><div class="class-profile-list">${classStudents().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(student=>`<button type="button" class="class-profile-choice" data-open-profile="${student.id}">${avatar(student)}<strong>${escape(student.name)}</strong><span aria-hidden="true">→</span></button>`).join('')}</div>`;
    }else if(panel==='import'||panel==='create'){
      content.innerHTML=`<div class="help-copy"><h3>${panel==='import'?'Bring in your class roster':'Set up your next class'}</h3><p>${panel==='import'?'Import students from a roster rather than adding each learner individually.':'Create a class, then add learners and choose the year level and learning focus.'}</p><p class="class-setup-notice">${panel==='import'?'Roster imports':'Class creation'} will be available when teacher accounts are connected.</p></div>`;
    }else if(panel==='help'){
      content.innerHTML='<div class="help-copy"><h3>Explore the reading catalogue</h3><p>Choose Reading to compare the eight focus skills shown in student radars. Reading Foundations remains separate. The five catalogue groups provide every comprehension skill, with coverage, strengths and teaching priorities shown separately.</p><h3>Navigate class comparisons</h3><p>In any category, use the large arrow beside the visible rows to jump to the last columns; it then points left to return. The arrow sits outside the scores and responses, and appears only when the columns need horizontal scrolling.</p><h3>Explore a skill across the class</h3><p>Select + Show evidence in a skill heading. Responses appear directly beneath each learner’s score in that skill’s column.</p><h3>Explore one learner</h3><p>Select + Show skill evidence to expand the learner’s row. Select the learner’s name to open their profile.</p><h3>Look behind a percentage</h3><p>Select a progress bar, heatmap cell or radar point to read the question, response and support used.</p><h3>Switch your view</h3><p>Use the class and portrait menus above. Photos, game avatars and initials change presentation without changing results.</p></div>';
    }else content.innerHTML='<div class="help-copy"><h3>Teacher account</h3><p>There is no connected teacher account. School sign-in, class imports and account management will be available when secure account access is implemented.</p><p>Class imports and saved learning records are not connected yet.</p></div>';
    document.querySelector('#preference-status').hidden=panel!=='settings'||storageAvailable;
    utilityDialog.showModal();document.querySelector('#close-utility').focus();
  }
  menu.addEventListener('click',event=>{const action=event.target.closest('[data-utility]');if(action)openUtility(action.dataset.utility);});
  document.querySelector('#close-utility').addEventListener('click',closeUtility);
  utilityDialog.addEventListener('cancel',event=>{event.preventDefault();closeUtility();});
  utilityDialog.addEventListener('click',event=>{
    const choice=event.target.closest('[data-open-profile]');if(!choice)return;
    closeUtility();if(matchMedia('(max-width:900px)').matches)closeClasses();nextFocus='#tab-overall';goStudent(choice.dataset.openProfile);
  });
  utilityDialog.addEventListener('change',event=>{
    const setting=event.target.dataset.setting,value=event.target.value;
    if(setting==='portrait'){setPortrait(value);document.querySelector('#portrait-style').value=value;}
    if(setting==='classView'){preferences.classView=value;savePreferences();if(root.querySelector('.class-table'))setClassView(value);}
    if(['studentView','overallView'].includes(setting)){preferences[setting]=value;savePreferences();if(root.querySelector('#skill-chart')&&setting===chartPreference())setStudentView(value);}
  });
  const portraitSelect=document.querySelector('#portrait-style');
  for(const [style,sheet] of Object.entries(window.EDUCADE_PORTRAITS||{})){
    if(sheet.available){const option=portraitSelect.querySelector(`[value="${style}"]`);option.disabled=false;option.textContent=style==='photos'?'Photos':'Viking avatars';}
  }
  portraitSelect.value=preferences.portrait;
  portraitSelect.addEventListener('change',event=>setPortrait(event.target.value));
  savePreferences();
  addEventListener('hashchange',()=>{if(dialog.open)dialog.close();parseRoute();scrollTo(0,0);if(nextFocus){document.querySelector(nextFocus)?.focus({preventScroll:true});nextFocus=null;}if(state.pendingClassReview){const id=state.pendingClassReview;state.pendingClassReview=null;reviewClassSkill(id);}});parseRoute();
})();
