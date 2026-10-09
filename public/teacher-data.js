/* Original EDUCADE demo taxonomy. Coverage reference: supplied Grade 5 skill lists.
   EDUCADE IDs identify skills; standards mappings live separately below. */
(() => {
  const domains = {
    reading: {name:'Reading', sections:[{id:'foundations',name:'Reading Foundations'},{id:'comprehension',name:'Reading Comprehension'}]},
    writing: {name:'Writing'}, grammar:{name:'Grammar'}, vocabulary:{name:'Vocabulary'}
  };
  const groups = [];
  function group(domain, section, key, name, labels) {
    const prefix = `EDU.G5.${domain.toUpperCase()}.${section ? section.toUpperCase()+'.' : ''}${key.toUpperCase()}`;
    const entry={id:prefix,domain,section,key,name,skills:labels.split('|').map((label,i)=>({id:`${prefix}.${String(i+1).padStart(2,'0')}`,name:label}))};
    groups.push(entry); return entry;
  }
  group('reading','foundations','syllables','Multisyllabic words','Identify syllable types|Segment multisyllabic words|Read multisyllabic words|Spell multisyllabic words');
  group('reading','foundations','affixed','Affixed words','Read words with affixes|Use an affixed word in a sentence');
  group('reading','foundations','frequent','High-frequency and irregular words','Read high-frequency words|Spell irregular words');
  group('reading','comprehension','mainidea','Main idea','Use key details to find the main idea|Summarize the main idea|Combine ideas from two texts');
  group('reading','comprehension','inference','Inference and theme','Draw an inference using textual evidence|Identify a story’s theme|Compare themes across stories');
  group('reading','comprehension','purpose','Author’s purpose and perspective','Identify author’s purpose|Compare points of view|Compare information from two texts|Analyze an argument');
  group('reading','comprehension','tone','Tone','Distinguish formal and informal language');
  group('reading','comprehension','character','Character thoughts and motivations','Compare characters using actions and dialogue|Explain how a character changes');
  group('reading','comprehension','story','Story elements','Identify narrative point of view|Identify story elements|Analyze plot events');
  group('reading','comprehension','structure','Text structure','Sequence informational events|Compare and contrast information|Connect causes and effects|Connect problems and solutions');
  group('reading','comprehension','sensory','Sensory details','Recognize sensory details|Sort sensory details');
  group('reading','comprehension','figurative','Literary devices','Explain similes and metaphors in context|Interpret an allusion|Explain the effect of figurative language');
  group('reading','comprehension','wordmeaning','Vocabulary in a text','Determine a word’s meaning in a story|Use context to explain a phrase');
  group('reading','comprehension','visual','Visual elements','Interpret illustrations|Read a graphic organizer');
  group('reading','comprehension','features','Text features','Use headings, captions and diagrams');
  group('reading','comprehension','poetry','Poetry elements','Identify rhyme patterns|Identify elements of poetry');
  group('reading','comprehension','literary','Literary texts','Read fantasy|Read realistic fiction|Read historical fiction|Read poetry and drama');
  group('reading','comprehension','informational','Informational texts','Read about people and places|Read about science and nature|Read about history and technology');
  group('writing',null,'organization','Organizing writing','Link information with transitions|Sequence sentences|Organize information by topic|Remove unrelated details');
  group('writing',null,'opening','Introductions and conclusions','Write a topic sentence|Write a concluding sentence');
  group('writing',null,'summary','Summarizing','Summarize a story');
  group('writing',null,'argument','Developing and supporting arguments','Support an opinion with reasons|Distinguish facts and opinions|Select supporting details');
  group('writing',null,'description','Descriptive details','Add sensory detail to a narrative|Show character emotions|Choose a stronger verb');
  group('writing',null,'variety','Sentence variety','Create varied sentences');
  group('writing',null,'revision','Editing and revising','Revise a draft using feedback|Correct a commonly confused word');
  group('writing',null,'research','Research skills','Avoid plagiarism|Distinguish primary and secondary sources');
  group('grammar',null,'spelling','Spelling','Spell words with prefixes|Spell words with suffixes|Spell common words');
  group('grammar',null,'sentences','Sentences, fragments and run-ons','Identify sentence types|Recognize a complete sentence|Identify clauses|Build compound and complex sentences');
  group('grammar',null,'nouns','Nouns','Recognize common and proper nouns|Form plurals|Use possessive nouns');
  group('grammar',null,'pronouns','Pronouns','Use subject and object pronouns|Use possessive and reflexive pronouns|Use relative pronouns');
  group('grammar',null,'verbtypes','Verb types','Recognize main and helping verbs|Use modal verbs');
  group('grammar',null,'agreement','Subject–verb agreement','Choose an agreeing subject and verb|Use agreement with compound subjects');
  group('grammar',null,'tense','Verb tense','Form and use perfect verb tenses|Correct inappropriate shifts in tense|Use progressive verb tenses');
  group('grammar',null,'modifiers','Adjectives and adverbs','Distinguish adjectives and adverbs|Order adjectives|Use comparisons');
  group('grammar',null,'prepositions','Prepositions','Identify prepositions and objects|Use prepositional phrases');
  group('grammar',null,'conjunctions','Conjunctions','Explain how a conjunction connects ideas|Use correlative conjunctions');
  group('grammar',null,'contractions','Contractions','Use pronoun–verb contractions|Use contractions with not');
  group('grammar',null,'commas','Commas','Use a comma after an introductory element|Use commas in a series|Use commas in direct address');
  group('grammar',null,'capitalization','Capitalization','Correct capitalization|Capitalize titles');
  group('grammar',null,'formatting','Formatting','Format titles|Punctuate dialogue|Format addresses');
  group('grammar',null,'abbreviations','Abbreviations','Abbreviate days and months|Use common abbreviations');
  group('vocabulary',null,'affixes','Prefixes and suffixes','Use a prefix to explain meaning|Use a suffix to explain meaning|Group words by affix');
  group('vocabulary',null,'roots','Greek and Latin roots','Use a Greek or Latin root to infer meaning|Group words by shared roots');
  group('vocabulary',null,'categories','Categories','Group related words|Identify a word that does not belong');
  group('vocabulary',null,'relationships','Synonyms and antonyms','Explain relationships between synonyms and antonyms|Find a synonym in context');
  group('vocabulary',null,'analogies','Analogies','Complete a word analogy');
  group('vocabulary',null,'homophones','Homophones and multiple meanings','Choose the correct homophone|Interpret a multiple-meaning word');
  group('vocabulary',null,'idioms','Idioms and adages','Explain an idiom in context|Explain an adage');
  group('vocabulary',null,'shades','Shades of meaning','Compare shades of meaning|Recognize connotation');
  group('vocabulary',null,'context','Context clues','Infer a word’s meaning using context|Use domain-specific vocabulary|Use academic vocabulary');
  group('vocabulary',null,'reference','Reference skills','Use dictionary entries|Use guide words|Use a thesaurus|Alphabetize words');
  const find=(domain,key,n=0)=>groups.find(g=>g.domain===domain&&g.key===key).skills[n];
  const samples={};
  const mappings={};
  function assess(domain,key,n,code,standard,title,prompt,answer,retry,hint){
    const skill=find(domain,key,n);
    samples[skill.id]={title,prompt,answer,retry,hint};
    mappings[skill.id]={code:`CCSS.ELA-LITERACY.${code}`,description:standard,status:'candidate',source:`https://www.thecorestandards.org/ELA-Literacy/${code.split('.')[0]}/5/`,checked:null};
    return skill.id;
  }
  const reading=[
    assess('reading','inference',0,'RL.5.1','Quote accurately when explaining a text and drawing inferences.','The rising tide','“The water climbed past the lowest step. Eirik pulled the supply crates up to the higher path.” Why does Eirik move the crates? Cite a detail.','He wants to keep them dry: the water is climbing past the lowest step.','He moves them because he dislikes the harbour.','Connect the rising water with the location of the crates.'),
    assess('reading','wordmeaning',0,'RL.5.4','Determine the meaning of words and phrases in a text.','Harbour supplies','“Bring me a sturdy rope. The wind is rising, and we must secure the ship.” What does sturdy mean here?','Strong enough to hold the ship safely.','Thin and easy to break.','Think about the job the rope needs to do.'),
    assess('reading','figurative',0,'RL.5.4','Determine meanings of words and phrases, including figurative language.','The storm’s voice','“The wind howled like a hungry wolf.” What does this simile suggest about the wind?','It is loud and fierce, like a wolf’s howl.','A real wolf is hiding on the ship.','Compare the sound of wind with the sound of a wolf.'),
    assess('reading','character',0,'RL.5.3','Compare and contrast characters using details such as actions and dialogue.','Two ways to help','Eirik says, “Check every knot first.” Liv says, “I will carry the supplies while you check.” Compare their priorities, using their words.','Eirik focuses on safety; Liv focuses on getting supplies ready. Their dialogue shows two ways to help the crew.','Both characters want to leave the supplies behind.','Look at what each character offers to do.')
  ];
  const foundation=assess('reading','syllables',2,'RF.5.3.a','Use letter–sound knowledge, syllabication and morphology to read unfamiliar multisyllabic words.','A longer word','Read transportation by identifying its syllable chunks. This is a fictional teacher-recorded reading check.','trans / por / ta / tion — transportation','trans / port — stops before the end of the word','Try one syllable at a time, then blend the complete word.');
  const writing=[
    assess('writing','organization',0,'W.5.2.c','Link ideas within and across categories of information using words, phrases and clauses.','A useful connection','Link these informational ideas: “The wind is rising. The crew must check the ropes.” Use a transition showing the connection.','The wind is rising; therefore, the crew must check the ropes.','The wind is rising. Also, the apples are red.','Choose a transition that shows a cause and a response.'),
    assess('writing','argument',0,'W.5.1.b','Support an opinion with logically ordered reasons, facts and details.','Choose the safer plan','Support this opinion with a reason from the quest: “The crew should check the ropes before departure.”','They should check first because the rising wind could loosen the ship’s ropes.','They should check because it is my favourite plan.','Use the rising wind as a fact to support the opinion.'),
    assess('writing','description',0,'W.5.3.d','Use concrete words, phrases and sensory details to convey experiences and events.','Bring the harbour to life','Add concrete sensory details to this narrative sentence: “We walked by the sea.”','We followed the salt-sprayed path as cold waves slapped the wooden pier.','We walked by the nice sea in a nice place.','Describe something the character can hear or feel.'),
    assess('writing','revision',0,'W.5.5','With guidance and support, strengthen writing by planning, revising, editing or rewriting.','A partner’s suggestion','A partner says your verb could show more urgency. Revise: “Liv went to the ship before the tide rose.”','Liv hurried to the ship before the tide rose.','Liv went to the ship and it was a ship.','Choose a verb that shows quick movement.')
  ];
  const grammar=[
    assess('grammar','conjunctions',0,'L.5.1.a','Explain the function of conjunctions, prepositions and interjections.','Connecting a reason','In “We wait because the tide is high,” what is the job of because?','It joins the action to the reason for waiting.','It names the person who waits.','Notice which idea explains the other idea.'),
    assess('grammar','tense',0,'L.5.1.b','Form and use perfect verb tenses.','Before the storm','Complete using the past perfect: “Before the storm arrived, the crew ___ the ropes.”','had secured','will secure','The securing happened before another past event.'),
    assess('grammar','tense',1,'L.5.1.d','Recognize and correct inappropriate shifts in verb tense.','Keep the timeline clear','Correct the tense shift: “Yesterday, Liv carried supplies and checks the sail.”','Yesterday, Liv carried supplies and checked the sail.','Yesterday, Liv carries supplies and will check the sail.','Both actions happened yesterday.'),
    assess('grammar','commas',0,'L.5.2.b','Use a comma to separate an introductory element from the rest of a sentence.','A pause before departure','Add the missing comma: “Before sunrise the crew checked the ship.”','Before sunrise, the crew checked the ship.','Before, sunrise the crew checked the ship.','Find the introductory time phrase.')
  ];
  const vocabulary=[
    assess('vocabulary','context',0,'L.5.4.a','Use context as a clue to the meaning of a word or phrase.','A narrow route','“The passage was narrow; only one sailor could walk through at a time.” Explain narrow using the context.','Not wide; the passage fits just one sailor.','Very deep and full of water.','Use the clue about one sailor at a time.'),
    assess('vocabulary','roots',0,'L.5.4.b','Use common, grade-appropriate Greek and Latin affixes and roots as clues to meaning.','Cargo to carry','The Latin root port means carry. What does transport suggest when the crew transports cargo?','They carry or move the cargo from one place to another.','They paint the cargo blue.','Use the meaning of port to explain the action.'),
    assess('vocabulary','relationships',0,'L.5.5.c','Use relationships between words such as synonyms and antonyms to understand words.','Words that work together','How do strong and sturdy help you understand the rope? How is fragile different?','Strong and sturdy are similar; fragile means easily broken, the opposite quality.','All three words mean exactly the same thing.','Separate similar meanings from opposite meanings.'),
    assess('vocabulary','context',1,'L.5.6','Acquire and accurately use grade-appropriate academic and domain-specific words.','The harbour log','Use cargo accurately in a sentence about the supplies being carried on the ship.','The crew loaded cargo, including food and rope, onto the ship.','The cargo blew across the sky like a cloud.','Cargo is the goods a vehicle or ship carries.')
  ];
  const names=[['alex','Alex Chen',[45,85,60,70]],['maya','Maya Patel',[80,70,90,65]],['leo','Leo Martin',[60,40,60,80]],['sofia','Sofia Kim',[90,75,70,55]],['noah','Noah Wilson',[30,60,50,70]],['ella','Ella Brown',[70,90,35,80]]];
  function records(skillId,score,studentIndex,skillIndex){
    const correctTotal=Math.round(score/5);
    const quota=[-.9,-.3,.3,.9].map(offset=>Math.max(0,Math.min(5,Math.round(correctTotal/4+offset))));
    while(quota.reduce((a,b)=>a+b,0)<correctTotal){for(let w=3;w>=0;w--)if(quota[w]<5){quota[w]++;break;}}
    while(quota.reduce((a,b)=>a+b,0)>correctTotal){for(let w=0;w<4;w++)if(quota[w]>0){quota[w]--;break;}}
    return Array.from({length:20},(_,i)=>{
      const week=Math.floor(i/5)+1,correct=(i%5)<quota[week-1];
      const supported=(i+studentIndex+skillIndex)%4===0||(!correct&&(i+skillIndex)%3===0);
      const hint=supported&&(i+studentIndex)%3!==0;
      const sample=samples[skillId];
      return {id:`${names[studentIndex][0]}:${skillId}:${i+1}`,skillId,week,day:(i%5)+1,correct,supported,hint,response:correct?sample.answer:sample.retry};
    });
  }
  const students=names.map(([id,name,values],index)=>{
    const scores={};reading.forEach((skill,i)=>scores[skill]=values[i]);
    [writing,grammar,vocabulary].forEach((list,d)=>list.forEach((skill,i)=>scores[skill]=Math.max(25,Math.min(95,values[(i+d)%4]+(d-1)*5))));
    scores[foundation]=Math.min(95,values[1]);
    const evidence=Object.entries(scores).flatMap(([skill,score],i)=>records(skill,score,index,i));
    return {id,name,index,initials:name.split(' ').map(s=>s[0]).join(''),evidence};
  });
  function summarize(evidence){
    const attempts=evidence.length,correct=evidence.filter(r=>r.correct).length;
    return {attempts,correct,score:attempts?Math.round(correct/attempts*100):null,independent:evidence.filter(r=>!r.supported).length,supported:evidence.filter(r=>r.supported).length,hints:evidence.filter(r=>r.hint).length};
  }
  function skillStats(student,id){return summarize(student.evidence.filter(r=>r.skillId===id));}
  function groupStats(student,group){return summarize(student.evidence.filter(r=>group.skills.some(s=>s.id===r.skillId)));}
  window.EDUCADE_DEMO={domains,groups,students,samples,mappings,reading,summarize,skillStats,groupStats};
})();
