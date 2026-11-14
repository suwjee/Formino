/* Formino Final · authoritative, immutable 120-session evidence-informed training data.
 * The research data is never overwritten. Runtime personalization takes place in
 * adaptive-final.js and is persisted separately in SQLite snapshots. */
window.FITNESS_PLAN=(()=>{
 'use strict';
 const D=window.FORMINO_RESEARCH_DATA;
 if(!D||D.sessions.length!==120)throw Error('بسته برنامه پژوهشی کامل نیست.');
 const sourceExercises=Object.fromEntries(D.exercises.map(e=>[e.id,e]));
 const sourceVariants=Object.fromEntries(D.exercises.flatMap(e=>e.variants.map(v=>[v.id,{...v,family:e.id,base:e}])));
 const muscleGroups={chest:'سینه',lats:'پشت و زیربغل',mid_back:'پشت و زیربغل',lateral_deltoid:'سرشانه',rear_deltoid:'سرشانه',anterior_deltoid:'سرشانه',biceps:'جلو بازو',brachialis:'جلو بازو',triceps:'پشت بازو',quadriceps:'ران',hamstrings:'پشت ران',glutes:'باسن',calves:'ساق',rectus_abdominis:'شکم و میان‌تنه',obliques:'شکم و میان‌تنه',forearms:'ساعد',trunk:'شکم و میان‌تنه'};
 const equipLabel={bodyweight:'وزن بدن',dumbbell:'یک دمبل 2–8 کیلوگرمی',floor:'زمین',wall:'دیوار',pilates_band:'کش پیلاتس',verified_pullup_bar:'میله بارفیکس ایمن'};
 function isWeight(e,v){
   if(['PU','CR','RC','DB','SP','HW','PULL','BAND'].includes(e.id))return false;
   if(['CALF','SQ','GB','SS','RL'].includes(e.id))return /دمبل|dumbbell|weighted|goblet/i.test(v.name_fa+' '+v.name_en);
   if(e.id==='RDL')return v.id!=='RDL-V0';
   return e.equipment.includes('dumbbell');
 }
 const exercises={};
 for(const family of D.exercises){
  for(const v of family.variants){
   const weight=isWeight(family,v);
   const id=v.id;
   exercises[id]={
    id,familyId:family.id,variantId:id,variantIndex:family.variants.findIndex(x=>x.id===id),
    fa:v.name_fa,en:v.name_en,group:muscleGroups[family.primary_muscles[0]]||'سایر',
    muscles:[...family.primary_muscles,...family.secondary_dynamic_muscles].map(m=>muscleGroups[m]||m),
    equip:family.equipment.map(k=>equipLabel[k]||k).join('، '),
    type:weight?'weight':v.unit==='seconds'?'time':family.id==='BAND'?'band':'body',side:!!v.unilateral,
    how:[family.technique_fa,v.instruction_fa,family.range_of_motion_fa].filter(Boolean),
    mistakes:family.common_errors_fa,easier:family.variants[Math.max(0, family.variants.findIndex(x=>x.id===id)-1)]?.name_fa||family.easier_alternative,
    harder:family.variants[Math.min(family.variants.length-1, family.variants.findIndex(x=>x.id===id)+1)]?.name_fa||family.harder_alternative,
    youtube:v.name_en+' proper exercise form',level:family.difficulty,
    safety:family.safety_fa,tempo:family.seconds_per_rep,
    targetFloor:v.target_floor||family.target_floor,targetCeiling:v.target_ceiling||family.target_ceiling,
    instructions:v.instruction_fa,requiresBar:family.equipment.includes('verified_pullup_bar'),
    requiresBand:family.equipment.includes('pilates_band')
   };
  }
  // Family alias for historical analytics and specific programmatic lookups
  if(!exercises[family.id]){const v=family.variants[family.default_variant_index]||family.variants[0];exercises[family.id]={...exercises[v.id],id:family.id};}
 }
 const programs=D.sessions;
 const orderedCodes=['A','D','B','C','E'];
 const sessionLabels={A:'تمام‌بدن A',B:'تمام‌بدن B',C:'تمام‌بدن C',D:'هوازی و میان‌تنه D',E:'هوازی و میان‌تنه E'};
 const sessions=orderedCodes.map((code,i)=>{
  const s=programs[i]; if(s.type!==code)throw Error('ترتیب جلسات پژوهشی نامعتبر است');
  return {code,title:sessionLabels[code],kind:['D','E'].includes(code)?'cardio':'strength',focus: ['D','E'].includes(code)?'cardio':`fullbody-${code}`,tone:['D','E'].includes(code)?'blue':'green',subtitle:s.title_fa,steps:s.main.map(x=>[x.variant_id,x.sets,`${x.set_targets[0].target} ${x.set_targets[0].unit==='seconds'?'ثانیه':'تکرار'}`,x.rest_between_sets_seconds])};
 });
 const weekGoals=D.weeks.map(w=>w.goal_fa);
 const phases=D.phases.map(x=>({from:x.weeks[0],to:x.weeks[1],name:x.name_fa,effort:x.effort_fa,rir:'مشروط به توان واقعی',note:x.effort_fa}));
 const phaseOf=week=>phases.find(p=>week>=p.from&&week<=p.to)||phases[0];
 const byId=new Map(programs.map(x=>[x.id,x]));
 function convertSession(raw){
  const wk=D.weeks[raw.week-1],ph=phaseOf(raw.week);
  const warmupSeconds=raw.warm_up.reduce((n,x)=>n+x.duration_seconds,0),cooldownSeconds=raw.cool_down.reduce((n,x)=>n+x.duration_seconds,0);
  const cardioSeconds=raw.cardio.total_seconds;
  const mainSeconds=raw.duration_seconds-warmupSeconds-cooldownSeconds-cardioSeconds;
  const steps=raw.main.map(row=>{
   const initial=row.set_targets.map(x=>x.target),variant=sourceVariants[row.variant_id];
   if(!variant)throw Error('شناسه حرکت نامعتبر '+row.variant_id);
   return {id:row.variant_id,original:row.exercise_id,familyId:row.exercise_id,variantId:row.variant_id,
    sets:row.sets,reps:`${initial[0]} ${row.set_targets[0].unit==='seconds'?'ثانیه':'تکرار'}`,
    targets:initial,unit:row.set_targets[0].unit,side:row.set_targets[0].per_side,
    rest:row.rest_between_sets_seconds,restSides:row.rest_between_sides_seconds,kind:exercises[row.variant_id].type,
    goalRir:ph.rir,sourceRow:row,estimatedSeconds:row.estimated_seconds,upgrade:sourceExercises[row.exercise_id]?.harder_alternative||''};
  });
  const title=raw.title_fa;
  return {
   code:raw.type,week:raw.week,sessionId:raw.id,title,subtitle:raw.goal_fa,
   kind:['D','E'].includes(raw.type)?'cardio':'strength',focus:['D','E'].includes(raw.type)?'cardio':`fullbody-${raw.type}`,
   tone:['D','E'].includes(raw.type)?'blue':'green',phase:ph,steps,
   warmup:warmupSeconds/60,strength:mainSeconds/60,cardioMinutes:cardioSeconds/60,cooldown:cooldownSeconds/60,
   duration:Math.round(raw.duration_seconds/60*10)/10,durationSeconds:raw.duration_seconds,
   warmupItems:raw.warm_up,cardioDetails:raw.cardio,cooldownItems:raw.cool_down,
   warmupText:raw.warm_up.map(x=>`${x.name_fa}: ${x.duration_seconds}s`).join('؛ '),
   cardio:raw.cardio.steps.map(x=>`${x.name_fa}: ${x.duration_seconds}s`).join('؛ '),
   cooldownText:raw.cool_down.map(x=>`${x.name_fa}: ${x.duration_seconds}s`).join('؛ '),
   transitionsSeconds:raw.transitions_seconds,assessmentSeconds:raw.assessment_slot_seconds,
   orderNote:raw.transition_fa||'ترتیب مراحل: گرم‌کردن، تمرین اصلی، هوازی، سردکردن.',
   weekGoal:wk.goal_fa,performanceRule:raw.progression_fa,recoveryRule:raw.recovery_fa,
   barNote:'بارفیکس فقط در صورت تأیید ایمنی میله و توان واقعی.',emphasis:raw.goal_fa,
   research:raw
  };
 }
 function forNumber(n){if(!Number.isInteger(n)||n<1||n>120)return null;return convertSession(programs[n-1]);}
 function prescription(week,code){if(!Number.isInteger(week)||week<1||week>24||!orderedCodes.includes(code))return null;return convertSession(programs[(week-1)*5+orderedCodes.indexOf(code)]);}
 function cardioMinutesFor(week,code){return prescription(week,code)?.cardioMinutes||0;}
 function busyForNumber(n){
  const full=forNumber(n);if(!full||full.kind!=='strength')return full;
  const spec=D.busy_cycle.find(x=>x.type===full.code);if(!spec)return full;
  const clone={...full.research,warm_up:spec.warm_up,cool_down:spec.cool_down,cardio:spec.cardio,transitions_seconds:spec.transitions_seconds,
    assessment_slot_seconds:0,assessment_fa:'',goal_fa:full.subtitle+' • اجرای کوتاه روز شلوغ',
    recovery_fa:spec.rule||full.recoveryRule,transition_fa:'جلسه کوتاه؛ ست‌های حذف‌شده، انجام‌شده محسوب نمی‌شوند.'};
  const originalByFamily=Object.fromEntries(full.research.main.map(v=>[v.exercise_id,v]));
  clone.main=spec.main.map(v=>{
   const original=originalByFamily[v.exercise_id];
   const count=Math.min(v.sets,original?.sets||1);
   const targets=v.set_targets.slice(0,count).map((x,i)=>({...x,set:i+1}));
   const sides=v.rest_between_sides_seconds*(targets[0]?.per_side?count:0);
   const active=Math.round(v.active_seconds*count/v.sets);
   const total=v.setup_seconds+active+Math.max(0,count-1)*v.rest_between_sets_seconds+sides;
   return {...v,sets:count,set_targets:targets,active_seconds:active,between_set_rest_total_seconds:Math.max(0,count-1)*v.rest_between_sets_seconds,side_change_total_seconds:sides,estimated_seconds:total};
  });
  clone.duration_seconds=clone.warm_up.reduce((v,x)=>v+x.duration_seconds,0)+clone.main.reduce((v,x)=>v+x.estimated_seconds,0)+
   clone.cardio.total_seconds+clone.cool_down.reduce((v,x)=>v+x.duration_seconds,0)+clone.transitions_seconds;
  const p=convertSession(clone);
  return {...p,executionMode:'busy',title:'نسخه کوتاه • '+p.title,subtitle:p.subtitle+' (فعالیت کاهش‌یافته، مناسب روز شلوغ)'};
 }
 const movementLadders={};
 return {exercises,sourceExercises,sourceVariants,research:D,sessions,weekGoals,phases,phaseOf,cardioMinutesFor,prescription,forNumber,busyForNumber,movementLadders,protectedVariants:[],progressionRules:D.rules,version:7};
})();

