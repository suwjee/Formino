/* Formino Final · deterministic, conservative adaptation rules.
 * This is an implementable policy based on the supplied research blueprint,
 * not a clinically-validated automated prescription. Never infer pain, RIR,
 * equipment loads, range-of-motion or technique from a button press. */
window.FORMINO_ADAPT=(()=>{
 'use strict';
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 const DAY=86400000;
 const dateDiff=(a,b)=>{const x=Date.parse(a+'T12:00:00'),y=Date.parse(b+'T12:00:00');return Math.round((x-y)/DAY);};
 const validLoad=x=>Number.isFinite(Number(x))&&Number(x)>=2&&Number(x)<=8?Number(x):null;
 function getHistory(family,sessions,excludeId=null){
  return (sessions||[]).filter(s=>Number(s.planVersion)===7&&s.id!==excludeId)
   .sort((a,b)=>a.sessionNumber-b.sessionNumber||a.date.localeCompare(b.date))
   .flatMap(s=>(s.exerciseLogs||[]).filter(l=>l.familyId===family).map(l=>({...l,completedDate:s.date,sessionNumber:s.sessionNumber,sessionId:s.id})));
 }
 function success(log){return !!log?.sets?.length&&log.sets.every(s=>s.done&&!s.failed&&!s.failedAttempts&&Number(s.coachTarget)>0);}
 function completedWithoutPain(log){return success(log)&&log?.safetyClear!==false;}
 function lastGoal(log){return Number(log?.sets?.[0]?.coachTarget)||null;}
 function hasPain(state){return state?.activeSession?.safetyFlag===true;}
 function makeSets(targets,unit,load,source=[]){
  return targets.map((goal,i)=>{
   const old=source[i];if(old)return {...old,coachTarget:old.coachTarget??goal,coachLoad:old.coachLoad??load,coachUnit:old.coachUnit||(unit==='seconds'?'ثانیه':'تکرار')};
   return {done:false,failed:false,attempted:false,failedAttempts:0,reps:'',repsR:'',repsL:'',weight:'',rir:'',coachTarget:goal,coachLoad:load,coachUnit:unit==='seconds'?'ثانیه':'تکرار'};
  });
 }
 function resolve(row,settings,history,date,readiness='good',prevWeek=null){
  const P=window.FITNESS_PLAN;
  const fam=P.sourceExercises[row.familyId];
  if(!fam)throw Error('خانواده حرکت نامعتبر '+row.familyId);
  const cfg=settings.finalCalibration?.[fam.id]||{};
  let variantId=P.sourceVariants[cfg.variantId]?.family===fam.id?cfg.variantId:row.variantId;
  let variant=P.sourceVariants[variantId];
  // Pull-up skill may never silently become a complete pull-up.
  if(fam.id==='PULL'&&!settings.pullupBarVerified)variantId='PULL-V0';
  variant=P.sourceVariants[variantId];
  const ex=P.exercises[variantId];
  const recent=history.filter(h=>h.variantId===variantId&&h.sets?.length&&h.calibrationPending!==true);
  const last=recent.at(-1),prev=recent.length>1?recent.at(-2):null;
  let setsCount=row.sets,targets=Array.from({length:setsCount},(_,i)=>Number(row.targets[Math.min(i,row.targets.length-1)])||variant.initial_target||fam.base_target||6);
  const variantChanged=variantId!==row.variantId;
  if(variantChanged)targets=Array(setsCount).fill(variant.initial_target||fam.base_target||6);
  let reason='هدف پایه پژوهشی؛ نخست سطح و مقاومت مناسب خود را تأیید کن.';
  let load=null,atLimit=false,changed=false;
  if(ex.type==='weight')load=validLoad(last?.sets?.find(s=>s.coachLoad!=null)?.coachLoad)||validLoad(cfg.loadKg);
  const lastDate=(history||[]).at(-1)?.completedDate;
  const afterBreak=lastDate&&dateDiff(date,lastDate)>=14;
  // Research plan is conditional on an actual training history, never calendar-alone upgrades.
  if(last){
   const v=last.sets.map(s=>Number(s.coachTarget)||variant.initial_target||fam.base_target);
   targets=Array.from({length:setsCount},(_,i)=>v[Math.min(i,v.length-1)]||v[0]);
   const missed=last.sets.some(s=>s.failed||s.failedAttempts>0||!s.done);
   const hard=last.difficulty==='hard';
   if(missed||hard){
    const failureN=recent.slice(-2).filter(x=>x.difficulty==='hard'||x.sets.some(s=>s.failed||s.failedAttempts>0||!s.done)).length;
    if(failureN>=2){
      const currentIndex=fam.variants.findIndex(v=>v.id===variantId);
      if(currentIndex>0&&fam.id!=='PULL'){
       variantId=fam.variants[currentIndex-1].id;variant=fam.variants[currentIndex-1];
       targets=Array(setsCount).fill(variant.initial_target||fam.base_target);
       reason='دو اجرای دشوار یا ناتمام؛ بازگشت به نسخه آسان‌تر برای تثبیت فرم.';
      }else{targets=targets.map(v=>Math.max(variant.target_floor||fam.target_floor||1,Math.floor(v*.8)));reason='دو اجرای دشوار یا ناتمام؛ کاهش محافظه‌کارانه هدف.';}
      changed=true;
    }
    else reason='ست ناموفق/دشوار؛ افزایش فشار متوقف شد و هدف قبلی حفظ شد.';
   }else if(readiness!=='good'){
    reason='آمادگی امروز ایده‌آل نیست؛ افزایش دشواری انجام نمی‌شود.';
   }else if(afterBreak){
    reason='بازگشت پس از وقفه؛ هدف قبلی با حجم سبک‌تر آزمایش می‌شود.';
   }else if(setsCount!==last.sets.length){
    reason='تعداد ست تغییر کرده؛ ابتدا حجم جدید تثبیت شود، بدون افزایش هم‌زمان بار یا تکرار.';
   }else if(completedWithoutPain(last)){
    const ceil=variant.target_ceiling||fam.target_ceiling||20;
    const unit=variant.unit;
    const inc=unit==='seconds'?5:1;
    const goodEasy=last.difficulty==='easy';
    const stable=prev&&completedWithoutPain(prev)&&prev.difficulty===last.difficulty&&
      prev.variantId===last.variantId&&Number(prev.sets[0]?.coachLoad||0)===Number(last.sets[0]?.coachLoad||0)&&
      dateDiff(last.completedDate,prev.completedDate)<=21&&dateDiff(date,last.completedDate)<=21;
    if(goodEasy&&!targets.some(t=>t<ceil)&&stable&&prev.difficulty==='easy'){
      const idx=fam.variants.findIndex(v=>v.id===variantId);
      if(ex.type==='weight'){
       const available=(settings.availableDumbbellWeights||[]).map(Number).filter(v=>v>=2&&v<=8).sort((a,b)=>a-b);
       const next=available.find(w=>w>load+1e-6);
       if(next){load=next;targets=Array(setsCount).fill(variant.initial_target||fam.base_target);reason='دو اجرای آسان در سقف؛ ارتقا به پله واقعی بعدی دمبل.';changed=true;}
       else if(!available.length)reason='سقف عملکرد فعلی؛ پله‌های واقعی وزنه مشخص نیستند، ارتقا متوقف شد.';
       else if(idx<fam.variants.length-1&&fam.id!=='PULL'){
        variantId=fam.variants[idx+1].id;variant=fam.variants[idx+1];targets=Array(setsCount).fill(variant.initial_target||fam.base_target);reason='تسلط به نسخه فعلی؛ نسخه مکث‌دار/دشوارتر به شکل آزمون ست اول.';changed=true;
       }else{atLimit=true;reason='محدودیت تجهیزات یا نسخه؛ افزایش نامحدود تکرار مجاز نیست.';}
      }else if(idx<fam.variants.length-1 && fam.id!=='PULL'){
       variantId=fam.variants[idx+1].id;variant=fam.variants[idx+1];targets=Array(setsCount).fill(variant.initial_target||fam.base_target);reason='دو اجرای آسان در سقف؛ ارتقا به نسخه ایمن بعدی پس از احراز کنترل.';changed=true;
      }else{atLimit=true;reason='آخرین نسخه ایمن در سقف؛ پیشرفت جدید نیازمند بررسی توان/تجهیزات.';}
    }else if(targets.some(t=>t<ceil)){
      if(goodEasy ||(last.difficulty==='okay'&&stable)){
       if(goodEasy)targets=targets.map(v=>Math.min(ceil,v+inc));
       else{const idx=targets.indexOf(Math.min(...targets));targets[idx]=Math.min(ceil,targets[idx]+inc);}
       changed=true;reason=goodEasy?'اجرای کامل و آسان؛ افزایش محدود هدف ست‌ها.':'دو اجرای مناسب و مشابه؛ افزایش هدف یک ست.';
      }else reason='تثبیت هدف فعلی تا اجرای بعدی قابل‌مقایسه.';
    }else reason='هدف سقف با دشواری مناسب؛ حفظ تا احراز معیار ارتقا.';
   }
  }
  if(afterBreak){
   setsCount=Math.min(setsCount,Math.max(1,Math.ceil(setsCount/2)));
   targets=targets.slice(0,setsCount);changed=true;
   reason='وقفه 14 روز یا بیشتر؛ نصف حجم برای بازآشنایی، بدون افزایش فشار.';
  }
  if(readiness==='medium')reason+=' در روز خسته، کیفیت اجرا مقدم است.';
  if(fam.id==='PULL'&&variantId==='PULL-V3'){
   variantId='PULL-V2';variant=P.sourceVariants[variantId];targets=Array(setsCount).fill(variant.initial_target);reason='بارفیکس کامل فقط پس از آزمون مستقل ایمن فعال می‌شود.';
  }
  const finalEx=P.exercises[variantId];
  if(finalEx.type==='weight'&&load===null)reason+=' وزن واقعی دمبل باید در کالیبراسیون ثبت شود.';
  return {id:variantId,familyId:fam.id,variantId,targets,unit:variant.unit,perSide:!!variant.unilateral,
   load:finalEx.type==='weight'?load:null,calibrationPending:finalEx.type==='weight'&&load===null,
   coachReason:reason,rest:row.rest,setCount:setsCount,atLimit,changed,baseSets:row.sets,baseTargets:row.targets};
 }
 function familyVariantIds(id){return (window.FITNESS_PLAN.sourceExercises[id]?.variants||[]).map(v=>v.id);}
 function approvedVariant(family,id,settings){
  const v=window.FITNESS_PLAN.sourceVariants[id];if(!v||v.family!==family)return false;
  const ex=window.FITNESS_PLAN.exercises[id];if(ex.requiresBar&&!settings.pullupBarVerified)return false;
  if(ex.requiresBand&&!settings.bandChecked)return false;
  if(id==='PULL-V3'&&!settings.strictPullupConfirmed)return false;
  return true;
 }
 return {resolve,getHistory,makeSets,success,approvedVariant,familyVariantIds,validLoad,dateDiff};
})();
