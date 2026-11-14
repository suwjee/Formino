/* Formino 4.4 — cautious adaptive coach: objective completions + simple optional effort feedback.
   No invented RIR, unmeasured band tension, body-fat or weights. */
window.FORMINO_COACH=(()=>{
 'use strict';
 const loads={oneArmRow:4,oneArmRowPause:4,floorPress:4,floorPressPause:4,shoulderPress:2,bicepsCurl:2,hammerCurl:2,
  kickstandRdl:4,gobletSquat:4,gobletPause:4,tricepsFloor:2,suitcaseHold:4,dumbbellPullover:2,loadedCrunch:2};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function range(step){const text=String(step?.reps||'');const numbers=(text.match(/\d+/g)||[]).map(Number);
  const low=Math.max(1,numbers[0]||8),high=Math.max(low,numbers[1]||numbers[0]||12);
  const timed=/ثانیه|second|sec/i.test(text);return {low,high,timed,unit:timed?'ثانیه':'تکرار'};}
 function initial(step,ex){const r=range(step);const load=ex.type==='weight'?loads[step.id]||2:null;
  return {count:step.sets,targets:Array(step.sets).fill(r.low),unit:r.unit,low:r.low,high:r.high,
   rir:Number(step.goalRir)||3,load,loadUnit:ex.type==='weight'?'kg':'',rest:Number(step.rest)||75,
   reason:'تعداد هدف از ابتدا مشخص است. فقط ست‌هایی را تأیید کن که واقعاً با فرم صحیح کامل شده‌اند.',progressed:false,loadRaised:false,atLimit:false};
 }
 const effort=log=>['easy','okay','hard'].includes(log?.difficulty)?log.difficulty:null;
 function successful(log,expectedSets){return !!log?.sets&&log.sets.length===expectedSets&&log.sets.every(s=>{
  if(!s.done||s.failed||s.failedAttempts>0)return false;
  const goal=Number(s.coachTarget),recorded=s.repsR!==''&&s.repsL!==''&&s.repsR!=null&&s.repsL!=null?Math.min(Number(s.repsR),Number(s.repsL)):Number(s.reps);
  return Number.isFinite(goal)&&goal>0&&Number.isFinite(recorded)&&recorded>=goal;
 });}
 function loadFrom(l){const n=Number(l?.sets?.find(s=>s.done&&Number(s.coachLoad)>0)?.coachLoad);return Number.isFinite(n)&&n>0?n:null;}
 function recommend(step,ex,week,history=[]){
  const base=initial(step,ex),r=range(step);
  const same=history.filter(h=>h?.id===step.id&&h.sets?.length===step.sets).slice(-4);
  if(!same.length)return base;
  const last=same.at(-1),prev=same.length>1?same.at(-2):null;
  if(ex.type==='weight')base.load=clamp(loadFrom(last)||base.load||2,2,8);
  else base.load=null;
  const prevTarget=clamp(Number(last.sets[0]?.coachTarget)||r.low,r.low,r.high);
  base.targets=Array(step.sets).fill(prevTarget);
  const missed=last.sets.some(s=>s.failed||s.failedAttempts>0);
  if(missed){base.reason='در اجرای قبلی ست ناتمام ثبت شد. هدف ثابت می‌ماند و ابتدا باید کیفیت اجرا برگردد.';return base;}
  if(effort(last)==='hard'){
   base.reason='این حرکت دفعه قبل بیش‌ازحد سخت گزارش شده؛ افزایش فشار متوقف شد. اگر دوباره سخت بود نسخه آسان‌تر را انتخاب کن.';
   return base;
  }
  const matched=prev&&prev.sets?.every(s=>Number(s.coachTarget)===prevTarget)&&
    last.sets.every(s=>Number(s.coachTarget)===prevTarget)&&
    (ex.type!=='weight'||loadFrom(last)===loadFrom(prev));
  const ready=matched&&successful(last,step.sets)&&successful(prev,step.sets)&&effort(prev)!=='hard'&&effort(last)!=='hard';
  if(!ready){base.reason='تثبیت هدف: برای افزایش فشار، دو نوبت اجرای کامل و قابل‌مقایسه لازم است.';return base;}
  if(prevTarget<r.high){
   const delta=r.timed?Math.min(5,r.high-prevTarget):1;
   base.targets=Array(step.sets).fill(prevTarget+delta);base.progressed=true;
   base.reason=`دو اجرای کامل ثبت شده است: هدف هر ست ${delta} ${r.unit} بیشتر شد.`;return base;
  }
  if(ex.type==='weight'&&base.load<8){
   base.load=Math.min(8,base.load+2);base.loadRaised=true;base.targets=Array(step.sets).fill(r.low);
   base.reason='سقف تکرار دوبار تکمیل شد؛ وزنه یک پله بیشتر و تعداد تکرار به آغاز بازه بازگشت.';
  }else{
   base.atLimit=true;
   base.reason='سقف تکرار تثبیت شد. نسخه دشوارترِ ایمن با بازخورد «آسان» پیشنهاد می‌شود؛ اگر مقاومت محدود باشد، وزنه/کش مناسب‌تر در آینده سودمند است.';
  }
  return base;
 }
 function readyForVariant(id,rangeText,history=[],allowProtected=false){
  const ladder=window.FITNESS_PLAN?.movementLadders||{};
  const next=ladder[id];if(!next||next==='chinUp'&&!allowProtected)return null;
  const info=range({reps:rangeText});
  const match=history.filter(x=>x?.id===id&&x.sets?.length).slice(-2);
  if(match.length<2||match.some(x=>!successful(x,x.sets.length)||effort(x)!=='easy'))return null;
  // Increase the actual adjustable dumbbell up to 8 kg before changing to pause variants.
  if(window.FITNESS_PLAN?.exercises?.[id]?.type==='weight'&&match.some(x=>loadFrom(x)!==8))return null;
  if(match.some(x=>x.sets.some(s=>Number(s.coachTarget)<Math.max(info.low,info.high-2))))return null;
  // Chin-up requires a separately confirmed strict, pain-free repetition; scapular movement alone is insufficient.
  return next;
 }
 function makeSets(p,previous=[]){return p.targets.map((goal,i)=>{
  const old=previous[i];if(old)return {...old,failed:!!old.failed,failedAttempts:Number(old.failedAttempts)||0,
   coachTarget:Number(old.coachTarget)||goal,coachLoad:old.coachLoad??p.load,
   coachRir:old.coachRir??p.rir,coachUnit:old.coachUnit||p.unit};
  return {done:false,failed:false,attempted:false,failedAttempts:0,reps:'',repsR:'',repsL:'',weight:'',rir:'',
   coachTarget:goal,coachLoad:p.load,coachRir:p.rir,coachUnit:p.unit};
 });}
 return {range,initial,recommend,readyForVariant,successful,makeSets};
})();
