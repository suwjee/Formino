'use strict';
const fs=require('node:fs');
const path=require('node:path');
global.window=globalThis;
for(const name of ['workouts-v2.js','workouts-v3.js','workouts-v4.js','workouts-v43.js','workouts-v411.js','research-data.js','workouts.js']){
 require(path.join(__dirname,name));
}
const plan=require('./program-v8.js');
const guides=global.FORMINO_EXERCISE_GUIDES;
const stageGuide=activity=>guides?.forStage(activity.name_en);
const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2,useGrouping:false});
const format=value=>number.format(value);
const seconds=total=>`${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
const latinDigits=text=>text.replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)&15));
const markdown=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
const english=value=>`<bdi dir="ltr">${markdown(value)}</bdi>`;
const intensity={easy:'سبک',moderate:'متوسط',vigorous:'تند کنترل‌شده'};
const stagePhase={work:'فعالیت',transition:'انتقال',recovery:'بازیابی'};
const lines=[
 '# برنامهٔ کامل 24 هفته‌ای تمرین فرمینو',
 '',
 'شناسهٔ برنامه: `FORMINO-FIXED-24W-V8`',
 '',
 'این سند از همان داده‌ای تولید شده که اپلیکیشن برای نمایش جلسه استفاده می‌کند. هر چرخهٔ تمرینی 5 جلسه دارد: 3 جلسهٔ تمام‌بدن، یک جلسهٔ هوازی پیوسته و یک جلسهٔ تناوبی. شمارهٔ جلسه با جابه‌جایی روزهای تمرین ثابت است.',
 '',
 'زمان‌ها با قالب دقیقه:ثانیه نمایش داده شده‌اند. زمان تخمینی از اجرای حرکت، مکث بین ست‌ها، تغییر سمت، آماده‌سازی تجهیزات، هوازی، گرم‌کردن، سردکردن و جابه‌جایی بین بخش‌ها به دست می‌آید. زمان واقعی می‌تواند با حفظ فرم و استراحت لازم بیشتر شود.',
 '',
 'ست تک‌طرفه بعد از تکمیل هدف هر دو سمت کامل است. حجم هفته بر اساس ست برنامه‌ریزی‌شدهٔ هر حرکت محاسبه می‌شود و یک ست تک‌طرفه در شمارش حجم 2 بار حساب نمی‌شود. یک حرکت چندمفصلی می‌تواند بیش از یک عضلهٔ اصلی داشته باشد، بنابراین جمع ستون عضلات با تعداد واقعی ست‌ها یکی نیست. سهم غیرمستقیم جداست و کار مهارتی میله یا ثبات میان‌تنه ست رشد مستقیم راست شکمی محسوب نمی‌شود.',
 '',
 'در حرکت دمبل‌دار، 4 kg وزن پایهٔ مشروط است. پله‌های بالاتر باید واقعی و یک‌بار تأیید شده باشند. ایستگاه‌ها در هفته‌های 5، 11 و 17 قرار دارند. هر بار فقط یک پلهٔ واقعی بالاتر و فقط بعد از دو اجرای موفق همان حرکت در همان وزنه مجاز است. سقف 8 kg است. بعضی حرکت‌های ظریف 4 kg می‌مانند و با تکرار یا کنترل بیشتر پیش می‌روند. اگر انجام صحیح ممکن نیست، ست ناتمام ثبت می‌شود و عدد هدف تغییر نمی‌کند.',
 '',
 'تمرین تناوبی از هفتهٔ 9 در بعضی جلسات به کار تند کنترل‌شده می‌رسد. مدت بازیابی و تعداد دور از قبل تعیین شده‌اند. اجرای متوسطِ هم‌زمان برای ورود تدریجی تعریف شده است. پرش فقط گزینهٔ هم‌زمانِ برخی نوبت‌ها و مشروط به تحمل قبلیِ ضربه است. در تمرین تند، تلاش بیشینه تجویز نشده است.',
 '',
 '| هفته | فاز | ست برنامه‌ریزی‌شده | دقیقه متوسط | دقیقه تند | دقیقهٔ معادل متوسط | مجموع زمان تخمینی |',
 '| ---: | --- | ---: | ---: | ---: | ---: | ---: |'
];
for(const week of plan.weeks){
 lines.push(`| ${week.week} | ${week.phase} | ${week.weekly_set_count} | ${format(week.moderateSeconds/60)} | ${format(week.vigorousSeconds/60)} | ${format(week.equivalentModerateSeconds/60)} | ${seconds(week.totalSeconds)} |`);
}

function appendActivities(activities,showPhase=false){
 lines.push('| ترتیب | نام فارسی | نام انگلیسی | زمان | شدت | روش اجرا |','| ---: | --- | --- | ---: | --- | --- |');
 activities.forEach((item,index)=>{
  const guide=stageGuide(item);
  const phase=showPhase?` · ${stagePhase[item.phase]}`:'';
  lines.push(`| ${index+1} | ${markdown(guide?.fa||item.name_fa)} | ${english(guide?.en||item.name_en)} | ${item.duration_seconds} ثانیه | ${intensity[item.intensity]}${phase} | ${markdown([item.instruction_fa,item.goal_fa,item.safety_fa].filter(Boolean).join(' '))} |`);
 });
 lines.push('');
}

function loadLabel(step){
 if(step.kind==='weight')return step.loadCheckpoint?`4 تا 8 kg · ایستگاه ${step.loadCheckpoint} و مشروط به پلهٔ واقعی`:'4 kg با فرم صحیح';
 return step.kind==='band'?'کشش ثابت و قابل‌کنترل، بدون معادل kg':'وزن بدن';
}
function appendExercise(step,index){
 const guide=guides?.get(step.id);
 const primary=step.muscles.primary.map(key=>plan.musclesFa[key]).join('، ');
 const secondary=step.muscles.secondary.map(key=>plan.musclesFa[key]).join('، ')||'—';
 const target=step.targets.join(' / ')+(step.unit==='seconds'?' ثانیه':' تکرار')+(step.side?' برای هر سمت':'');
 lines.push(`**${index+1}. ${guide?.fa||step.nameFa}** — ${english(guide?.en||step.nameEn)} · \`${step.id}\``,
  '',
  `- هدف تجویز: ${step.sets} ست با اهداف ${target}. مقاومت: ${loadLabel(step)}. تجهیزات: ${step.equipment}.`,
  `- عضلهٔ اصلی: ${primary}. مشارکت غیرمستقیم: ${secondary}.`,
  `- زمان: ${step.activeSeconds} ثانیه اجرا + ${step.betweenSetSeconds} ثانیه استراحت بین ست‌ها (هر فاصله ${step.rest} ثانیه) + ${step.sideChangeSeconds} ثانیه تغییر سمت (هر ست ${step.restSides} ثانیه) + ${step.setupSeconds} ثانیه آماده‌سازی = ${step.estimatedSeconds} ثانیه.`,
  `- اجرا: ${(guide?.how||step.techniqueNotes).join(' / ')}`,
  `- تمپو: ${step.unit==='reps'?`تقریباً ${step.tempoSeconds} ثانیه برای هر تکرار`:'نگه‌داشتن تا زمان تعیین‌شده همراه تنفس آرام'}. ${step.side?'هدف هر سمت جداست.':''}`,
  `- دلیل تجویز: ${step.rationale} ${step.loadRule}`,
  `- مسیر بعد از سقف فعلی: ${step.nextCycleOption}`,
  '');
}
function appendCardio(cardio){
 lines.push(`**${cardio.intensity_fa}.** ${cardio.rounds} دور × ${cardio.round_seconds} ثانیه = ${cardio.total_seconds} ثانیه. زمان فعالیت متوسط ${cardio.moderate_seconds}، تند ${cardio.vigorous_seconds}، بازیابی ${cardio.recovery_seconds} و انتقال ${cardio.transition_seconds} ثانیه است.`,
  '',
  cardio.goal_fa,
  '');
 appendActivities(cardio.steps,true);
 for(const item of cardio.steps){
  if(item.intensityGate)lines.push(`- شرط ورود به شدت تند: ${item.intensityGate.note}`);
  if(item.easyAlternative)lines.push(`- گزینهٔ هم‌زمان متوسط: ${item.easyAlternative.name_fa}، ${item.easyAlternative.duration_seconds} ثانیه در هر دور. ${item.easyAlternative.instruction_fa}`);
  if(item.alternative)lines.push(`- گزینهٔ اختیاری پرشی: ${item.alternative.name_fa}، ${item.alternative.duration_seconds} ثانیه در هر دور. ${item.alternative.instruction_fa}`);
 }
 lines.push('',cardio.progression_fa,'',cardio.safety_fa,'');
}
for(const week of plan.weeks){
 const prior=plan.weeks[week.week-2];
 const signed=value=>(value>0?'+':'')+format(value);
 const shift=prior?`تغییر نسبت به هفتهٔ قبل: ${signed(week.weekly_set_count-prior.weekly_set_count)} ست و ${signed((week.equivalentModerateSeconds-prior.equivalentModerateSeconds)/60)} دقیقهٔ معادل متوسط.`:
  'چرخهٔ اول برای تثبیت تکنیک و یافتن سرعت هوازی قابل مکالمه طراحی شده است.';
 const reason=week.week===8||week.week===16?'کاهش از پیش تعیین‌شدهٔ حجم به کیفیت تکرار و مدیریت خستگی کمک می‌کند.':
  'حجم روی 3 جلسهٔ تمام‌بدن پخش می‌شود تا کیفیت ست‌های هدف حفظ شود. بخش تند به یک جلسه در چرخه محدود است.';
 lines.push('',`## هفتهٔ ${week.week} · ${week.phase}`,'',week.goal_fa,'',shift,reason,'',
  '| عضله | ست مستقیم | سهم غیرمستقیم |','| --- | ---: | ---: |');
 for(const key of plan.muscleKeys)lines.push(`| ${plan.musclesFa[key]} | ${week.directSets[key]} | ${week.secondarySets[key]} |`);
 for(let i=0;i<5;i++){
  const session=plan.forNumber((week.week-1)*5+i+1);
  const time=session.timeBreakdown;
  lines.push('',`### جلسهٔ ${String(session.sessionNumber).padStart(3,'0')} · ${session.title}`,'',session.subtitle,'',
   `**زمان تخمینی ${seconds(session.durationSeconds)}.** گرم‌کردن ${seconds(time.warmupSeconds)}، بخش اصلی ${seconds(time.strengthSeconds)}، هوازی ${seconds(time.cardioSeconds)}، سردکردن ${seconds(time.cooldownSeconds)} و انتقال بین بخش‌ها ${seconds(time.transitionsSeconds)}.`,
   '',session.recoveryRule,'','#### گرم‌کردن','');
  appendActivities(session.warmupItems);
  lines.push('#### بخش اصلی','');
  session.steps.forEach(appendExercise);
  if(session.optionalSkills.length){
   lines.push('#### مهارت اختیاری میله','');
   for(const skill of session.optionalSkills){
    const guide=guides?.get(skill.id);
    lines.push(`- ${guide?.fa||plan.exercises[skill.id].fa} · ${english(guide?.en||plan.exercises[skill.id].en)} · \`${skill.id}\`. ${skill.sets} ست × ${skill.target} ${skill.unit==='seconds'?'ثانیه':'تکرار'}، ${skill.rest} ثانیه استراحت بین ست‌ها و ${skill.duration_seconds} ثانیه زمان اضافه.`,
     `- ${skill.prerequisite} ${skill.note}`,'');
   }
  }
  lines.push('#### هوازی','');
  appendCardio(session.cardioDetails);
  lines.push('#### سردکردن','');
  appendActivities(session.cooldownItems);
 }
}
const destination=path.join(__dirname,'FORMINO_24_WEEK_PLAN_V8_FA.md');
fs.writeFileSync(destination,latinDigits(lines.join('\n'))+'\n','utf8');
console.log(destination);
