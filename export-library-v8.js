'use strict';

const fs=require('node:fs');
global.window=global;
for(const file of ['workouts-v2','workouts-v3','workouts-v4','workouts-v43','workouts-v411','research-data','workouts','tutorials-v8'])require('./'+file+'.js');
const program=require('./program-v8.js');
const guides=global.FORMINO_EXERCISE_GUIDES;
const tutorials=global.FORMINO_TUTORIALS;
const movements=new Map();
function collect(guide,number,prescription){
 let entry=movements.get(guide.id);
 if(!entry){entry={guide,doses:new Map()};movements.set(guide.id,entry);}
 if(!entry.doses.has(prescription))entry.doses.set(prescription,[]);
 entry.doses.get(prescription).push(number);
}
const numerals=s=>String(s??'').replace(/[۰-۹٠-٩]/g,ch=>String(ch.charCodeAt(0)&15));
for(let n=1;n<=120;n++){
 const s=program.forNumber(n);
 for(const step of s.steps){
  const targets=[...new Set(step.targets)].join(' / ');
  collect(guides.get(step.id,8),n,step.sets+' × '+targets+(step.unit==='seconds'?' ثانیه':' تکرار')+(step.side?' هر سمت':''));
 }
 for(const item of [...s.warmupItems,...s.cardioDetails.steps,...s.cooldownItems].flatMap(a=>[a,a.easyAlternative,a.alternative].filter(Boolean))){
  collect(guides.get(item.id)||guides.forStage(item.name_en),n,item.duration_seconds+' ثانیه در هر اجرا');
 }
 for(const skill of s.optionalSkills)collect(guides.get(skill.id,8),n,skill.sets+' × '+skill.target+(skill.unit==='seconds'?' ثانیه':' تکرار')+' (اختیاری)');
}
const out=[
 '# کتابخانه و ممیزی منابع آموزشی فرمینو',
 '',
 'تمام حرکت‌های فعال، جایگزین‌های هوازی و مهارت‌های اختیاری برنامهٔ 8 در این فهرست آمده‌اند. کارت‌های نسخه‌های قبلی همچنان در اپ قابل جست‌وجو هستند.',
 'برچسب «مطابق» به فرم و تجهیزات اصلی اشاره دارد. «الگوی پایه» یعنی بخشی از نسخه، تکیه‌گاه، تجهیز یا ریتم با تجویز فرمینو فرق دارد. اختلاف زیر همان لینک توضیح داده شده است.',
 'عبارت جست‌وجو برای بازیابی راهنما در اپ و جست‌وجوی بیرونی درج شده است. هدف و زمان هر جلسه را از برنامه بخوان.',
 ''
];
for(const [id,{guide:g,doses}] of movements){
 const {source,video,status}=tutorials[id]||{};
 out.push('## '+g.fa+' · '+g.en,'','شناسه: '+id,'',
  'تجهیزات: '+g.equip,'','عبارت جست‌وجو: '+g.query,'');
 if(g.muscles?.length)out.push('عضلات یا هدف: '+[...new Set(g.muscles)].join('، '),'');
 for(const [i,step] of g.how.entries())out.push((i+1)+'. '+step);
 out.push('','تنفس: '+(g.breathing||(g.category==='stage'||g.type==='time'?'آرام و پیوسته نفس بکش.':'در بخش پرفشار بازدم و در برگشت دم انجام بده.')),'');
 if(g.mistakes)out.push('خطای رایج: '+g.mistakes,'');
 const ex=program.exercises[id]||program.exercises[id.replace(/^legacy:/,'')];
 const safety=ex?.type==='weight'?'بست دمبل را بررسی کن. اگر اجرای ایمن هدف با 4 kg ممکن نیست، ست را ناتمام ثبت کن.':
  ex?.requiresBand?'کش تخت سالم، طول کافی و گرفتن مطمئن لازم است. از کفش غیرلغزنده استفاده کن و کش را از مسیر صورت دور نگه دار.':g.safety;
 if(safety)out.push('احتیاط: '+safety,'');
 if(source)out.push((status==='exact'?'مطابق فرم پایهٔ تجویز':'الگوی پایه با تفاوت ثبت‌شده')+' · ['+source.name+']('+source.url+')','',source.note||'','');
 if(video)out.push('[ویدئوی مستقیم '+video.name+(video.match==='base'?' · الگوی پایه':'')+']('+video.url+')','',video.note||'','');
 out.push('نمونهٔ تجویز جلسه: '+[...doses].slice(0,4).map(([dose,ns])=>dose+' (جلسهٔ '+ns[0]+')').join('؛ ')+'.','');
}
fs.writeFileSync('FORMINO_EXERCISE_LIBRARY_V8_FA.md',numerals(out.join('\n')));
console.log('Exported '+movements.size+' active movement guides.');

