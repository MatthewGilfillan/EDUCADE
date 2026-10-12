/* Teacher judgments are separate from practice scores and standards mappings. */
(() => {
  'use strict';
  const D=window.EDUCADE_DEMO,key='educade.teacher.standards.v1';
  const levels={
    beginning:{name:'Beginning',description:'Important components are emerging; the learning goal is not yet demonstrated consistently.',next:'Model the skill and build the specific foundations.'},
    approaching:{name:'Approaching',description:'Some components are secure; the full learning goal remains inconsistent or depends on instructional prompts.',next:'Guide practice toward consistency, then check a fresh response.'},
    meeting:{name:'Meeting',description:'The learning goal is demonstrated consistently across suitable tasks and independently, with permitted accommodations.',next:'Consolidate and apply the skill in varied contexts.'},
    exceeding:{name:'Exceeding',description:'The learning goal is secure and the agreed extension criteria demonstrate greater depth, complexity or transfer.',next:'Extend depth or task complexity with a purposeful challenge.'}
  };
  const skills=new Set(D.groups.flatMap(group=>group.skills.map(skill=>skill.id)));
  let judgments={},storageAvailable=true;
  // Initial layout levels are deliberately independent of practice percentages.
  // They are replaced by a teacher review, rather than inferred from correctness.
  const initialLevels={
    alex:{reading:[0,1,0,1,1,0,1,0],writing:[0,1,0,1,0,1],grammar:[1,0,1,0,1,0],vocabulary:[1,1,0,1,0,1]},
    maya:{reading:[1,1,1,1,1,0,1,1],writing:[1,1,0,1,1,1],grammar:[1,1,1,0,1,1],vocabulary:[1,1,1,2,1,1]},
    leo:{reading:[0,0,1,0,1,0,0,1],writing:[0,1,0,0,0,1],grammar:[0,1,0,1,0,0],vocabulary:[1,0,0,1,0,1]},
    sofia:{reading:[1,1,1,1,2,1,1,1],writing:[1,1,1,1,0,1],grammar:[1,1,2,1,1,1],vocabulary:[1,1,0,1,1,1]},
    noah:{reading:[0,0,0,1,0,0,0,0],writing:[0,0,1,0,0,0],grammar:[0,0,0,1,0,0],vocabulary:[0,1,0,0,0,1]},
    ella:{reading:[1,1,0,1,1,0,1,0],writing:[0,1,0,1,0,1],grammar:[1,0,1,1,0,1],vocabulary:[0,1,1,0,1,1]},
    finn:{reading:[1,1,0,1,1,0,1,0],writing:[0,1,1,0,1,0],grammar:[1,0,1,0,1,1],vocabulary:[1,1,0,1,0,1]},
    amara:{reading:[1,1,1,1,1,1,1,0],writing:[1,1,1,0,1,1],grammar:[1,1,1,1,0,1],vocabulary:[1,1,1,1,1,1]},
    oliver:{reading:[0,1,0,1,0,1,0,1],writing:[1,0,1,0,1,0],grammar:[0,1,0,1,0,1],vocabulary:[1,0,1,0,1,0]}
  };
  function validate(studentId,skillId,entry){
    const student=D.students.find(learner=>learner.id===studentId);
    if(!student||!skills.has(skillId)||!D.skillStats(student,skillId).attempts||!Object.hasOwn(levels,entry?.level))return null;
    if(['meeting','exceeding'].includes(entry.level)&&(entry.consistent!==true||entry.independent!==true))return null;
    if(entry.level==='exceeding'&&(entry.extension!==true||!String(entry.note||'').trim()))return null;
    return {level:entry.level,consistent:entry.consistent===true,independent:entry.independent===true,extension:entry.extension===true,note:String(entry.note||'').trim().slice(0,500)};
  }
  try{
    const saved=JSON.parse(localStorage.getItem(key));
    if(saved?.version===1&&saved.judgments&&typeof saved.judgments==='object'){
      for(const [id,entry] of Object.entries(saved.judgments)){
        const [studentId,skillId]=id.split(':'),valid=validate(studentId,skillId,entry);
        if(valid)judgments[id]=valid;
        else if(entry===null&&D.students.some(student=>student.id===studentId)&&skills.has(skillId))judgments[id]=null;
      }
    }
  }catch{/* Invalid or unavailable browser storage must not create an achievement level. */}
  function get(studentId,skillId){return judgments[`${studentId}:${skillId}`]||null;}
  function display(studentId,skillId){
    const id=`${studentId}:${skillId}`;
    if(Object.hasOwn(judgments,id))return get(studentId,skillId);
    const student=D.students.find(learner=>learner.id===studentId);
    if(!student||!D.skillStats(student,skillId).attempts)return null;
    const group=D.groups.find(group=>group.skills.some(skill=>skill.id===skillId));
    if(!group)return null;
    const index=D.profileAxes[group.domain].findIndex(axis=>axis.id===skillId);
    const position=group.section==='foundations'?1:initialLevels[studentId]?.[group.domain]?.[index];
    return position===undefined?null:{level:Object.keys(levels)[position],source:'layout'};
  }
  function record(studentId,skillId,entry){
    if(!D.students.some(student=>student.id===studentId)||!skills.has(skillId))return false;
    if(!entry?.level)judgments[`${studentId}:${skillId}`]=null;
    else{
      const valid=validate(studentId,skillId,entry);if(!valid)return false;
      judgments[`${studentId}:${skillId}`]=valid;
    }
    try{localStorage.setItem(key,JSON.stringify({version:1,judgments}));storageAvailable=true;}
    catch{storageAvailable=false;}
    return true;
  }
  function summary(student,domain){
    const assessed=D.groups.filter(group=>group.domain===domain).flatMap(group=>group.skills).filter(skill=>D.skillStats(student,skill.id).attempts);
    const counts=Object.fromEntries(Object.keys(levels).map(level=>[level,0]));
    for(const skill of assessed){const judgment=display(student.id,skill.id);if(judgment)counts[judgment.level]++;}
    return {assessed:assessed.length,reviewed:assessed.filter(skill=>get(student.id,skill.id)).length,counts};
  }
  window.EDUCADE_STANDARDS={levels,get,display,record,summary,get storageAvailable(){return storageAvailable;}};
})();
