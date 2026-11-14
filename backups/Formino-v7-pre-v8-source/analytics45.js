/* Formino 4.5 — pure, offline analytics. No synthetic measurements or inferred body composition. */
(function(root){
'use strict';
const muscleNames=['سینه','پشت و زیربغل','سرشانه','جلو بازو','پشت بازو','ران','پشت ران','ساق','باسن','شکم و میان‌تنه','ساعد','عضلات کنترل‌کننده شانه'];
const muscleFor=ex=>({شکم:'شکم و میان‌تنه'})[ex?.group]||ex?.group||null;
function secondaryFor(ex){
 const m=muscleFor(ex), names=(ex?.muscles||[]).join('،');let s=[];
 if(m==='سینه'){if(/پشت بازو|سه‌سر/.test(names))s.push('پشت بازو');if(/سرشانه/.test(names))s.push('سرشانه');}
 if(m==='پشت و زیربغل'){if(/جلو بازو|دوسر|براکیالیس/.test(names))s.push('جلو بازو');if(/پشت شانه/.test(names))s.push('سرشانه');}
 if(m==='سرشانه'&&/پشت بازو/.test(names))s.push('پشت بازو');
 if(m==='ران'&&/باسن/.test(names))s.push('باسن (مشارکت در تمرین پا)');
 if(m==='پشت ران'&&/باسن/.test(names))s.push('باسن (مشارکت در تمرین پا)');
 return [...new Set(s)];
}
function safeNumber(x){return x===''||x===undefined||x===null?null:Number.isFinite(Number(x))?Number(x):null;}
function usableSet(s){return !!s?.done && !s?.failed;}
function bestOf(exLog){
 const sets=(exLog.sets||[]).filter(usableSet);if(!sets.length)return null;
 const values=sets.map(s=>{const r=safeNumber(s.repsR),l=safeNumber(s.repsL),v=r!==null&&l!==null?Math.min(r,l):safeNumber(s.reps);return {value:v??safeNumber(s.coachTarget),load:safeNumber(s.coachLoad)??safeNumber(s.weight),unit:s.coachUnit||'',confirmedOnly:v===null};}).filter(x=>x.value!==null&&x.value>0);
 if(!values.length)return null;const first=values[0];const same=values.filter(x=>x.load===first.load&&x.unit===first.unit);return {...same.reduce((a,b)=>b.value>a.value?b:a),completed:sets.length,planned:exLog.sets.length,failed:(exLog.sets||[]).filter(s=>s.failed).length,difficulty:exLog.difficulty||null};
}
function histories(sessions,exercises){let all=[];for(const sess of sessions||[])for(const log of sess.exerciseLogs||[]){const b=bestOf(log);if(!b)continue;all.push({id:log.id,date:sess.date,sessionNumber:sess.sessionNumber,week:Math.ceil((sess.sessionNumber||1)/5),variant:log.id,name:exercises[log.id]?.fa||log.id,...b});}return all.sort((a,b)=>a.date.localeCompare(b.date)||a.sessionNumber-b.sessionNumber);}
function bestProgress(rows,id){const matching=rows.filter(x=>x.id===id);const baseline=matching[0];const latest=matching.at(-1);if(!latest)return {rows:[],baseline:null,latest:null,comparison:null};
 const comparable=matching.filter(x=>x.load===latest.load&&x.unit===latest.unit);
 const base=comparable[0],end=comparable.at(-1);return {rows:matching,baseline,latest,comparison:base&&end&&comparable.length>1?{first:base.value,last:end.value,delta:end.value-base.value,percent:base.value?100*(end.value-base.value)/base.value:null,n:comparable.length,load:end.load,unit:end.unit}:null};
}
function weeklyVolume(sessions,plan,exercises,week){
 const totals={};for(const name of [...muscleNames,'باسن (مشارکت در تمرین پا)'])totals[name]={name,planned:0,done:0,indirect:0,failed:0};
 for(let index=0;index<5;index++){
  const n=(week-1)*5+index+1,p=plan.forNumber(n);if(!p)continue;
  for(const step of p.steps){const name=muscleFor(exercises[step.id]),rec=totals[name];if(rec)rec.planned+=step.sets;}
  const recorded=(sessions||[]).find(x=>Number(x.sessionNumber)===n);if(!recorded)continue;
  for(const l of recorded.exerciseLogs||[]){const ex=exercises[l.id],name=muscleFor(ex),d=(l.sets||[]).filter(usableSet).length,failed=(l.sets||[]).filter(z=>z.failed).length;
   if(totals[name]){totals[name].done+=d;totals[name].failed+=failed;}
   for(const key of secondaryFor(ex))if(totals[key])totals[key].indirect+=d;
  }
 }
 return Object.values(totals).filter(x=>x.planned||x.done||x.indirect);
}
function cardioByProgramWeek(sessions,plan){return Array.from({length:24},(_,i)=>{
 const week=i+1;const logs=(sessions||[]).filter(x=>Math.ceil(Number(x.sessionNumber)/5)===week);const done=logs.reduce((sum,s)=>{
  const prescribed=plan.forNumber(s.sessionNumber);return sum+(s.cardioConfirmed?Math.max(0,Number(s.cardioMin)||Number(prescribed?.cardioMinutes)||0):0);
 },0);return {week,minutes:done,confirmed:logs.filter(x=>x.cardioConfirmed).length};
 });}
function symmetry(measurements,left,right){const points=[];for(const m of [...(measurements||[])].sort((a,b)=>a.week-b.week)){const l=safeNumber(m[left]),r=safeNumber(m[right]);if(l===null||r===null)continue;points.push({week:Number(m.week),date:m.date,value:Math.abs(l-r),left:l,right:r});}return points;}
function sessionTotals(sessions){return (sessions||[]).reduce((a,s)=>{a.sessions++;if(s.status==='completed')a.complete++;else a.partial++;for(const x of s.exerciseLogs||[])for(const q of x.sets||[]){a.planned++;if(q.done&&!q.failed)a.sets++;if(q.failed)a.failed++;}a.cardioMinutes+=s.cardioConfirmed?(Number(s.cardioMin)||0):0;return a;},{sessions:0,complete:0,partial:0,sets:0,planned:0,failed:0,cardioMinutes:0});}
function insights(sessions,measurements,exercises,plan){let result=[];const logs=histories(sessions,exercises);
 const byId=new Map();for(const r of logs)if(!byId.has(r.id))byId.set(r.id,[]);for(const r of logs)byId.get(r.id).push(r);
 for(const [id,rows] of byId){if(rows.length<3)continue;const l=rows.slice(-3);const same=l.every(x=>x.load===l[0].load&&x.unit===l[0].unit);
  if(same&&l[2].value>l[0].value)result.push({type:'good',text:`${exercises[id]?.fa||id}: عملکرد در 3 اجرای قابل‌مقایسه اخیر بهتر شده است.`});
  else if(same&&l.every(x=>x.value===l[0].value)&&l.some(x=>x.difficulty==='hard'||x.failed))result.push({type:'watch',text:`${exercises[id]?.fa||id}: چند اجرای مشابه بدون افزایش عملکرد ثبت شده؛ کیفیت اجرا، خواب و مقاومت را بررسی کن.`});
  if(result.length>=4)break;
 }
 for(const key of ['abdomen','waist']){const arr=(measurements||[]).filter(m=>safeNumber(m[key])!==null).sort((a,b)=>a.week-b.week);
  if(arr.length>=2){const a=arr[0],b=arr.at(-1),delta=b[key]-a[key];if(delta<-.5)result.push({type:'neutral',text:`${key==='waist'?'دور کمر':'دور شکم'} از ثبت نخست ${Math.abs(delta).toFixed(1)} cm کمتر است؛ این تغییر به‌تنهایی اثبات کاهش چربی خالص نیست.`});}}
 if(result.length===0)result.push({type:'neutral',text:'برای تحلیل روند، چند جلسه قابل‌مقایسه و دست‌کم 2 اندازه‌گیری واقعی ثبت کن. فعلاً نتیجه‌ای حدس زده نمی‌شود.'});
 return result.slice(0,5);
}
function weekHeatmap(sessions,startDate,shiftDates,unavailable,rest,now,days=84){
 const byDay=new Map((sessions||[]).map(x=>[x.date,x]));const shifts=new Set(shiftDates||[]),unavail=new Set(unavailable||[]),restDays=new Set(rest||[]);
 const parse=s=>new Date(s+'T12:00:00');const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const end=parse(now),out=[];for(let n=days-1;n>=0;n--){const d=new Date(end);d.setDate(d.getDate()-n);const iso=fmt(d);const sess=byDay.get(iso);const kind=iso<startDate?'before':sess?sess.status==='completed'?'complete':'partial':shifts.has(iso)?'shift':restDays.has(iso)?'rest':unavail.has(iso)?'unavailable':'open';out.push({date:iso,kind,weekday:d.getDay()});}return out;
}
return root.FORMINO_ANALYTICS={muscleNames,muscleFor,secondaryFor,safeNumber,bestOf,histories,bestProgress,weeklyVolume,cardioByProgramWeek,symmetry,sessionTotals,insights,weekHeatmap};
})(typeof window!=='undefined'?window:globalThis);