/* Exercise-library metadata. Keep presentation labels and search terms separate from prescriptions. */
window.FORMINO_EXERCISE_GUIDES=(()=>{
 'use strict';
 const plan=window.FITNESS_PLAN;
 const library=new Map();
 const stageIds=new Map();
 const references={
  floorPress:['نمایش اجرای پایه · OPEX','https://www.youtube.com/watch?v=Q1aqB3gzQd8'],
  kneePushup:['آموزش حرکت · ACE','https://www.acefitness.org/resources/everyone/exercise-library/13/bent-knee-push-up/'],
  reverseCrunch:['آموزش اجرای پایه · ACE','https://www.acefitness.org/resources/everyone/exercise-library/76/reverse-crunch/'],
  proneW:['بخش W در مجموعهٔ آموزشی ACE','https://www.acefitness.org/resources/everyone/exercise-library/249/prone-scapular-shoulder-stabilization-series-i-y-t-w-o-formation/'],
  kickstandRdl:['نمایش الگوی پای کمکی · ThriveTraining','https://www.youtube.com/watch?v=d13dAICgzG8'],
  heelBridge:['نمایش پل ایستا با فشار پاشنه · The Physios','https://thephysios.com/videos/level-1-isometric-hamstring-bridge/'],
  bridge:['آموزش اجرای پایه · NASM','https://www.nasm.org/resource-center/exercise-library/floor-bridge'],
  sidePlank:['آموزش اجرای پایه · NASM','https://www.nasm.org/resource-center/exercise-library/side-plank'],
  rdl:['الگوی پایه با دو دمبل · NASM','https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift'],
  deadBug:['آموزش اجرای پایه · NASM','https://www.nasm.org/resource-center/exercise-library/dead-bug'],
  march:['بخش راه‌رفتن درجا · NHS','https://www.nhs.uk/Livewell/fitness/Pages/how-to-warm-up.aspx'],
  shoulderRolls:['بخش چرخش شانه · NHS','https://www.nhs.uk/Livewell/fitness/Pages/how-to-warm-up.aspx'],
  calfStretch:['بخش کشش ساق · NHS','https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/']
 };
 const variants=[
  ['PU-V0','شنای سوئدی روی دیوار','Wall Push-Up','wall push up','شنا دیواری|wall incline push up','دیوار'],
  ['PU-V1','شنای سوئدی روی زانو','Knee Push-Up','bent knee push up','شنای زانو|شنا زانو|modified push up|kneeling push up','وزن بدن، زمین','kneePushup'],
  ['PU-V2','شنای سوئدی کامل روی زمین','Standard Push-Up','standard floor push up','شنا کامل|شنای کامل|شنا سویدی|regular push up','وزن بدن، زمین'],
  ['PU-V3','شنای سوئدی با مکث پایین','Paused Push-Up','paused push up bottom pause','شنا مکث دار|tempo push up','وزن بدن، زمین'],
  ['PU-V4','شنای سوئدی با انتقال جزئی وزن به طرفین','Push-Up with a Small Side-to-Side Weight Shift','side to side push up small lateral weight shift hands on floor','شنای انتقال وزن|lateral weight shift push up','وزن بدن، زمین'],
  ['FP-V0','پرس سینه تک‌دست با دمبل روی زمین · وزن سبک','Single-Arm Dumbbell Floor Press','single arm dumbbell floor press','پرس سینه روی زمین|پرس سبک|one arm dumbbell floor press','یک دمبل، زمین','floorPress'],
  ['FP-V1','پرس سینه تک‌دست با دمبل روی زمین · وزن بیشتر','Single-Arm Dumbbell Floor Press (Higher Load)','single arm dumbbell floor press','پرس با وزن بیشتر|پرس سینه تک دست','یک دمبل، زمین','floorPress'],
  ['FP-V2','پرس سینه تک‌دست با دمبل روی زمین و مکث پایین','Paused Single-Arm Dumbbell Floor Press','paused single arm dumbbell floor press bottom pause','پرس مکث دار|one arm floor press with pause','یک دمبل، زمین','floorPress'],
  ['ROW-V0','زیربغل دمبل تک‌دست با تکیه بر ران · وزن سبک','Thigh-Supported One-Arm Dumbbell Row','one arm dumbbell row hand or forearm on thigh no bench','قایقی سبک|زیر بغل خم دمبل تک دست|self-supported row','یک دمبل، بدون نیمکت'],
  ['ROW-V1','زیربغل دمبل تک‌دست با تکیه بر ران · وزن بیشتر','Thigh-Supported One-Arm Dumbbell Row (Higher Load)','one arm dumbbell row hand or forearm on thigh no bench','قایقی سنگین تر|خم دمبل تک دست','یک دمبل، بدون نیمکت'],
  ['ROW-V2','زیربغل دمبل تک‌دست با تکیه بر ران و مکث بالا','Thigh-Supported One-Arm Dumbbell Row with Top Pause','one arm dumbbell row thigh supported top pause no bench','قایقی مکث دار|one arm row with pause','یک دمبل، بدون نیمکت'],
  ['SQ-V0','اسکوات کم‌عمق با کمک دیوار','Wall-Assisted Shallow Bodyweight Squat','shallow bodyweight squat hand support wall','اسکوات کم عمق|partial squat','وزن بدن، دیوار'],
  ['SQ-V1','اسکوات وزن بدن','Bodyweight Squat','bodyweight squat proper form','اسکات بدون وزنه|اسکوات بدون وزنه|air squat','وزن بدن'],
  ['SQ-V2','اسکوات جام با یک دمبل','Dumbbell Goblet Squat','single dumbbell goblet squat','گابلت اسکوات|اسکوات گابلت','یک دمبل'],
  ['SQ-V3','اسکوات وزن بدن با مکث پایین','Paused Bodyweight Squat','bodyweight squat bottom pause','اسکوات مکث دار|pause squat','وزن بدن'],
  ['RDL-V0','هینج لگن بدون وزنه','Bodyweight Hip Hinge','bodyweight hip hinge drill hands on hips','خم شدن از لگن|هینج بدون وزنه|hip hinge rehearsal','وزن بدن'],
  ['RDL-V1','ددلیفت رومانیایی دوپا با یک دمبل','Two-Leg Single-Dumbbell Romanian Deadlift','single dumbbell Romanian deadlift both feet on floor','ددلیفت رومانیایی دمبل|رومانیایی دوپا|single dumbbell RDL','یک دمبل','rdl'],
  ['RDL-V2','ددلیفت رومانیایی با دمبل و پای کمکی','Dumbbell Kickstand Romanian Deadlift (B-Stance RDL)','dumbbell kickstand Romanian deadlift B stance rear toes on floor','ددلیفت بی استنس|رومانیایی پای کمکی|staggered stance RDL','یک دمبل، دیوار برای تعادل','kickstandRdl'],
  ['RDL-V3','ددلیفت رومانیایی تک‌پا با دمبل و تکیهٔ دست به دیوار','Hand-Supported Single-Leg Dumbbell Romanian Deadlift','single leg dumbbell Romanian deadlift free hand on wall for balance','رومانیایی تک پا با دیوار|supported single leg RDL','یک دمبل، دیوار برای تعادل'],
  ['LAT-V0','نشر جانب تک‌دست بدون وزنه','Unloaded Single-Arm Lateral Raise','single arm lateral raise no weight','نشر بدون وزنه|نشر از جانب','وزن بدن'],
  ['LAT-V1','نشر جانب تک‌دست با دمبل و آرنج خم','Bent-Elbow Single-Arm Dumbbell Lateral Raise','single arm bent elbow dumbbell lateral raise','نشر با آرنج خم|bent arm lateral raise','یک دمبل'],
  ['LAT-V2','نشر جانب تک‌دست با دمبل','Single-Arm Dumbbell Lateral Raise','single arm dumbbell lateral raise','نشر استاندارد|نشر از جانب دمبل','یک دمبل'],
  ['LAT-V3','نشر جانب تک‌دست با دمبل و مکث بالا','Paused Single-Arm Dumbbell Lateral Raise','single arm dumbbell lateral raise top pause','نشر مکث دار|paused lateral raise','یک دمبل'],
  ['HC-V0','جلو بازو چکشی تک‌دست با دمبل · وزن سبک','Single-Arm Dumbbell Hammer Curl','single arm dumbbell hammer curl neutral grip','چکشی سبک|جلو بازو دمبل چکشی','یک دمبل'],
  ['HC-V1','جلو بازو چکشی تک‌دست با دمبل · وزن بیشتر','Single-Arm Dumbbell Hammer Curl (Higher Load)','single arm dumbbell hammer curl neutral grip','چکشی سنگین تر','یک دمبل'],
  ['HC-V2','جلو بازو چکشی تک‌دست با دمبل و مکث میانه','Paused Single-Arm Dumbbell Hammer Curl','single arm dumbbell hammer curl midway pause','چکشی مکث دار','یک دمبل'],
  ['CR-V0','کرانچ شکم با دست‌ها رو به زانو','Crunch with Reach Toward Knees','abdominal crunch reach hands toward knees shoulders off floor','کرانچ دست رو به زانو|شکم کرانچ|reach crunch','وزن بدن، زمین'],
  ['CR-V1','کرانچ شکم با دست‌های ضربدری روی سینه','Arms-Crossed Abdominal Crunch','abdominal crunch arms crossed over chest','کرانچ دست روی سینه|شکم کرانچ','وزن بدن، زمین'],
  ['CR-V2','کرانچ شکم با دمبل نزدیک سینه','Dumbbell Crunch with Weight at Chest','weighted crunch holding dumbbell at chest','کرانچ دمبل|weighted crunch','یک دمبل، زمین'],
  ['CALF-V0','ساق پا ایستاده دوپا روی زمین','Standing Two-Leg Calf Raise on the Floor','standing bilateral calf raise flat floor no step','ساق دوپا|بلند شدن روی پنجه|bilateral calf raise','وزن بدن، دیوار برای تعادل'],
  ['CALF-V1','ساق پا ایستاده تک‌پا با کمک دیوار','Wall-Supported Single-Leg Standing Calf Raise','single leg standing calf raise hand on wall floor no step','ساق تک پا با دیوار|single leg heel raise','وزن بدن، دیوار'],
  ['CALF-V2','ساق پا ایستاده تک‌پا با دمبل و کمک دیوار','Wall-Supported Single-Leg Dumbbell Calf Raise','single leg dumbbell calf raise hand on wall flat floor','ساق تک پا با دمبل|loaded single leg calf raise','یک دمبل، دیوار'],
  ['SS-V0','اسپلیت اسکوات ثابت کم‌عمق با کمک دیوار','Wall-Supported Shallow Split Squat','shallow split squat both feet on floor hand on wall','اسپلیت کم عمق|اسکات اسپلیت|static lunge','وزن بدن، دیوار'],
  ['SS-V1','اسپلیت اسکوات ثابت با کمک دیوار','Wall-Supported Bodyweight Split Squat','bodyweight split squat both feet on floor hand on wall','اسپلیت استاندارد|اسکوات اسپلیت|static lunge','وزن بدن، دیوار'],
  ['SS-V2','اسپلیت اسکوات ثابت با یک دمبل و کمک دیوار','Wall-Supported Single-Dumbbell Split Squat','single dumbbell split squat feet on floor free hand supported','اسپلیت با دمبل|loaded split squat','یک دمبل، دیوار'],
  ['SS-V3','اسپلیت اسکوات ثابت با مکث پایین و کمک دیوار','Paused Wall-Supported Split Squat','bodyweight split squat both feet on floor bottom pause hand support','اسپلیت مکث دار|paused split squat','وزن بدن، دیوار'],
  ['HW-V0','نگه‌داشتن پل باسن با فشار پاشنه‌ها','Heel-Dig Bridge Hold','isometric heel dig hamstring bridge hold heels on floor','پل پاشنه ای|hamstring bridge isometric','وزن بدن، زمین','heelBridge'],
  ['HW-V1','راه‌رفتن پاشنه‌ها از پل باسن · گام کوتاه','Hamstring Bridge Walkout (Short Steps)','hamstring bridge heel walkout small steps','واک اوت کوتاه|hamstring walkout|glute bridge walkout','وزن بدن، زمین'],
  ['HW-V2','راه‌رفتن پاشنه‌ها از پل باسن · گام بلندتر','Hamstring Bridge Walkout (Longer Steps)','hamstring bridge heel walkout controlled longer steps','واک اوت با دامنه بیشتر|hamstring walkout|glute bridge walkout','وزن بدن، زمین'],
  ['OHP-V0','پرس سرشانه تک‌دست با دمبل در حالت نیم‌زانو · وزن سبک','Half-Kneeling Single-Arm Dumbbell Shoulder Press','half kneeling single arm dumbbell shoulder press','پرس سبک نیم زانو|half kneeling overhead press','یک دمبل، زمین'],
  ['OHP-V1','پرس سرشانه تک‌دست با دمبل در حالت نیم‌زانو · وزن بیشتر','Half-Kneeling Single-Arm Dumbbell Shoulder Press (Higher Load)','half kneeling single arm dumbbell shoulder press','پرس با مقاومت بیشتر|half kneeling overhead press','یک دمبل، زمین'],
  ['OHP-V2','پرس سرشانه تک‌دست با دمبل در حالت نیم‌زانو و مکث پایین','Paused Half-Kneeling Single-Arm Dumbbell Shoulder Press','half kneeling single arm dumbbell overhead press bottom pause','پرس مکث دار نیم زانو','یک دمبل، زمین'],
  ['RC-V0','تیلت خلفی لگن در حالت طاق‌باز','Supine Posterior Pelvic Tilt','supine posterior pelvic tilt lying knees bent','تیلت لگن خوابیده|چرخش خلفی لگن|pelvic tuck','وزن بدن، زمین'],
  ['RC-V1','کرانچ معکوس با زانوهای خم','Bent-Knee Reverse Crunch','bent knee reverse crunch pelvic curl floor','کرانچ معکوس|reverse ab crunch','وزن بدن، زمین','reverseCrunch'],
  ['RC-V2','کرانچ معکوس با زانوهای خم و مکث بالا','Paused Bent-Knee Reverse Crunch','bent knee reverse crunch top pause pelvic curl floor','کرانچ معکوس مکث دار|paused reverse crunch','وزن بدن، زمین','reverseCrunch'],
  ['TRI-V0','پشت بازو خوابیده تک‌دست با دمبل روی زمین · وزن سبک','Lying Single-Arm Dumbbell Triceps Extension on the Floor','single arm lying dumbbell triceps extension floor','پشت بازو سبک|single arm dumbbell skull crusher','یک دمبل، زمین'],
  ['TRI-V1','پشت بازو خوابیده تک‌دست با دمبل روی زمین · وزن بیشتر','Lying Single-Arm Dumbbell Triceps Extension on the Floor (Higher Load)','single arm lying dumbbell triceps extension floor','پشت بازو سنگین تر|single arm dumbbell skull crusher','یک دمبل، زمین'],
  ['TRI-V2','پشت بازو خوابیده تک‌دست با دمبل روی زمین و مکث پایین','Paused Lying Single-Arm Dumbbell Triceps Extension on the Floor','single arm lying dumbbell triceps extension floor bottom pause','پشت بازو مکث دار|paused single arm skull crusher','یک دمبل، زمین'],
  ['RL-V0','اسپلیت اسکوات ثابت با کمک دیوار · جایگزین لانج','Wall-Supported Static Split Squat (Lunge Alternative)','bodyweight static split squat hand support both feet on floor','اسپلیت ثابت|static lunge|جایگزین لانج معکوس','وزن بدن، دیوار'],
  ['RL-V1','لانج معکوس بدون وزنه با کمک دیوار','Wall-Supported Bodyweight Reverse Lunge','bodyweight reverse lunge step back hand on wall','لانگز معکوس|لانج عقب|backward lunge','وزن بدن، دیوار'],
  ['RL-V2','لانج معکوس با یک دمبل و کمک دیوار','Wall-Supported Single-Dumbbell Reverse Lunge','reverse lunge one dumbbell free hand supported','لانج معکوس با دمبل|دمبل لانج عقب|loaded reverse lunge','یک دمبل، دیوار'],
  ['GB-V0','پل باسن دوپا روی زمین','Two-Leg Floor Glute Bridge','bodyweight floor glute bridge both feet','پل دوپا|پل باسن|bilateral glute bridge','وزن بدن، زمین','bridge'],
  ['GB-V1','پل باسن دوپا با دمبل روی لگن','Dumbbell Floor Glute Bridge','dumbbell glute bridge on floor weight on hips','پل با دمبل|weighted glute bridge','یک دمبل، زمین'],
  ['GB-V2','پل باسن تک‌پا روی زمین','Single-Leg Floor Glute Bridge','single leg glute bridge floor','پل تک پا|single leg bridge','وزن بدن، زمین'],
  ['RD-V0','بالا آوردن دست‌ها به شکل W در حالت دمر','Prone W Raise','prone W raise shoulder floor no weights','نشر دمر W|حرکت دبلیو|prone W lift','وزن بدن، زمین','proneW'],
  ['RD-V1','نشر خم تک‌دست با دمبل، آرنج خم و تکیه بر ران','Thigh-Supported Bent-Elbow Dumbbell Rear Delt Raise','one arm bent elbow dumbbell rear delt raise hand on thigh no bench','نشر خم آرنج خم|bent arm reverse fly','یک دمبل، بدون نیمکت'],
  ['RD-V2','نشر خم تک‌دست با دمبل و تکیه بر ران','Thigh-Supported One-Arm Dumbbell Rear Delt Raise','one arm dumbbell rear delt reverse fly hand on thigh no bench','نشر خم استاندارد|rear delt fly|نشر معکوس دمبل','یک دمبل، بدون نیمکت'],
  ['BC-V0','جلو بازو تک‌دست با دمبل، کف دست رو به بالا · وزن سبک','Single-Arm Supinated Dumbbell Curl','single arm dumbbell biceps curl palms up supinated grip','جلو بازو سبک|جلو بازو دمبل','یک دمبل'],
  ['BC-V1','جلو بازو تک‌دست با دمبل، کف دست رو به بالا · وزن بیشتر','Single-Arm Supinated Dumbbell Curl (Higher Load)','single arm dumbbell biceps curl palms up supinated grip','جلو بازو سنگین تر|جلو بازو دمبل','یک دمبل'],
  ['BC-V2','جلو بازو تک‌دست با دمبل، کف دست رو به بالا و مکث میانه','Paused Single-Arm Supinated Dumbbell Curl','single arm supinated dumbbell bicep curl midway pause','جلو بازو مکث دار|جلو بازو دمبل','یک دمبل'],
  ['DB-V0','ددباگ با تماس پاشنه و دست‌های ثابت','Dead Bug Heel Tap (Arms Still)','dead bug heel taps bent knees arms still','تماس پاشنه|حشره مرده|dead bug heel touch','وزن بدن، زمین'],
  ['DB-V1','ددباگ با حرکت دست و پای مخالف','Contralateral Dead Bug','dead bug opposite arm and leg','ددباگ استاندارد|حشره مرده|دست و پای مخالف','وزن بدن، زمین','deadBug'],
  ['DB-V2','ددباگ با دست مخالف و پای کشیده‌تر','Long-Lever Contralateral Dead Bug','dead bug opposite arm and extended leg long lever','ددباگ اهرم بلند|حشره مرده','وزن بدن، زمین','deadBug'],
  ['SP-V0','پلانک پهلو روی ساعد با زانوهای خم','Bent-Knee Forearm Side Plank','modified side plank forearm bent knees','پلانک پهلو زانو خم|پلانک جانبی|kneeling side plank','وزن بدن، زمین'],
  ['SP-V1','پلانک پهلو روی ساعد با پاهای صاف','Straight-Leg Forearm Side Plank','forearm side plank straight legs','پلانک پهلو پا صاف|پلانک جانبی','وزن بدن، زمین','sidePlank'],
  ['PULL-V0','آویز کمکی از میله با پاها روی زمین','Feet-Supported Pull-Up Bar Hang','feet supported hang pull up bar feet on floor no chair','آویز کمکی|آویزان با پا روی زمین','میلهٔ بارفیکس ایمن'],
  ['PULL-V1','آویز فعال از میلهٔ بارفیکس','Active Hang on a Pull-Up Bar','active hang pull up bar straight arms scapular depression','آویزان فعال|scapular hang','میلهٔ بارفیکس ایمن'],
  ['PULL-V2','بارفیکس کتف با آرنج صاف','Scapular Pull-Up','scapular pull up straight elbows on bar','بارفیکس اسکاپولا|scap pull up','میلهٔ بارفیکس ایمن'],
  ['PULL-V3','بارفیکس کامل کنترل‌شده بدون تاب','Strict Pull-Up','strict pull up overhand no kip','بارفیکس کامل|pullup strict','میلهٔ بارفیکس ایمن'],
  ['BAND-V0','بازکردن کش جلوی سینه · کشش سبک','Resistance Band Pull-Apart (Light Tension)','standing resistance band pull apart chest height no anchor','باز کردن کش|بازکردن کش روبروی سینه|band pull apart|پول اپارت','کش پیلاتس'],
  ['BAND-V1','بازکردن کش جلوی سینه · کشش بیشتر در محدودهٔ مجاز','Resistance Band Pull-Apart (Higher Tension)','standing resistance band pull apart chest height no anchor','باز کردن کش|band pull apart|پول اپارت','کش پیلاتس']
 ];

 const techniques={
  'PU-V0':['روبه‌روی دیوار بایست و کف دست‌ها را هم‌ارتفاع شانه روی دیوار بگذار.','بدن را از سر تا پاشنه هم‌راستا نگه دار و با خم‌کردن آرنج‌ها سینه را به دیوار نزدیک کن.','با فشار دست‌ها به دیوار به حالت ایستاده برگرد.'],
  'PU-V1':['روی زمین روی کف دست‌ها و زانوها قرار بگیر. از سر تا زانو یک خط بساز.','با خم‌کردن آرنج‌ها سینه را به زمین نزدیک کن. باسن عقب نرود.','با فشار کف دست‌ها به حالت شروع برگرد و تنه را یکپارچه نگه دار.'],
  'PU-V4':['در وضعیت شنای روی زمین قرار بگیر و جای هر دو دست را ثابت نگه دار.','هم‌زمان با خم‌کردن آرنج‌ها، وزن را فقط کمی به یک سمت ببر.','به وسط برگرد و سمت دیگر را به همان اندازه اجرا کن.'],
  'GB-V2':['طاق‌باز دراز بکش و کف پای تکیه‌گاه را روی زمین قرار بده. پای دیگر را از زمین جدا کن.','با فشار پای تکیه‌گاه لگن را بالا بیاور و دو سمت لگن را هم‌سطح نگه دار.','بدون قوس‌دادن کمر لگن را آرام پایین بیاور. سمت دیگر را هم اجرا کن.'],
  'RDL-V0':['پاها را تقریباً به عرض لگن بگذار و دست‌ها را روی لگن قرار بده.','با زانوی کمی خم، لگن را عقب ببر و تنه را همراه لگن به جلو متمایل کن.','پیش از گردشدن کمر به حالت ایستاده برگرد.'],
  'RDL-V2':['یک پا را جلو بگذار و پنجهٔ پای عقب را کمی عقب‌تر روی زمین نگه دار.','بیشتر وزن روی پای جلو بماند. دمبل را نزدیک پای جلو پایین ببر و لگن را عقب بده.','با پای جلو به ایستادن برگرد. برای تعادل از دیوار کمک بگیر و سمت دیگر را هم تمرین کن.'],
  'RDL-V3':['روی یک پا بایست، با دست آزاد دیوار را لمس کن و دمبل را نزدیک بدن نگه دار.','لگن را عقب ببر و پای آزاد را کمی به عقب بکش. لگن رو به زمین بماند.','تا جایی پایین برو که بتوانی تعادل و راستای تنه را حفظ کنی، سپس برگرد.'],
  'HW-V0':['طاق‌باز دراز بکش، زانوها را خم کن و پاشنه‌ها را نزدیک باسن روی زمین بگذار.','پاشنه‌ها را به زمین فشار بده و لگن را تا یک پل کوتاه بالا بیاور.','در همان وضعیت بمان و نفس بکش، سپس لگن را آرام پایین بیاور.'],
  'RC-V0':['طاق‌باز دراز بکش، زانوها را خم کن و کف پاها را روی زمین بگذار.','با بازدم لگن را کمی به عقب بچرخان تا فاصلهٔ کمر با زمین کمتر شود.','پس از مکث کوتاه، لگن را با کنترل به حالت خنثی برگردان.'],
  'RL-V0':['یک پا جلو و پای دیگر عقب باشد. برای تعادل دیوار را با دست لمس کن.','جای پاها را ثابت نگه دار و با خم‌کردن زانوها کمی پایین برو.','با فشار پای جلو بالا بیا و سپس سمت دیگر را اجرا کن.'],
  'RD-V0':['روی شکم دراز بکش و آرنج‌های خم را کنار بدن طوری قرار بده که دست‌ها شکل W بسازند.','کتف‌ها را آرام کنترل کن و دست‌ها و ساعدها را کمی از زمین بلند کن.','بدون بالا انداختن شانه یا قوس‌دادن کمر، آرام پایین بیاور.'],
  'DB-V0':['طاق‌باز با ران‌های بالا و زانوهای خم شروع کن. دست‌ها را ثابت نگه دار.','یک پاشنه را آرام به زمین نزدیک کن یا به زمین بزن.','پاشنه را بالا بیاور و سمت دیگر را انجام بده. وضعیت کمر در طول حرکت ثابت بماند.'],
  'DB-V1':['طاق‌باز با دست‌ها رو به سقف، ران‌های بالا و زانوهای خم شروع کن.','یک پا را با کنترل دور کن و هم‌زمان دست مخالف را به سمت بالای سر ببر.','قبل از تغییر محسوس قوس کمر، دست و پا را برگردان و سمت دیگر را انجام بده.'],
  'DB-V2':['طاق‌باز با دست‌ها رو به سقف و پاها بالا شروع کن.','دست مخالف را به بالای سر ببر و هم‌زمان زانوی پای در حال حرکت را بیشتر باز کن.','فقط تا جایی ادامه بده که کمر ثابت بماند. سپس برگرد و سمت را عوض کن.'],
  'PULL-V0':['با هر دو دست میلهٔ ایمن را بگیر. میله باید به‌اندازه‌ای پایین باشد که پاها روی زمین بمانند.','بخشی از وزن را روی پاها نگه دار و با آرنج‌های صاف در وضعیت راحت بمان.','برای پایان وزن را کامل به پاها منتقل کن و بعد میله را رها کن.'],
  'PULL-V1':['میلهٔ تأییدشده را از موقعیت ایمن بگیر و بدون پرش وارد آویز شو.','با آرنج‌های صاف، شانه‌ها را کمی از گوش‌ها دور کن و همان وضعیت را نگه دار.','بدون تاب‌خوردن یا رهاشدن ناگهانی، به تکیه‌گاه پا برگرد.'],
  'PULL-V2':['از میلهٔ ایمن با بازوهای صاف و بدن آرام آویزان شو.','بدون خم‌کردن آرنج‌ها، کتف‌ها را کمی پایین بکش تا بدن اندکی بالا بیاید.','آرام به آویز راحت برگرد. حرکت کوچک است و به بالاکشیدن چانه نیاز ندارد.'],
  'PULL-V3':['میلهٔ تأییدشده را با کف دست رو به جلو بگیر و از موقعیت ایمن وارد آویز شو.','با پایین کشیدن آرنج‌ها، بدون تاب یا پرش بالا برو تا چانه از میله عبور کند.','آرام پایین بیا. فقط پس از تأیید شرایط اجرای بارفیکس کامل در فرمینو این نسخه را انجام بده.']
 };
 const safetyOverrides={
  'RDL-V0':'حرکت را بدون دمبل تمرین کن و دامنه را در حدی نگه دار که کمر تحت کنترل بماند.',
  'RC-V0':'لگن را از زمین بلند نکن. حرکت کوچک و کنترل‌شده باشد.',
  'RD-V0':'فقط در دامنهٔ راحت شانه بالا بیا و سر را در راستای تنه نگه دار.',
  'PULL-V0':'پاها باید روی زمین بمانند. از صندلی یا پرش برای رسیدن به میله استفاده نکن.',
  'PULL-V1':'قبل از آویز، ایمنی میله و امکان ورود و خروج بدون پرش را بررسی کن.',
  'PULL-V2':'آرنج‌ها صاف بمانند. اگر ورود یا خروج از میله ایمن نیست، حرکت را انجام نده.'
 };
 const displayNotes={
  'HW-V0':'این نسخه نگه‌داشتنی است. مدت نگه‌داشتن را از کارت تمرین همان جلسه بخوان.',
  'PULL-V3':'فقط بعد از تأیید ایمنی میله و قبولی در آزمون مستقل فرمینو اجرا کن.'
 };
 const mistakeOverrides={
  'PU-V0':'رهاشدن لگن، بازشدن بیش از حد آرنج‌ها یا ضربه زدن به دیوار.',
  'RDL-V0':'خم‌کردن کمر به‌جای عقب بردن لگن یا تبدیل حرکت به اسکوات.',
  'HW-V0':'گام برداشتن حین نگه‌داشتن پل، افتادن لگن یا حبس نفس.',
  'RC-V0':'بلندکردن باسن، فشار دادن با پاها یا حرکت پرتابی لگن.',
  'RL-V0':'قدم برداشتن حین تکرار یا جابه‌جا شدن زانوی جلو به داخل.',
  'RD-V0':'تاب دادن دست‌ها، قوس کمر یا جمع کردن شانه‌ها کنار گوش.',
  'LAT-V0':'بالا انداختن شانه، تاب دادن تنه یا بردن بازو به دامنهٔ ناراحت.',
  'PULL-V0':'جدا کردن پاها از زمین یا پریدن به سمت میله.',
  'PULL-V1':'خم کردن آرنج، بالا و پایین رفتن کتف یا تاب خوردن.',
  'PULL-V2':'خم کردن آرنج برای بالا رفتن یا تلاش برای رساندن چانه به میله.'
 };
 function aliasesOf(text){return text?text.split('|'):[];}
 function register(guide){library.set(guide.id,guide);return guide;}
 for(const [id,fa,en,query,aliases,equip,reference] of variants){
  const ex=plan.exercises[id];
  const source=plan.sourceVariants[id];
  if(!ex||!source)continue;
  register({...ex,fa,en,query,equip,reference:references[reference],category:'main',
   aliases:[source.name_fa,source.name_en,source.base.name_fa,source.base.name_en,...aliasesOf(aliases)],
   how:techniques[id]||[ex.how[0],ex.how[2]].filter(Boolean),variantNote:displayNotes[id]||source.instruction_fa,
   mistakes:mistakeOverrides[id]||ex.mistakes,safety:safetyOverrides[id]||ex.safety
  });
 }
 // Link variants using stable exercise IDs rather than displaying the current variant as its own alternative.
 for(const guide of library.values()){
  const family=plan.sourceExercises[guide.familyId];
  const neighbors=family.variants.map(variant=>variant.id);
  const index=neighbors.indexOf(guide.id);
  guide.easierId=neighbors[index-1]||null;
  guide.harderId=neighbors[index+1]||null;
 }

 const activities=[
  ['easy-march','Easy marching','راه‌رفتن سبک درجا','Easy March in Place','low impact easy march in place warm up','درجا آرام|قدم زدن درجا|مارچ درجا',['صاف بایست و وزن را به‌نوبت روی هر پا منتقل کن.','قدم‌های کوچک و آرام بردار. بدون پرش، یکی از پاها همیشه روی زمین بماند.','در طول حرکت تنفس راحت داشته باش.'],'march'],
  ['shoulder-elbow-circles','Shoulder and elbow circles','چرخش ملایم شانه‌ها و حرکت دورانی آرنج‌ها','Gentle Shoulder Rolls and Elbow Circles','gentle standing shoulder rolls and bent elbow circles warm up','چرخش شانه و آرنج|shoulder and elbow warm up',['شانه‌ها را در دامنهٔ کوتاه جلو و عقب بچرخان.','آرنج‌ها را خم کن و با حرکت کوچک بازوها، مسیر دایره‌ای کوتاه بساز.','بدن را ثابت نگه دار و فقط در دامنهٔ راحت حرکت کن.'],'shoulderRolls'],
  ['wall-scapular-push-up','Wall scapular push-up','شنای کتف روی دیوار با آرنج صاف','Wall Scapular Push-Up','wall scapular push up straight arms shoulder blades','حرکت کتف روی دیوار|شنا کتف دیوار|wall push up plus',['دست‌ها را هم‌ارتفاع شانه روی دیوار بگذار و آرنج‌ها را صاف نگه دار.','اجازه بده کتف‌ها کمی به هم نزدیک شوند و سینه اندکی به دیوار نزدیک شود.','به دیوار فشار بده تا کتف‌ها از هم دور شوند. آرنج‌ها در طول حرکت صاف بمانند.']],
  ['easy-squat','Easy squat','اسکوات آرام بدون وزنه برای گرم‌کردن','Easy Bodyweight Squat Warm-Up','slow bodyweight squat warm up no weights','اسکوات سبک|اسکات گرم کردن',['پاها را در عرض راحت بگذار و کل کف پا را روی زمین نگه دار.','زانوها را هم‌جهت پنجه‌ها خم کن و با کنترل کمی پایین برو.','با فشار کف پا به ایستادن برگرد. عمق حرکت در حد راحت باشد.']],
  ['hip-hinge-drill','Hip-hinge rehearsal','تمرین هینج لگن بدون وزنه','Bodyweight Hip Hinge Drill','standing bodyweight hip hinge drill hands on hips','تمرین هینج|تمرین عقب بردن لگن',['دست‌ها را روی لگن بگذار و زانوها را کمی خم کن.','لگن را به عقب ببر تا تنه از مفصل لگن به جلو متمایل شود.','پیش از گردشدن کمر حرکت را برگردان و صاف بایست.']],
  ['easy-push-up','Easy push-up rehearsal','شنای آسان روی دیوار یا زانو برای گرم‌کردن','Easy Wall or Knee Push-Up Warm-Up','wall push up or bent knee push up beginner','شنای آسان|شنا گرم کردن',['نسخهٔ دیواری یا نسخهٔ روی زانو را انتخاب کن که بتوانی با کنترل انجام بدهی.','دست‌ها را روی سطح مناسب بگذار، بدن را هم‌راستا نگه دار و سینه را نزدیک سطح ببر.','با فشار دست‌ها به حالت آغاز برگرد.'],null,['PU-V0','PU-V1']],
  ['march-arm-swing','Marching with arm swing','راه‌رفتن درجا با حرکت دست‌ها','March in Place with Arm Swing','march in place with arm swing low impact exercise','درجا با حرکت دست|هوازی درجا',['صاف بایست و پاها را یکی‌درمیان از زمین بلند کن.','دست مخالف پای در حال حرکت را طبیعی جلو بیاور.','بدون پرش، حرکت دست و پا را با ریتم راحت ادامه بده.'],'march'],
  ['side-step','Side step','گام جانبی بدون پرش','Low-Impact Side Step (Step Touch)','low impact side step step touch exercise no jumping','گام به طرفین|استپ تاچ|قدم به پهلو|گام جانبی',['زانوها را نرم نگه دار و یک قدم کوتاه به پهلو بردار.','پای دیگر را نزدیک پای اول بیاور و بعد در جهت مخالف تکرار کن.','قدم‌ها را سبک بردار و از پرش یا پیچاندن زانو خودداری کن.']],
  ['step-jack','Low-impact step jack','استپ‌جک · پروانه بدون پرش','Low-Impact Step Jack (No-Jump Jumping Jack)','low impact step jack no jumping alternating side step','استپ جک|پروانه بدون پرش|standing step jack',['یک پا را به کنار ببر و هم‌زمان دست‌ها را در دامنهٔ راحت بالا بیاور.','پا را به مرکز برگردان و دست‌ها را پایین بیاور.','سمت دیگر را انجام بده. هر بار یک پا روی زمین بماند.']],
  ['continuous-march','Continuous marching','راه‌رفتن پیوسته درجا','Continuous March in Place','low impact continuous march in place cardio no jumping','درجا پیوسته|مارچ پیوسته',['قدم‌های متناوب درجا بردار و قامت را راحت نگه دار.','دست‌ها را به‌طور طبیعی حرکت بده و ریتم یکنواختی انتخاب کن.','سرعت را تا جایی نگه دار که حرکت روان و کنترل‌شده بماند.'],'march'],
  ['slow-march','Slow marching','راه‌رفتن درجا با کاهش تدریجی سرعت','Slow March in Place for Cool-Down','slow march in place cool down low impact','درجا آرام شونده|درجا سرد کردن',['با گام‌های آرام درجا حرکت کن.','به‌تدریج سرعت و ارتفاع گام‌ها را کمتر کن.','وقتی تنفس آرام‌تر شد، حرکت را به‌آرامی تمام کن.'],'march'],
  ['standing-breathing','Relaxed breathing','تنفس آرام در حالت ایستاده','Relaxed Standing Breathing','relaxed standing breathing exercise cool down no breath holding','تنفس راحت ایستاده|نفس آرام',['با پاهای ثابت بایست و شانه‌ها را شل کن.','در ریتم طبیعی نفس بکش. هوا را بدون زور یا حبس نفس بیرون بده.','تا زمانی که ایستادن و تنفس راحت است ادامه بده.']],
  ['chest-opening','Gentle chest opening','بازکردن ملایم سینه در حالت ایستاده','Gentle Standing Chest Opener','gentle standing chest opener stretch no equipment','کشش راحت سینه|کشش سینه ایستاده',['صاف بایست و شانه‌ها را راحت نگه دار.','بازوها را کمی به طرفین و عقب ببر تا کشش ملایمی جلوی سینه حس شود.','در دامنهٔ بدون درد نفس بکش و آرام دست‌ها را پایین بیاور.']],
  ['wall-calf-stretch','Gentle wall calf stretch','کشش ساق پا کنار دیوار','Standing Wall Calf Stretch','standing wall calf stretch back knee straight heel down','کشش ساق کنار دیوار|کشش عضله ساق',['کف دست‌ها را روی دیوار بگذار و یک پا را عقب ببر.','پاشنهٔ عقب را روی زمین نگه دار و زانوی پای جلو را کمی خم کن.','کشش ملایم را حس کن، سپس آرام برگرد و پاها را عوض کن.'],'calfStretch'],
  ['ankle-shoulder-mobility','Ankle and shoulder mobility','حرکات ملایم مچ پا و شانه','Gentle Ankle and Shoulder Mobility','gentle ankle circles and shoulder rolls warm up','حرکت مچ و شانه|چرخش مچ پا و شانه',['برای تعادل کنار دیوار بایست و هر مچ پا را جداگانه در دامنهٔ کوتاه حرکت بده.','کف پاها را روی زمین بگذار و شانه‌ها را آرام جلو و عقب بچرخان.','حرکت را نرم و در دامنهٔ راحت ادامه بده.']],
  ['progressive-march','Progressive marching','راه‌رفتن درجا با افزایش تدریجی سرعت','Progressive March in Place Warm-Up','march in place warm up gradually increase pace no jumping','درجا تدریجی|هوازی گرم کردن درجا',['با قدم‌های کوچک و آرام درجا شروع کن.','به‌تدریج ریتم قدم‌ها و حرکت دست‌ها را کمی بیشتر کن.','در شدتی بمان که بتوانی راحت صحبت کنی.'],'march'],
  ['shoulder-mobility','Gentle shoulder mobility','حرکت آرام شانه برای سردکردن','Gentle Shoulder Mobility for Cool-Down','gentle standing shoulder rolls cool down shoulder mobility','حرکت آرام شانه|چرخش شانه سرد کردن',['دست‌ها را کنار بدن رها کن و صاف بایست.','شانه‌ها را آرام و با دامنهٔ کوتاه جلو و عقب بچرخان.','بدون بالابردن اجباری دست‌ها، به حالت راحت برگرد.'],'shoulderRolls'],
  ['shallow-split-squat','Shallow split squat rehearsal','اسپلیت اسکوات ثابت کم‌عمق کنار دیوار برای گرم‌کردن','Shallow Wall-Supported Split Squat Warm-Up','shallow split squat both feet on floor hand on wall warm up','اسپلیت کم عمق|اسپلیت گرم کردن',['پاها را جلو و عقب بگذار و دیوار را برای تعادل لمس کن.','با پاهای ثابت کمی پایین برو، سپس با فشار پای جلو بالا بیا.','دامنه را کوتاه نگه دار و سمت دیگر را هم انجام بده.'],null,['SS-V0']],
  ['easy-glute-bridge','Easy glute bridge','پل باسن دوپا بدون وزنه برای گرم‌کردن','Easy Two-Leg Floor Glute Bridge Warm-Up','bodyweight floor glute bridge beginner warm up','پل باسن سبک|پل باسن گرم کردن',['طاق‌باز با زانوهای خم و کف پا روی زمین شروع کن.','باسن را با فشار کف پاها بلند کن و کمر را بیش از حد قوس نده.','لگن را آرام پایین بیاور و در دامنهٔ راحت تکرار کن.'],null,['GB-V0']],
  ['unloaded-floor-press','Unloaded floor press rehearsal','تمرین الگوی پرس سینه تک‌دست روی زمین بدون وزنه','Unloaded Single-Arm Floor Press Drill','single arm dumbbell floor press setup lying on floor practice without weight','پرس سینه بدون وزنه|تمرین پرس روی زمین',['طاق‌باز روی زمین دراز بکش و زانوها را خم کن.','یک دست را در مسیر پرس سینه بالا ببر، بدون اینکه چیزی در دست داشته باشی.','بازو را با کنترل پایین بیاور تا آرام به زمین برسد، سپس سمت دیگر را تمرین کن.'],'floorPress',['FP-V0']],
  ['reverse-step','Reverse-step rehearsal','تمرین گام کوتاه به عقب کنار دیوار','Supported Short Backward Step Drill','short backward step drill hand on wall reverse lunge warm up','گام عقب کوتاه|گام معکوس گرم کردن',['کنار دیوار صاف بایست و آن را برای تعادل لمس کن.','با یک پا قدم کوتاهی به عقب بردار و بیشتر وزن را روی پای جلو نگه دار.','به حالت ایستاده برگرد و سمت دیگر را تمرین کن.'],null,['RL-V1']],
  ['shadow-boxing','Easy shadow boxing','بوکس سایه‌ای سبک بدون وزنه','Easy Shadow Boxing Without Weights','low impact shadow boxing for beginners no weights no jumping','مشت زنی آرام|بوکس درجا|shadowboxing',['با زانوهای نرم و دست‌های آزاد روبه‌روی بدن بایست.','یکی‌درمیان مشت سبک به جلو بزن و قبل از قفل‌شدن آرنج دست را برگردان.','پاها را کنترل‌شده نگه دار و از وزنه، پرش و ضربهٔ پرقدرت استفاده نکن.']]
 ];
 const stageNames={warmup:'گرم‌کردن',cardio:'هوازی',cooldown:'سردکردن'};
 const stageUsage=new Map();
 for(const session of [...plan.research.sessions,...plan.research.busy_cycle]){
  for(const [stage,items] of [['warmup',session.warm_up],['cardio',session.cardio.steps],['cooldown',session.cool_down]]){
   for(const item of items){
    if(!stageUsage.has(item.name_en))stageUsage.set(item.name_en,{stages:new Set(),names:new Set()});
    const usage=stageUsage.get(item.name_en);
    usage.stages.add(stage);
    usage.names.add(item.name_fa);
   }
  }
 }
 for(const [slug,sourceName,fa,en,query,aliases,how,reference,related=[]] of activities){
  const id='stage:'+slug;
  const usage=stageUsage.get(sourceName);
  if(!usage)continue;
  const categories=[...usage.stages];
  register({id,fa,en,query,how,category:'stage',categories,
   aliases:[sourceName,...usage.names,...aliasesOf(aliases)],
   group:categories.map(stage=>stageNames[stage]).join('، '),
   equip:['wall-scapular-push-up','wall-calf-stretch'].includes(slug)?'دیوار':
    slug==='easy-push-up'?'دیوار یا زمین':/supported|reverse-step|shallow-split/.test(slug)?'دیوار برای تعادل':'بدون وزنه',
   reference:references[reference],related,
   stageNote:slug==='easy-push-up'?'برای دیدن هر اجرا به‌صورت جداگانه، راهنمای شنای دیواری یا شنای روی زانو را باز کن.':
    slug==='unloaded-floor-press'?'منبع بیرونی الگوی پرس با دمبل را نشان می‌دهد. در گرم‌کردن فرمینو همان مسیر را با دست خالی تمرین کن.':''
  });
  stageIds.set(sourceName,id);
 }

 const legacyPlans=[window.FITNESS_PLAN_V2,window.FITNESS_PLAN_V3,window.FITNESS_PLAN_V4,window.FITNESS_PLAN_V43,window.FITNESS_PLAN_V411].filter(Boolean);
 const legacyLatest=Object.assign({},...legacyPlans.map(legacy=>legacy.exercises));
 const legacyNames={
  reverseFly:['بازکردن کش جلوی سینه در نسخهٔ قدیمی','Standing Band Pull-Apart (Legacy Reverse Fly)','standing chest height resistance band pull apart no anchor'],
  scapPull:['بارفیکس کتف با آرنج صاف','Scapular Pull-Up','scapular pull up straight elbows on bar'],
  assistedPullup:['بارفیکس کمکی روی میله','Assisted Pull-Up','controlled assisted pull up on secure pull up bar'],
  sidePlankReach:['پلانک پهلو روی ساعد با دست رو به سقف','Forearm Side Plank with Top Arm Raised','forearm side plank top arm pointing straight up'],
  reverseCrunchPause:['کرانچ معکوس با جمع‌کردن لگن و مکث بالا','Reverse Crunch with a Top Pause','reverse crunch pelvic curl top pause floor'],
  weightedCrunch:['کرانچ شکم با دمبل اختیاری نزدیک سینه','Abdominal Crunch with Optional Dumbbell at Chest','abdominal crunch holding dumbbell at chest floor']
 };
 function legacyGuide(id,exercise,key='legacy:'+id,history=[exercise]){
  const [fa,en,query]=legacyNames[id]||[exercise.fa,exercise.en,exercise.youtube||exercise.en];
  register({...exercise,id:key,fa,en,query,category:'legacy',
   aliases:history.flatMap(item=>[item.fa,item.en])
  });
 }
 for(const [id,exercise] of Object.entries(legacyLatest)){
  legacyGuide(id,exercise,'legacy:'+id,legacyPlans.map(item=>item.exercises[id]).filter(Boolean));
 }
 for(const id of ['inclinePushup','oneArmRow']){
  if(legacyPlans[0]?.exercises[id])legacyGuide(id,legacyPlans[0].exercises[id],'legacy-v2:'+id);
 }

 function normalize(value){
  return String(value).normalize('NFKC').toLowerCase()
   .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u064b-\u065f\u0640\u200e\u200f]/g,'')
   .replace(/[۰-۹٠-٩]/g,d=>String(d.charCodeAt(0)&15))
   .replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 }
 const compact=value=>normalize(value).replaceAll(' ','');
 const entries=[...library.values()];
 const searchable=entries.map(guide=>({
  guide,names:[guide.fa,guide.en,guide.id,...guide.aliases].map(compact),
  terms:compact([guide.fa,guide.en,guide.id,guide.group,guide.equip,guide.query,...guide.aliases].join(' '))
 }));
 function search(value,category='all'){
  const key=compact(value),tokens=normalize(value).split(' ').filter(Boolean);
  const candidates=searchable.filter(({guide})=>category==='all'||guide.category===category||guide.categories?.includes(category));
  const exactId=candidates.find(({guide})=>compact(guide.id)===key);
  if(exactId)return [exactId.guide];
  return candidates
   .map(({guide,names,terms})=>({
    guide,rank:!key?1:names[0]===key||names[1]===key?5:names.includes(key)?4:
     names.some(name=>name.includes(key))?3:terms.includes(key)||tokens.every(token=>terms.includes(token))?2:0
   }))
   .filter(item=>item.rank>0)
   .sort((a,b)=>Number(a.guide.category==='legacy')-Number(b.guide.category==='legacy')||b.rank-a.rank)
   .map(item=>item.guide);
 }
 function get(id,planVersion){
  const key=Number(planVersion)===2&&library.has('legacy-v2:'+id)?'legacy-v2:'+id:id;
  return library.get(key)||library.get('legacy:'+id);
 }
 return Object.freeze({entries,get,search,forStage:name=>library.get(stageIds.get(name))});
})();
