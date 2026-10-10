/* Curriculum metadata stays separate from EDUCADE skills and practice evidence.
   Candidate alignments are partial; no grade conversions or mastery claims. */
(() => {
  'use strict';
  const D=window.EDUCADE_DEMO;
  const frameworks={
    ccss:{name:'Common Core ELA',band:'Grade 5',source:'https://www.thecorestandards.org/ELA-Literacy/'},
    england:{name:'National Curriculum for England',band:'Upper KS2 · Years 5–6',source:'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study'},
    australia:{name:'Australian Curriculum English · v9.0',band:'Year 5 · Candidate links',source:'https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/english'},
    cambridge:{name:'Cambridge Primary English (0058)',band:'Stage 5 · Objective review pending',source:'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/curriculum/english/'}
  };
  const england={
    inference:['Reading comprehension','Infer meaning from actions and details, supporting the inference with evidence.'],
    character:['Reading comprehension','Explain characters’ thoughts and motives using evidence from their actions.'],
    wordmeaning:['Reading comprehension','Explore unfamiliar word meanings in context.'],
    figurative:['Reading comprehension','Explain how figurative language affects the reader.'],
    syllables:['Word reading','Use word structure and letter–sound knowledge to read unfamiliar words; syllable practice supports this broader objective.'],
    organization:['Writing composition','Connect ideas across paragraphs using cohesive devices.'],
    argument:['Writing composition','Select details and reasons appropriate to the purpose and audience.'],
    description:['Writing composition','Develop settings and characters through purposeful description.'],
    revision:['Writing composition','Evaluate and revise vocabulary and grammar to improve clarity.'],
    tense:['Vocabulary, grammar and punctuation','Use tense consistently and appropriately.'],
    commas:['Vocabulary, grammar and punctuation','Use commas to clarify meaning.'],
    conjunctions:['Vocabulary, grammar and punctuation','Use words and clauses to connect ideas; review the precise year-specific requirement.'],
    context:['Reading vocabulary','Use context to explain vocabulary and discuss precise word choices.'],
    roots:['Word reading','Use roots and affixes to understand unfamiliar words.'],
    relationships:['Vocabulary, grammar and punctuation','Explain how synonyms and antonyms relate to word meaning.']
  };
  const australia={
    reading:['Literacy / Literature','Candidate connection: explain meaning and interpretations using details from a text.'],
    writing:['Literacy · Creating texts','Candidate connection: create and revise text for a clear purpose and audience.'],
    grammar:['Language · Expressing and developing ideas','Candidate connection: use sentence structure and punctuation to communicate meaning.'],
    vocabulary:['Language / Literacy','Candidate connection: interpret and use vocabulary appropriately in context.']
  };
  const cambridge={
    reading:['Reading','Candidate connection: interpret a text and explain an answer using relevant details.'],
    writing:['Writing','Candidate connection: organise, develop and improve written ideas.'],
    grammar:['Grammar and punctuation','Candidate connection: use grammar and punctuation to support clear meaning.'],
    vocabulary:['Vocabulary and language','Candidate connection: explore word meaning and purposeful language choices.']
  };
  function lookup(skillId,framework){
    const group=D.groups.find(g=>g.skills.some(s=>s.id===skillId));
    if(!group)return null;
    if(framework==='ccss'){
      const m=D.mappings[skillId];return m?{code:m.code,area:group.name,objective:m.description,status:'Partial prototype alignment'}:null;
    }
    // Restrict candidates to skills with existing challenge evidence, not the whole scaffold.
    if(!D.samples[skillId])return null;
    const row=framework==='england'?england[group.key]:framework==='australia'?australia[group.domain]:cambridge[group.domain];
    if(!row)return null;
    return {area:row[0],objective:row[1],status:framework==='england'?'Candidate alignment · Review needed':'Thematic link · Objective review pending'};
  }
  // Independent fictional fixtures, never inferred from accuracy or labelled as Lexile.
  const readingLevels=Object.fromEntries(D.students.map((s,i)=>{
    const start=[3,4,2,4,2,3][i%6],current=start+(i%3===0?1:0);
    return [s.id,{start,current,next:current>=4?'A slightly longer passage with implied meaning':'A short passage with clear context clues'}];
  }));
  const passages={
    supported:'The tide rose. Eirik moved the crates up the path. He wanted to keep the supplies dry.',
    stretch:'As seawater crept over the harbour steps, Eirik hauled the supplies uphill, glancing back at the darkening sky. “Better now than too late,” he muttered.'
  };
  window.EDUCADE_ALIGNMENT={frameworks,lookup,readingLevels,passages};
})();
