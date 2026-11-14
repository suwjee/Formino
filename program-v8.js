/* Formino v8 fixed home-training curriculum. Historical prescriptions remain in their owning modules. */
(function(root){
'use strict';
const legacy=root.FITNESS_PLAN;
const programKey='FORMINO-FIXED-24W-V8';
const codes=['A','D','B','E','C'];
const bandExercises=['bandRow','bandCurl','lateralRaise'];
const exerciseOverrides={
 'CR-V2':{type:'weight',equip:'یک دمبل، زمین'},
 'SQ-V2':{type:'weight',equip:'یک دمبل'},
 'LAT-V1':{type:'weight',equip:'یک دمبل'}
};
const exercises={...legacy.exercises};
for(const id of bandExercises){
 const old=root.FITNESS_PLAN_V411.exercises[id];
 exercises[id]={...old,id,familyId:id,variantId:id,type:'band',side:false,requiresBand:true,tempo:3,equip:'کش پیلاتس تخت، بدون اتصال خارجی'};
}
for(const [id,override] of Object.entries(exerciseOverrides))exercises[id]={...exercises[id],...override};

const phases=[
 {from:1,to:4,name:'بازگشت و تثبیت فرم',note:'تکرارهای هدف از توان گزارش‌شدهٔ شنا پایین‌تر شروع می‌شوند. مقاومت دمبل از 4 kg مشروط به فرم صحیح شروع می‌شود.'},
 {from:5,to:8,name:'ساخت پایهٔ حجم',note:'حجم پایه افزایش می‌یابد. هفتهٔ 8 سبک‌تر و از پیش تعیین شده است. افزایش وزنه در ایستگاه پیشرفت مشروط است.'},
 {from:9,to:12,name:'انباشت حجم هدفمند',note:'ست‌های بیشتر روی سینه، زیربغل و شانه توزیع می‌شوند. فقط یک نوبت هوازی تناوبی در هر چرخه.'},
 {from:13,to:16,name:'توسعهٔ استقامت و حفظ حجم',note:'تناوب‌های کنترل‌شدهٔ هوازی طولانی‌تر می‌شوند. هفتهٔ 16 سبک‌تر و از پیش تعیین شده است.'},
 {from:17,to:20,name:'حجم بالاتر و مقاومت بیشتر مشروط',note:'برای حرکات بزرگ فقط پله‌های تأییدشدهٔ دمبل مجازند. برای حرکات ظریف، کنترل دامنه و تکرار در اولویت است.'},
 {from:21,to:24,name:'تثبیت و ارزیابی زیر بیشینه',note:'هفتهٔ 24 اهداف تثبیت‌شده دارد. تعداد ست‌های کامل، زمان و مقاومت تأییدشده در شرایط مشابه مقایسه شوند.'}
];
const weekGoals=[
 'بازگشت به الگوی تمرین، ثبت ایمن نخستین ست‌ها و شناخت سرعت راه‌رفتن درجا',
 'تکرار حرکات با دامنه و تمپوی ثابت، افزایش مختصر زمان هوازی',
 'افزایش محدود تکرارها و نخستین تناوب‌های متوسط',
 'تثبیت حجم پایه و مقایسهٔ ثبت‌ها با همان فرم و مقاومت',
 'افزایش ست‌های حرکات اصلی و بررسی نخستین پلهٔ واقعی وزنه',
 'افزایش زمان هوازی پیوسته و تثبیت ست‌های تازه',
 'افزایش حجم هدفمند سینه و پشت با حفظ فاصلهٔ استراحت',
 'هفتهٔ سبک برنامه‌ریزی‌شده، حفظ تکنیک و کاهش حجم',
 'بازگشت به حجم تمرینی، نخستین تناوب‌های تند کنترل‌شده',
 'تثبیت تکرارهای تازه در مقاومت ثابت',
 'فرصت پلهٔ واقعی بعدی دمبل در حرکات واجد شرایط',
 'تثبیت حجم سینه و سرشانه، پیشرفت زمان هوازی',
 'افزایش زمان کار تناوبی با ریکاوری مشخص',
 'حفظ کنترل تک‌پا و دامنهٔ کامل در ست‌های هدف',
 'بالاترین حجم این فاز با فاصلهٔ کافی میان جلسات مقاومتی',
 'هفتهٔ سبک برنامه‌ریزی‌شده، کاهش ست‌ها و هوازی تند',
 'فرصت آخرین پلهٔ واقعیِ برنامه‌ریزی‌شده تا سقف 8 kg',
 'تثبیت وزنه یا افزایش تکرار طبق هدف از پیش تعیین‌شده',
 'انباشت حجم سینه، پشت و سرشانه با حفظ تمرین پایین‌تنه',
 'پیشرفت مدت هوازی با حفظ یک روز تناوبی',
 'ادامهٔ حجم بالا و حفظ کنترل در تکرارهای پایانی',
 'تثبیت عملکرد در نسخه و مقاومت یکسان',
 'بیشترین زمان هوازی برنامه با شدت کنترل‌شده',
 'ارزیابی زیر بیشینه با اهداف تثبیت‌شده و مقایسهٔ اجرای واقعی'
];
const phaseOf=week=>phases.find(phase=>week>=phase.from&&week<=phase.to)||null;
const muscleKeys=['chest','lateral_deltoids','rear_deltoids','lats','upper_back','biceps','triceps','rectus_abdominis','quadriceps','hamstrings','glutes','calves','anterior_deltoids','brachialis','forearms','trunk_stability'];
const musclesFa={
 chest:'سینه',lateral_deltoids:'سرشانهٔ میانی',rear_deltoids:'سرشانهٔ خلفی',lats:'زیربغل',upper_back:'پشت بالایی',
 biceps:'جلو بازو',triceps:'پشت بازو',rectus_abdominis:'راست شکمی',quadriceps:'چهارسر ران',hamstrings:'پشت ران',
 glutes:'باسن',calves:'ساق',anterior_deltoids:'سرشانهٔ جلویی',brachialis:'براکیالیس',forearms:'ساعد',trunk_stability:'ثبات میان‌تنه'
};
const nextCycleOptions={
 body:'بعد از تکمیل هدف‌های پایان دوره با فرم ثابت، می‌توان نسخهٔ دارای مکث یا اهرم سخت‌تر را در برنامهٔ بعد انتخاب کرد.',
 weight:'اگر پلهٔ واقعی بالاتر در دسترس نیست و هدف با فرم ثابت کامل می‌شود، پس از بازبینی می‌توان تکرار، مکث کنترل‌شده یا نسخهٔ مکانیکی دشوارتر را در برنامهٔ بعد انتخاب کرد.',
 band:'اگر تکرارهای هدف آسان شده‌اند، فقط در محدودهٔ مجاز سازنده و با گرفتن ایمن، در برنامهٔ بعد موقعیت شروع را مشخص و ثابت کن.'
};
const loadProgression={
 startingKg:4,maxKg:8,checkpoints:[5,11,17],requiredCompletedExposures:2,
 rule:'فقط در ایستگاه‌های برنامه و پس از 2 اجرای پیاپی و موفق همان حرکت در وزن یکسان، پلهٔ واقعی تأییدشدهٔ بعدی تا 8 kg مجاز است. در غیر این صورت وزن قبلی حفظ می‌شود. از وزنهٔ تأییدنشده یا تکرار با فرم نامطمئن استفاده نکن.'
};
const stageSafety={
 warmup:'این مرحله برای آماده‌سازی است. سرعت و دامنه را در حد کنترل و راحتی نگه دار.',
 cooldown:'سرعت را آرام کم کن. حرکت یا کشش دردناک و حبس نفس لازم نیست.'
};
const cardioSafety='شدت را از روی مکالمه بسنج. در شدت متوسط جملهٔ کامل ممکن است؛ در بخش تند کنترل‌شده چند کلمه ممکن است. در صورت درد، سرگیجه، تنگی نفس غیرعادی یا از دست‌رفتن کنترل توقف کن.';
const titles={
 A:'تمام‌بدن A · سینه، زیربغل و هینج لگن',D:'هوازی پیوسته D · استقامت و ثبات میان‌تنه',
 B:'تمام‌بدن B · پرس، تمرین تک‌پا و پشت ران',E:'هوازی تناوبی E · تداوم ریتم و میان‌تنه',
 C:'تمام‌بدن C · سینه، شانه و پایین‌تنه'
};
const goals={
 A:'اولویت سینه و زیربغل، سپس اسکوات، هینج لگن و تمرین مستقیم بازو و شکم.',
 B:'پرس تک‌دست، کشش افقی با کش، تمرین تک‌پا و کار اختصاصی پشت بازو و پشت ران.',
 C:'شنا با مکث، زیربغل با مکث، سرشانهٔ میانی و خلفی، باسن و ساق.',
 D:'ساخت استقامت با هوازی متوسط پیوسته و تمرین کنترل تنه.',
 E:'پیشرفت هوازی با نوبت‌های تند کنترل‌شده و ریکاوری فعال؛ در انتها تنفس به‌آرامی عادی می‌شود.'
};
const recovery='جلسه‌ها به ترتیب اجرا می‌شوند. بین جلسه‌های مقاومتی حداقل یک روز فاصله باشد. پس از شیفت طولانی یا خواب ناکافی، روز را در تقویم برای استراحت علامت بزن و همان جلسه را بعداً اجرا کن.';
const equipment={weight:'یک دمبل قابل تنظیم، 4 تا 8 kg',band:'کش پیلاتس تخت و سالم، بدون اتصال خارجی',body:'وزن بدن',time:'وزن بدن'};

function activity(name_fa,name_en,duration_seconds,instruction_fa,intensity='easy',phase='work'){
 return {name_fa,name_en,duration_seconds,instruction_fa,intensity,phase};
}
const easyMarch=(seconds)=>activity('راه‌رفتن سبک درجا','Easy marching',seconds,'با گام کوتاه و بدون پرش شروع کن؛ تنفس راحت باشد.');
const slowMarch=(seconds)=>activity('راه‌رفتن آرام درجا','Slow marching',seconds,'سرعت و ارتفاع گام را به‌تدریج کم کن.','easy','recovery');
const armMarch=(seconds)=>activity('راه‌رفتن درجا با حرکت دست‌ها','Marching with arm swing',seconds,'بدون پرش، با قامت راحت و ریتم یکنواخت قدم بزن.','moderate');
const sideStep=(seconds,intensity='moderate')=>activity('گام جانبی بدون پرش','Side step',seconds,'با گام کوتاه به پهلو حرکت کن. زانو نرم و کف پا تحت کنترل باشد.',intensity);
const stepJack=(seconds)=>activity('پروانهٔ بدون پرش','Low-impact step jack',seconds,'هر بار فقط یک پا را به کنار ببر. دست‌ها در دامنهٔ راحت بالا بیایند.','moderate');
const briskMarch=(seconds,intensity='moderate')=>activity('راه‌رفتن تند درجا','Brisk March in Place',seconds,'ریتم قدم و حرکت دست را بیشتر کن؛ یکی از پاها همیشه روی زمین بماند.',intensity);
const easyBox=(seconds)=>activity('بوکس سایه‌ای سبک بدون وزنه','Easy shadow boxing',seconds,'آرام مشت بزن، آرنج را قفل نکن و در دامنهٔ راحت شانه بمان.','moderate');
const briskBox=(seconds)=>activity('بوکس سایه‌ای تند بدون پرش','Brisk Low-Impact Shadow Boxing',seconds,'با گام‌های کوچک و مشت‌های کنترل‌شده ریتم را بالا ببر؛ آرنج قفل نشود و وزنه‌ای در دست نباشد.','vigorous');
const climber=(seconds)=>activity('کوه‌نوردی گامی بدون پرش','Low-Impact Mountain Climber',seconds,'دست‌ها روی زمین؛ هر بار یک پا را گامی جلو بیاور و برگردان. لگن ثابت و مچ و شانه در وضعیت راحت بمانند.','vigorous');
function warmupFor(code){
 const ankle=activity('حرکت ملایم مچ پا و شانه','Ankle and shoulder mobility',60,'به هر ناحیه 30 ثانیه حرکت آرام و در دامنهٔ راحت بده.');
 const scap=activity('شنای کتف روی دیوار','Wall scapular push-up',45,'6 تکرار کوچک با آرنج صاف. سپس آمادهٔ مرحلهٔ بعد شو.');
 const hip=activity('تمرین هینج لگن بدون وزنه','Hip-hinge rehearsal',45,'5 تکرار کنترل‌شدهٔ هینج. لگن به عقب برود؛ وزنه استفاده نشود.');
 const squat=activity('اسکوات سبک بدون وزنه','Easy squat',45,'5 تکرار آرام در دامنهٔ راحت. هدف گرم‌شدن است.');
 const push=activity('شنای آسان برای گرم‌کردن','Easy push-up rehearsal',45,'5 تکرار کنترل‌شده در نسخهٔ دیواری یا زانو؛ پیش از خستگی توقف کن.');
 const floorPress=activity('تمرین پرس سینه تک‌دست روی زمین بدون وزنه','Unloaded floor press rehearsal',45,'در همان وضعیت پرس روی زمین، 5 تکرار آرام با دست خالی برای هر سمت انجام بده.');
 const progressive=activity('راه‌رفتن درجا با افزایش تدریجی سرعت','Progressive marching',90,'از گام سبک شروع کن و به ریتم قابل مکالمه برس.');
 const split=activity('اسپلیت اسکوات کم‌عمق کنار دیوار','Shallow split squat rehearsal',45,'3 تکرار هر سمت در دامنهٔ کوتاه، دست آزاد کنار دیوار.');
 const bridge=activity('پل باسن دوپا بدون وزنه','Easy glute bridge',45,'5 تکرار آرام، بدون قوس‌دادن کمر.');
 const reverse=activity('تمرین گام کوتاه به عقب کنار دیوار','Reverse-step rehearsal',45,'3 تکرار هر سمت در دامنهٔ کوتاه، دست آزاد کنار دیوار.');
 const common=[easyMarch(90),ankle];
 if(code==='D'||code==='E')return [...common,sideStep(60,'easy'),progressive];
 if(code==='B')return [...common,scap,split,bridge,floorPress];
 if(code==='C')return [...common,scap,reverse,bridge,push];
 return [...common,scap,squat,hip,push];
}
function cooldownFor(code){
 const breath=activity('تنفس آرام در حالت ایستاده','Relaxed breathing',60,'شانه‌ها را شل کن و به ریتم طبیعی نفس بکش.','easy','recovery');
 return [slowMarch(code==='D'||code==='E'?120:90),breath];
}

/* Each row owns its own progression by week. Stage names and exercise IDs use the existing guide catalog. */
const defaultRest=90;
const row=(id,primary,secondary,rest=defaultRest,switchSeconds=0,checkpoint=false)=>({id,primary,secondary,rest,switchSeconds,checkpoint});
const strengthBlocks={
 A:[
  row('PU-V2',['chest'],['triceps','anterior_deltoids'],150),
  row('ROW-V0',['lats','upper_back'],['biceps','rear_deltoids','forearms'],150,20,true),
  row('SQ-V2',['quadriceps'],['glutes','trunk_stability'],120,0,true),
  row('RDL-V1',['hamstrings','glutes'],['forearms'],150,0,true),
  row('lateralRaise',['lateral_deltoids'],[],75),
  row('BAND-V0',['rear_deltoids','upper_back'],[],75),
  row('BC-V0',['biceps'],['brachialis','forearms'],90,15),
  row('CR-V1',['rectus_abdominis'],[],75)
 ],
 B:[
  row('FP-V0',['chest'],['triceps','anterior_deltoids'],150,20,true),
  row('SS-V1',['quadriceps'],['glutes'],120,15),
  row('bandRow',['lats','upper_back'],['biceps','rear_deltoids'],105),
  row('OHP-V0',['anterior_deltoids'],['triceps','lateral_deltoids'],120,20),
  row('HW-V1',['hamstrings'],['glutes'],105),
  row('TRI-V0',['triceps'],[],90,15),
  row('CALF-V1',['calves'],[],75,15),
  row('RC-V1',['rectus_abdominis'],[],75)
 ],
 C:[
  row('PU-V3',['chest'],['triceps','anterior_deltoids'],150),
  row('ROW-V2',['lats','upper_back'],['biceps','rear_deltoids','forearms'],150,20,true),
  row('RL-V1',['quadriceps'],['glutes'],120,15),
  row('GB-V1',['glutes'],['hamstrings'],120,0,true),
  row('LAT-V1',['lateral_deltoids'],[],90,15),
  row('BAND-V0',['rear_deltoids','upper_back'],[],75),
  row('bandCurl',['biceps'],['brachialis','forearms'],75),
  row('CALF-V0',['calves'],[],75),
  row('CR-V2',['rectus_abdominis'],[],90)
 ]
};
const coreBlocks={
 D:[row('DB-V0',['trunk_stability'],[],60,12)],
 E:[row('SP-V0',['trunk_stability'],[],60,12)]
};
const repsById={
 'PU-V2':[6,7,8,9,9,10,11,11,12,12,12,12,13,13,14,14,14,14,15,15,15,16,16,16],
 'PU-V3':[5,5,6,6,7,7,8,8,8,9,9,10,10,10,11,11,11,12,12,12,13,13,14,14],
 'ROW-V0':[10,10,11,12,12,12,13,13,14,14,14,14,15,15,16,16,16,16,17,17,18,18,18,18],
 'ROW-V2':[8,9,10,10,10,11,12,12,12,13,13,14,14,14,15,15,15,15,16,16,16,17,18,18],
 'SQ-V2':[10,11,12,12,12,13,14,14,14,15,15,16,16,17,17,17,17,18,18,18,19,19,20,20],
 'RDL-V1':[10,11,12,12,12,13,13,13,14,14,14,15,15,16,16,16,16,16,17,17,18,18,18,18],
 'FP-V0':[8,9,10,10,10,11,12,12,12,13,13,14,14,15,15,15,15,15,16,16,17,17,18,18],
 'SS-V1':[8,9,10,10,11,12,12,12,13,13,14,14,15,15,16,16,16,17,17,18,18,19,20,20],
 bandRow:[10,11,12,12,13,14,14,14,15,16,16,17,17,18,18,18,19,19,20,20,21,21,22,22],
 'OHP-V0':[6,7,8,8,9,9,10,10,10,11,11,12,12,12,13,13,13,14,14,14,15,15,16,16],
 'HW-V1':[4,4,5,5,6,6,6,6,7,7,8,8,8,9,9,9,9,10,10,10,11,11,12,12],
 'TRI-V0':[6,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,14,15,15,16,16,17,18,18],
 'CALF-V1':[8,9,10,10,11,12,12,12,13,14,14,15,15,16,16,16,17,17,18,18,19,19,20,20],
 'CALF-V0':[12,13,14,14,15,16,16,16,17,18,18,19,19,20,20,20,21,21,22,22,23,23,24,24],
 'RC-V1':[6,7,8,8,9,10,10,10,11,11,12,12,13,13,14,14,14,15,15,16,16,17,18,18],
 'RL-V1':[6,7,8,8,9,9,10,10,11,11,12,12,12,13,13,13,14,14,15,15,16,16,16,16],
 'GB-V1':[10,11,12,12,12,13,14,14,15,15,15,16,16,17,17,17,17,18,18,18,19,19,20,20],
 'LAT-V1':[6,6,7,8,8,9,9,9,10,10,11,11,12,12,12,12,13,13,14,14,15,15,16,16],
 lateralRaise:[10,11,12,12,13,14,14,14,15,16,16,17,17,18,18,18,19,19,20,20,21,21,22,22],
 'BAND-V0':[10,11,12,12,13,14,14,14,15,16,16,17,17,18,18,18,19,19,20,20,21,21,22,22],
 'BC-V0':[8,9,10,10,11,12,12,12,13,13,14,14,15,15,16,16,16,17,17,18,18,19,20,20],
 bandCurl:[10,11,12,12,13,14,14,14,15,16,16,17,17,18,18,18,19,19,20,20,21,21,22,22],
 'CR-V1':[8,9,10,10,11,12,12,12,13,13,14,14,15,15,16,16,16,17,17,18,18,19,20,20],
 'CR-V2':[6,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,14,15,15,16,16,17,18,18],
 'DB-V0':[6,6,7,7,8,8,9,9,9,10,10,10,11,11,12,12,12,12,13,13,14,14,14,14],
 'SP-V0':[15,17,20,20,22,24,25,25,26,28,30,30,32,34,35,35,36,38,40,40,42,44,45,45]
};
const focusPrimary=new Set(['PU-V2','FP-V0','PU-V3','ROW-V0','ROW-V2','bandRow']);
const lowerBody=new Set(['SQ-V2','RDL-V1','SS-V1','HW-V1','RL-V1','GB-V1']);
const shoulderPriority=new Set(['lateralRaise','LAT-V1','BAND-V0']);
const core=new Set(['DB-V0','SP-V0']);
function setsFor(id,week){
 const lighter=week===8||week===16;
 if(core.has(id))return lighter?1:2;
 if(focusPrimary.has(id)){
  if(week<=2)return 2;
  if(lighter)return week===8?2:3;
  if(week>=17)return 4;
  if(week>=9&&['PU-V2','ROW-V0'].includes(id))return 4;
  return 3;
 }
 if(lowerBody.has(id))return week<=2||lighter?2:3;
 if(shoulderPriority.has(id)){
  if(week<=2)return 1;
  if(lighter)return 2;
  if(week>=17&&['lateralRaise','LAT-V1'].includes(id))return 4;
  return week>=7?3:2;
 }
 if(week<=2)return 1;
 if(lighter)return week===8?1:2;
 return week>=11&&['CALF-V1','CALF-V0','CR-V1','CR-V2','RC-V1','BC-V0','TRI-V0'].includes(id)?3:2;
}

const specificTempoSeconds={'PU-V3':4,'ROW-V2':4,'HW-V1':7};
function stepFor(spec,week){
 const exercise=exercises[spec.id];
 const guide=root.FORMINO_EXERCISE_GUIDES?.get(spec.id);
 const kind=exercise.type,side=!!exercise.side,unit=kind==='time'?'seconds':'reps';
 const sets=setsFor(spec.id,week),target=repsById[spec.id][week-1];
 const loadKg=kind==='weight'?loadProgression.startingKg:null;
 const loadCheckpoint=spec.checkpoint?loadProgression.checkpoints.filter(n=>week>=n).length:0;
 const tempoSeconds=specificTempoSeconds[spec.id]??Math.max(3,Number(exercise.tempo)||3);
 const activeSeconds=sets*target*(unit==='seconds'?1:tempoSeconds)*(side?2:1);
 const betweenSetSeconds=(sets-1)*spec.rest;
 const sideChangeSeconds=sets*spec.switchSeconds;
 const setupSeconds=kind==='weight'||kind==='band'?30:15;
 const estimatedSeconds=setupSeconds+activeSeconds+betweenSetSeconds+sideChangeSeconds;
 const targets=Array(sets).fill(target);
 const reps=target+(unit==='seconds'?' ثانیه':' تکرار');
 const loadRule=kind==='weight'?(loadCheckpoint?loadProgression.rule:'4 kg با فرم صحیح. اگر با 4 kg کنترل کامل ممکن نیست، ست را کامل ثبت نکن.'):
  kind==='band'?'فقط کش تخت سالم با طول کافی و کشش مجاز سازنده. موقعیت گرفتن را ثابت نگه دار و کشش را به kg تبدیل نکن.':'دامنه و تمپوی ثابت؛ تا عدد هدف با فرم صحیح پیش برو.';
 const rationale=week===8||week===16?'هفتهٔ سبک از پیش تعیین شده؛ الگوی حرکت و هدف تکرار حفظ می‌شود و تعداد ست‌ها کمتر است.':
  loadCheckpoint&&kind==='weight'?'وزنهٔ واقعی فقط با احراز معیار در ایستگاه برنامه؛ اعداد هدف ست از پیش ثابت‌اند.':
  'پیشرفت با افزایش برنامه‌ریزی‌شدهٔ تکرار یا حجم در دامنهٔ قابل‌کنترل.';
 const setTargets=targets.map((value,index)=>({set:index+1,target:value,unit,per_side:side}));
 const sourceRow={exercise_id:exercise.familyId||spec.id,variant_id:spec.id,sets,set_targets:setTargets,
  rest_between_sets_seconds:spec.rest,rest_between_sides_seconds:spec.switchSeconds,
  active_seconds:activeSeconds,setup_seconds:setupSeconds,side_change_total_seconds:sideChangeSeconds,
  between_set_rest_total_seconds:betweenSetSeconds,estimated_seconds:estimatedSeconds};
 return {id:spec.id,original:exercise.familyId||spec.id,familyId:exercise.familyId||spec.id,variantId:spec.id,
  sets,targets,reps,unit,side,rest:spec.rest,restSides:spec.switchSeconds,kind,loadKg,loadCheckpoint,
  loadRule,rationale,nextCycleOption:nextCycleOptions[kind]||nextCycleOptions.body,tempoSeconds,setupSeconds,activeSeconds,betweenSetSeconds,sideChangeSeconds,estimatedSeconds,
  equipment:kind==='weight'?equipment.weight:guide?.equip||equipment[kind],nameFa:guide?.fa||exercise.fa,nameEn:guide?.en||exercise.en,
  techniqueNotes:guide?.how||exercise.how,requiresBand:kind==='band',muscles:{primary:spec.primary,secondary:spec.secondary},sourceRow};
}
const strengthCardioMinutes=[6,7,8,8,9,10,10,8,11,12,12,13,13,14,14,10,15,15,15,15,16,16,16,16];
const continuousMinutes=[16,18,20,22,24,25,26,20,27,28,29,30,31,32,33,25,35,36,37,39,41,43,45,45];
// [rounds, fast seconds, transition seconds, easy seconds]. Work becomes vigorous from week 9 outside deloads.
const intervals=[
 [6,20,0,70],[7,20,0,70],[8,20,0,70],[8,25,0,65],
 [8,30,5,55],[9,30,5,55],[10,30,5,55],[7,25,5,60],
 [8,30,5,60],[9,30,5,60],[10,30,5,55],[10,35,5,55],
 [10,35,5,50],[11,35,5,50],[11,40,5,50],[8,25,5,60],
 [11,40,5,50],[12,40,5,50],[12,45,5,45],[12,45,5,45],
 [12,50,5,45],[12,50,5,45],[12,55,5,40],[12,55,5,40]
];

function cardioFor(code,week){
 if(code==='E'){
  const [rounds,fast,transition,easy]=intervals[week-1];
  const vigorous=week>=9&&week!==16;
  const fastMotion=!vigorous?briskMarch(fast):week>=17&&week%2===1?climber(fast):week%2===0?briskBox(fast):briskMarch(fast,'vigorous');
  if(vigorous){
   fastMotion.easyAlternative={...briskMarch(fast,'moderate'),gate:'moderate-fallback'};
   fastMotion.intensityGate={
    prerequisite:'successful-recent-cardio',
    note:'اگر هنوز تناوب متوسط را با کنترل کامل نکرده‌ای، همین زمان را با راه‌رفتن تندِ قابل مکالمه اجرا کن. در بخش تند برای سرعت بیشینه تلاش نکن.'
   };
  }
  if(week>=13&&week!==16&&vigorous&&week%2===0){
   fastMotion.alternative={
    ...activity('پروانهٔ پرشی','Jumping Jack',fast,'فقط در صورت تحمل قبلی ضربه، نبود درد و وجود فضای امن. پرش کوتاه و فرود نرم و کنترل‌شده. در صورت شک نسخهٔ بدون پرش را اجرا کن.','vigorous'),
    gate:'impact-ready'
   };
  }
  const steps=[fastMotion];
  if(transition){
   steps.push({...easyMarch(transition),phase:'transition',instruction_fa:'درجا قدم بزن و با کنترل به حرکت ریکاوری برو.'});
  }
  steps.push({...easyMarch(easy),phase:'recovery',instruction_fa:'درجا آرام راه برو تا تنفس قابل کنترل شود.'});
  const round_seconds=fast+transition+easy;
  return {kind:vigorous?'controlled-hiit':'moderate-intervals',rounds,round_seconds,total_seconds:rounds*round_seconds,steps,
   intensity_fa:vigorous?'تناوب تند کنترل‌شده و بازیابی سبک، بدون تلاش بیشینه':'تناوب متوسط و بازیابی سبک',
   intensity:vigorous?'تناوب تند کنترل‌شده و بازیابی سبک، بدون تلاش بیشینه':'تناوب متوسط و بازیابی سبک',
   vigorous_seconds:vigorous?rounds*fast:0,moderate_seconds:vigorous?0:rounds*fast,
   recovery_seconds:rounds*easy,transition_seconds:rounds*transition,
   goal_fa:'حفظ ریتم قابل کنترل در همهٔ دورها و بازگشت تدریجی تنفس در بازیابی.',
   progression_fa:'افزایش تدریجی دور یا مدت بخش تند؛ در هفته‌های سبک فشار کمتر و در پایان دوره سنجش اجرای ثابت.',
   safety_fa:cardioSafety};
 }
 const minutes=(code==='D'?continuousMinutes:strengthCardioMinutes)[week-1];
 const rounds=code==='D'?minutes:1;
 const round_seconds=code==='D'?60:minutes*60;
 const middle=code==='B'?easyBox:code==='C'?stepJack:sideStep;
 const steps=code==='D'?[armMarch(30),sideStep(15),briskMarch(15)]:
  [armMarch(round_seconds/2),middle(round_seconds/2)];
 const intensity='متوسط پیوسته؛ امکان گفتن جملهٔ کامل';
 return {kind:'mict',rounds,round_seconds,total_seconds:minutes*60,steps,intensity,intensity_fa:intensity,
  vigorous_seconds:0,moderate_seconds:minutes*60,recovery_seconds:0,transition_seconds:0,
  goal_fa:code==='D'?'استقامت هوازی با حفظ ریتم قابل مکالمه.':'افزودن کار هوازی پیوسته بعد از تمرین مقاومتی.',
  progression_fa:'افزایش زمان با ریتم کنترل‌شده. تغییر حرکت با یک گام روان در زمان همان بخش انجام می‌شود.',
  safety_fa:cardioSafety};
}

function optionalSkillsFor(code,week){
 if(code!=='B')return [];
 let skill;
 if(week<=4)skill={id:'PULL-V0',sets:2,target:8,unit:'seconds',gate:'bar-safe',rest:60,
  prerequisite:'پاها در حالت آویز روی زمین بمانند. نصب، ظرفیت تحمل وزن، دسترسی و خروج امن تأیید شده باشند.'};
 else if(week<=8)skill={id:'PULL-V1',sets:2,target:10,unit:'seconds',gate:'bar-safe',rest:75,
  prerequisite:'ابتدا آویز کمک‌گرفته با پاها روی زمین را بدون درد و با کنترل انجام داده باش.'};
 else if(week<=16)skill={id:'PULL-V2',sets:2,target:5,unit:'reps',gate:'bar-safe',rest:75,
  prerequisite:'پیش از اجرای تکرارهای کتف، آویز فعال 10 ثانیه‌ای باید بدون درد و تاب قابل کنترل باشد.'};
 else skill={id:'PULL-V3',sets:2,target:2,unit:'reps',gate:'bar-safe-and-pullup-capable',rest:120,
  prerequisite:'ایمنی و دسترسی میله تأیید شده باشد و 3 بارفیکس کاملِ کنترل‌شده، بدون پرش و بدون تلاش اجباری از قبل احراز شده باشد.'};
 const active=skill.sets*skill.target*(skill.unit==='seconds'?1:4);
 return [{...skill,side:false,duration_seconds:15+active+(skill.sets-1)*skill.rest,
  note:'مهارت اختیاری. اگر شرط ورود برقرار نیست، از این بخش عبور کن. ست مهارتی در حجم عضله‌سازی برنامه منظور نمی‌شود.'}];
}

const phaseLabel=week=>phaseOf(week).name;
function sumSeconds(items){return items.reduce((sum,item)=>sum+item.duration_seconds,0);}
function makeSession(week,code,index){
 const sessionNumber=(week-1)*codes.length+index+1,sessionId='S'+String(sessionNumber).padStart(3,'0');
 const kind=code==='D'||code==='E'?'cardio':'strength';
 const steps=(strengthBlocks[code]||coreBlocks[code]).map(spec=>stepFor(spec,week));
 const warmupItems=warmupFor(code).map(item=>({...item,goal_fa:'آماده‌سازی برای الگوی حرکتی همین جلسه با خستگی کم.',safety_fa:stageSafety.warmup}));
 const cooldownItems=cooldownFor(code).map(item=>({...item,goal_fa:'کاهش تدریجی شدت و بازگشت به ریتم تنفس طبیعی.',safety_fa:stageSafety.cooldown}));
 const cardioDetails=cardioFor(code,week);
 const optionalSkills=optionalSkillsFor(code,week);
 const warmupSeconds=sumSeconds(warmupItems),cooldownSeconds=sumSeconds(cooldownItems);
 const strengthSeconds=steps.reduce((sum,step)=>sum+step.estimatedSeconds,0);
 const transitionsSeconds=kind==='strength'?90:60;
 const durationSeconds=warmupSeconds+strengthSeconds+cardioDetails.total_seconds+cooldownSeconds+transitionsSeconds;
 const weekGoal=weekGoals[week-1];
 const phase={...phaseOf(week),rir:'بدون ورود دستی شدت یا تکرار ذخیره'};
 const formatStage=items=>items.map(item=>item.name_fa+' · '+item.duration_seconds+' ثانیه').join('، ');
 const raw={
  id:sessionId,session_number:sessionNumber,week,type:code,title_fa:titles[code],goal_fa:goals[code],phase:phaseLabel(week),
  warm_up:warmupItems,main:steps.map(step=>step.sourceRow),cardio:cardioDetails,cool_down:cooldownItems,
  duration_seconds:durationSeconds,transitions_seconds:transitionsSeconds,optional_skills:optionalSkills,
  assessment_slot_seconds:0,assessment_fa:week===24?'در آخرین ستِ برنامه فقط اجرای واقعی هدف ثابت را ثبت کن.':'',
  progression_fa:weekGoal,recovery_fa:recovery
 };
 return {
  code,week,sessionId,sessionNumber,planVersion:8,programId:programKey,executionMode:'full',
  title:titles[code],subtitle:goals[code],kind,focus:kind==='strength'?'full-body-'+code:'cardio-'+code,
  tone:kind==='strength'?'green':'blue',phase,steps,optionalSkills,optionalSkillSeconds:sumSeconds(optionalSkills),
  warmup:warmupSeconds/60,strength:strengthSeconds/60,cardioMinutes:cardioDetails.total_seconds/60,
  cooldown:cooldownSeconds/60,duration:Math.round(durationSeconds/6)/10,durationSeconds,
  warmupItems,cardioDetails,cooldownItems,warmupText:formatStage(warmupItems),cardio:`${cardioDetails.rounds} دور × ${cardioDetails.round_seconds} ثانیه. ${formatStage(cardioDetails.steps)}`,
  cooldownText:formatStage(cooldownItems),transitionsSeconds,assessmentSeconds:0,
  timeBreakdown:{warmupSeconds,strengthSeconds,cardioSeconds:cardioDetails.total_seconds,cooldownSeconds,transitionsSeconds},
  orderNote:'گرم‌کردن، حرکت‌های اصلی، هوازی و سردکردن. حرکت مهارتی اختیاری را فقط در صورت احراز شرایط و پس از گرم‌کردن انجام بده.',
  weekGoal,performanceRule:weekGoal,recoveryRule:recovery,barNote:optionalSkills[0]?.prerequisite||'',
  emphasis:goals[code],research:raw
 };
}
function weeklySummary(week,sessions){
 const directSets=Object.fromEntries(muscleKeys.map(key=>[key,0]));
 const secondarySets=Object.fromEntries(muscleKeys.map(key=>[key,0]));
 for(const session of sessions){
  for(const step of session.steps){
   for(const muscle of step.muscles.primary)directSets[muscle]+=step.sets;
   for(const muscle of step.muscles.secondary)secondarySets[muscle]+=step.sets;
  }
 }
 const moderateSeconds=sessions.reduce((sum,session)=>sum+session.cardioDetails.moderate_seconds,0);
 const vigorousSeconds=sessions.reduce((sum,session)=>sum+session.cardioDetails.vigorous_seconds,0);
 return {
  week,phase:phaseLabel(week),goal_fa:weekGoals[week-1],session_ids:sessions.map(session=>session.sessionId),
  weekly_set_count:sessions.flatMap(session=>session.steps).reduce((sum,step)=>sum+step.sets,0),
  moderateSeconds,vigorousSeconds,equivalentModerateSeconds:moderateSeconds+vigorousSeconds*2,
  cardioTotalSeconds:sessions.reduce((sum,session)=>sum+session.cardioDetails.total_seconds,0),
  totalSeconds:sessions.reduce((sum,session)=>sum+session.durationSeconds,0),directSets,secondarySets
 };
}
const plans=Array.from({length:24},(_,index)=>codes.map((code,position)=>makeSession(index+1,code,position))).flat();
const forNumber=number=>Number.isInteger(number)?plans[number-1]||null:null;
const prescription=(week,code)=>Number.isInteger(week)&&codes.includes(code)?forNumber((week-1)*codes.length+codes.indexOf(code)+1):null;
const weeks=Array.from({length:24},(_,index)=>weeklySummary(index+1,plans.slice(index*5,(index+1)*5)));
const sessions=plans.slice(0,5).map(session=>({
 code:session.code,title:session.title,kind:session.kind,focus:session.focus,tone:session.tone,subtitle:session.subtitle,
 steps:session.steps.map(step=>[step.id,step.sets,step.reps,step.rest])
}));
const metadata={program_id:programKey,version:8,title_fa:'فرمینو · برنامهٔ ثابت 24 هفته‌ای',sessions_count:120,
 resistance_sessions_count:72,aerobic_sessions_count:48,calendar_duration_not_guaranteed:true};
const research={metadata,sessions:plans.map(session=>session.research),weeks};
const api={version:8,programKey,metadata,research,exercises,sessions,weeks,weekGoals,phases,phaseOf,forNumber,prescription,
 busyForNumber:forNumber,cardioMinutesFor:(week,code)=>prescription(week,code)?.cardioMinutes||0,
 muscleKeys,musclesFa,loadProgression,cardioSafety};
root.FORMINO_PROGRAM_V8=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
