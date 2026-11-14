/* Formino — Vanilla JS SPA / local SQLite API. No trackers, CDNs, or runtime dependencies. */
'use strict';
(() => {
const P=window.FITNESS_PLAN,COACH=window.FORMINO_COACH,ADAPT=window.FORMINO_ADAPT,AN=window.FORMINO_ANALYTICS;
const GUIDES=window.FORMINO_EXERCISE_GUIDES;
const LEGACY=window.FITNESS_PLAN_V2;
const LEGACY_V3=window.FITNESS_PLAN_V3;
const LEGACY_V4=window.FITNESS_PLAN_V4;
const LEGACY_V43=window.FITNESS_PLAN_V43;
const LEGACY_V411=window.FITNESS_PLAN_V411;
// Keep discontinued exercise IDs readable in pre-v3 historical logs.
for(const old of [LEGACY,LEGACY_V3,LEGACY_V4,LEGACY_V43,LEGACY_V411])for(const [id,ex] of Object.entries(old?.exercises||{}))if(!P.exercises[id])P.exercises[id]=ex;
const planFor=(number,record=null)=>Number(record?.planVersion)===2&&LEGACY?LEGACY.forNumber(number):Number(record?.planVersion)===3&&LEGACY_V3?LEGACY_V3.forNumber(number):Number(record?.planVersion)===4&&LEGACY_V4?LEGACY_V4.forNumber(number):Number(record?.planVersion)===5&&LEGACY_V43?LEGACY_V43.forNumber(number):Number(record?.planVersion)===6&&LEGACY_V411?LEGACY_V411.forNumber(number):Number(record?.planVersion)===7&&record?.executionMode==='busy'?P.busyForNumber(number):P.forNumber(number);
// Approved substitutions stay inside the exact home-equipment set.
const alternatives={
 activeHang:{id:'oneArmRow',reps:'8–15 هر دست'},scapPull:{id:'oneArmRow',reps:'8–15 هر دست'},chinUp:{id:'scapPull',reps:'4–8'},
 reverseCrunchPause:{id:'reverseCrunch',reps:'8–15'},loadedCrunch:{id:'weightedCrunch',reps:'10–18'},oneArmRowPause:{id:'oneArmRow',reps:'8–15 هر دست'},
 floorPressPause:{id:'floorPress',reps:'8–15 هر دست'},splitSquatPause:{id:'splitSquat',reps:'8–14 هر پا'},gobletPause:{id:'gobletSquat',reps:'12–20'},sidePlankReach:{id:'sidePlank',reps:'20–40 ثانیه هر سمت'},
 pushup:{id:'kneePushup',reps:'8–15'},pausedPushup:{id:'pushup',reps:'6–12'},closePushup:{id:'kneePushup',reps:'8–15'},
 kneePushup:{id:'inclinePushup',reps:'8–15'},hamWalkout:{id:'bridgeHold',reps:'15–25 ثانیه'},
 shoulderPress:{id:'lateralRaise',reps:'12–20'},pikePushup:{id:'shoulderPress',reps:'8–12 هر دست'},
 reverseLunge:{id:'splitSquat',reps:'8–12 هر پا'},dumbbellPullover:{id:'bandRow',reps:'10–18'},
 weightedCrunch:{id:'deadBug',reps:'8–12 هر سمت'},singleCalf:{id:'calfRaise',reps:'12–20'}
};
function alternativeFor(id){return alternatives[id]||null;}
const advancedVariants={
 kneePushup:{id:'pushup',reps:'5–10'},
 pushup:{id:'pausedPushup',reps:'5–10'},
 activeHang:{id:'scapPull',reps:'4–8'},scapPull:{id:'chinUp',reps:'1–5'},
 scapPull:{id:'chinUp',reps:'1–5'},
 shoulderPress:{id:'pikePushup',reps:'5–10'},
 calfRaise:{id:'singleCalf',reps:'10–20 هر پا'}
};
function upgradeFor(id){return advancedVariants[id]||null;}
// Adaptive progression: safe variants are selected automatically from logged sets and feedback.
// Two genuinely easy, completed and comparable exposures are necessary; a strict chin-up is NEVER
// inferred from scapular movement. The user must independently confirm a clean full chin-up.
function variantRange(id){
 const samples={inclinePushup:'8–15',kneePushup:'6–12',pushup:'6–12',pausedPushup:'5–10',
  weightedCrunch:'10–18',loadedCrunch:'8–15',reverseCrunch:'8–15',reverseCrunchPause:'6–12',
  oneArmRow:'8–15 هر دست',oneArmRowPause:'8–12 هر دست',floorPress:'8–15 هر دست',floorPressPause:'8–12 هر دست',
  splitSquat:'8–14 هر پا',splitSquatPause:'8–12 هر پا',gobletSquat:'12–20',gobletPause:'8–15',
  sidePlank:'20–40 ثانیه هر سمت',sidePlankReach:'15–30 ثانیه هر سمت',
  bridgeHold:'15–30 ثانیه',hamWalkout:'5–12',activeHang:'10–25 ثانیه',scapPull:'4–8',chinUp:'1–5'};
 return samples[id]||null;
}
function variantStep(id,exerciseHistory){
 return COACH.readyForVariant(id,variantRange(id),exerciseHistory,!!state.settings.barReady);
}
function regressionCandidate(id){
 const pairs=Object.entries(P.movementLadders||{});
 return pairs.find(([,v])=>v===id)?.[0]||null;
}
function shouldRegress(id,logs){
 const recent=logs.filter(x=>x.id===id).slice(-2);
 return recent.length===2&&recent.every(x=>x.difficulty==='hard'||x.sets?.some(s=>s.failed));
}
function adaptiveVariant(step,original,editing){
 if(editing)return null;
 let current=state.settings.exerciseUpgrades[original]||step.id;
 if(!P.exercises[current]){current=step.id;delete state.settings.exerciseUpgrades[original];}
 if(current==='chinUp'&&!state.settings.barReady){current='scapPull';state.settings.exerciseUpgrades[original]=current;}
 let history=exerciseHistory(current);
 if(shouldRegress(current,history)){
  const simpler=regressionCandidate(current);
  if(simpler){state.settings.exerciseUpgrades[original]=simpler;return simpler;}
 }
 const candidate=variantStep(current,history);
 if(candidate&&P.exercises[candidate]){
  state.settings.exerciseUpgrades[original]=candidate;return candidate;
 }
 return current;
}
function readyToUpgrade(id,target,excludeId){
 const logs=exerciseHistory(id,excludeId).filter(x=>x.sets?.length).slice(-2);
 if(logs.length<2)return false;
 const digits=(String(target).match(/\d+/g)||[]).map(Number),upper=digits.length>1?digits[1]:digits[0]||12;
 return logs.every(log=>log.sets.every(q=>q.done&&!q.failed&&!q.failedAttempts&&
    Number(q.coachTarget)>=upper&&
    (q.repsR!==undefined&&q.repsR!==''?Math.min(Number(q.repsR),Number(q.repsL)):Number(q.reps))>=upper));
}


const $=s=>document.querySelector(s), root=$('#app-content');
const today=()=>localISO(new Date());
const dateObj=s=>new Date((s||today())+'T12:00:00');
function localISO(d){const n=new Date(d);return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;}
function addDays(s,n){const d=dateObj(s);d.setDate(d.getDate()+n);return localISO(d);}
function diffDays(a,b){return Math.round((dateObj(a)-dateObj(b))/86400000);}
function weekStart(s){return addDays(s,-((dateObj(s).getDay()+1)%7));}
const latinDigits=s=>String(s).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06f0)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660));
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>n==null||!Number.isFinite(Number(n))?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(Number(n));
const pd=s=>new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(dateObj(s));
const shortDate=s=>new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{day:'numeric',month:'short'}).format(dateObj(s));
const gDate=s=>new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{weekday:'long'}).format(dateObj(s));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=v=>v===''||v===null||v===undefined?null:Number.isFinite(Number(v))?Number(v):null;
const pct=(a,b)=>b>0?100*(a-b)/b:null;
const icon=(id,extra='')=>`<svg class="ico ${extra}" aria-hidden="true"><use href="#ic-${id}"/></svg>`;
const eTag=(s,cls='')=>`<span class="tag ${cls}">${escapeHtml(s)}</span>`;
const head=(title,sub,actions='')=>`<div class="page-heading"><div><h1 tabindex="-1">${title}</h1><p class="subheading">${sub}</p></div>${actions?`<div class="actions no-print">${actions}</div>`:''}</div>`;
const btn=(text,action,cls='outline',extra='')=>`<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;

const weekdays=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const oldMeasures={neck:36,shoulder:47,chest:92,abdomen:92,waist:86,hip:104,armR:31,armL:29,forearmR:25,forearmL:27,thighR:61,thighL:57,calfR:39,calfL:38};
const defs=[
 {key:'neck',fa:'دور گردن',unit:'cm',category:'بالاتنه'},
 {key:'shoulder',fa:'عرض شانه',unit:'cm',category:'بالاتنه'},
 {key:'chest',fa:'دور سینه',unit:'cm',category:'بالاتنه'},
 {key:'armR',fa:'دور بازوی راست',unit:'cm',category:'بالاتنه'},
 {key:'armL',fa:'دور بازوی چپ',unit:'cm',category:'بالاتنه'},
 {key:'forearmR',fa:'دور ساعد راست',unit:'cm',category:'بالاتنه'},
 {key:'forearmL',fa:'دور ساعد چپ',unit:'cm',category:'بالاتنه'},
 {key:'abdomen',fa:'دور شکم (سطح ناف)',unit:'cm',category:'میان‌تنه'},
 {key:'waist',fa:'دور کمر (باریک‌ترین بخش)',unit:'cm',category:'میان‌تنه'},
 {key:'whr',fa:'نسبت دور کمر به قد',unit:'',category:'میان‌تنه',derived:true},
 {key:'hip',fa:'دور باسن',unit:'cm',category:'پایین‌تنه'},
 {key:'thighR',fa:'دور ران راست',unit:'cm',category:'پایین‌تنه'},
 {key:'thighL',fa:'دور ران چپ',unit:'cm',category:'پایین‌تنه'},
 {key:'calfR',fa:'دور ساق راست',unit:'cm',category:'پایین‌تنه'},
 {key:'calfL',fa:'دور ساق چپ',unit:'cm',category:'پایین‌تنه'}
];
const byMetric=Object.fromEntries(defs.map(d=>[d.key,d]));
let state=null,revision=0,currentPage='dashboard',busy=Promise.resolve(),calendarMonth=today(),selectedCalendarDay=today(),selectedPlanWeek=1,selectedPlanCode='A',selectedMeasureWeek=1,selectedMetric='abdomen',selectedMetricGroup='همه',reportWeek=1,exerciseFilter='',exerciseCategory='all',reportPrint=false;
let timerInterval=null,timerEnds=0,timerLeft=0,sessionClockTicker=null,beepContext=null,toastTimer=null,autoSaveDebounce=null,calendarBatchMode=false,calendarSelected=new Set();
let screenWakeLock=null,lastSetCompletionAt=0;
let selectedStrengthId='PU-V2',selectedVolumeWeek=1,selectedChartSpan=24,selectedOverlayA='abdomen',selectedOverlayB='waist',selectedSymmetry='armR:armL',focusMode=false,restSound=true,finalReportMode=false,readinessToday='good';
let focusCurrentIndex=0,restSecondsTotal=0;
async function requestScreenWakeLock(){
 if(!('wakeLock' in navigator)||document.visibilityState!=='visible')return;
 if(screenWakeLock)return;
 try{
  screenWakeLock=await navigator.wakeLock.request('screen');
  screenWakeLock.addEventListener('release',()=>{screenWakeLock=null;});
 }catch(e){/* Windows native helper runs independently when available. */}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestScreenWakeLock();});

function defaultState(){return {version:7,programKey:'FORMINO-EVIDENCE-24W-20261113',startDate:today(),settings:{height:175,notes:'برنامه پژوهش‌محور؛ 3 جلسه مقاومتی و 2 هوازی در هر چرخه.',exerciseUpgrades:{},barReady:false,restSound:true,finalCalibration:{},availableDumbbellWeights:[],pullupBarVerified:false,bandChecked:false,strictPullupConfirmed:false},shifts:[],unavailable:[],rest:[],measurements:[],oldMeasures:{},legacyArchive:[],sessions:[],activeSession:null};}
function ensureState(s){
 const priorVersion=Number(s.version)||2;
 const migration=priorVersion<7||s.programKey!=='FORMINO-EVIDENCE-24W-20261113';
 // A new research program has a distinct 120-session namespace. Old sessions are
 // archived, NEVER counted as new sessions, and can be exported from Settings.
 if(migration){
  const legacy={archivedAt:new Date().toISOString(),fromVersion:priorVersion,
   startDate:s.startDate,settings:s.settings||{},sessions:Array.isArray(s.sessions)?s.sessions:[],
   activeSession:s.activeSession||null,measurements:Array.isArray(s.measurements)?s.measurements:[],
   oldMeasures:s.oldMeasures||{},shifts:s.shifts||[],unavailable:s.unavailable||[],rest:s.rest||[]};
  s.legacyArchive=Array.isArray(s.legacyArchive)?s.legacyArchive:[];
  if(legacy.sessions.length||legacy.activeSession||legacy.measurements.length)s.legacyArchive.push(legacy);
  s.sessions=[];s.activeSession=null;s.measurements=[];s.startDate=today();
  s.shifts=[];s.unavailable=[];s.rest=[];s.oldMeasures={};
 }
 s.version=7;s.programKey='FORMINO-EVIDENCE-24W-20261113';
 const previous=s.settings||{};
 s.settings={...previous,height:num(previous.height)||175,notes:previous.notes||'',
  restSound:previous.restSound!==false,barReady:previous.barReady===true,
  exerciseUpgrades:previous.exerciseUpgrades&&typeof previous.exerciseUpgrades==='object'?previous.exerciseUpgrades:{},
  finalCalibration:previous.finalCalibration&&typeof previous.finalCalibration==='object'?previous.finalCalibration:{},
  availableDumbbellWeights:Array.isArray(previous.availableDumbbellWeights)?[...new Set(previous.availableDumbbellWeights.map(Number).filter(n=>n>=2&&n<=8))].sort((a,b)=>a-b):[],
  pullupBarVerified:previous.pullupBarVerified===true,bandChecked:previous.bandChecked===true,
  strictPullupConfirmed:previous.strictPullupConfirmed===true};
 s.legacyArchive=Array.isArray(s.legacyArchive)?s.legacyArchive:[];
 s.shifts=Array.isArray(s.shifts)?[...new Set(s.shifts)]:[];
 s.unavailable=Array.isArray(s.unavailable)?[...new Set(s.unavailable)]:[];
 s.rest=Array.isArray(s.rest)?[...new Set(s.rest)]:[];
 s.sessions=(Array.isArray(s.sessions)?s.sessions:[]).map(x=>({...x,planVersion:Number(x.planVersion)||7}));
 s.oldMeasures={};
 s.activeSession=s.activeSession||null;
 if(s.activeSession)s.activeSession.planVersion=Number(s.activeSession.planVersion)||7;
 s.measurements=(Array.isArray(s.measurements)?s.measurements:[]).filter(m=>Number(m.week)>=1&&Number(m.week)<=24).map(m=>{
  const clean={week:Number(m.week),date:/^\d{4}-\d{2}-\d{2}$/.test(m.date||'')?m.date:today()};
  defs.filter(x=>!x.derived).forEach(d=>{const v=num(m[d.key]);if(v!==null&&v>0&&v<400)clean[d.key]=v;});
  return clean;
 }).filter(m=>Object.keys(m).length>2);
 return s;
}
const sameValue=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const recoveryPrefix='formino-workout-pending:';
const recoveryKey=recoveryPrefix+crypto.randomUUID();
const workoutSettingKeys=['finalCalibration','exerciseUpgrades','barReady','restSound'];
const setControls='[data-complete-exercise-set],[data-failed-exercise-set],[data-undo-exercise-set]';
const canEditWorkout=kind=>kind==='saved'||kind==='pending'||kind==='memory';
let confirmedState=null,workoutPending=null,recoverySaving=false,workoutSaveStatus='saved';
let recoveryEntries=[],lastWorkoutSet=null;

function readRecoveryEntries(){
 try{
  return Object.keys(localStorage).filter(key=>key.startsWith(recoveryPrefix)).flatMap(key=>{
   try{
    const entry=JSON.parse(localStorage.getItem(key));
    if(entry?.version===1&&entry.sessionId&&entry.base&&entry.local&&entry.program===state.programKey)return [{key,...entry}];
   }catch{}
   return [];
  }).sort((a,b)=>b.updatedAt-a.updatedAt);
 }catch{return [];}
}
function writeRecovery(entry){
 try{localStorage.setItem(recoveryKey,JSON.stringify(entry));return true;}
 catch{return false;}
}
function removeRecovery(key){
 try{localStorage.removeItem(key);}catch{}
}
function workoutSnapshot(source,sessionId){
 return {
  draft:source.activeSession||null,
  logged:source.sessions.find(session=>session.id===sessionId)||null,
  settings:Object.fromEntries(workoutSettingKeys.map(key=>[key,source.settings[key]??null]))
 };
}
function workoutValuesMatch(a,b,settingKeys){
 const now=Date.now();
 const comparableDraft=draft=>draft&&{
  ...draft,restUntil:draft.restUntil>now?draft.restUntil:0,
  restDuration:draft.restUntil>now?draft.restDuration:0
 };
 return sameValue(comparableDraft(a.draft),comparableDraft(b.draft))&&sameValue(a.logged,b.logged)&&
  settingKeys.every(key=>sameValue(a.settings[key],b.settings[key]));
}
function updateWorkoutSaveStatus(kind){
 workoutSaveStatus=kind;
 const text={
  saving:'در حال ذخیره…',saved:'در پایگاه داده ذخیره شد',pending:'پیش‌نویس در مرورگر محفوظ است',
  memory:'ثبت فقط در این صفحه است. دوباره تلاش کن.',conflict:'ثبت دیگری وجود دارد. نسخه‌ها را بررسی کن.'
 }[kind];
 root.querySelectorAll('[data-workout-save]').forEach(element=>{
  element.dataset.state=kind;
  const label=element.querySelector('[data-workout-save-label]');
  if(label.textContent!==text)label.textContent=text;
  const action=element.querySelector('button');
  if(action)action.hidden=kind==='saved'||kind==='saving';
 });
 root.querySelectorAll(setControls+',[data-action="finish-workout"]').forEach(button=>{
  const inactive=focusMode&&button.closest('.counter-exercise:not(.focus-active)');
  button.disabled=Boolean(inactive)||(button.dataset.action==='finish-workout'?kind!=='saved':!canEditWorkout(kind));
 });
 const stop=root.querySelector('.workout-dock [data-action="timer-stop"]');
 if(stop)stop.disabled=timerEnds<=Date.now()||!canEditWorkout(kind);
}
function recoveryNotice(){
 if(!workoutPending&&!recoveryEntries.length)return '';
 return `<div class="notice warn workout-recovery-notice">${icon('alert')}<div>
  <b>ثبت تمرین نیاز به بررسی دارد</b><p>پیش‌نویس باقی‌مانده را باز کن و وضعیت ذخیره را بررسی کن.</p>
  ${btn('بررسی پیش‌نویس','review-workout-save','outline')}</div></div>`;
}
function renderWorkoutSaveStatus(){
 return `<div class="workout-save-status" data-workout-save>
  <span role="status" data-workout-save-label></span>
  <button type="button" class="table-btn" data-action="review-workout-save">بررسی یا تلاش دوباره</button>
 </div>`;
}
function saveWorkoutProgress(sessionId=state.activeSession?.id){
 if(!sessionId||!confirmedState)return saveState();
 const base=workoutPending?.sessionId===sessionId?workoutPending.base:workoutSnapshot(confirmedState,sessionId);
 const local=workoutSnapshot(state,sessionId);
 const entry=structuredClone({version:1,program:state.programKey,sessionId,base,local,updatedAt:Date.now()});
 workoutPending=entry;
 const durable=writeRecovery(entry);
 updateWorkoutSaveStatus('saving');
 return saveState({workoutWrite:true}).then(()=>{
  if(workoutPending!==entry){
   if(workoutPending?.sessionId===entry.sessionId){
    workoutPending.base=entry.local;
    writeRecovery(workoutPending);
   }
   return;
  }
  workoutPending=null;removeRecovery(recoveryKey);updateWorkoutSaveStatus('saved');
  const notice=root.querySelector('.workout-recovery-notice');
  if(notice&&!recoveryEntries.length)notice.remove();
 },err=>{
  if(workoutPending===entry){
   updateWorkoutSaveStatus(err.status===409?'conflict':durable?'pending':'memory');
   if(!root.querySelector('[data-workout-save],.workout-recovery-notice'))root.insertAdjacentHTML('afterbegin',recoveryNotice());
  }
  throw err;
 });
}
function applyWorkoutSnapshot(source,snapshot,id,settingKeys){
 const sessions=source.sessions.filter(session=>session.id!==id);
 if(snapshot.logged)sessions.push(snapshot.logged);
 return {...source,activeSession:snapshot.draft,sessions:sessions.sort((a,b)=>a.sessionNumber-b.sessionNumber),
  settings:{...source.settings,...Object.fromEntries(settingKeys.map(key=>[key,snapshot.settings[key]]))}};
}
function describeWorkoutSnapshot(snapshot){
 const session=snapshot.draft||snapshot.logged;
 if(!session)return '<p>برای این جلسه ثبت یا پیش‌نویسی وجود ندارد.</p>';
 const title=planFor(session.sessionNumber,session)?.title||'تمرین';
 const logged=session.exerciseLogs||[];
 return `<p><b>${escapeHtml(title)}</b> · ${escapeHtml(pd(session.date))} · ${snapshot.draft?'پیش‌نویس':session.status==='completed'?'جلسهٔ کامل':'جلسهٔ نیمه‌تمام'}</p>
 <p>${nf(logged.reduce((sum,log)=>sum+log.sets.filter(set=>set.done).length,0))} ست کامل ·
 ${nf(logged.reduce((sum,log)=>sum+log.sets.filter(set=>set.failed).length,0))} ست ناتمام</p>
 <p>گرم‌کردن ${session.warmupConfirmed?'تأیید شد':'در انتظار'} · هوازی ${session.cardioConfirmed?'تأیید شد':'در انتظار'} · سردکردن ${session.cooldownConfirmed?'تأیید شد':'در انتظار'}</p>
 ${session.notes?`<p>یادداشت: ${escapeHtml(session.notes)}</p>`:''}
 <ul>${logged.filter(log=>log.sets.some(set=>set.done||set.failed)).map(log=>`<li>${escapeHtml(P.exercises[log.id]?.fa||log.id)} ·
  ${log.sets.map((set,index)=>{
   const result=set.done?'کامل':set.failed?'ناتمام':'در انتظار';
   const actual=set.done?(set.reps||((set.repsR&&set.repsL)?`${set.repsR} / ${set.repsL}`:'')):'';
   const weight=set.done&&num(set.weight)!==null?`، ${nf(set.weight)} کیلوگرم`:'';
   return `ست ${nf(index+1)}: ${result}${actual?` (${escapeHtml(actual)} ${escapeHtml(set.coachUnit||'تکرار')}${weight})`:''}`;
  }).join('، ')}</li>`).join('')}</ul>`;
}
function downloadRecovery(source,entry,settingKeys){
 const recovered=applyWorkoutSnapshot(source,entry.local,entry.sessionId,settingKeys);
 downloadFile(JSON.stringify(recovered,null,2),'application/json;charset=utf-8','formino-workout-recovery.json');
}
function confirmRecoveryComparison(local,remote){
 const dialog=$('#modal');
 if(dialog.open)return Promise.resolve(null);
 $('#modal-body').innerHTML=`<h2 id="modal-title">دو نسخهٔ متفاوت از تمرین</h2>
  <p>هر دو نسخه را بررسی کن و مشخص کن کدام در پایگاه داده بماند. اگر نسخهٔ ذخیره‌شده را نگه داری، پیش‌نویس مرورگر به‌صورت فایل JSON دریافت می‌شود.</p>
  <div class="recovery-comparison">
   <section><h3>پیش‌نویس مرورگر</h3>${describeWorkoutSnapshot(local)}</section>
   <section><h3>نسخهٔ ذخیره‌شده</h3>${describeWorkoutSnapshot(remote)}</section>
  </div>
  <form class="form-actions" method="dialog">
   <button class="btn primary" value="local">ذخیرهٔ پیش‌نویس مرورگر</button>
   <button class="btn outline" value="remote">نگه‌داشتن نسخهٔ ذخیره‌شده</button>
   <button class="btn ghost" type="button" data-dialog-cancel>بعداً بررسی می‌کنم</button>
  </form>`;
 dialog.returnValue='cancel';
 return new Promise(resolve=>{
  dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true});
  dialog.showModal();
  const heading=dialog.querySelector('#modal-title');
  heading.tabIndex=-1;heading.focus({preventScroll:true});dialog.scrollTop=0;
 });
}
function syncWorkoutClocks(){
 clearInterval(timerInterval);timerInterval=null;timerEnds=0;timerLeft=0;restSecondsTotal=0;
 stopSessionClock();
 const draft=state.activeSession;
 if(draft?.restUntil>Date.now()){
  timerEnds=Number(draft.restUntil);runTimer(Number(draft.restDuration)||60,true);
 }
 if(draft?.exerciseStartedAt)sessionClockTicker=setInterval(paintSessionClock,1000);
}
async function reviewWorkoutSave(){
 if(recoverySaving)return;
 const entry=workoutPending?{...workoutPending,key:recoveryKey}:readRecoveryEntries()[0];
 if(!entry){
  recoveryEntries=[];
  root.querySelector('.workout-recovery-notice')?.remove();
  return;
 }
 recoverySaving=true;
 try{
  await busy;
  const response=await api('/api/state');
  const serverState=ensureState(response.state||defaultState());
  const remote=workoutSnapshot(serverState,entry.sessionId);
  const settingKeys=workoutSettingKeys.filter(key=>!sameValue(entry.base.settings[key],entry.local.settings[key]));
  const alreadySaved=workoutValuesMatch(remote,entry.local,settingKeys);
  const conflict=!alreadySaved&&!workoutValuesMatch(remote,entry.base,settingKeys);
  const choice=conflict?await confirmRecoveryComparison(entry.local,remote):
   alreadySaved?'remote':entry.key===recoveryKey?'local':await askDialog('یک ثبت تأییدنشده در مرورگر باقی مانده است.',{
    title:'بازیابی پیش‌نویس تمرین',confirmLabel:'بازیابی و ذخیره',detailMarkup:describeWorkoutSnapshot(entry.local)
   })?'local':'cancel';
  if(!['local','remote'].includes(choice))return;
  let recoveredState=serverState,confirmedRevision=response.revision;
  if(choice==='local'){
   if(conflict)await api('/api/backup',{method:'POST'});
   recoveredState=applyWorkoutSnapshot(serverState,entry.local,entry.sessionId,settingKeys);
   const saved=await api('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({state:recoveredState,expectedRevision:response.revision})});
   confirmedRevision=saved.revision;
  }else if(conflict){
   const latest=await api('/api/state');
   if(latest.revision!==response.revision){
    toast('نسخهٔ ذخیره‌شده دوباره تغییر کرده است. مقایسه را دوباره باز کن.','error');
    return;
   }
   downloadRecovery(serverState,entry,settingKeys);
  }
  removeRecovery(entry.key);
  if(entry.key===recoveryKey)workoutPending=null;
  recoveryEntries=readRecoveryEntries().filter(record=>record.key!==entry.key);
  state=recoveredState;confirmedState=structuredClone(recoveredState);revision=confirmedRevision;
  restSound=state.settings.restSound!==false;
  calendarUndo=null;
  syncWorkoutClocks();invalidateSchedule();
  status('اطلاعات ذخیره شد');updateWorkoutSaveStatus('saved');
  if(state.activeSession)go('workout');
  else if(currentPage==='workout')go('dashboard');
  else render();
  toast(choice==='local'?'ثبت تمرین بازیابی و ذخیره شد.':
   conflict?'نسخهٔ ذخیره‌شده باز شد. پیش‌نویس مرورگر به‌صورت JSON دریافت شد.':'ثبت تمرین در پایگاه داده موجود است.');
 }catch(err){
  if(workoutPending&&err.status===409)updateWorkoutSaveStatus('conflict');
  toast(err.message,'error');
 }finally{recoverySaving=false;}
}
function status(text, kind='ok'){
 const sidebarStatus=$('#store-status');
 sidebarStatus.textContent=text;
 sidebarStatus.parentElement.dataset.state=kind;
 $('#top-store-status').textContent=kind==='bad'?text:'ذخیرهٔ محلی';
 $('.server-pill').dataset.state=kind;
}
async function api(url,opts={}){
 let response;
 try{response=await fetch(url,{cache:'no-store',...opts});}
 catch{throw new Error('ارتباط با سرور محلی برقرار نیست.');}
 if(!response.ok){
  let message='ارتباط با پایگاه داده ممکن نیست';
  try{message=(await response.json()).error||message;}catch{}
  const error=new Error(message);error.status=response.status;throw error;
 }
 return response.json();
}
async function saveState({workoutWrite=false}={}){
 if(workoutPending&&!workoutWrite)throw new Error('ابتدا وضعیت ثبت تمرین را بررسی کن.');
 const copy=JSON.parse(JSON.stringify(state));status('در حال ذخیره ...');
 const transaction=busy.catch(()=>{}).then(async()=>{
  const out=await api('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:copy,expectedRevision:revision})});
  revision=out.revision;confirmedState=copy;status('اطلاعات ذخیره شد');return out;
 });
 busy=transaction.catch(err=>{status('خطا در ذخیره','bad');toast(err.message,'error');});
 return transaction;
}
function notifySaved(){toast('اطلاعات در فایل SQLite ذخیره شد');}
function toast(message,kind='ok'){const el=$('#toast');el.textContent=latinDigits(message);el.className='toast show'+(kind==='error'?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3900);}
const scrollToSection=target=>{
 target?.focus({preventScroll:true});
 target?.scrollIntoView({block:'start'});
};
const mobileLayout=matchMedia('(max-width: 760px)');
function setMenu(open, restoreFocus=true){
 const sidebar=$('#sidebar');
 const menu=$('.mobile-menu');
 const main=$('.app-main');
 open=open&&mobileLayout.matches;
 const wasOpen=sidebar.classList.contains('open');
 sidebar.classList.toggle('open',open);
 $('#mobile-backdrop').classList.toggle('show',open);
 document.body.classList.toggle('menu-open',open);
 menu.setAttribute('aria-expanded',String(open));
 main.inert=open;
 sidebar.inert=mobileLayout.matches&&!open;
 if(open&&!wasOpen)(sidebar.querySelector('[aria-current="page"]')||sidebar.querySelector('button'))?.focus();
 if(!open&&wasOpen&&restoreFocus&&mobileLayout.matches)menu.focus();
}
mobileLayout.addEventListener('change',()=>setMenu(false));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.body.classList.contains('menu-open')){
  event.preventDefault();
  setMenu(false);
 }
});
function go(page){
 if(!state){setMenu(false);return;}
 currentPage=page;
 focusMode=page==='workout'&&!!state.activeSession;
 document.body.classList.remove('print-report');
 reportPrint=false;
 setMenu(false,false);
 render({restoreFocus:false});
 window.scrollTo({top:0,behavior:'instant'});
 root.querySelector('h1')?.focus({preventScroll:true});
}
function currentWeek(){return clamp(Math.floor(diffDays(today(),state.startDate)/7)+1,1,24);}
function weekWindow(n){const first=addDays(state.startDate,(n-1)*7);return {first,last:addDays(first,6)};}
function phaseWeek(){const next=nextSchedule();return next?.prescription?.week||clamp(Math.floor((Math.max(1,...state.sessions.map(x=>x.sessionNumber))-1)/5)+1,1,24);}
function measurementForWeek(week){return state.measurements.find(x=>Number(x.week)===Number(week));}
function valueOf(m,key){if(!m)return null;if(key==='whr'){const v=num(m.waist);return v===null?null:v/state.settings.height;}return num(m[key]);}
function series(key){return [...state.measurements].sort((a,b)=>a.week-b.week).filter(m=>valueOf(m,key)!==null).map(m=>({week:Number(m.week),date:m.date,value:valueOf(m,key)}));}
function latest(key){const arr=series(key);return arr[arr.length-1]||null;}
function previous(key){const arr=series(key);return arr.length>1?arr[arr.length-2]:null;}
function compare(key){const last=latest(key),prev=previous(key);return {last,prev,diff:last&&prev?last.value-prev.value:null,percent:last&&prev?pct(last.value,prev.value):null};}
function relativeBaseline(key){const arr=series(key);if(arr.length<2)return null;return pct(arr.at(-1).value,arr[0].value);}
function weekStats(n){const {first,last}=weekWindow(n);const items=state.sessions.filter(s=>s.date>=first&&s.date<=last);const complete=items.filter(s=>s.status==='completed').length,partial=items.filter(s=>s.status==='partial').length;
 const scheduled=computeSchedule();const expected=Array.from(scheduled.byDate.keys()).filter(d=>d>=first&&d<=last).length+items.length;
 const doneSets=items.reduce((t,s)=>t+(s.exerciseLogs||[]).reduce((u,x)=>u+(x.sets||[]).filter(q=>q.done).length,0),0);
 const reps=items.reduce((t,s)=>t+(s.exerciseLogs||[]).reduce((u,x)=>u+(x.sets||[]).filter(q=>q.done).reduce((k,q)=>k+((num(q.repsR)>0&&num(q.repsL)>0)?num(q.repsR)+num(q.repsL):(num(q.reps)||0)),0),0),0);
 return {items,complete,partial,expected,doneSets,reps,minutes:items.reduce((t,s)=>t+(num(s.durationMin)||0),0)};
}
function chooseDates(candidates,already,k,firstNumber){
 // Exhaustive 7-day selection; cardio C may sit between consecutive strength days.
 // Do not schedule 3 successive strength days, even across a week boundary.
 let best=[],bestScore=-Infinity;const dates=[...candidates].sort();
 function valid(subset){
  const proposed=subset.map((date,i)=>({date,code:P.forNumber(firstNumber+i)?.code||'',kind:P.forNumber(firstNumber+i)?.kind||'strength',focus:P.forNumber(firstNumber+i)?.focus||''}));
  const all=[...already,...proposed].sort((a,b)=>a.date.localeCompare(b.date));
  for(let i=2;i<all.length;i++){
   const a=all[i-2],b=all[i-1],c=all[i];
   if(diffDays(b.date,a.date)===1&&diffDays(c.date,b.date)===1&&[a,b,c].every(x=>x.kind==='strength'))return false;
  }
  for(let i=1;i<all.length;i++){
   const a=all[i-1],b=all[i];
   if(diffDays(b.date,a.date)===1 && a.kind==='strength'&&b.kind==='strength')return false;
  }
  return true;
 }
 function visit(i,chosen){
  if(i===dates.length){
   if(!valid(chosen))return;
   const score=chosen.length*1000 - chosen.reduce((v,d,j)=>v+(j&&diffDays(d,chosen[j-1])===1?1:0),0)*3 - chosen.reduce((v,d)=>v+diffDays(d,dates[0])*.01,0);
   if(score>bestScore){bestScore=score;best=[...chosen];}return;
  }
  visit(i+1,chosen);
  if(chosen.length<k){chosen.push(dates[i]);visit(i+1,chosen);chosen.pop();}
 }
 visit(0,[]);return best.sort();
}
let cachedSchedule=null,cacheMark=0;
function computeSchedule(){return cachedSchedule??=scheduleFor(state);}
function scheduleFor(source,t=today()){
 const byDate=new Map(),byNum=new Map();
 const completed=new Map(source.sessions.map(s=>[s.date,s]));
 const fullyDone=source.sessions.filter(s=>s.status==='completed');
 const completedNumbers=new Set(fullyDone.map(s=>Number(s.sessionNumber)));const maxNum=Math.max(0,...completedNumbers);let nextN=Array.from({length:120},(_,i)=>i+1).find(n=>!completedNumbers.has(n))||121;
 // A partially logged session is still the next session, not an already completed one.
 const shifts=new Set(source.shifts),unavailable=new Set(source.unavailable),rest=new Set(source.rest);
 let weekCursor=source.startDate;const end=addDays(t>source.startDate?t:source.startDate,560);let loops=0;
 while(weekCursor<=end&&nextN<=120&&loops++<100){
  const weekDays=Array.from({length:7},(_,i)=>addDays(weekCursor,i));
  const recorded=weekDays.filter(d=>completed.has(d));
  const remaining=Math.max(0,5-recorded.length);
  const candidates=weekDays.filter(d=>d>=source.startDate&&d>=t&&!shifts.has(d)&&!unavailable.has(d)&&!rest.has(d)&&!completed.has(d));
  const history=source.sessions.map(x=>({date:x.date,code:planFor(x.sessionNumber,x)?.code||'',kind:planFor(x.sessionNumber,x)?.kind||'strength',focus:planFor(x.sessionNumber,x)?.focus||''}));
  const future=[...byDate.values()].map(x=>({date:x.date,code:x.prescription.code,kind:x.prescription.kind,focus:x.prescription.focus}));
  const nearby=[...history,...future].filter(x=>x.date>=addDays(weekCursor,-3)&&x.date<=addDays(weekCursor,8));
  const chosen=chooseDates(candidates,nearby,Math.min(remaining,candidates.length,121-nextN),nextN);
  for(const d of chosen){if(nextN>120)break;const prescription=P.forNumber(nextN);const entry={date:d,sessionNumber:nextN,prescription};byDate.set(d,entry);byNum.set(nextN,entry);nextN++;while(completedNumbers.has(nextN)&&nextN<=120)nextN++;}
  weekCursor=addDays(weekCursor,7);
 }
 return {byDate,byNum,completed,maxNum,remaining:Math.max(0,120-completedNumbers.size),scheduled:Array.from(byDate.values()).sort((a,b)=>a.date.localeCompare(b.date))};
}
function invalidateSchedule(){cachedSchedule=null;cacheMark++;}
function nextSchedule(){const schedule=computeSchedule();return schedule.scheduled[0]||null;}
function completedCount(){return state.sessions.filter(x=>x.status==='completed').length;}
function render({restoreFocus=true}={}){
 if(!state)return;
 const active=document.activeElement;
 const activeStage=active?.matches('.final-stage > summary')?active.closest('.final-stage').id:null;
 const focusAttributes=['data-action','data-day','data-set-day','data-cardio-confirm','data-metric','data-plan-week','data-plan-session','data-readiness','data-exercise-difficulty','data-complete-exercise-set','data-failed-exercise-set','data-undo-exercise-set','data-calibrate-weight','data-select-variant'];
 const attribute=active?.id?'id':focusAttributes.find(name=>active?.hasAttribute(name));
 const focusSelector=restoreFocus&&attribute&&root.contains(active)?`[${attribute}="${CSS.escape(active.getAttribute(attribute))}"]`:null;
 const openSections=restoreFocus?new Set([...root.querySelectorAll('details.ux-disclosure[open] > summary')].map(el=>el.textContent)):new Set();
 invalidateSchedule();const names={dashboard:'داشبورد',workout:'تمرین امروز',calendar:'تقویم و شیفت‌ها',plan:'برنامه ۲۴ هفته‌ای',measurements:'اندازه‌گیری بدن',analytics:'تحلیل و نمودارها',reports:'گزارش‌های هفتگی',library:'آموزش حرکات',nutrition:'تغذیه و ریکاوری',settings:'تنظیمات و پشتیبان'};
 document.title=`${names[currentPage]||'داشبورد'} | فرمینو`;
 $('#breadcrumb-page').textContent=names[currentPage]||'داشبورد';$('#today-text').textContent=latinDigits(pd(today()));document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===currentPage);if(b.matches('nav [data-nav]')){if(b.dataset.nav===currentPage)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}});
 const percentage=clamp(Math.round(completedCount()/120*100),0,100);$('#sidebar-progress').style.width=percentage+'%';$('#sidebar-progress-text').textContent=`${nf(completedCount())} جلسه از 120 جلسه • ${nf(percentage)}%`;
 const view={dashboard:renderDashboard,workout:renderWorkout,calendar:renderCalendar,plan:renderPlan,measurements:renderMeasurements,analytics:renderAnalytics45,reports:renderReports,library:renderLibrary,nutrition:renderNutrition,settings:renderSettings};const markup=(view[currentPage]||renderDashboard)();
 root.innerHTML=latinDigits((currentPage==='workout'&&state.activeSession?'':recoveryNotice())+markup);document.body.classList.toggle('focus-mode',currentPage==='workout'&&focusMode&&!!state.activeSession);document.body.classList.toggle('focus-cardio',currentPage==='workout'&&focusMode&&!!state.activeSession&&state.activeSession.exerciseLogs.every(x=>x.sets.every(q=>q.done||q.failed)));root.removeAttribute('aria-busy');
 if(currentPage==='workout'&&focusMode){
  root.querySelectorAll('.workout-counter-list .counter-exercise:not(.focus-active)').forEach(card=>{
   card.querySelectorAll('button').forEach(control=>{control.disabled=true;});
  });
 }
 root.querySelectorAll('.table-wrap').forEach(wrapper=>{
  const title=wrapper.previousElementSibling;
  if(!title?.matches('h2,h3,h4'))return;
  wrapper.tabIndex=0;
  wrapper.setAttribute('role','region');
  wrapper.setAttribute('aria-label',title.textContent);
 });
 root.querySelectorAll('details.ux-disclosure > summary').forEach(summary=>{
  if(openSections.has(summary.textContent))summary.parentElement.open=true;
 });
 if(restoreFocus&&(focusSelector||activeStage)){
  const target=activeStage?document.getElementById(activeStage)?.querySelector('summary'):root.querySelector(focusSelector);
  if(target&&!target.disabled&&target.getClientRects().length)target.focus({preventScroll:true});
 }
 if(currentPage==='library')filterExercises();
 updateWorkoutSaveStatus(workoutSaveStatus);
 paintTimer();paintSessionClock();
}
function metricStat(key,label,iconName){const x=compare(key),unit=byMetric[key]?.unit||'';const diff=x.percent;
 return `<div class="card stat-card"><div class="stat-header"><span>${label}</span><span class="stat-icon">${icon(iconName)}</span></div><div class="stat-value">${x.last?nf(x.last.value):'—'} <span class="stat-unit">${unit}</span></div><div class="stat-foot">${diff===null?'نیازمند ثبت اندازه‌گیری جدید':`${diff>0?'+':''}${nf(diff)}٪ نسبت به ثبت قبلی`}</div></div>`;
}
function stamp(s){return s.status==='completed'?eTag('تکمیل‌شده','green'):eTag('نیمه‌تمام','amber');}
function renderDashboard(){
 const sched=nextSchedule(),done=completedCount(),currentPhase=P.phaseOf(phaseWeek()),up=computeSchedule().scheduled.slice(0,4);
 const activity=state.activeSession?'ادامهٔ تمرین':sched?'مشاهدهٔ جلسهٔ بعدی':'مشاهدهٔ تمرین‌ها';
 return `${head('داشبورد تمرین','جلسهٔ بعدی و پیشرفت برنامه را اینجا ببین.')}
 <div class="hero dashboard-priority"><div class="hero-content"><div class="hero-label">برنامهٔ ۲۴ هفته‌ای</div><h2>${state.activeSession?'جلسه نیمه‌تمام آماده ادامه است':sched?`جلسه بعدی: ${sched.prescription.title}`:done>=120?'دوره تمرینی تکمیل شد':'برنامهٔ تمرینی آماده است'}</h2><p>${sched?`هفته ${nf(sched.prescription.week)} • ${pd(sched.date)} • ${sched.prescription.subtitle}`:'برنامه، عملکرد واقعی تو را ثبت و به جلسه بعد وصل می‌کند.'}</p><button class="btn" data-nav="workout">${icon('play')} ${activity}</button></div><div class="hero-stat"><b class="hero-count">${nf(done)}</b><small>از ۱۲۰ جلسه کامل</small><div class="progress-track" aria-hidden="true"><div style="width:${clamp(done/120*100,0,100)}%"></div></div></div><div class="hero-deco" aria-hidden="true"></div></div>
 ${dashboardKpis45()}
 <div class="grid two spaced dashboard-main-grid">
  <div class="card"><div class="section-title"><h2>جلسات پیش‌رو</h2><button class="table-btn" data-nav="calendar">مدیریت شیفت‌ها</button></div>${up.length?up.map(x=>`<div class="list-row"><div class="badge-letter ${x.prescription.tone}">${x.prescription.code}</div><div><div class="list-title">${x.prescription.title}</div><div class="list-subtitle">هفته ${nf(x.prescription.week)} • ${x.prescription.subtitle}</div></div><div class="list-end">${shortDate(x.date)}</div></div>`).join(''):'<div class="empty">هنوز جلسه‌ای برای آینده برنامه‌ریزی نشده است.</div>'}</div>
  <div class="card"><div class="section-title"><h2>نقشه پیشرفت دوره</h2><button class="table-btn" data-nav="plan">برنامه 24 هفته‌ای</button></div><div class="progress-header"><span>${nf(done)} جلسه تکمیل‌شده</span><span>${nf(Math.round(done/120*100))}%</span></div><div class="progress-track"><div style="width:${Math.min(100,done/120*100)}%"></div></div><div class="badge-phase spaced">${icon('target')} ${currentPhase.name}</div><p class="subheading">${currentPhase.note}</p><div class="key-metrics"><span>تمرین خانگی</span><span>5 جلسه هدف</span><span>ریکاوری متناسب با شیفت</span></div></div>
 </div>
 <div class="grid two spaced">
  <div class="card"><div class="section-title"><h2>روند دور شکم</h2><button class="table-btn" data-nav="measurements">ثبت اندازه</button></div>${drawChart(series('abdomen'),'دور شکم','cm',520,210)}</div>
  <div class="card"><div class="section-title"><h2>آخرین جلسات</h2><button class="table-btn" data-nav="reports">گزارش‌ها</button></div>${recentSessions(3)}</div>
 </div>
 <details class="ux-disclosure spaced"><summary>نمایش تحلیل‌های بیشتر و تقویم حرارتی <span class="summary-hint">اختیاری</span></summary><div class="disclosure-content"><div class="grid two">${dashboardExtra45()}</div></div></details>
 <div class="notice spaced dashboard-guidance">${icon('info')}<span>تا زمانی که چند اندازه‌گیری واقعی و جلسه قابل‌مقایسه ثبت نشده است، نمودارها نتیجه‌ای حدس نمی‌زنند. برای سنجش تغییرات بدن، ابتدا بخش اندازه‌گیری را تکمیل کن.</span></div>`;
}
function recentSessions(limit=6){return [...state.sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit).map(s=>`<div class="list-row"><span class="badge-letter ${planFor(s.sessionNumber,s)?.tone||''}">${planFor(s.sessionNumber,s)?.code||'?'}</span><div><div class="list-title">${planFor(s.sessionNumber,s)?.title||'جلسه ثبت‌شده'}</div><div class="list-subtitle">${pd(s.date)} • ${nf(s.durationMin||0)} دقیقه</div></div><div class="list-end">${stamp(s)}<div><button class="table-btn" data-edit-session="${escapeHtml(s.id)}">ویرایش</button></div></div></div>`).join('')||'<div class="empty">هنوز هیچ جلسه‌ای ثبت نشده است.</div>'}
function persianParts(s){const f=new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'});const parts=Object.fromEntries(f.formatToParts(dateObj(s)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));return parts;}
function monthStart(s){let d=s;for(let i=0;i<33;i++){if(persianParts(d).day===1)return d;d=addDays(d,-1);}return d;}
function shiftMonth(s,n){let d=monthStart(s);if(n>0){d=addDays(d,35);return monthStart(d);}d=addDays(d,-1);return monthStart(d);}
function monthTitle(s){return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{month:'long',year:'numeric'}).format(dateObj(s));}
function dayStatus(d,sch){const log=state.sessions.find(x=>x.date===d);if(log)return {cls:'completed',title:log.status==='completed'?'انجام شد':'نیمه‌تمام',sub:planFor(log.sessionNumber,log)?.code||''};if(state.shifts.includes(d))return {cls:'shift',title:'شیفت کاری',sub:'استراحت از تمرین'};if(state.unavailable.includes(d))return {cls:'missed',title:'عدم امکان',sub:'منتقل شد'};if(state.rest.includes(d))return {cls:'rest',title:'استراحت',sub:''};const planned=sch.byDate.get(d);if(planned)return {cls:'work',title:'تمرین '+planned.prescription.code,sub:planned.prescription.title};return {cls:'',title:'',sub:''};}
function renderCalendar(){const first=monthStart(calendarMonth),after=shiftMonth(first,1),last=addDays(after,-1),begin=weekStart(first);const n=diffDays(last,begin)+1;const total=Math.ceil(n/7)*7;const sc=computeSchedule();const days=Array.from({length:total},(_,i)=>{const d=addDays(begin,i),out=d<first||d>last,ps=persianParts(d),stat=dayStatus(d,sc);return `<button class="day ${stat.cls} ${calendarBatchMode&&calendarSelected.has(d)?'multi-selected':''} ${out?'outside':''} ${d===today()?'today':''}" data-day="${d}" aria-pressed="${calendarBatchMode?calendarSelected.has(d):d===selectedCalendarDay}" ${d===today()?'aria-current="date"':''} aria-description="${escapeHtml(pd(d))}${stat.title?'':'، بدون برنامه'}"><span class="date-number">${nf(ps.day)}</span><span class="date-label">${stat.title}</span><span class="day-note">${stat.sub}</span></button>`;}).join('');
 const st=dayStatus(selectedCalendarDay,sc),selPlan=sc.byDate.get(selectedCalendarDay),hasLog=state.sessions.find(x=>x.date===selectedCalendarDay);
 return `${head('تقویم تمرین و شیفت‌ها','روزهای شیفت یا استراحت را انتخاب کن و جابه‌جایی جلسه‌ها را پیش از ثبت ببین.',btn(icon('rotate')+' ماه جاری','month-current','outline')+(calendarUndo?btn(icon('rotate')+' برگشت آخرین تغییر','undo-calendar','outline'):''))}
 <div class="card calendar-panel"><div class="calendar-bar"><div class="calendar-month"><button class="icon-btn" data-action="month-prev" aria-label="ماه قبل">${icon('chevron')}</button><h2 aria-live="polite">${monthTitle(first)}</h2><button class="icon-btn" data-action="month-next" aria-label="ماه بعد">${icon('chevron','reverse-chevron')}</button></div><div class="calendar-legend"><span><i class="legend-dot" style="background:#72b88e"></i> تمرین</span><span><i class="legend-dot" style="background:#8b99a6"></i> شیفت</span><span><i class="legend-dot" style="background:#dd8274"></i> انتقال</span><span><i class="legend-dot" style="background:#e7c176"></i> استراحت</span></div></div>
 <div class="calendar-grid">${weekdays.map(x=>`<div class="weekday">${x}</div>`).join('')}${days}</div>
 <div class="calendar-batch no-print"><div><strong>ثبت گروهی روزهای شیفت</strong><p class="hint">ابتدا «انتخاب چند روز» را فعال کن؛ سپس تاریخ‌های دلخواه را در تقویم انتخاب کن.</p></div><div class="actions"><button class="btn sm ${calendarBatchMode?'primary':'outline'}" data-action="toggle-batch">${calendarBatchMode?'پایان انتخاب':'انتخاب چند روز'}</button>${calendarBatchMode?`<span class="tag">${nf(calendarSelected.size)} روز انتخاب‌شده</span>${btn('ثبت شیفت','batch-shift','primary')}${btn('نتوانستم تمرین کنم','batch-unavailable','outline')}${btn('استراحت','batch-rest','outline')}${btn('پاک‌کردن وضعیت','batch-clear','ghost')}${btn('پاک‌کردن انتخاب','batch-reset','ghost')}`:''}</div></div>
 <div class="day-editor" id="day-editor"><div class="row-between"><h3 tabindex="-1">${pd(selectedCalendarDay)}</h3>${eTag(st.title||'روز آزاد',st.cls==='completed'?'green':st.cls==='shift'?'blue':'')}</div><p class="subheading">${hasLog?'برای این روز یک تمرین ثبت شده؛ تغییر وضعیت، تاریخچه را پاک نمی‌کند.':selPlan?`جلسه برنامه‌ریزی‌شده: ${selPlan.prescription.title} — هفته ${nf(selPlan.prescription.week)}`:'روز قابل تنظیم برای شیفت، استراحت یا عدم امکان تمرین.'}</p><div class="actions" style="margin-top:14px"><button class="btn sm ${state.shifts.includes(selectedCalendarDay)?'primary':'outline'}" data-set-day="shift">${icon('briefcase')} شیفت کاری</button><button class="btn sm ${state.unavailable.includes(selectedCalendarDay)?'danger':'outline'}" data-set-day="unavailable">${icon('close')} نتوانستم تمرین کنم</button><button class="btn sm ${state.rest.includes(selectedCalendarDay)?'primary':'outline'}" data-set-day="rest">${icon('clock')} استراحت</button><button class="btn sm ghost" data-set-day="clear">پاک‌کردن محدودیت روز</button></div>${selPlan?`<div class="hint" style="margin-top:12px">اگر این روز را «شیفت» یا «عدم امکان تمرین» علامت بزنی، جلسه به روز آزاد مناسب بعدی منتقل می‌شود.</div>`:''}</div></div>
 <div class="grid two spaced"><div class="card"><div class="section-title"><h2>جلسات آینده</h2><span class="tag green">زمان‌بندی شناور</span></div>${sc.scheduled.slice(0,6).map(s=>`<div class="list-row"><span class="badge-letter ${s.prescription.tone}">${s.prescription.code}</span><div><div class="list-title">${s.prescription.title}</div><div class="list-subtitle">هفته تمرینی ${nf(s.prescription.week)} • ${shortDate(s.date)}</div></div><div class="list-end">${eTag('برنامه‌ریزی‌شده','green')}</div></div>`).join('')||'<div class="empty">جلسه‌ای باقی نمانده است.</div>'}</div><div class="card"><div class="section-title"><h2>قواعد تقویم</h2></div><div class="stack"><div class="notice">${icon('check')}<span>روزهای شیفت هیچ الگوی ثابتی ندارند؛ هر تاریخی را می‌توانی انتخاب کنی.</span></div><div class="notice">${icon('check')}<span>حداکثر پنج جلسه در هر بازه هفت‌روزه از تاریخ شروع برنامه‌ریزی می‌شود و دست‌کم دو روز بدون تمرین باقی می‌ماند.</span></div><div class="notice">${icon('check')}<span>جلسات انجام‌نشده حذف نمی‌شوند؛ صف ۱۲۰ جلسه به روزهای مناسب آینده انتقال پیدا می‌کند.</span></div><div class="notice warn">${icon('alert')}<span>اگر به‌علت شیفت، وقت کافی یا فاصله ریکاوری مناسب نباشد، اتمام ۱۲۰ جلسه ممکن است بیش از ۲۴ هفته تقویمی زمان ببرد.</span></div></div></div></div>`;
}
function unilateral(id,version=5){if(Number(version)<3)return ['oneArmRow','floorPress','shoulderPress','bicepsCurl','hammerCurl','reverseLunge','splitSquat','kickstandRdl'].includes(id);return !!P.exercises[id]?.side;}
function lastExerciseLog(id,excludeId=null){return [...state.sessions].filter(s=>s.id!==excludeId).sort((a,b)=>b.date.localeCompare(a.date)).flatMap(s=>(s.exerciseLogs||[]).filter(x=>x.id===id)).at(0)||null;}
function lastSummary(id,excludeId){const l=lastExerciseLog(id,excludeId);if(!l)return 'اولین ثبت عملکرد';const valid=l.sets.filter(x=>x.done);if(!valid.length)return 'جلسه قبل ست کامل ثبت نشد';const best=Math.max(...valid.map(x=>num(x.repsR)!=null?Math.min(num(x.repsR)||0,num(x.repsL)||0):(num(x.reps)||0)));const weight=valid.find(x=>num(x.weight)>0)?.weight;return `آخرین رکورد: ${nf(best)} تکرار${weight!=null?' • '+nf(weight)+' کیلوگرم':''}`;}
function increaseSuggestion(id,target,excludeId){const logs=lastExerciseLog(id,excludeId);if(!logs)return 'از تعداد تکرار قابل‌کنترل شروع کن و ۲ تا ۳ تکرار ذخیره بگذار.';const targetNums=(target.match(/\d+/g)||[]).map(Number),upper=targetNums.length>1?targetNums[1]:targetNums[0]||12;const good=logs.sets.length&&logs.sets.every(s=>s.done&&(num(s.repsR)!=null?Math.min(s.repsR,s.repsL):num(s.reps))>=upper&&(num(s.rir)===null||num(s.rir)>=2));return good?'جلسه قبل به سقف تکرار رسیدی؛ فقط با دامنه صحیح و شرایط ریکاوری مناسب، مقاومت یا نسخه حرکت را یک پله دشوارتر کن.':'ابتدا اجرای صحیح و تکمیل همه ست‌ها در بازه هدف را تثبیت کن.';}
function exerciseHistory(id,excludeId=null){
 return [...state.sessions].filter(s=>s.id!==excludeId).sort((a,b)=>a.date.localeCompare(b.date))
  .flatMap(s=>(s.exerciseLogs||[]).filter(x=>x.id===id));
}
function perExerciseCoach(step,id,week,excludeId=null){
 return COACH.recommend({...step,id},P.exercises[id],week,exerciseHistory(id,excludeId));
}
function buildDraft(number,date,editing=null,mode='full'){
 const plan=planFor(number,editing||{planVersion:7,executionMode:mode});if(!plan)return null;
 if(Number(editing?.planVersion)===6){return buildLegacyDraft(number,date,editing);}
 const oldLogs=editing?.exerciseLogs||[];
 const draft={planVersion:7,executionMode:editing?.executionMode||mode,programId:P.research.metadata.program_id,
  id:editing?.id||'s'+Date.now()+'-'+Math.random().toString(36).slice(2,7),sessionNumber:number,
  date:date||today(),startedAt:editing?.startedAt||new Date().toISOString(),exerciseStartedAt:editing?.exerciseStartedAt||null,
  readiness:editing?.readiness||readinessToday,restUntil:editing?.restUntil||0,restDuration:editing?.restDuration||0,
  durationMin:editing?.durationMin??0,cardioMin:editing?.cardioMin??0,cardioConfirmed:editing?.cardioConfirmed??false,
  warmupConfirmed:editing?.warmupConfirmed===true,cooldownConfirmed:editing?.cooldownConfirmed===true,
  stageTicks:editing?.stageTicks||{warmup:[],cardio:[],cooldown:[]},
  safetyFlag:editing?.safetyFlag===true,
  effort:editing?.effort??6,notes:editing?.notes||'',exerciseLogs:[]};
 draft.exerciseLogs=plan.steps.map((step,index)=>{
  const old=oldLogs[index]||null;
  if(old&&old.familyId===step.familyId)return {...old,sets:old.sets.map(s=>s.failed&&!s.done&&editing?.status==='partial'?{...s,failed:false,attempted:false}:({...s}))};
  const history=ADAPT.getHistory(step.familyId,state.sessions,editing?.id);
  const rx=ADAPT.resolve(step,state.settings,history,draft.date,draft.readiness);
  if(rx.variantId!==(state.settings.finalCalibration?.[step.familyId]?.variantId||step.variantId)||
     (rx.load!=null&&rx.load!==state.settings.finalCalibration?.[step.familyId]?.loadKg)){
    state.settings.finalCalibration[step.familyId]={...(state.settings.finalCalibration[step.familyId]||{}),variantId:rx.variantId,
      ...(rx.load!=null?{loadKg:rx.load}:{})};
  }
  return {id:rx.id,familyId:step.familyId,variantId:rx.variantId,target:step.reps,
   coachReason:rx.coachReason,difficulty:null,safetyClear:null,calibrationPending:rx.calibrationPending,
   equipmentLimited:rx.atLimit,coachRest:step.rest,coachRestSides:step.restSides,
   sets:ADAPT.makeSets(rx.targets,rx.unit,rx.load)};
 });
 return draft;
}
function buildLegacyDraft(number,date,editing){
 const plan=planFor(number,editing);
 return {...editing,date:date||today(),exerciseLogs:plan.steps.map((step,index)=>{
  const old=editing.exerciseLogs[index];if(old)return old;
  const rx=COACH.initial(step,P.exercises[step.id]);
  return {id:step.id,target:step.reps,coachReason:rx.reason,difficulty:null,coachRest:step.rest,sets:COACH.makeSets(rx,[])};
 })};
}
function completedSets(draft){return draft.exerciseLogs.reduce((n,x)=>n+x.sets.filter(s=>s.done).length,0);}
function totalSets(draft){return draft.exerciseLogs.reduce((n,x)=>n+x.sets.length,0);}
// Formino 4.2: a single action confirms one entire prescribed set.
// The application never guesses that an unfinished set was completed.
function prescribedSetLabel(s,ex){
 const goal=Math.max(1,Number(s.coachTarget)||1),unit=s.coachUnit||(ex.type==='time'?'ثانیه':'تکرار');
 return `${nf(goal)} ${unit}${ex.side?' برای هر سمت':''}`;
}
function handoffForExercise(draft,index,record){
 if(!focusMode||index!==activeFocusIndex(draft))return '';
 const hasPending=record.sets.some(set=>!set.done&&!set.failed);
 const previous=lastWorkoutSet?.id===draft.id?lastWorkoutSet.index:
  draft.exerciseLogs.findLastIndex((log,i)=>i<index&&log.sets.some(set=>set.done||set.failed));
 if(previous<0||previous===index||!hasPending)return '';
 return `<div class="counter-handoff">
  <p><b>حرکت بعدی: ${escapeHtml((GUIDES.get(record.id,draft.planVersion)||P.exercises[record.id]).fa)}</b>${record.calibrationPending?' · ابتدا وزنه را تأیید کن.':''}</p>
  <button class="btn sm outline" data-undo-exercise-set="${previous}">${icon('rotate')} برگشت آخرین ثبت</button>
 </div>`;
}
function comparisonForSet(record,set,exercise,draft,history){
 const load=num(set?.coachLoad),unit=set?.coachUnit||(exercise.type==='time'?'ثانیه':'تکرار');
 if(exercise.type==='band'||(exercise.type==='weight'&&load===null))return null;
 return history.find(row=>row.id===record.id&&!row.confirmedOnly&&row.unit===unit&&row.load===load&&row.date<=draft.date);
}
function exerciseCounter(x,ei,history){
 const guide=GUIDES.get(x.id,state.activeSession?.planVersion);
 const ex=P.exercises[x.id],total=x.sets.length,done=x.sets.filter(z=>z.done).length;
 const failed=x.sets.filter(z=>z.failed).length,processed=done+failed;
 const remaining=total-processed,pctDone=Math.round(processed/Math.max(total,1)*100);
 const nextIdx=x.sets.findIndex(z=>!z.done&&!z.failed),next=nextIdx>=0?x.sets[nextIdx]:null;
 const targets=[...new Set(x.sets.map(s=>Number(s.coachTarget)||1))];
 const unit=x.sets[0]?.coachUnit||(ex.type==='time'?'ثانیه':'تکرار');
 const targetLine=targets.length===1?`${nf(total)} ست × ${nf(targets[0])} ${unit}${ex.side?' برای هر سمت':''}`:
   `${nf(total)} ست • ${x.sets.map(s=>nf(s.coachTarget)).join(' / ')} ${unit}${ex.side?' هر سمت':''}`;
 const nextLoad=next?.coachLoad??x.sets[0]?.coachLoad;
 const last=comparisonForSet(x,next||x.sets[0],ex,state.activeSession,history);
 const loadText=nextLoad==null?(Number(state.activeSession?.planVersion)===7&&ex.type==='weight'?' • وزن دمبل هنوز تأیید نشده':''):ex.type==='band'?' • کش پیلاتس با طول کشش قابل‌کنترل':
   ex.type==='weight'?` • دمبل ${nf(nextLoad)} کیلوگرم`:'';
 const whole=remaining===0&&failed===0;
 const isResearch=Number(state.activeSession?.planVersion)===7;
 const allAttempted=remaining===0;
 const markers=x.sets.map((s,i)=>`<span class="counter-step ${s.done?'finished':s.failed?'not-completed':i===nextIdx?'current':''}" title="ست ${i+1}: ${s.done?'کامل':s.failed?'ناتمام':'در انتظار'}">${s.done?icon('check'):s.failed?icon('close'):nf(i+1)}</span>`).join('');
 return `<section class="counter-exercise ${whole?'counter-exercise-done':''}" id="exercise-${ei}" aria-label="حرکت ${escapeHtml(ex.fa)}">
  <div class="counter-top"><div class="counter-id">${nf(ei+1).padStart(2,'0')}</div><div class="counter-name"><div class="counter-title">${whole?`<span class="complete-seal" aria-hidden="true">${icon('check')}</span>`:''}<h3>${escapeHtml(guide?.fa||ex.fa)}</h3></div><div class="counter-en" lang="en" dir="ltr">${escapeHtml(guide?.en||ex.en)}</div></div><div class="counter-actions">${guide?exerciseGuideButton(guide):''}</div></div>
  <div class="counter-target"><small>استراحت ${nf(x.coachRest||60)} ثانیه${loadText} • تکرار ذخیره هدف ${nf(next?.coachRir??x.sets[0]?.coachRir??3)}</small></div>
  <div class="counter-status-row"><div><span class="counter-status-label">پیشرفت این حرکت</span><b class="counter-status-count">${nf(done)} ست کامل از ${nf(total)}</b></div><span class="counter-left ${whole?'is-complete':''}">${whole?'حرکت کامل شد':allAttempted?'ست ناتمام ثبت شده':`${nf(remaining)} ست باقی‌مانده`}</span></div>
  <div class="counter-progress" role="progressbar" aria-label="ست‌های ثبت‌شده ${escapeHtml(ex.fa)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${processed}"><div class="counter-progress-fill" style="width:${pctDone}%;${failed?'background:#c98b56;':''}"></div></div>
  <div class="counter-steps" aria-label="نشانگر ست‌های تمرین">${markers}</div>
  ${isResearch&&x.calibrationPending?`<div class="calibration-warning"><b>کالیبراسیون ضروری</b><p>برای این حرکت دمبل‌دار، وزن واقعیِ قابل نصب را یک بار مشخص کن. هدف تکرار توسط مربی ثابت می‌ماند.</p><button class="btn outline" data-calibrate-weight="${ei}">تأیید وزن دمبل</button></div>`:''}
  <dl class="coach-comparison">
   <div><dt>هدف امروز</dt><dd>${escapeHtml(targetLine)}</dd></div>
   <div><dt>آخرین اجرای قابل‌مقایسه</dt><dd>${last?`${nf(last.value)} ${escapeHtml(last.unit)}${ex.side?' برای هر سمت':''}${last.load===null?'':' با '+nf(last.load)+' کیلوگرم'} · ${escapeHtml(shortDate(last.date))}`:'اجرای ثبت‌شده با همین نسخه و مقاومت در دسترس نیست.'}</dd></div>
   ${x.coachReason?`<div><dt>دلیل انتخاب هدف</dt><dd>${escapeHtml(x.coachReason)}</dd></div>`:''}
  </dl>
  ${isResearch&&processed===0?`<div class="counter-options"><button class="table-btn" data-select-variant="${ei}">انتخاب نسخه آسان‌تر / سطح اولیه حرکت</button></div>`:''}
  ${processed===0?`<div class="counter-options">${alternativeFor(x.id)?`<button type="button" class="table-btn" data-swap-exercise="${ei}">این حرکت برایم ممکن نیست · جایگزین</button>`:''}</div>`:''}
  ${allAttempted&&whole?`<div class="difficulty-panel" aria-label="بازخورد دشواری حرکت"><div class="difficulty-heading">این حرکت چقدر سخت بود؟ <small>اختیاری؛ برای تنظیم هوشمند جلسه بعد</small></div><div class="difficulty-buttons">${[['easy','آسان بود'],['okay','مناسب بود'],['hard','خیلی سخت بود']].map(([v,label])=>`<button type="button" data-exercise-difficulty="${ei}:${v}" class="btn sm ${x.difficulty===v?'primary':'outline'}" aria-pressed="${x.difficulty===v}">${label}</button>`).join('')}</div></div>`:''}
  ${allAttempted&&whole&&x.id==='scapPull'&&!state.settings.barReady?`<div class="readiness-panel">${icon('info')} بارفیکس کامل از روی بارفیکس کتف قابل حدس نیست. <button type="button" class="table-btn" data-bar-ready="true">یک تکرار بارفیکس کامل، ایمن و بدون کمک واقعاً انجام داده‌ام</button></div>`:''}
  <div class="counter-bottom">
   ${handoffForExercise(state.activeSession,ei,x)}
   ${allAttempted?'':`<div class="counter-rest"><span>استراحت</span><b data-rest-clock dir="ltr"></b></div>`}
   ${allAttempted?`<div class="counter-complete-message">${whole?icon('check')+' همه ست‌ها انجام شد':icon('info')+' یک یا چند ست کامل نشد؛ افزایش فشار متوقف می‌شود.'}</div>`:
    `<div class="counter-next"><small>ست بعدی</small><strong>ست ${nf(nextIdx+1)} · ${prescribedSetLabel(next,ex)}</strong></div>`}
    <div class="counter-button-wrap">${allAttempted?'':`<button class="btn primary counter-big-button" type="button" data-complete-exercise-set="${ei}">${icon('check')} یک ست کامل انجام دادم</button><button type="button" class="btn outline counter-failed" data-failed-exercise-set="${ei}">این ست کامل نشد</button>`}
    ${processed?`<button type="button" class="btn outline counter-undo" data-undo-exercise-set="${ei}" title="اصلاح کلیک اشتباه">${icon('rotate')} برگشت آخرین ست</button>`:''}</div>
   ${renderWorkoutSaveStatus()}
  </div>

 </section>`;
}
function estimateExerciseMinutes(log){
 const setCount=(log?.sets||[]).length||0,rest=(Number(log?.coachRest)||60),ex=P.exercises[log.id]||{};
 const targets=(log?.sets||[]).map(s=>Number(s.coachTarget)||1);
 let workSec=0;
 for(const target of targets){
  if((log?.sets?.[0]?.coachUnit||'').includes('ثانیه'))workSec+=target;
  else{
   const perRep=ex.side?5:3;
   workSec+=target*perRep*(ex.side?2:1);
  }
 }
 const totalSec=workSec+Math.max(0,setCount-1)*rest+20;
 return Math.max(1,Math.round(totalSec/60));
}
function warmupItemsFor(plan){
 const activation=plan.code==='A'?'شنا به دیوار یا فشار سبک سینه و کتف':plan.code==='B'?'اسکوات آرام و پل باسن سبک':plan.code==='C'?'راه رفتن درجا و آمادگی هوازی تدریجی':plan.code==='D'?'قایقی کش سبک و چرخش شانه': 'لانج کوتاه و Hip Hinge سبک';
 return [
  {label:'راه رفتن یا حرکت درجا',time:'3 min',note:'بالا آوردن تدریجی دمای بدن'},
  {label:'حرکت کتف و شانه',time:'1 min',note:'باز و بسته‌کردن شانه و کتف'},
  {label:'اسکوات آرام بدون وزنه',time:'1 min',note:'دامنه کنترل‌شده'},
  {label:'الگوی Hip Hinge',time:'1 min',note:'آماده‌سازی پشت ران و لگن'},
  {label:'فعال‌سازی اختصاصی جلسه',time:'2 min',note:activation}
 ];
}
function cooldownItemsFor(plan){
 return [
  {label:'راه رفتن آهسته درجا',time:'3 min',note:'کاهش تدریجی ضربان'},
  {label:'تنفس آرام و کشش بدون درد',time:'3 min',note:'شکم، سینه، پشت و باسن به‌صورت سبک'}
 ];
}
function cardioItemsFor(plan){
 const m=Number(plan.cardioMinutes)||0;
 if(!m)return [];
 if(plan.code==='C'){
   if(plan.week<=4||[13,19,24].includes(plan.week))return [
     {label:'شروع هوازی تدریجی',time:'4 min',note:'حرکت آهسته درجا'},
     {label:'حرکت تند درجا',time:'2 min',note:'شدت متوسط'},
     {label:'Step Jack بدون پرش',time:'2 min',note:'دست و پا با ضرب‌آهنگ یکنواخت'},
     {label:'بوکس سایه‌ای سبک',time:'1 min',note:'کنترل تنفس'},
     {label:'تکرار چرخه تا تکمیل زمان',time:`${Math.max(0,m-9)} min`,note:'همین سه حرکت را تا پایان زمان ادامه بده'}
   ];
   const rounds=plan.week<=8?6:plan.week<=12?6:8;
   const prep=5, intense=plan.week<=8?20:30, easy=plan.week<=8?100:90;
   const roundsMin=Math.round(rounds*(intense+easy)/60);
   const remain=Math.max(0,m-prep-roundsMin);
   return [
     {label:'گرم‌کردن هوازی',time:`${prep} min`,note:'حرکت درجا سبک'},
     {label:`${rounds} دور اینتروال`,time:`${roundsMin} min`,note:`هر دور: ${intense}s سریع + ${easy}s آرام با Step Jack یا بوکس سایه‌ای`},
     {label:'تکمیل زمان با هوازی متوسط',time:`${remain} min`,note:'حرکت درجا یا Step Jack کنترل‌شده'}
   ];
 }
 const settle=Math.min(2,m), walk=Math.max(1,Math.floor((m-settle)*0.4)), step=Math.max(1,Math.floor((m-settle-walk)*0.5)), boxing=Math.max(0,m-walk-step-settle);
 return [
   {label:'حرکت سریع درجا',time:`${walk} min`,note:'شدت متوسط'},
   {label:'Step Jack بدون پرش',time:`${step} min`,note:'ریتم یکنواخت'},
   {label:'بوکس سایه‌ای بدون دمبل',time:`${boxing} min`,note:'کنترل شکم و تنفس'},
   {label:'کاهش شدت و آرام‌سازی',time:`${settle} min`,note:'قدم آهسته درجا'}
 ];
}
function workoutStructure(plan,draft){
 const activityItems=items=>(items||[]).map(item=>{
  const guide=GUIDES.forStage(item.name_en);
  return {label:guide?.fa||item.name_fa,en:guide?.en||item.name_en,guide,
   time:`${nf(item.duration_seconds)} ثانیه`,note:item.instruction_fa||'',state:'neutral'};
 });
 const warm=activityItems(plan.warmupItems),cool=activityItems(plan.cooldownItems),cardio=activityItems(plan.cardioDetails?.steps);
 const currentMainIndex=Math.max(0,activeFocusIndex(draft));
 const main=(plan.steps||[]).map((step,i)=>{
  const log=draft?.exerciseLogs?.[i]||null;
  const movement=log?.id||step.id;
  const ex=P.exercises[movement]||{fa:movement,en:movement,side:false};
  const guide=GUIDES.get(movement,draft.planVersion);
  const totalSets=Number(step.sets||log?.sets?.length||0);
  const completedSets=log?log.sets.filter(q=>q.done).length:0;
  const pendingSets=Math.max(0,totalSets-completedSets);
  const targets=(log?.sets?.length?log.sets.map(q=>q.coachTarget):COACH.initial(step,ex,plan.week).targets)||[];
  const unit=(log?.sets?.[0]?.coachUnit)||(COACH.range(step).unit)||'تکرار';
  const rest=Number(log?.coachRest||step.rest||0);
  const state=completedSets===totalSets&&totalSets>0?'complete':i===currentMainIndex?'current':'upcoming';
  const targetText=targets.length?targets.map(v=>nf(v)).join('/'):`${nf(totalSets)}`;
  const note=`${nf(totalSets)} ست × ${targetText} ${unit}${ex.side?' هر سمت':''} • استراحت ${nf(rest)} ثانیه`;
  const meta=completedSets===totalSets&&totalSets>0?'کامل شده':i===currentMainIndex?`مرحله فعلی • ${nf(pendingSets)} ست باقی‌مانده`:`در انتظار • ${nf(pendingSets)} ست باقی‌مانده`;
  return {label:guide?.fa||ex.fa,en:guide?.en||ex.en,guide,time:`~${((step.estimatedSeconds||0)/60).toFixed(1)} min`,note,meta,state};
 });
 const stages=[
  {id:'warmup',label:'گرم‌کردن',seconds:Math.round(plan.warmup*60),items:warm,tone:'warm',action:'warmup'},
  {id:'main',label:'تمرین اصلی',seconds:Math.round(plan.strength*60),items:main,tone:'main',action:'main'},
  {id:'cardio',label:'هوازی',seconds:Math.round(plan.cardioMinutes*60),items:cardio,tone:'cardio',action:'cardio'},
  {id:'cooldown',label:'سردکردن',seconds:Math.round(plan.cooldown*60),items:cool,tone:'cool',action:'cooldown'}
 ];
 const completeMain=draft.exerciseLogs.length>0&&draft.exerciseLogs.every(x=>x.sets.every(q=>q.done));
 const done={warmup:draft.warmupConfirmed,main:completeMain,cardio:draft.cardioConfirmed,cooldown:draft.cooldownConfirmed};
 const current=stages.find(x=>!done[x.id])?.id||'done';
 const bar=stages.map(a=>`<div class="final-timeline-segment ${a.tone} ${done[a.id]?'complete':current===a.id?'active':'upcoming'}" style="flex:${Math.max(1,a.seconds)}" title="${a.label}: ${nf((a.seconds/60).toFixed(1))} دقیقه"></div>`).join('');
 const phasePills=stages.map(a=>`<div class="final-phase-pill ${a.tone} ${done[a.id]?'complete':current===a.id?'current':'waiting'}"><span>${a.label}</span><b>${nf((a.seconds/60).toFixed(1))} دقیقه</b><small>${done[a.id]?'انجام شد':current===a.id?'مرحله فعلی':'در انتظار'}</small></div>`).join('');
 const rowsFor=a=>a.items.length?a.items.map((it,i)=>`<div class="final-stage-row ${it.state||''}"><span>${nf(i+1)}</span><div><b>${escapeHtml(it.label)}${it.en?`<span class="final-stage-en" dir="ltr">${escapeHtml(it.en)}</span>`:''}</b><small>${escapeHtml(it.note||'')}</small>${it.meta?`<em>${escapeHtml(it.meta)}</em>`:''}</div><div class="stage-row-actions"><strong>${escapeHtml(it.time)}</strong>${it.guide?exerciseGuideButton(it.guide):''}</div></div>`).join(''):`<div class="final-stage-empty">هنوز موردی برای این بخش ثبت نشده است.</div>`;
 const actionFor=a=>a.id==='warmup'?`<button class="btn ${done.warmup?'outline':'primary'}" data-action="confirm-warmup">${done.warmup?'بازگردانی تأیید گرم‌کردن':'گرم‌کردن را کامل انجام دادم'}</button>`:a.id==='cooldown'?`<button class="btn ${done.cooldown?'outline':'primary'}" data-action="confirm-cooldown">${done.cooldown?'بازگردانی تأیید سردکردن':'سردکردن را کامل انجام دادم'}</button>`:a.id==='cardio'?`<button class="btn ${done.cardio?'outline':'primary'}" data-cardio-confirm="true">${done.cardio?'بازگردانی تأیید هوازی':'هوازی را کامل انجام دادم'}</button>`:`<div class="final-stage-empty">جزئیات حرکات اصلی پایین صفحه در کارت‌های ثبت ست نمایش داده می‌شوند. این بخش فقط نقشه و ترتیب اجرای جلسه را نشان می‌دهد.</div>`;
 const card=a=>`<details class="final-stage ${a.tone}" id="stage-${a.id}" ${current===a.id?'open':''}><summary><span class="final-stage-state">${done[a.id]?icon('check'):current===a.id?'●':'○'}</span><b>${a.label}</b><small>${nf(a.seconds/60)} دقیقه</small><span class="stage-state-label">${done[a.id]?'انجام شد':current===a.id?'مرحله فعلی':'در انتظار'}</span></summary><div class="final-stage-content">${a.id==='cardio'?`<p class="stage-program-note">${nf(plan.cardioDetails?.rounds||1)} دور × ${nf(plan.cardioDetails?.round_seconds||0)} ثانیه • ${escapeHtml(plan.cardioDetails?.intensity||'شدت قابل کنترل')}</p>`:''}${rowsFor(a)}<div class="final-stage-action">${actionFor(a)}</div></div></details>`;
 return `<section class="workout-structure card spaced"><div class="section-title"><div><h2>مسیر اجرای جلسه</h2></div><span class="tag">${nf(plan.duration)} دقیقه (تقریبی)</span></div><div class="final-timeline" role="img" aria-label="زمان‌بندی افقی جلسه">${bar}</div><div class="final-phase-pills">${phasePills}</div><div class="final-stage-list">${stages.map(card).join('')}</div></section>`;
}

function workoutDock(draft){
 return `<section class="workout-dock no-print" aria-label="زمان‌سنج‌های تمرین">
  <div class="dock-clock">${icon('clock')}<span>زمان جلسه</span><b data-session-clock dir="ltr"></b></div>
  <div class="dock-clock dock-rest" id="rest-banner">${icon('clock')}<span>استراحت</span><b data-rest-clock dir="ltr"></b></div>
  <button class="icon-btn dock-action" data-action="${draft.exerciseStartedAt?'timer-stop':'start-session-clock'}"
   aria-label="${draft.exerciseStartedAt?'توقف زمان‌سنج استراحت':'شروع زمان‌سنج جلسه'}"
   title="${draft.exerciseStartedAt?'توقف استراحت':'شروع زمان جلسه'}" ${draft.exerciseStartedAt&&!timerEnds?'disabled':''}>
   ${icon(draft.exerciseStartedAt?'close':'play')}
  </button>
 </section>`;
}
function renderWorkout(){const draft=state.activeSession,next=nextSchedule();const canStart=!!next;const recent=recentSessions(6);
 if(draft){
 const history=AN.histories(state.sessions.filter(session=>session.id!==draft.id),P.exercises).reverse();
 const p=planFor(draft.sessionNumber,draft),done=completedSets(draft),total=totalSets(draft),allDone=done===total,currentIdx=activeFocusIndex(draft),order=(focusMode?[currentIdx,...draft.exerciseLogs.map((_,i)=>i).filter(i=>i!==currentIdx)]:draft.exerciseLogs.map((_,i)=>i)),currentEx=GUIDES.get(draft.exerciseLogs[currentIdx]?.id,draft.planVersion)||P.exercises[draft.exerciseLogs[currentIdx]?.id]||null;
 return `${workoutDock(draft)}${recoveryEntries.length&&!workoutPending?recoveryNotice():''}${head('تمرین امروز',`جلسه ${nf(draft.sessionNumber)} از 120 • ${p.title} • ${pd(draft.date)}`,btn(icon('close')+' خروج و ذخیره خودکار','leave-workout','outline'))}
 <div class="training-focus"><div><span class="focus-kicker">برنامهٔ جلسه</span><h2>${escapeHtml(p.title)}</h2><button class="btn" data-action="jump-workout">${icon('play')} ${!draft.warmupConfirmed?'رفتن به گرم‌کردن':draft.exerciseLogs.some(log=>log.sets.some(set=>!set.done&&!set.failed))?'رفتن به حرکت فعلی':!draft.cardioConfirmed?'رفتن به هوازی':!draft.cooldownConfirmed?'رفتن به سردکردن':'رفتن به ثبت جلسه'}</button></div><div class="focus-week"><strong>${nf(p.week)}<small>/ 24</small></strong><span>هفته برنامه</span></div></div>
 <div class="focus-toolbar no-print"><div class="actions">${btn(icon('target')+(focusMode?' نمایش جزئیات همه':' تمرکز روی حرکت'),'toggle-focus','outline')}${btn(icon(restSound?'volume':'volume-off')+' صدای استراحت','toggle-sound','outline',`aria-pressed="${restSound}"`)}${btn(icon('play')+' آزمایش صدا','test-rest-alarm','outline')}${p.kind==='strength'?btn((draft.executionMode==='busy'?' بازگشت به برنامه کامل':' نسخه کوتاه روز شلوغ'),'toggle-busy','outline'):''}</div><span class="hint">هدف حرکت ثابت است؛ فقط نتیجه واقعی ست را ثبت کن.</span></div>
 <details class="ux-disclosure readiness-drawer no-print"><summary>تنظیم آمادگی امروز <span class="summary-hint">اختیاری</span></summary><div class="readiness-strip"><b>آمادگی امروز</b>${[['good','آماده'],['medium','کمی خسته'],['poor','خسته / پس از شیفت']].map(([v,t])=>`<button class="readiness-choice ${draft.readiness===v?'chosen':''}" data-readiness="${v}" aria-pressed="${draft.readiness===v}">${t}</button>`).join('')}<small>${draft.readiness==='poor'?'تمرین سنگین امروز بهتر است به روز بعد منتقل شود.':draft.readiness==='medium'?'تمرین را بدون افزایش اجباری دشواری انجام بده.':'برنامه اصلی را با فرم صحیح دنبال کن.'}</small>${draft.readiness==='poor'?`<button class="btn sm outline" data-action="postpone-workout">انتقال جلسه به روز مناسب بعدی</button>`:''}</div><div class="safety-alert-row"><button class="btn sm outline" data-action="report-safety">${draft.safetyFlag?'رفع پرچم پس از ارزیابی':'درد تیز، ضعف غیرعادی، سرگیجه یا علامت هشدار دارم'}</button></div></details>
 <details class="ux-disclosure fm-session-options no-print"><summary>تنظیمات و گزینه‌های جلسه <span class="summary-hint">اختیاری</span></summary><div class="workout-reset-area"><span>برای شروع مجدد، اطلاعات تمرین امروز پس از پشتیبان‌گیری و دو مرحله تأیید حذف می‌شود.</span><button class="btn sm outline reset-day-button" data-action="reset-today-training">${icon('rotate')} ریست تمرین امروز</button></div></details>
 ${workoutStructure(p,draft)}
 <div class="training-overview fm-workout-overview"><div class="overview-stat"><span>ست‌های تکمیل‌شده</span><strong>${nf(done)} <small>/ ${nf(total)}</small></strong></div><div class="overview-stat"><span>ست‌های باقی‌مانده</span><strong>${nf(total-done)}</strong></div><div class="overview-stat"><span>حرکات تکمیل‌شده</span><strong>${nf(draft.exerciseLogs.filter(x=>x.sets.every(z=>z.done)).length)} <small>/ ${nf(draft.exerciseLogs.length)}</small></strong></div></div>
 <div class="current-exercise-banner"><span class="current-exercise-dot"></span><div><b>حرکت فعلی:</b> ${currentEx?escapeHtml(currentEx.fa):'—'} <span class="english-inline" lang="en" dir="ltr">${currentEx?escapeHtml(currentEx.en):''}</span></div><small>حرکت ${nf(currentIdx+1)} از ${nf(draft.exerciseLogs.length)}</small></div>
 <details class="ux-disclosure workout-help"><summary>راهنمای ثبت تمرین و ست ناتمام</summary><div class="disclosure-content">تأیید هر ست یعنی تمام تکرارها با فرم صحیح انجام شده‌اند. برای ست ناقص دکمه «این ست کامل نشد» را بزن. حرکات بعدی در صف انتظارند.</div></details>
 <div class="workout-counter-list"><div class="section-title" style="margin-bottom:4px"><div><h2>ثبت تمرین اصلی</h2><p class="subheading">ثبت ست برای حرکت فعلی فعال است.</p></div><span class="tag">${nf(draft.exerciseLogs.length)} حرکت</span></div>${order.map(i=>{const r=draft.exerciseLogs[i],processed=r.sets.every(q=>q.done||q.failed);const status=processed?'queue-done':'queue-waiting';return exerciseCounter(r,i,history).replace('class="counter-exercise ',`class="counter-exercise ${focusMode&&i===currentIdx?'focus-active':status} `);}).join('')}</div>

 ${p.cardioMinutes>0&&Number(draft.planVersion)<7?`<section class="counter-exercise cardio-counter" id="cardio-check"><div class="counter-top"><div class="counter-id">${icon('flame')}</div><div class="counter-name"><h3>بخش هوازی داخل خانه</h3><div class="counter-en" dir="ltr">Home Cardio</div></div></div><div class="counter-target"><span class="counter-caption">هدف این جلسه</span><strong>${nf(p.cardioMinutes)} دقیقه هوازی</strong><small>${escapeHtml(p.cardio)}</small></div><div class="counter-progress" role="progressbar" aria-label="وضعیت هوازی" aria-valuenow="${draft.cardioConfirmed?1:0}" aria-valuemin="0" aria-valuemax="1"><div class="counter-progress-fill" style="width:${draft.cardioConfirmed?'100':'0'}%"></div></div><div class="counter-bottom"><span class="counter-left ${draft.cardioConfirmed?'is-complete':''}">${draft.cardioConfirmed?'هوازی تکمیل شد':'در انتظار تأیید'}</span><div class="counter-button-wrap"><button type="button" class="btn ${draft.cardioConfirmed?'outline':'primary'} counter-big-button" data-cardio-confirm="true">${icon(draft.cardioConfirmed?'rotate':'check')} ${draft.cardioConfirmed?'برگرداندن تأیید هوازی':'هوازی را کامل انجام دادم'}</button></div></div></section>`:''}
 <div class="workout-final-panel" id="workout-summary"><div><h2 tabindex="-1">${allDone&&draft.warmupConfirmed&&draft.cardioConfirmed&&draft.cooldownConfirmed?'همه مراحل جلسه تکمیل شدند!':'پایان و ثبت جلسه'}</h2><p>${allDone?'برای ذخیره جلسه کامل، دکمه ثبت نهایی را بزن.':'اگر ست کامل نشد، موفقیت محسوب نمی‌شود؛ می‌توانی جلسه را نیمه‌تمام ذخیره و بعداً ادامه بدهی.'}</p><small>هوازی: ${escapeHtml(p.cardio)} • فعالیت‌ها و سردکردن طبق برنامه انجام شوند.</small></div><div class="workout-final-actions">${btn(icon('check')+(allDone?' ثبت نهایی جلسه کامل':' ذخیره جلسه نیمه‌تمام'),'finish-workout','primary')}${btn('ذخیره و خروج','leave-workout','outline')}</div>${renderWorkoutSaveStatus()}</div>`;}
 return `${head('جلسه تمرین و ثبت عملکرد','مربی تعداد مشخص هر ست را تعیین می‌کند؛ تو فقط اجرای واقعی را ثبت کن.')}
 ${FORMINO_CLOCK.trainingCountForDate(state,today()).total?`<div class="workout-reset-area"><span>جلسه ثبت‌شده امروز را می‌خواهی از نو شروع کنی؟</span><button class="btn sm outline reset-day-button" data-action="reset-today-training">${icon('rotate')} ریست تمرین امروز</button></div>`:''}
 ${next?`<div class="hero"><div class="hero-content"><div class="hero-label">جلسه ${nf(next.sessionNumber)} از ۱۲۰ • هفته تمرینی ${nf(next.prescription.week)}</div><h2>${next.prescription.title}</h2><p>${next.prescription.subtitle} • ${pd(next.date)} • ${next.prescription.steps.length} حرکت • ${nf(next.prescription.duration)} دقیقه تمرین در خانه</p><button class="btn" data-action="start-workout">${icon('play')} شروع ثبت جلسه</button></div><div class="hero-stat"><big>${next.prescription.code}</big><small>${next.prescription.phase.name}</small></div><div class="hero-deco"></div></div>`:`<div class="empty">${completedCount()>=120?'تمام ۱۲۰ جلسه برنامه ثبت شده‌اند.':'جلسه قابل برنامه‌ریزی موجود نیست؛ تنظیمات شیفت و تاریخ شروع را بررسی کن.'}</div>`}
 <div class="grid two spaced"><div class="card"><div class="section-title"><h2>جزئیات جلسه بعدی</h2><button class="table-btn" data-nav="plan">مشاهدهٔ برنامه</button></div>${next?`<div class="stack">${next.prescription.steps.map((s,i)=>`<div class="list-row"><div class="ex-bullet">${nf(i+1)}</div><div><div class="list-title">${P.exercises[s.id].fa}</div><div class="list-subtitle">${P.exercises[s.id].en}</div></div><div class="list-end tiny">${nf(s.sets)} ست × ${nf(COACH.initial(s,P.exercises[s.id],next.prescription.week).targets[0])} ${COACH.range(s).unit}</div></div>`).join('')}</div>`:'<div class="empty">—</div>'}</div>
 <div class="card"><div class="section-title"><h2>تاریخچه جلسات</h2><span class="tag">${nf(completedCount())} جلسه</span></div>${recent}</div></div>
 <div class="notice spaced">${icon('info')}<span>داده‌های این صفحه در پایگاه داده SQLite همین پوشه ذخیره می‌شوند. هر ست را مطابق آنچه واقعاً انجام داده‌ای ثبت کن؛ برنامه خودکار بر اساس تمرین ثبت‌شده بعدی را پیشنهاد می‌دهد.</span></div>`;
}
function clockText(t){const v=Math.max(0,Math.floor(t));return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;}
function unlockRestAudio(){
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  if(!beepContext||beepContext.state==='closed')beepContext=new C();
  if(beepContext.state==='suspended')void beepContext.resume();
  return beepContext;
 }catch{return null;}
}
// Four clear dual-tone pulses over ~2 seconds. Browser/system volume is outside app control.
function beepRest(force=false){
 if(!force&&!restSound)return false;
 try{const ctx=unlockRestAudio();if(!ctx)return false;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=9;compressor.ratio.value=8;compressor.attack.value=.003;compressor.release.value=.18;
  const master=ctx.createGain();master.gain.value=.85;compressor.connect(master);master.connect(ctx.destination);
  const base=ctx.currentTime+.018;
  for(let i=0;i<4;i++){
   const t=base+i*.49;
   for(const [freq,type,gain] of [[660,'triangle',.23],[990,'sine',.14]]){
    const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq+(i===3?65:0),t);
    env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(gain,t+.018);env.gain.setValueAtTime(gain,t+.25);env.gain.exponentialRampToValueAtTime(.0001,t+.43);
    osc.connect(env);env.connect(compressor);osc.start(t);osc.stop(t+.45);
   }
  }
  return true;
 }catch{return false;}
}
function paintSessionClock(){
 const start=state?.activeSession?.exerciseStartedAt;
 const value=FORMINO_CLOCK.formatElapsed(FORMINO_CLOCK.elapsedSeconds(start));
 root.querySelectorAll('[data-session-clock]').forEach(el=>{if(el.textContent!==value)el.textContent=value;});
}
function startSessionClock(){
 if(!state?.activeSession)return false;
 if(state.activeSession.exerciseStartedAt)return false;
 state.activeSession.exerciseStartedAt=new Date().toISOString();
 if(!sessionClockTicker)sessionClockTicker=setInterval(paintSessionClock,1000);
 paintSessionClock();return true;
}
function stopSessionClock(){clearInterval(sessionClockTicker);sessionClockTicker=null;paintSessionClock();}
function paintTimer(){
 const value=clockText(timerLeft);
 root.querySelectorAll('[data-rest-clock]').forEach(box=>{if(box.textContent!==value)box.textContent=value;});
 const active=timerEnds>Date.now();
 const card=$('#rest-banner');
 if(card)card.classList.toggle('rest-active',active);
 const stop=root.querySelector('.workout-dock [data-action="timer-stop"]');
 if(stop)stop.disabled=!active||!canEditWorkout(workoutSaveStatus);
}
function completeRestTimer(){
 clearInterval(timerInterval);timerInterval=null;timerLeft=0;timerEnds=0;
 if(state?.activeSession){state.activeSession.restUntil=0;state.activeSession.restDuration=0;}
 paintTimer();beepRest();toast('زمان استراحت تمام شد؛ ست بعدی آماده است.');
}
function runTimer(seconds,restoring=false){
 clearInterval(timerInterval);
 restSecondsTotal=Math.max(1,Number(seconds)||60);
 if(!restoring){timerEnds=Date.now()+restSecondsTotal*1000;if(state?.activeSession){state.activeSession.restUntil=timerEnds;state.activeSession.restDuration=restSecondsTotal;}}
 timerLeft=Math.max(0,Math.ceil((timerEnds-Date.now())/1000));
 if(!timerLeft){timerEnds=0;timerLeft=0;paintTimer();return;}// Do not replay stale alerts after reopening.
 paintTimer();timerInterval=setInterval(()=>{
  timerLeft=Math.max(0,Math.ceil((timerEnds-Date.now())/1000));paintTimer();
  if(!timerLeft)completeRestTimer();
 },250);
}
function endTimer(){clearInterval(timerInterval);timerInterval=null;timerLeft=0;timerEnds=0;restSecondsTotal=0;if(state?.activeSession){state.activeSession.restUntil=0;state.activeSession.restDuration=0;}paintTimer();}
async function saveAndRenderWorkout(){
 const saving=saveWorkoutProgress();
 render();
 await saving;
}
function activeFocusIndex(draft){const n=draft?.exerciseLogs?.findIndex(x=>x.sets.some(z=>!z.done&&!z.failed))??-1;return n<0?Math.max(0,(draft?.exerciseLogs?.length||1)-1):n;}
function renderPlan(){selectedPlanWeek=clamp(selectedPlanWeek,1,24);const p=P.prescription(selectedPlanWeek,selectedPlanCode),phase=p.phase;const links=P.sessions.map(x=>`<button class="session-tab ${selectedPlanCode===x.code?'active':''}" data-plan-session="${x.code}">${x.code} • ${x.title}</button>`).join('');
 return `${head('برنامه کامل ۲۴ هفته‌ای','هر جلسه هدف عددی پایه دارد؛ وقتی تمرین را شروع می‌کنی، هدف شخصی‌سازی‌شده با نتایج قبلی تنظیم می‌شود.',btn(icon('file')+' چاپ برنامه','print-plan','outline'))}
 <div class="card week-selector-card"><div class="section-title"><h2>هفته و فاز تمرینی</h2>${eTag('هفته '+nf(selectedPlanWeek)+' از 24','green')}</div><div class="control-bar"><div class="field"><label for="plan-week-select">انتخاب هفته</label><select id="plan-week-select">${Array.from({length:24},(_,i)=>`<option value="${i+1}" ${selectedPlanWeek===i+1?'selected':''}>هفته ${nf(i+1)} — ${P.phaseOf(i+1).name}</option>`).join('')}</select></div><div class="plan-week-summary">${P.phaseOf(selectedPlanWeek).name}<small>برای دیدن تمام هفته‌ها، فهرست زیر را باز کن.</small></div></div><details class="ux-disclosure week-picker"><summary>نمایش نقشه تمام 24 هفته</summary><div class="week-grid">${Array.from({length:24},(_,i)=>{const n=i+1;return `<button class="week-btn ${n===selectedPlanWeek?'active':''}" data-plan-week="${n}"><b>هفته ${nf(n)}</b><span>${P.phaseOf(n).name}</span></button>`;}).join('')}</div></details></div>
 <div class="card spaced"><div class="section-title"><div><h2>${phase.name} — هفته ${nf(selectedPlanWeek)}</h2><p class="subheading">شدت هدف: ${phase.effort} • RIR: ${phase.rir} تکرار ذخیره</p></div>${eTag('۵ جلسه تمرینی','green')}</div><div class="notice">${icon('info')}<span>${phase.note}<br><b>هدف اختصاصی هفته:</b> ${escapeHtml(p.weekGoal||'')}<br><b>قانون پیشرفت:</b> ${escapeHtml(p.performanceRule||'افزایش تدریجی با حفظ فرم.')}</span></div><div class="hr"></div><div class="session-tabs">${links}</div><div class="row-between" style="margin:18px 0 12px"><div><h2 style="margin:0;font-size:17px">${p.title} <span class="tag">${p.code}</span></h2><p class="subheading">${p.subtitle}</p></div><span class="pill">${icon('clock')} ${nf(p.duration)} دقیقه</span></div>
 <div class="grid four" style="gap:9px;margin-bottom:15px"><div class="summary-cell"><b>${nf(p.warmup)} دقیقه</b><span>گرم‌کردن</span></div><div class="summary-cell"><b>${nf(p.strength)} دقیقه</b><span>قدرتی</span></div><div class="summary-cell"><b>${nf(p.cardioMinutes)} دقیقه</b><span>هوازی</span></div><div class="summary-cell"><b>${nf(p.cooldown)} دقیقه</b><span>سردکردن</span></div></div>
 <div class="table-wrap plan-desktop-table"><table class="data-table"><thead><tr><th>حرکت</th><th>نام انگلیسی</th><th>ست</th><th>هدف پایه تکرار / زمان</th><th>استراحت</th><th>آموزش</th></tr></thead><tbody>${p.steps.map((s,i)=>`<tr><td><span class="exercise-mini"><span class="ex-bullet">${nf(i+1)}</span>${P.exercises[s.id].fa}</span></td><td class="english">${P.exercises[s.id].en}</td><td>${nf(s.sets)}</td><td><strong>${nf(s.targets?.[0]||COACH.initial(s,P.exercises[s.id],selectedPlanWeek).targets[0])} ${s.unit==='seconds'?'ثانیه':'تکرار'}</strong><div class="hint">هدف پایه، وابسته به کالیبراسیون</div></td><td>${nf(s.rest)} ثانیه</td><td><button class="table-btn" data-exercise="${s.id}">راهنما و ویدئو</button></td></tr>`).join('')}</tbody></table></div><div class="plan-mobile-cards">${p.steps.map((s,i)=>{const e=P.exercises[s.id];return `<article class="plan-mobile-card"><div class="plan-mobile-index">${nf(i+1)}</div><div class="plan-mobile-content"><strong>${escapeHtml(e.fa)}</strong><small dir="ltr">${escapeHtml(e.en)}</small><div class="plan-mobile-prescription"><b>${nf(s.sets)} ست × ${nf(s.targets?.[0]||COACH.initial(s,e,selectedPlanWeek).targets[0])} ${s.unit==='seconds'?'ثانیه':'تکرار'}</b><span>استراحت: ${nf(s.rest)} ثانیه</span></div><button class="table-btn" data-exercise="${s.id}">آموزش حرکت</button></div></article>`;}).join('')}</div>
 <div class="hr"></div><div class="notice">${icon('clock')}<span><b>هوازی ${nf(p.cardioMinutes)} دقیقه:</b> ${p.cardio}<br><b>گرم‌کردن ${nf(p.warmup)} دقیقه:</b> ${p.warmupText}<br><b>سردکردن ${nf(p.cooldown)} دقیقه:</b> ${p.cooldownText}<br><b>ترتیب و استراحت:</b> ${p.orderNote}</span></div>
 </div><div class="notice warn spaced">${icon('alert')}<span>از روز اول حجم هفته‌های پیشرفته را اجرا نکن. حتی با هدف چربی‌سوزی سریع، اجرای باکیفیت، تغذیه کافی و فرصت ریکاوری به رشد عضله کمک بیشتری می‌کنند. تمرین شدید تا ناتوانی مطلق برای همه ست‌ها لازم نیست.</span></div>`;
}
function measurementField(d,record){const val=record&&valueOf(record,d.key)!==null?valueOf(record,d.key):'',prev=latest(d.key);return `<div class="field"><label for="measure-${d.key}">${d.fa}</label><input id="measure-${d.key}" type="number" name="m-${d.key}" min="0" step="0.1" placeholder="${prev?'قبلی: '+prev.value:'ثبت مقدار'}" value="${escapeHtml(val)}"><small>${d.unit||'نسبت'}</small></div>`;}
function renderMeasurements(){selectedMeasureWeek=clamp(selectedMeasureWeek,1,24);const row=measurementForWeek(selectedMeasureWeek),current=currentWeek(),old=state.oldMeasures;
 return `${head('اندازه‌گیری هفتگی تمام بدن','هر هفته در شرایط مشابه اندازه بگیر. تمام اندام‌ها به‌صورت مستقل ذخیره و تحلیل می‌شوند.',btn(icon('chart')+' مشاهده نمودارها','go-analytics','outline'))}
 <div class="card"><div class="section-title"><h2>انتخاب هفته اندازه‌گیری</h2><span class="tag">هفته تمرینی ${nf(phaseWeek())} از 24</span></div><div class="control-bar"><div class="field" style="width:220px"><label for="measure-week">هفته موردنظر</label><select id="measure-week">${Array.from({length:24},(_,i)=>`<option value="${i+1}" ${selectedMeasureWeek===i+1?'selected':''}>هفته تمرینی ${nf(i+1)}</option>`).join('')}</select></div><span class="hint">برای هر شاخص یک مقدار وارد کن؛ فیلدهای خالی، داده گمشده باقی می‌مانند.</span></div><div class="notice">${icon('info')}<span>برای دور شکم متر را هم‌سطح ناف و برای باسن در برجسته‌ترین بخش قرار بده. محیط‌ها را یک‌بار در شرایط مشابه، بدون سفت‌کردن متر و بدون داخل‌دادن شکم اندازه بگیر. این بخش فقط اندازه‌های متر و نسبت دور کمر به قد را ثبت و تحلیل می‌کند.</span></div>
 <form id="measurement-form"><div class="form-grid spaced"><div class="field"><label for="measure-date">تاریخ اندازه‌گیری</label><input type="date" id="measure-date" name="measure-date" value="${escapeHtml(row?.date||today())}" required></div></div>${['بالاتنه','میان‌تنه','پایین‌تنه'].map(cat=>`<div class="section-title spaced"><h2>${cat}</h2><span class="tag">${nf(defs.filter(d=>d.category===cat&&!d.derived).length)} شاخص</span></div><div class="form-grid">${defs.filter(d=>d.category===cat&&!d.derived).map(d=>measurementField(d,row)).join('')}</div>`).join('')}
 <p class="form-feedback" id="measurement-feedback" role="status" tabindex="-1"></p><div class="form-actions"><button class="btn primary" type="submit">${icon('check')} ذخیره اندازه‌گیری این هفته</button>${btn('کپی مقادیر آخرین ثبت','copy-last-measures','outline')}${btn('حذف ثبت این هفته','remove-measure','danger',row?'':'disabled')}${btn('نمایش گزارش هفتگی','go-reports','outline')}</div></form></div>
 <details class="ux-disclosure spaced"><summary>مشاهده اندازه‌های قدیمی مرجع <span class="summary-hint">خارج از نمودارها</span></summary><div class="disclosure-content"><p class="subheading">تاریخ و شرایط اندازه‌گیری قدیمی یکسان و معلوم نیست؛ بنابراین این مقادیر خط مبنای نمودار نیستند.</p><div class="grid four">${Object.entries(old).map(([key,value])=>`<div class="summary-cell"><b>${nf(value)} <small>cm</small></b><span>${byMetric[key]?.fa||key}</span></div>`).join('')}</div></div></details>`;
}
function drawChart(points,label,unit,w=750,h=270){if(!points||!points.length)return '<div class="chart-empty">هنوز داده کافی برای این نمودار ثبت نشده است.<br>از بخش اندازه‌گیری بدن شروع کن.</div>';const left=48,right=17,top=20,bottom=43,pw=w-left-right,ph=h-top-bottom;const vals=points.map(x=>x.value),min0=Math.min(...vals),max0=Math.max(...vals),span=Math.max(0.5,(max0-min0)*1.6),min=min0-span*.15,max=max0+span*.85;const ymin=isFinite(min)?min:0,ymax=isFinite(max)?max:1;
 const x=wk=>left+((wk)/24)*pw;const y=v=>top+(ymax-v)/(ymax-ymin)*ph;
 const path=points.map((p,i)=>(i===0?'M':'L')+x(p.week).toFixed(1)+','+y(p.value).toFixed(1)).join(' ');
 const area=path+` L${x(points.at(-1).week).toFixed(1)},${top+ph} L${x(points[0].week).toFixed(1)},${top+ph} Z`;
 const grid=Array.from({length:5},(_,i)=>{const yy=top+i*ph/4,v=ymax-i*(ymax-ymin)/4;return `<line class="chart-gridline" x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}"/><text class="chart-text" text-anchor="end" x="${left-9}" y="${yy+4}">${Number(v.toFixed(1))}</text>`;}).join('');
 const ticks=[0,4,8,12,16,20,24].map(a=>`<text class="chart-text" text-anchor="middle" x="${x(a)}" y="${h-13}">${nf(a)}</text>`).join('');
 return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="نمودار ${escapeHtml(label)} در هفته‌های برنامه"><title>${escapeHtml(label)} — ${escapeHtml(unit)}</title>${grid}<path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>${points.map(p=>`<circle class="chart-dot" cx="${x(p.week).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4"><title>هفته ${p.week}: ${p.value} ${unit}</title></circle>`).join('')}${ticks}<text class="chart-text" text-anchor="middle" x="${w/2}" y="${h-1}">هفته</text></svg>`;
}
function spark(points){if(!points?.length)return '<span class="hint">بدون داده</span>';const vals=points.map(x=>x.value),max=Math.max(...vals),min=Math.min(...vals),span=Math.max(.2,max-min),poly=points.map((p,i)=>`${i*(126/Math.max(points.length-1,1))},${24-(p.value-min)/span*19}`).join(' ');return `<svg viewBox="0 0 130 29" class="sparkline" aria-hidden="true"><polyline points="${poly}" stroke="#3a966d" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function metricCard(d){const arr=series(d.key),last=arr.at(-1),prev=arr.length>1?arr.at(-2):null,change=last&&prev?pct(last.value,prev.value):null;return `<button class="metric-card ${selectedMetric===d.key?'active':''}" data-metric="${d.key}"><div class="metric-top"><span>${d.fa}</span><span>${d.unit||''}</span></div><strong>${last?nf(last.value):'—'}</strong><div class="change">${change===null?'ثبت اول یا داده ناکافی':(change>0?'+':'')+nf(change)+'٪ نسبت به ثبت قبلی'}</div>${spark(arr)}</button>`;}
function strengthPairs(upTo=today()){const rows=[];for(const id of Object.keys(P.exercises)){const logs=[...state.sessions].filter(s=>s.date<=upTo).sort((a,b)=>a.date.localeCompare(b.date)).flatMap(s=>(s.exerciseLogs||[]).filter(x=>x.id===id).map(x=>({date:s.date,sets:x.sets})));if(logs.length<2)continue;const extract=l=>Math.max(0,...l.sets.filter(s=>s.done).map(s=>(num(s.repsR)>0&&num(s.repsL)>0)?Math.min(num(s.repsR),num(s.repsL)):num(s.reps)||0));const first=extract(logs[0]),last=extract(logs.at(-1));if(first<=0)continue;
 const firstLoads=logs[0].sets.filter(s=>s.done).map(s=>num(s.weight)||0),lastLoads=logs.at(-1).sets.filter(s=>s.done).map(s=>num(s.weight)||0);const comparable=Math.max(0,...firstLoads)===Math.max(0,...lastLoads);rows.push({id,name:P.exercises[id].fa,first,last,percent:comparable?pct(last,first):null,firstLoad:Math.max(0,...firstLoads),lastLoad:Math.max(0,...lastLoads),comparable});}return rows;}
function scoreInfo(weekLimit=null){const lastDay=weekLimit===null?today():weekWindow(clamp(weekLimit,1,24)).last;const cutoff=lastDay<today()?lastDay:today();if(cutoff<state.startDate)return {subs:[],overall:null,coverage:0,availableWeight:0,strengthComparisons:[],plannedTotal:0};const measures=k=>{const arr=series(k).filter(x=>weekLimit===null||x.week<=weekLimit);return arr.length>=2?arr:null;};const records=state.sessions.filter(s=>s.date<=cutoff);
 // A personalized motivational index, not a validated health / body-composition score.
 const eligibleDates=Array.from({length:7},(_,i)=>addDays(weekStart(today()),i)).filter(x=>x<=today()&&!state.shifts.includes(x));
 const firstDate=state.startDate;const elapsed=clamp(Math.floor(diffDays(cutoff,firstDate)/7)+1,0,weekLimit??60);let plannedTotal=0;
 for(let n=1;n<=elapsed;n++){const {first,last}=weekWindow(n);const maxDay=n===elapsed?cutoff:last;const relevantDays=Array.from({length:7},(_,i)=>addDays(first,i)).filter(d=>d>=firstDate&&d<=maxDay&&!state.shifts.includes(d)&&!state.unavailable.includes(d)&&!state.rest.includes(d));plannedTotal+=Math.min(5,relevantDays.length);}
 const adherence=plannedTotal?clamp(records.filter(r=>r.date<=today()).length/plannedTotal*100,0,100):null;
 const pair=strengthPairs(cutoff).filter(x=>x.percent!==null);const strength=pair.length?clamp(50+200*(pair.reduce((a,x)=>a+clamp(x.percent,-25,25),0)/pair.length)/100,0,100):null;
 const circum=['abdomen','waist','hip'].map(k=>measures(k)).filter(Boolean);const reductions=circum.map(a=>-pct(a.at(-1).value,a[0].value));const sizes=reductions.length?clamp(50+500*(reductions.reduce((a,b)=>a+b,0)/reductions.length)/100,0,100):null;
 
 const subs=[{key:'adherence',label:'پایبندی به برنامه',value:adherence,weight:35},{key:'strength',label:'پیشرفت عملکرد',value:strength,weight:35},{key:'sizes',label:'تغییر اندازه‌های هدف',value:sizes,weight:30}];const present=subs.filter(x=>x.value!==null);const overall=present.length>=2?Math.round(present.reduce((a,x)=>a+x.value*x.weight,0)/present.reduce((a,x)=>a+x.weight,0)):null;
 return {subs,overall,coverage:present.length,availableWeight:present.reduce((a,x)=>a+x.weight,0),strengthComparisons:pair,plannedTotal};
}
function normalizedOverview(){
 const chosen=[['abdomen','شکم','#cc8847'],['waist','کمر','#9d6cb1'],['hip','باسن','#4ba6a1'],['chest','سینه','#89954d'],['shoulder','عرض شانه','#688dbb'],['armR','بازوی راست','#277c5d'],['thighR','ران راست','#be6665']];
 const paths=chosen.map(([key,label,color])=>{const points=series(key);if(points.length<2||!points[0].value)return null;return {key,label,color,points:points.map(x=>({week:x.week,value:x.value/points[0].value*100}))};}).filter(Boolean);
 if(!paths.length)return '<div class="chart-empty">برای این نمودار باید دست‌کم دو اندازه‌گیری از هر شاخص ثبت شود.</div>';
 const w=760,h=270,left=45,right=15,top=18,bottom=42,pw=w-left-right,ph=h-top-bottom,all=paths.flatMap(s=>s.points.map(x=>x.value));
 const low=Math.min(100,...all),high=Math.max(100,...all),range=Math.max(2,(high-low)*1.45),min=low-range*.2,max=high+range*.8;
 const xp=wk=>left+wk/24*pw,yp=value=>top+(max-value)/(max-min)*ph;
 const grid=Array.from({length:5},(_,i)=>{const yy=top+i*ph/4;return `<line class="chart-gridline" x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}"/><text class="chart-text" x="${left-8}" y="${yy+4}" text-anchor="end">${(max-i*(max-min)/4).toFixed(1)}</text>`}).join('');
 const lines=paths.map(v=>`<path d="${v.points.map((p,i)=>(i?'L':'M')+xp(p.week).toFixed(1)+','+yp(p.value).toFixed(1)).join(' ')}" fill="none" stroke="${v.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${v.points.map(p=>`<circle cx="${xp(p.week)}" cy="${yp(p.value)}" r="3" fill="${v.color}"><title>${v.label}، هفته ${p.week}: ${p.value.toFixed(1)}٪ مقدار آغاز</title></circle>`).join('')}`).join('');
 return `<div class="chart-legend">${paths.map(p=>`<span><i style="background:${p.color}"></i>${p.label}</span>`).join('')}</div><svg viewBox="0 0 ${w} ${h}" class="chart-svg" role="img" aria-label="نمودار کلی روند نسبی شاخص‌های بدن"><title>شاخص نسبی، مقدار اولین ثبت هر شاخص برابر ۱۰۰</title>${grid}<line x1="${left}" x2="${w-right}" y1="${yp(100)}" y2="${yp(100)}" stroke="#c2d4c6" stroke-dasharray="4 5"/>${lines}${[0,4,8,12,16,20,24].map(a=>`<text class="chart-text" text-anchor="middle" x="${xp(a)}" y="${h-15}">${nf(a)}</text>`).join('')}<text class="chart-text" x="${w/2}" y="${h-1}" text-anchor="middle">هفته</text></svg>`;
}
// Version 4.5: transparent analytics; no artificial body measurements, weights or inferred effort.
function currentProgramWeek45(){return clamp(Math.ceil((Math.max(1,...state.sessions.map(x=>Number(x.sessionNumber)||1))-1)/5)+1,1,24);}
function strengthData45(){return AN.histories(state.sessions,P.exercises);}
function measureSpan45(key){const a=series(key);return selectedChartSpan===24?a:a.filter(x=>x.week>=Math.max(1,currentProgramWeek45()-selectedChartSpan+1));}
function selectedStrength45(){const all=strengthData45(),ids=[...new Set(all.map(x=>x.id))];if(!ids.includes(selectedStrengthId)&&ids.length)selectedStrengthId=ids[0];const info=AN.bestProgress(all,selectedStrengthId);
 const comparable=info.rows.filter(x=>info.latest&&x.load===info.latest.load&&x.unit===info.latest.unit);
 return {ids,info,comparable};}
function strengthChart45(rows,label){if(!rows.length)return '<div class="chart-empty">هنوز ست کامل قابل‌مقایسه برای این حرکت وجود ندارد.</div>';
 return drawChart(rows.map(x=>({week:x.week,value:x.value})),label,rows[0].unit==='ثانیه'?'ثانیه':'تکرار',750,238);}
function renderStrength45(){const {ids,info,comparable}=selectedStrength45();return `<div class="card spaced"><div class="section-title"><h2>روند قدرت و عملکرد هر حرکت</h2><span class="tag green">مقایسه هم‌شرایط</span></div>
 <div class="control-bar"><div class="field" style="max-width:350px"><label for="strength-exercise">انتخاب حرکت</label><select id="strength-exercise">${ids.length?ids.map(id=>`<option value="${escapeHtml(id)}" ${id===selectedStrengthId?'selected':''}>${escapeHtml(P.exercises[id]?.fa||id)}</option>`).join(''):'<option value="">هنوز تمرینی ثبت نشده</option>'}</select></div>
 <div class="hint">فقط همان نسخه حرکت و همان مقاومت مقایسه می‌شوند. تغییر نسخه یا وزنه با علامت «سطح جدید» جدا ثبت می‌شود.</div></div>
 <div data-plot="strength">${strengthChart45(comparable,P.exercises[selectedStrengthId]?.fa||'حرکت')}</div>
 ${info.latest?`<div class="analytical-kpis"><div><small>آخرین عملکرد ثبت‌شده</small><strong>${nf(info.latest.value)} ${escapeHtml(info.latest.unit||'تکرار')}</strong></div><div><small>مقاومت همین مقایسه</small><strong>${info.latest.load===null?'وزن بدن یا کش':nf(info.latest.load)+' kg'}</strong></div><div><small>تغییر در شرایط یکسان</small><strong>${info.comparison?(info.comparison.delta>0?'+':'')+nf(info.comparison.delta):'—'}</strong></div><div><small>جلسات هم‌شرایط</small><strong>${nf(comparable.length)}</strong></div></div>`:''}
 ${info.rows.length?`<div class="analytics-compact-history">${info.rows.slice(-8).map(r=>`<span title="${escapeHtml(r.date)} · ${nf(r.completed)} ست کامل">هفته ${nf(r.week)} · ${nf(r.value)} ${escapeHtml(r.unit)}${r.load===null?'':' · '+nf(r.load)+' kg'}</span>`).join('')}</div>`:''}
 <div class="form-actions no-print">${btn(icon('download')+' تصویر PNG عملکرد','export-strength-png','outline')}</div><p class="footer-note">مبنای نمودار: بالاترین هدف تأییدشده در ست کامل؛ اگر تکرار واقعی جدا وارد نشده باشد، این مقدار نشانه «انجام هدف تجویزی» است، نه اندازه‌گیری حداکثر قدرت.</p></div>`;}
function renderVolume45(){const rows=AN.weeklyVolume(state.sessions,{forNumber(n){const past=state.sessions.find(x=>Number(x.sessionNumber)===n);return past?planFor(n,past):P.forNumber(n);}},P.exercises,selectedVolumeWeek);const max=Math.max(1,...rows.map(x=>x.planned));return `<div class="card spaced"><div class="section-title"><h2>حجم واقعی تمرین هر گروه عضلانی</h2><span class="tag">ست مستقیم / درگیری غیرمستقیم</span></div>
 <div class="control-bar"><div class="field" style="max-width:220px"><label for="volume-week">هفته تمرینی</label><select id="volume-week">${Array.from({length:24},(_,i)=>`<option value="${i+1}" ${selectedVolumeWeek===i+1?'selected':''}>هفته ${nf(i+1)}</option>`).join('')}</select></div><p class="hint">نوار سبز ست‌های کامل‌شده؛ پس‌زمینه خاکستری ست‌های برنامه‌ریزی‌شده. درگیری کمکی جدا نشان داده می‌شود و معادل ست مستقیم فرض نمی‌شود.</p></div>
 <div class="volume-grid">${rows.map(v=>`<div class="volume-item"><div class="volume-heading"><strong>${escapeHtml(v.name)}</strong><span>${nf(v.done)} / ${nf(v.planned)} ست مستقیم ${v.indirect?`• ${nf(v.indirect)} ست درگیری کمکی`:''}</span></div><div class="volume-track"><i style="width:${Math.min(100,Math.max(0,v.done/max*100))}%"></i><b style="width:${Math.min(100,v.planned/max*100)}%"></b></div></div>`).join('')}</div>
 <p class="footer-note">در ست‌های تمرینی یک‌طرفه، یک ست برای هر سمت در تجویز کلی یک‌بار شمارش شده است. این اعداد شاخص برنامه‌ریزی و پایبندی هستند، نه میزان رشد عضله.</p></div>`;}
function renderMeasure45(){const options=defs.filter(x=>!x.derived);const d=byMetric[selectedMetric]||defs[0],a=measureSpan45(d.key),whole=series(d.key),first=whole[0],last=whole.at(-1),prev=whole.at(-2),delta=first&&last&&whole.length>1?last.value-first.value:null;return `<div class="card spaced"><div class="section-title"><h2>نمودار اندازه‌های بدن با متر</h2>${eTag('سانتی‌متر / مقادیر واقعی','green')}</div>
 <div class="control-bar"><div class="field"><label for="chart-span">بازه نمایش</label><select id="chart-span">${[4,8,12,24].map(v=>`<option value="${v}" ${selectedChartSpan===v?'selected':''}>${nf(v)} هفته</option>`).join('')}</select></div><span class="hint">هر نقطه، یک اندازه‌گیری واقعی است؛ هفته بدون ثبت داده، نقطه‌ای ندارد.</span></div>
 <div class="analytical-kpis"><div><small>اولین مقدار ثبت‌شده</small><strong>${first?nf(first.value):'—'} cm</strong></div><div><small>آخرین مقدار ثبت‌شده</small><strong>${last?nf(last.value):'—'} cm</strong></div><div><small>تغییر از شروع</small><strong>${delta===null?'—':(delta>0?'+':'')+nf(delta)+' cm'}</strong></div><div><small>تغییر از ثبت قبلی</small><strong>${prev&&last?(last.value-prev.value>0?'+':'')+nf(last.value-prev.value)+' cm':'—'}</strong></div></div>
 <div class="filter-row">${options.map(x=>`<button class="filter-chip ${selectedMetric===x.key?'active':''}" data-metric="${x.key}">${x.fa}</button>`).join('')}</div><div data-plot="measure">${drawChart(a,d.fa,'cm')}</div>
 <div class="form-actions no-print">${btn(icon('download')+' ذخیره نمودار به صورت PNG','export-measure-png','outline')}</div>
 <p class="footer-note">اختلاف کوچک، مخصوصاً کمتر از 0.5 cm، ممکن است ناشی از خطای اندازه‌گیری باشد. افزایش یا کاهش دور اندام به‌تنهایی اثبات تغییر عضله یا چربی نیست.</p></div>`;}
function overlayChart45(){const a=series(selectedOverlayA),b=series(selectedOverlayB);if(a.length<1&&b.length<1)return '<div class="chart-empty">برای مقایسه دو شاخص، ابتدا اندازه‌گیری ثبت کن.</div>';
 const selected=[{k:selectedOverlayA,arr:a,color:'#278764'},{k:selectedOverlayB,arr:b,color:'#8979c1'}].filter(x=>x.arr.length&&x.arr[0].value>0);
 const normalized=selected.map(x=>({...x,points:x.arr.map(p=>({week:p.week,value:p.value/x.arr[0].value*100}))}));const values=normalized.flatMap(x=>x.points.map(p=>p.value)),min=Math.min(100,...values)-2,max=Math.max(100,...values)+2;
 const w=750,h=230,l=48,r=20,t=16,bm=39,x=v=>l+(v/24)*(w-l-r),y=v=>t+(max-v)/(max-min)*(h-t-bm);
 return `<div class="chart-legend">${normalized.map(x=>`<span><i style="background:${x.color}"></i>${byMetric[x.k]?.fa||x.k}</span>`).join('')}</div><svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="مقایسه دو شاخص با مقدار شروع برابر 100"><line x1="${l}" x2="${w-r}" y1="${y(100)}" y2="${y(100)}" stroke="#b8c7c0" stroke-dasharray="5 5"/>${normalized.map(v=>`<polyline fill="none" stroke="${v.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${v.points.map(p=>x(p.week)+','+y(p.value)).join(' ')}"/>${v.points.map(p=>`<circle r="4" cx="${x(p.week)}" cy="${y(p.value)}" fill="${v.color}"><title>${byMetric[v.k].fa}: هفته ${p.week}، ${nf(p.value)}% از شروع</title></circle>`).join('')}`).join('')}${[0,4,8,12,16,20,24].map(week=>`<text class="chart-text" x="${x(week)}" y="${h-11}" text-anchor="middle">${week}</text>`).join('')}</svg>`;
}
function renderOverlay45(){const list=defs.filter(x=>!x.derived);const select=(id,v)=>`<select id="${id}">${list.map(x=>`<option value="${x.key}" ${x.key===v?'selected':''}>${x.fa}</option>`).join('')}</select>`;return `<div class="card spaced"><div class="section-title"><h2>مقایسه هم‌زمان دو شاخص بدن</h2><span class="tag">مبنای شروع = 100</span></div><div class="control-bar"><div class="field"><label for="overlay-a">شاخص اول</label>${select('overlay-a',selectedOverlayA)}</div><div class="field"><label for="overlay-b">شاخص دوم</label>${select('overlay-b',selectedOverlayB)}</div></div><div data-plot="overlay">${overlayChart45()}</div><div class="form-actions no-print">${btn(icon('download')+' تصویر مقایسه','export-overlay-png','outline')}</div><p class="footer-note">هر شاخص نسبت به اولین مقدار واقعی خودش نرمال می‌شود. درصدها تغییر نسبی اندازه هستند و به معنای تغییر خالص عضله یا چربی نیستند.</p></div>`;}
function renderHeatmap45(){const days=AN.weekHeatmap(state.sessions,state.startDate,state.shifts,state.unavailable,state.rest,today());const legends=[['complete','جلسه کامل'],['partial','نیمه‌تمام'],['shift','شیفت'],['rest','استراحت'],['unavailable','منتقل شد'],['open','بدون ثبت']];return `<div class="card spaced"><div class="section-title"><h2>تقویم حرارتی 12 هفته اخیر</h2><span class="tag">بدون جریمه استراحت و شیفت</span></div><div class="heatmap45">${days.map(d=>`<span class="heat-cell heat-${d.kind}" title="${escapeHtml(d.date)} • ${escapeHtml(({complete:'جلسه کامل',partial:'نیمه‌تمام',shift:'شیفت کاری',rest:'استراحت',unavailable:'جلسه جابه‌جا شد',before:'پیش از شروع دوره',open:'جلسه‌ای ثبت نشده'}[d.kind]))}"></span>`).join('')}</div><div class="heat-legend">${legends.map(([k,v])=>`<span><i class="heat-cell heat-${k}"></i>${v}</span>`).join('')}</div><p class="footer-note">خانه خالی لزوماً تمرین ازدست‌رفته نیست؛ شیفت، استراحت و روز آزاد از هم متمایز شده‌اند.</p></div>`;}
function renderReadiness45(){const buckets=[['good','آماده'],['medium','کمی خسته'],['poor','پس از شیفت / خسته']].map(([code,label])=>{const logs=state.sessions.filter(x=>x.readiness===code);const planned=logs.reduce((n,s)=>n+(s.exerciseLogs||[]).reduce((a,x)=>a+(x.sets||[]).length,0),0);const done=logs.reduce((n,s)=>n+(s.exerciseLogs||[]).reduce((a,x)=>a+(x.sets||[]).filter(q=>q.done&&!q.failed).length,0),0);return {code,label,sessions:logs.length,planned,done};});const any=buckets.some(x=>x.sessions>0);return `<div class="card spaced"><div class="section-title"><h2>آمادگی روز تمرین و تکمیل ست‌ها</h2><span class="tag">خودارزیابی اختیاری</span></div>${any?`<div class="volume-grid">${buckets.map(x=>`<div class="volume-item"><div class="volume-heading"><strong>${x.label}</strong><span>${nf(x.sessions)} جلسه • ${x.planned?nf(Math.round(x.done/x.planned*100))+'% ست تأییدشده':'—'}</span></div><div class="progress-track"><div style="width:${x.planned?Math.round(x.done/x.planned*100):0}%"></div></div></div>`).join('')}</div>`:'<div class="chart-empty">هنوز جلسه‌ای با وضعیت آمادگی ثبت نشده است.</div>'}<p class="footer-note">این نمودار فقط هم‌زمانیِ وضعیت گزارش‌شده و درصد تکمیل ست‌ها را نشان می‌دهد؛ رابطه علت و معلولی یا تشخیص خستگی پزشکی نیست.</p></div>`;}
function renderCardio45(){const data=AN.cardioByProgramWeek(state.sessions,P),nonzero=data.filter(x=>x.confirmed);return `<div class="card spaced"><div class="section-title"><h2>هوازی تأییدشده در هفته‌های برنامه</h2><span class="tag">دقیقه</span></div>${nonzero.length?drawChart(nonzero.map(x=>({week:x.week,value:x.minutes})),'هوازی انجام‌شده','دقیقه'): '<div class="chart-empty">هنوز جلسه هوازی تکمیل و تأیید نشده است.</div>'}<p class="footer-note">زمان هوازی فقط در صورت تأیید آن بخش ثبت می‌شود. این نمودار میزان فعالیت ثبت‌شده را نشان می‌دهد، نه اندازه‌گیری مستقیم VO₂max یا آمادگی قلبی‌عروقی.</p></div>`;}
function renderSymmetry45(){const pairs=[['armR:armL','بازو'],['forearmR:forearmL','ساعد'],['thighR:thighL','ران'],['calfR:calfL','ساق']];const [r,l]=selectedSymmetry.split(':'),vals=AN.symmetry(state.measurements,l,r);return `<div class="card spaced"><div class="section-title"><h2>روند اختلاف اندازه سمت راست و چپ</h2><span class="tag">سانتی‌متر</span></div><div class="control-bar"><div class="field"><label for="symmetry-pair">عضو بدن</label><select id="symmetry-pair">${pairs.map(([id,v])=>`<option value="${id}" ${id===selectedSymmetry?'selected':''}>${v}</option>`).join('')}</select></div></div><div data-plot="symmetry">${drawChart(vals,'اختلاف اندازه دو سمت','cm')}</div><div class="form-actions no-print">${btn('تصویر نمودار','export-symmetry-png','outline')}</div><p class="footer-note">اختلاف محیط اندام‌ها به‌تنهایی به معنای عدم تعادل قدرت یا بیماری نیست. روش و محل اندازه‌گیری باید ثابت بماند.</p></div>`;}
function renderInsights45(){const result=AN.insights(state.sessions,state.measurements,P.exercises,P);return `<div class="card spaced"><div class="section-title"><h2>تحلیل خودکار پیشرفت</h2>${eTag('براساس داده ثبت‌شده','green')}</div><div class="insight-list45">${result.map(it=>`<div class="insight-item ${it.type}">${icon(it.type==='good'?'check':'info')}<span>${escapeHtml(it.text)}</span></div>`).join('')}</div><p class="footer-note">این تحلیل قطعی یا تشخیص پزشکی نیست. تغییر نسخه حرکات، مقاومت کش نامشخص و خطای اندازه‌گیری می‌توانند تفسیر روند را محدود کنند.</p></div>`;}
function renderAnalytics45(){selectedVolumeWeek=clamp(selectedVolumeWeek||currentProgramWeek45(),1,24);
 return `${head('مرکز تحلیل عملکرد','نخست عملکرد تمرین‌ها و تغییرات بدن را ببین؛ تحلیل‌های تخصصی در بخش‌های بازشدنی قرار دارند.',`${btn('CSV تحلیل‌ها','export-all-csv','outline')}${btn('گزارش 24 هفته‌ای','view-final-report','outline')}${btn(icon('ruler')+' ثبت اندازه','go-measurements','primary')}`)}
 <div class="analytical-intro45"><div><span class="eyebrow">FORMINO INSIGHTS • 4.7</span><h2>پیشرفت را بدون حدس ببین</h2><p>رکوردهای هم‌شرایط، ست‌های انجام‌شده و اندازه‌های ثبت‌شده جداگانه تحلیل می‌شوند.</p></div><span class="tag green">آفلاین</span></div>
 ${renderInsights45()}
 <div class="analytics-primary">${renderStrength45()}${renderMeasure45()}</div>
 <details class="ux-disclosure spaced" open><summary>حجم تمرین و فعالیت روزانه <span class="summary-hint">ست‌ها، هوازی و تقویم</span></summary><div class="disclosure-content">${renderVolume45()}<div class="grid two spaced">${renderHeatmap45()}${renderCardio45()}</div>${renderReadiness45()}</div></details>
 <details class="ux-disclosure spaced"><summary>مقایسه پیشرفته اندازه‌های بدن <span class="summary-hint">دو شاخص و راست / چپ</span></summary><div class="disclosure-content">${renderOverlay45()}${renderSymmetry45()}</div></details>
 <details class="ux-disclosure spaced"><summary>همه 14 اندازه و امتیاز انگیزشی <span class="summary-hint">اطلاعات تکمیلی</span></summary><div class="disclosure-content"><div class="grid four">${defs.map(metricCard).join('')}</div><div class="card spaced"><div class="section-title"><h2>امتیاز اختصاصی برنامه</h2><span class="tag">غیرپزشکی</span></div>${(()=>{const sc=scoreInfo();return `<div class="score-circle" style="--p:${sc.overall||0}%"><div class="score-value">${sc.overall===null?'—':nf(sc.overall)}<small>/100</small></div></div><p class="subheading">امتیاز انگیزشی فرمینو؛ شاخص معتبر سلامت یا درصد چربی بدن نیست. پوشش داده: ${nf(sc.coverage)} از 3 حوزه.</p>`})()}</div></div></details>`;
}
function dashboardKpis45(){const abd=series('abdomen'),a=abd[0],b=abd.at(-1),delta=abd.length>=2?b.value-a.value:null,ex=strengthData45(),pairs=[...new Set(ex.map(x=>x.id))].map(id=>AN.bestProgress(ex,id)).filter(x=>x.comparison?.delta>0);const all=AN.sessionTotals(state.sessions),card=AN.cardioByProgramWeek(state.sessions,P).filter(x=>x.confirmed).at(-1);
 return `<div class="grid four spaced kpi-grid45"><button class="card kpi45" data-nav="analytics"><span>تغییر دور شکم</span><strong>${delta===null?'—':(delta>0?'+':'')+nf(delta)} <small>سانتی‌متر</small></strong><em>نسبت به اولین اندازه‌گیری</em></button><button class="card kpi45" data-nav="analytics"><span>حرکات با پیشرفت ثبت‌شده</span><strong>${pairs.length?nf(pairs.length):'—'}</strong><em>در شرایط قابل‌مقایسه</em></button><button class="card kpi45" data-nav="analytics"><span>ست‌های کامل</span><strong>${all.planned?nf(Math.round(100*all.sets/all.planned))+'%':'—'}</strong><em>${nf(all.sets)} ست تأییدشده</em></button><button class="card kpi45" data-nav="analytics"><span>آخرین هفته هوازی ثبت‌شده</span><strong>${card?nf(card.minutes):'—'} <small>دقیقه</small></strong><em>زمان تأییدشده</em></button></div>`;
}
function dashboardExtra45(){const ex=strengthData45(),s=ex.find(x=>x.id==='pushup')?.id||ex[0]?.id;const hist=s?AN.bestProgress(ex,s):null;return `<div class="card"><div class="section-title"><h2>روند حرکت منتخب</h2><button class="table-btn" data-nav="analytics">تحلیل همهٔ حرکات</button></div>${hist?strengthChart45(hist.rows.filter(x=>x.load===hist.latest.load),P.exercises[s]?.fa||s):'<div class="chart-empty">پس از اولین جلسه، روند عملکرد اینجا ظاهر می‌شود.</div>'}</div>${renderHeatmap45()}`;}
function exportFinalCSV45(){const rows=[['بخش','شاخص','مقدار اول','مقدار آخر','تغییر','واحد','شرط مقایسه']];for(const d of defs){const arr=series(d.key);if(!arr.length)continue;rows.push(['اندازه',d.fa,arr[0].value,arr.at(-1).value,arr.length>1?arr.at(-1).value-arr[0].value:'',d.unit,'ثبت مستقیم با متر']);}const logs=strengthData45();for(const id of new Set(logs.map(x=>x.id))){const v=AN.bestProgress(logs,id),c=v.comparison;rows.push(['عملکرد',P.exercises[id]?.fa||id,c?.first??'',c?.last??'',c?.delta??'',v.latest?.unit||'تکرار',c?'نسخه حرکت و مقاومت یکسان؛ هدف تأییدشده':'داده هم‌شرایط ناکافی']);}downloadFile(parseCSV(rows),'text/csv;charset=utf-8','formino-final-24-weeks.csv');}
function exportAllAnalyticsCSV45(){const rows=[['نوع','هفته','تاریخ','شناسه','مقدار','واحد','مقاومت kg','وضعیت']];for(const x of strengthData45())rows.push(['تمرین',x.week,x.date,x.id,x.value,x.unit,x.load??'',x.confirmedOnly?'هدف تأییدشده':'مقدار ثبت‌شده']);for(const m of state.measurements)for(const d of defs.filter(x=>!x.derived)){const v=valueOf(m,d.key);if(v!==null)rows.push(['اندازه',m.week,m.date,d.key,v,d.unit,'','متر واقعی']);}for(const c of AN.cardioByProgramWeek(state.sessions,P).filter(x=>x.confirmed))rows.push(['هوازی',c.week,'','cardio',c.minutes,'min','','تأییدشده']);downloadFile(parseCSV(rows),'text/csv;charset=utf-8','formino-all-analytics.csv');}
async function exportChartPNG45(kind='measure'){const svg=root.querySelector(`[data-plot="${kind}"] svg`);if(!svg){toast('ابتدا نموداری با داده واقعی انتخاب کن.','error');return;}const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.insertAdjacentHTML('afterbegin',`<style>.chart-gridline{stroke:#e3e9e5;stroke-width:1}.chart-text{font:12px sans-serif;fill:#51665e}.chart-line{fill:none;stroke:#24815a;stroke-width:3}.chart-area{fill:#d7efe2;opacity:.5}.chart-dot{fill:#24815a;stroke:white;stroke-width:2}</style>`);const xml=new XMLSerializer().serializeToString(copy),raw=new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(raw);try{const img=new Image();img.src=u;await img.decode();const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=540;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('ساخت تصویر ممکن نیست');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='formino-chart.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1200);toast('تصویر نمودار ذخیره شد.');}catch(e){downloadFile(xml,'image/svg+xml;charset=utf-8','formino-chart.svg');toast('مرورگر PNG را نساخت؛ نمودار SVG ذخیره شد.');}finally{URL.revokeObjectURL(u);}}
function renderFinalReport45(){const rows=defs.filter(x=>!x.derived).map(d=>{const a=series(d.key),first=a[0],last=a.at(-1);return `<tr><td>${d.fa}</td><td>${first?nf(first.value):'—'}</td><td>${last?nf(last.value):'—'}</td><td>${a.length>1?(last.value-first.value>0?'+':'')+nf(last.value-first.value):'—'}</td></tr>`;}).join('');const overall=AN.sessionTotals(state.sessions),logs=strengthData45(),ids=[...new Set(logs.map(x=>x.id))],perf=ids.map(id=>({name:P.exercises[id]?.fa||id,p:AN.bestProgress(logs,id)})).slice(0,30);const cardio=AN.cardioByProgramWeek(state.sessions,P).reduce((a,b)=>a+b.minutes,0);return `${head('گزارش عملکرد و اندازه‌های دوره 24 هفته‌ای','قابل چاپ، ذخیره PDF، CSV و JSON؛ هیچ مقدار گمشده‌ای تخمین زده نمی‌شود.',`${btn('بازگشت به گزارش هفتگی','view-weekly-report','outline')}${btn('CSV نهایی','export-final-csv','outline')}${btn('خروجی JSON','export-json','outline')}${btn(icon('file')+' چاپ / PDF','print-report','primary')}`)}<div class="print-zone"><div class="report-sheet"><div class="eyebrow">FORMINO • 24-WEEK FINAL REPORT</div><h2 class="report-title">گزارش فردی 24 هفته</h2><p class="report-sub">از ${pd(state.startDate)} تا ${state.sessions.length?pd([...state.sessions].sort((a,b)=>a.date.localeCompare(b.date)).at(-1).date):'آخرین ثبت موجود نیست'} • این دوره ممکن است با شیفت‌ها بیش از 168 روز طول بکشد</p><div class="grid four spaced"><div class="summary-cell"><b>${nf(overall.complete)}</b><span>جلسه کامل</span></div><div class="summary-cell"><b>${nf(overall.sets)}</b><span>ست کامل</span></div><div class="summary-cell"><b>${nf(cardio)} min</b><span>هوازی تأییدشده</span></div><div class="summary-cell"><b>${nf(state.measurements.length)}</b><span>نوبت اندازه‌گیری</span></div></div>
 <h3>مقایسه شروع و آخرین اندازه‌گیری واقعی</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>عضو</th><th>مقدار اول (cm)</th><th>مقدار آخر (cm)</th><th>تغییر (cm)</th></tr></thead><tbody>${rows}</tbody></table></div>
 <h3 style="margin-top:25px">تغییر عملکرد حرکات در شرایط قابل‌مقایسه</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>حرکت</th><th>اول</th><th>آخر</th><th>تغییر</th></tr></thead><tbody>${perf.length?perf.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${r.p.comparison?nf(r.p.comparison.first):'—'}</td><td>${r.p.comparison?nf(r.p.comparison.last):'—'}</td><td>${r.p.comparison?(r.p.comparison.delta>0?'+':'')+nf(r.p.comparison.delta):'داده هم‌شرایط کافی نیست'}</td></tr>`).join(''):'<tr><td colspan="4">هنوز داده تمرین ثبت نشده است.</td></tr>'}</tbody></table></div>
 <h3 style="margin-top:25px">خلاصه تحلیل خودکار</h3><div class="insight-list45">${AN.insights(state.sessions,state.measurements,P.exercises,P).map(x=>`<div class="insight-item">${escapeHtml(x.text)}</div>`).join('')}</div>
 <p class="footer-note">این گزارش روند اندازه‌ها و توان اجرای هدف‌های تمرینی را نشان می‌دهد؛ ادعای درصد چربی، میزان عضله ساخته‌شده، سلامت پزشکی یا اصلاح قطعی وضعیت ستون فقرات ندارد. برای ذخیره PDF از چاپ مرورگر و گزینه Save as PDF استفاده کن.</p></div></div>`;}

function renderAnalytics(){const cats=['همه','بالاتنه','میان‌تنه','پایین‌تنه'];const visible=defs.filter(x=>selectedMetricGroup==='همه'||x.category===selectedMetricGroup);const d=byMetric[selectedMetric]||defs[0],arr=series(d.key),first=arr[0],last=arr.at(-1),prev=arr.length>1?arr.at(-2):null,basePct=arr.length>1?pct(last.value,first.value):null,score=scoreInfo();
 return `${head('نمودارهای تمام اعضای بدن','هر شاخص مستقل بررسی می‌شود؛ امتیاز کلی یک شاخص انگیزشی و شفاف است، نه سنجه پزشکی.',btn(icon('ruler')+' ثبت اندازه','go-measurements','primary'))}
 <div class="grid two"><div class="card"><div class="section-title"><h2>شاخص ترکیبی پیشرفت</h2>${eTag('اختصاصی و غیرپزشکی','amber')}</div><div class="row-between" style="align-items:center;gap:18px"><div class="score-circle" style="--p:${score.overall||0}%"><div class="score-value">${score.overall===null?'—':nf(score.overall)}<small>از ۱۰۰</small></div></div><div style="flex:1"><p class="subheading">${score.overall===null?'برای محاسبه قابل اتکا، دست‌کم دو دسته اطلاعات روندی ثبت کن.':'امتیاز بر اساس شاخص‌های موجود و وزن‌های مشخص محاسبه شده است.'}</p><div class="hint" style="margin-top:7px">پوشش داده: ${nf(score.coverage)} از ۳ حوزه • وزن داده‌های موجود ${nf(score.availableWeight)}٪</div></div></div><div class="hr"></div>${score.subs.map(s=>`<div class="score-bar"><span>${s.label}</span><div class="bar-bg"><span style="width:${s.value??0}%"></span></div><span class="score-num">${s.value===null?'—':nf(s.value)}</span></div>`).join('')}<details style="margin-top:13px"><summary class="small-link" style="cursor:pointer">فرمول و محدودیت‌های امتیازدهی</summary><p class="subheading" style="margin-top:8px">وزن مؤلفه‌ها: پایبندی ۳۵٪، عملکرد ۳۵٪، اندازه‌های شکم/کمر/باسن ۳۰٪. امتیاز عملکرد از تکرارهای قابل مقایسه در مقاومت یکسان به دست می‌آید. امتیاز اندازه‌ها بر کاهش اندازه‌های هدف نسبت به ثبت اول استوار است. اگر داده‌ای موجود نباشد وزن بقیه مؤلفه‌ها بازتوزیع می‌شود؛ با کمتر از دو مؤلفه امتیاز کلی نمایش داده نمی‌شود. در این نسخه از اطلاعات ترازو و شاخص BMI استفاده نمی‌شود. عدد ترکیبی اعتبارسنجی بالینی نشده است.</p></details></div>
 <div class="card"><div class="section-title"><h2>عدم تقارن و عملکرد اندام‌ها</h2><span class="tag">چپ / راست</span></div>${['armR:armL','forearmR:forearmL','thighR:thighL','calfR:calfL'].map(pair=>{const [r,l]=pair.split(':'),a=latest(r),b=latest(l);return `<div class="report-line"><span>${byMetric[r].fa.replace('راست','')}</span><strong>${a&&b?nf(a.value)+' / '+nf(b.value)+' cm • اختلاف '+nf(Math.abs(a.value-b.value))+' cm':'نیازمند اندازه‌گیری هر دو سمت'}</strong></div>`;}).join('')}<div class="hr"></div><div class="section-title"><h2>مقایسه قدرت حرکات</h2></div>${score.strengthComparisons.length?score.strengthComparisons.slice(0,5).map(s=>`<div class="report-line"><span>${s.name}</span><strong>${nf(s.first)} ← ${nf(s.last)} ${s.comparable?`(${s.percent>0?'+':''}${nf(s.percent)}٪)`:'(مقاومت متفاوت)'}</strong></div>`).join(''):'<div class="empty">پس از ثبت چند جلسه مشابه، مقایسه عملکرد اینجا ظاهر می‌شود.</div>'}</div></div>
 <div class="card spaced"><div class="section-title"><h2>نمودار کلی وضعیت بدن</h2>${eTag('مقایسه چند شاخص','green')}</div><p class="subheading" style="margin-bottom:13px">روند شکم، کمر، باسن، سینه، شانه، بازو و ران بر اساس اولین ثبتِ مستقل هر شاخص (مبنای ۱۰۰). کاهش یا افزایش لزوماً به معنای بهبود نیست؛ نمودار روند را نشان می‌دهد.</p>${normalizedOverview()}</div>
 <div class="card spaced"><div class="section-title"><h2>روند امتیاز ترکیبی ۲۴ هفته</h2>${eTag('داده‌محور','blue')}</div>${drawChart(Array.from({length:24},(_,i)=>({week:i+1,value:scoreInfo(i+1).overall})).filter(x=>x.value!==null),'روند امتیاز کلی','از ۱۰۰')}<p class="footer-note">امتیاز فقط برای هفته‌هایی نمایش داده می‌شود که دست‌کم دو حوزه دارای داده قابل مقایسه باشند؛ هیچ مقداری برای هفته‌های خالی ساخته نمی‌شود.</p></div>
 <div class="card spaced"><div class="section-title"><h2>نمودار اختصاصی: ${d.fa}</h2><span class="tag green">${d.unit||'نسبت'}</span></div><div class="grid three" style="gap:10px;margin-bottom:15px"><div class="summary-cell"><b>${last?nf(last.value):'—'}</b><span>آخرین مقدار</span></div><div class="summary-cell"><b>${prev?nf(prev.value):'—'}</b><span>ثبت قبلی</span></div><div class="summary-cell"><b>${basePct!==null?(basePct>0?'+':'')+nf(basePct)+'٪':'—'}</b><span>تغییر نسبت به ثبت اول</span></div></div>${drawChart(arr,d.fa,d.unit)}<p class="footer-note">تغییر اندازه هر اندام همیشه معادل تغییر خالص چربی یا عضله آن اندام نیست. اختلاف‌های جزئی ممکن است از خطای اندازه‌گیری ناشی شوند.</p></div>
 <div class="card spaced"><div class="section-title"><h2>تمام شاخص‌های قابل تحلیل</h2><span class="tag">${nf(defs.length)} نمودار مستقل</span></div><div class="filter-row">${cats.map(c=>`<button class="filter-chip ${selectedMetricGroup===c?'active':''}" data-metric-group="${c}">${c}</button>`).join('')}</div><div class="grid four">${visible.map(metricCard).join('')}</div></div>`;
}
function weeklyMetricRow(d,now,prev){const a=valueOf(now,d.key),b=valueOf(prev,d.key),delta=a!==null&&b!==null?pct(a,b):null;return `<tr><td>${d.fa}</td><td>${a!==null?nf(a)+' '+d.unit:'—'}</td><td>${b!==null?nf(b)+' '+d.unit:'—'}</td><td>${delta===null?'—':(delta>0?'+':'')+nf(delta)+'٪'}</td></tr>`;}
function weekReportData(n){const {first,last}=weekWindow(n);const now=measurementForWeek(n),prev=measurementForWeek(n-1),pastDays=Array.from({length:7},(_,i)=>addDays(first,i)).filter(d=>d<=today()),shifts=pastDays.filter(d=>state.shifts.includes(d)).length,eligible=pastDays.filter(d=>!state.shifts.includes(d)&&!state.unavailable.includes(d)&&!state.rest.includes(d)).length,target=Math.min(5,eligible);
 const logs=state.sessions.filter(s=>s.date>=first&&s.date<=last),done=logs.filter(s=>s.status==='completed').length,partial=logs.filter(s=>s.status==='partial').length;
 const sets=logs.flatMap(s=>(s.exerciseLogs||[]).flatMap(x=>x.sets.filter(k=>k.done).map(k=>({exerciseId:x.id,...k}))));
 const reps=sets.reduce((a,s)=>a+(s.repsR!==''&&s.repsL!==''&&s.repsR!=null&&s.repsL!=null?(num(s.repsR)||0)+(num(s.repsL)||0):num(s.reps)||0),0);
 const load=sets.reduce((a,s)=>a+(num(s.weight)||0)*(s.repsR!==''&&s.repsL!==''&&s.repsR!=null&&s.repsL!=null?(num(s.repsR)||0)+(num(s.repsL)||0):num(s.reps)||0),0);
 const times=logs.reduce((a,s)=>a+(num(s.durationMin)||0),0);
 const thisPerf={};for(const item of sets){const ex=item.exerciseId;const reps1=(num(item.repsR)>0&&num(item.repsL)>0)?Math.min(num(item.repsR),num(item.repsL)):num(item.reps)||0;thisPerf[ex]=Math.max(thisPerf[ex]||0,reps1);}
 const previousLogs=state.sessions.filter(s=>s.date<first&&s.date>=addDays(first,-7));const oldBest={};previousLogs.flatMap(s=>s.exerciseLogs||[]).forEach(x=>x.sets.filter(k=>k.done).forEach(k=>{const v=(num(k.repsR)>0&&num(k.repsL)>0)?Math.min(num(k.repsR),num(k.repsL)):num(k.reps)||0;oldBest[x.id]=Math.max(oldBest[x.id]||0,v);}));
 return {first,last,now,prev,shifts,target,logs,done,partial,sets,reps,load,times,thisPerf,oldBest};
}
function reportHighlights(r){
 const highlights=[];
 for(const key of ['abdomen','hip','waist']){
  const a=valueOf(r.now,key),b=valueOf(r.prev,key);
  if(a!==null&&b!==null)highlights.push(`${byMetric[key].fa}: ${nf(a-b)} سانتی‌متر تغییر (${pct(a,b)>0?'+':''}${nf(pct(a,b))}٪ نسبت به هفته قبل)`);
 }
 if(r.logs.length)highlights.push(`${nf(r.logs.length)} جلسه ثبت‌شده، ${nf(r.sets.length)} ست و ${nf(r.times)} دقیقه تمرین در این هفته`);
 else highlights.push('در این هفته جلسه‌ای ثبت نشده یا هنوز تاریخ آن نرسیده است.');
 if(!r.now)highlights.push('اندازه‌گیری این هفته ثبت نشده؛ برای تحلیل اندام‌ها داده لازم است.');
 return [...new Set(highlights)].slice(0,3).map(v=>`<div class="summary-insight">${icon('check')}<span>${v}</span></div>`).join('');
}
function renderReports(){if(finalReportMode)return renderFinalReport45();reportWeek=clamp(reportWeek,1,24);const r=weekReportData(reportWeek),score=scoreInfo(reportWeek);return `${head('گزارش جامع هفتگی','مقایسه همه شاخص‌ها، عملکرد ست‌ها و جلسات؛ گزارش قابل چاپ و خروجی CSV.',`${btn('گزارش نهایی 24 هفته','view-final-report','outline')}${btn(icon('download')+' CSV','export-report-csv','outline')}${btn(icon('file')+' چاپ / PDF','print-report','primary')}`)}
 <div class="card no-print"><div class="control-bar"><div class="field" style="width:235px"><label for="report-week">هفته گزارش</label><select id="report-week">${Array.from({length:24},(_,i)=>`<option value="${i+1}" ${i+1===reportWeek?'selected':''}>هفته ${nf(i+1)} • ${shortDate(weekWindow(i+1).first)}</option>`).join('')}</select></div><span class="hint">گزارش از داده‌های ذخیره‌شده ساخته می‌شود و اعداد گمشده را حدس نمی‌زند.</span></div></div>
 <div class="print-zone"><div class="report-sheet"><div class="row-between"><div><div class="eyebrow">FORMINO • WEEKLY PERFORMANCE REPORT</div><h2 class="report-title">گزارش هفته ${nf(reportWeek)} از ۲۴</h2><p class="report-sub">${pd(r.first)} تا ${pd(r.last)} • شخصی و آفلاین</p></div><div class="brand-icon">${icon('dumbbell')}</div></div><div class="hr"></div><div class="insight-grid">${reportHighlights(r)}</div>
 <div class="grid four"><div class="summary-cell"><b>${nf(r.logs.length)} / ${nf(r.target)}</b><span>جلسه ثبت‌شده / هدف ممکن</span></div><div class="summary-cell"><b>${nf(r.sets.length)}</b><span>ست انجام‌شده</span></div><div class="summary-cell"><b>${nf(r.reps)}</b><span>تکرار ثبت‌شده (دو سمت جمع)</span></div><div class="summary-cell"><b>${nf(r.times)} دقیقه</b><span>کل مدت جلسات</span></div></div>
 <div class="report-cols"><div class="report-block"><h3>وضعیت تقویم و فعالیت</h3><div class="report-line"><span>جلسه کامل</span><strong>${nf(r.done)}</strong></div><div class="report-line"><span>جلسه نیمه‌تمام</span><strong>${nf(r.partial)}</strong></div><div class="report-line"><span>روز شیفت ثبت‌شده</span><strong>${nf(r.shifts)}</strong></div><div class="report-line"><span>تمرین با دمبل (حجم بار × تکرار)</span><strong>${nf(r.load)} kg·rep</strong></div><div class="report-line"><span>امتیاز تجمعی فعلی (نه امتیاز این هفته)</span><strong>${score.overall===null?'داده ناکافی':nf(score.overall)+'/100'}</strong></div></div>
 <div class="report-block"><h3>اندازه‌های اصلی این هفته</h3>${['abdomen','waist','hip','chest','shoulder','armR','armL'].map(k=>{const value=valueOf(r.now,k),old=valueOf(r.prev,k);return `<div class="report-line"><span>${byMetric[k].fa}</span><strong>${value===null?'ثبت نشده':nf(value)+' '+byMetric[k].unit}${old!==null&&value!==null?` • ${pct(value,old)>0?'+':''}${nf(pct(value,old))}٪`:''}</strong></div>`;}).join('')}</div></div>
 <h3 style="margin:22px 0 10px;font-size:14px">تغییر تمام اندازه‌ها و شاخص‌ها</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>شاخص</th><th>این هفته</th><th>هفته قبل</th><th>تغییر</th></tr></thead><tbody>${defs.map(d=>weeklyMetricRow(d,r.now,r.prev)).join('')}</tbody></table></div>
 <h3 style="margin:23px 0 9px;font-size:14px">جلسات تمرینی ثبت‌شده</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>جلسه</th><th>وضعیت</th><th>ست کامل</th><th>مدت</th></tr></thead><tbody>${r.logs.length?r.logs.map(s=>`<tr><td>${shortDate(s.date)}</td><td>${planFor(s.sessionNumber,s)?.title||'—'}</td><td>${s.status==='completed'?'کامل':'نیمه‌تمام'}</td><td>${nf(s.exerciseLogs.reduce((a,x)=>a+x.sets.filter(q=>q.done).length,0))}</td><td>${nf(s.durationMin)} دقیقه</td></tr>`).join(''):'<tr><td colspan="5" class="muted">در این هفته جلسه‌ای ثبت نشده است.</td></tr>'}</tbody></table></div>
 <h3 style="margin:23px 0 9px;font-size:14px">رکوردهای حرکتی (بیشترین تکرار هر ست)</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>حرکت</th><th>این هفته</th><th>هفته قبل</th><th>توضیح</th></tr></thead><tbody>${Object.keys(r.thisPerf).length?Object.entries(r.thisPerf).map(([id,v])=>`<tr><td>${P.exercises[id]?.fa||id}</td><td>${nf(v)}</td><td>${r.oldBest[id]?nf(r.oldBest[id]):'—'}</td><td>فقط تعداد تکرار؛ مقاومت و تکنیک نیز مهم‌اند.</td></tr>`).join(''):'<tr><td colspan="4">داده حرکتی کافی موجود نیست.</td></tr>'}</tbody></table></div>
 <p class="footer-note">این گزارش جایگزین ارزیابی پزشکی نیست. اندازه‌های محیطی به‌تنهایی نشان‌دهنده تغییر خالص چربی یا عضله نیستند؛ اندازه‌گیری را در شرایط یکسان انجام بده. برای PDF از گزینه چاپ مرورگر و Save as PDF استفاده کن.</p>
 </div></div>`;}
const exerciseCategories=[
 ['all','همهٔ حرکت‌ها'],['main','حرکات اصلی'],['warmup','گرم‌کردن'],
 ['cardio','هوازی'],['cooldown','سردکردن'],['legacy','نسخه‌های قبلی']
];
function renderLibrary(){
 return `${head('آموزش حرکات ورزشی','با نام فارسی یا انگلیسی جست‌وجو کن و راهنمای همان حرکت را باز کن.')}
 <div class="card">
  <div class="control-bar exercise-controls">
   <div class="field"><label for="exercise-search">نام حرکت</label><input type="search" id="exercise-search" placeholder="مثلاً زیربغل دمبل، ددباگ یا Floor Press" value="${escapeHtml(exerciseFilter)}"></div>
   <div class="field"><label for="exercise-category">بخش تمرین</label><select id="exercise-category">${exerciseCategories.map(([value,label])=>`<option value="${value}" ${exerciseCategory===value?'selected':''}>${label}</option>`).join('')}</select></div>
  </div>
  <p class="search-summary" id="exercise-results" role="status"></p>
  <div class="grid two" id="exercise-list"></div>
  <div class="empty search-empty" id="exercise-empty" hidden>حرکتی پیدا نشد. نام کوتاه‌تر، املای دیگری یا بخش «همهٔ حرکت‌ها» را امتحان کن.</div>
 </div>`;
}
function filterExercises(){
 const matches=GUIDES.search(exerciseFilter,exerciseCategory);
 $('#exercise-list').innerHTML=matches.map(guide=>`<div class="exercise-card">
  <div class="ex-bullet">${icon(guide.category==='stage'?'play':'dumbbell')}</div>
  <div class="exercise-card-body"><b>${escapeHtml(guide.fa)}</b><p dir="ltr" lang="en">${escapeHtml(guide.en)}</p>
  <small>${escapeHtml(guide.category==='legacy'?'نسخهٔ قبلی · ':'')}${escapeHtml([guide.group,guide.equip].filter(Boolean).join(' · '))}</small></div>
  ${exerciseGuideButton(guide)}
 </div>`).join('');
 $('#exercise-results').textContent=`${nf(matches.length)} راهنما`;
 $('#exercise-empty').hidden=matches.length>0;
}
function exerciseGuideButton(guide){
 return `<button type="button" class="btn sm outline" data-exercise="${escapeHtml(guide.id)}" aria-label="راهنما، ${escapeHtml(guide.fa)}">راهنما</button>`;
}
function openExercise(id){
 const ex=GUIDES.get(id,state?.activeSession?.planVersion);
 if(!ex)return;
 const dialog=$('#modal');
 const youtube='https://www.youtube.com/results?search_query='+encodeURIComponent(ex.query);
 const google='https://www.google.com/search?q='+encodeURIComponent(ex.query);
 const alternatives=ex.category==='main'?[['نسخهٔ آسان‌تر',GUIDES.get(ex.easierId)],['نسخهٔ دشوارتر',GUIDES.get(ex.harderId)]]:
  (ex.related||[]).map(key=>['راهنمای مرتبط',GUIDES.get(key)]);
 const links=alternatives.filter(([,guide])=>guide);
 $('#modal-body').innerHTML=`<h2 id="modal-title" tabindex="-1">${escapeHtml(ex.fa)}</h2>
 <p class="modal-en" lang="en" dir="ltr">${escapeHtml(ex.en)}</p>
 <div class="key-metrics">${[ex.category==='legacy'?'نسخهٔ قبلی':'',ex.group,ex.equip,ex.side?'اجرا برای هر سمت':''].filter(Boolean).map(tag=>eTag(tag)).join('')}</div>
 <h3>پیدا کردن آموزش بیرونی</h3>
 ${ex.stageNote?`<p class="hint">${escapeHtml(ex.stageNote)}</p>`:''}
 <p class="guide-query" aria-label="عبارت جست‌وجو" lang="en" dir="ltr">${escapeHtml(ex.query)}</p>
 <div class="form-actions">
 ${ex.reference?`<a class="btn primary" href="${escapeHtml(ex.reference[1])}" target="_blank" rel="noopener noreferrer">${escapeHtml(ex.reference[0])}</a>`:''}
 <a class="btn outline" href="${youtube}" target="_blank" rel="noopener noreferrer">${icon('play')} جست‌وجو در یوتیوب</a>
 <a class="btn outline" href="${google}" target="_blank" rel="noopener noreferrer">جست‌وجو در گوگل</a></div>
 <h3>نحوهٔ اجرا</h3><ol class="guide-steps">${ex.how.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>
 ${ex.variantNote?`<div class="notice guide-note">${icon('info')}<span><b>جزئیات نسخهٔ فرمینو:</b> ${escapeHtml(ex.variantNote)}</span></div>`:''}
 ${ex.mistakes?`<h3>اشتباهات رایج</h3><p class="subheading">${escapeHtml(ex.mistakes)}</p>`:''}
 ${ex.safety?`<div class="notice warn guide-note">${icon('alert')}<span><b>نکتهٔ ایمنی:</b> ${escapeHtml(ex.safety)}</span></div>`:''}
 ${links.length?`<h3>نسخه‌های مرتبط</h3><ul class="guide-related">${links.map(([label,guide])=>`<li><button type="button" class="table-btn" data-guide-related="${escapeHtml(guide.id)}">${escapeHtml(label)} · ${escapeHtml(guide.fa)}</button></li>`).join('')}</ul>`:''}
 `;
 if(!dialog.open)dialog.showModal();
 dialog.scrollTop=0;
 $('#modal-title').focus({preventScroll:true});
}

function askDialog(message, {title='تأیید تغییر', field='', value='', inputmode='text', confirmLabel='تأیید', danger=false, detailMarkup=''}={}){
 const dialog=$('#modal');
 const body=$('#modal-body');
 if(dialog.open)return Promise.resolve(null);
 body.innerHTML=`<h2 id="modal-title">${escapeHtml(title)}</h2>
 <p class="dialog-message" id="dialog-message">${escapeHtml(message)}</p>
 ${detailMarkup}
 <form method="dialog">
 ${field?`<div class="field dialog-field"><label for="dialog-value">${escapeHtml(field)}</label><input id="dialog-value" value="${escapeHtml(value)}" inputmode="${inputmode}" autocomplete="off"></div>`:''}
 <div class="form-actions"><button class="btn outline" type="button" data-dialog-cancel>انصراف</button>
 <button class="btn ${danger?'danger':'primary'}" value="confirm">${escapeHtml(confirmLabel)}</button></div>
 </form>`;
 dialog.returnValue='cancel';
 dialog.setAttribute('aria-describedby','dialog-message');
 return new Promise(resolve=>{
  dialog.addEventListener('close',()=>{
   dialog.removeAttribute('aria-describedby');
   resolve(dialog.returnValue==='confirm'?(field?$('#dialog-value').value:true):null);
  },{once:true});
  dialog.showModal();
  if(detailMarkup&&!field){
   const title=body.querySelector('#modal-title');
   title.tabIndex=-1;
   title.focus({preventScroll:true});
   dialog.scrollTop=0;
  }else body.querySelector(field?'#dialog-value':'[data-dialog-cancel]').focus();
 });
}

function renderNutrition(){
 return `${head('تغذیه و ریکاوری برای فرم‌دهی بدن',
  'راهنمای عملی برای کاهش چربی کلی همراه با حفظ و رشد عضله؛ بدون ثبت وزن، کالری یا اطلاعات ترازو در برنامه.')}
 <div class="nutrition-hero"><div><span class="eyebrow">BODY RECOMPOSITION • 24 WEEKS</span><h2>تغذیه، هم‌مسیر برنامه تمرینی</h2><p>تمرین شکم چربی زیرشکم را موضعی نمی‌سوزاند؛ دیده‌شدن خطوط عضله به رشد عضله و کاهش چربی پوشاننده آن وابسته است.</p></div><span class="tag green">راهنمای بدون ورود داده</span></div>
 <div class="grid three spaced">
  <div class="card"><span class="nutri-label">پروتئین روزانه</span><strong class="nutri-number" dir="ltr">1.4–2.0 g/kg</strong><p>راهنمای عمومی بر اساس هر کیلوگرم وزن بدن؛ چون وزن فعلی ثبت نشده، مقدار شخصی روزانه را حدس نمی‌زنیم. نیاز دقیق به شرایط پزشکی و تغذیه بستگی دارد.</p></div>
  <div class="card"><span class="nutri-label">مدیریت انرژی</span><strong class="nutri-number">ملایم و پایدار</strong><p>اگر دور کمر در چند هفته ثابت ماند و قصد کاهش چربی داری، حجم خوراکی‌های پرکالری را اندکی کم کن؛ رژیم افراطی لازم نیست.</p></div>
  <div class="card"><span class="nutri-label">ریکاوری</span><strong class="nutri-number" dir="ltr">7–9 h</strong><p>خواب کافی در شبانه‌روز؛ پس از شیفت 24 ساعته و خواب ناکافی، جلسه سنگین را جابه‌جا کن.</p></div>
 </div>
 <div class="grid two spaced">
  <div class="card"><div class="section-title"><h2>الگوی غذایی ساده و قابل اجرا</h2></div><div class="nutrition-list">
   <div><b>صبحانه</b><span>منبع پروتئین مانند تخم‌مرغ، ماست یونانی یا لبنیات پرپروتئین + میوه یا غلات کامل.</span></div>
   <div><b>ناهار</b><span>مرغ، ماهی، حبوبات یا توفو + سبزیجات + مقدار متناسب برنج، نان یا سیب‌زمینی.</span></div>
   <div><b>میان‌وعده</b><span>لبنیات، حبوبات یا گزینه پرپروتئین ساده؛ آب کافی متناسب با تشنگی و فعالیت.</span></div>
   <div><b>شام</b><span>پروتئین کافی + سبزیجات + کربوهیدرات با توجه به اشتها و شدت تمرین.</span></div>
  </div></div>
  <div class="card"><div class="section-title"><h2>قاعده بازنگری هر 4 هفته</h2></div><div class="nutrition-list">
   <div><b>دور کمر کمتر و قدرت ثابت/بیشتر</b><span>برنامه فعلی احتمالاً قابل ادامه است؛ تغییر فوری نده.</span></div>
   <div><b>دور کمر ثابت، تمرین رو به بهبود</b><span>اول پایبندی و کیفیت اندازه‌گیری را بررسی کن؛ سپس در صورت نیاز تغییر کوچک در خوراک ایجاد کن.</span></div>
   <div><b>افت مداوم قدرت و خستگی</b><span>خواب، فاصله ریکاوری و کافی‌بودن غذا را بررسی کن؛ کسری شدید انرژی ممکن است مانع عملکرد شود.</span></div>
   <div><b>گرفتگی، درد تیز یا علائم عصبی</b><span>تمرین دردناک را متوقف کن و برای ارزیابی مناسب اقدام کن؛ مصرف غذا جایگزین درمان نیست.</span></div>
  </div></div>
 </div>
 <div class="card spaced"><div class="section-title"><h2>در طول شیفت کاری چه کار کنم؟</h2></div>
  <div class="grid three"><div class="notice">${icon('check')} وعده پروتئینیِ قابل حمل در نظر بگیر تا یک روز پرکار به حذف مکرر غذا منجر نشود.</div>
  <div class="notice">${icon('clock')} اگر خواب کافی نبوده، جلسه سنگین را به روز آزاد با انرژی بهتر منتقل کن.</div>
  <div class="notice">${icon('info')} فعالیت سبک داخل خانه و پیاده‌روی درجا برای روز غیرتمرینی اختیاری است، نه جبران اجباری تمرین.</div></div>
  <div class="hr"></div><p class="footer-note">راهنما مبتنی بر موضع‌گیری ISSN درباره پروتئین (2017)، ACSM درباره تمرین مقاومتی (2026) و WHO درباره فعالیت بدنی است. پروتئین برحسب هر کیلوگرم وزن بدن بیان می‌شود؛ بدون وزن فعلی مقدار شخصی روزانه تعیین نمی‌کنیم. برای بیماری کلیه، محدودیت غذایی یا مسئله پزشکی، مقدار پروتئین باید شخصی‌سازی شود.</p>
  <div class="form-actions"><a class="btn outline" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/" target="_blank" rel="noopener noreferrer">منبع پروتئین ISSN</a>
  <a class="btn outline" href="https://pubmed.ncbi.nlm.nih.gov/41843416/" target="_blank" rel="noopener noreferrer">مرور ACSM 2026</a>
  <a class="btn outline" href="https://www.who.int/news-room/fact-sheets/detail/physical-activity" target="_blank" rel="noopener noreferrer">راهنمای WHO</a></div>
 </div>`;
}
function renderSettings(){return `${head('شخصی‌سازی و مدیریت داده','تنظیم مشخصات، تاریخ شروع و ذخیره‌سازی در فایل SQLite داخل پوشه اصلی برنامه.')}
 <div class="card spaced"><div class="section-title"><h2>برنامه پژوهش‌محور جدید</h2></div><p>3 جلسه مقاومتی تمام‌بدن و 2 جلسه هوازی در چرخه شناور. پیش از هر حرکت دمبل‌دار، وزن واقعی را تأیید کن. هدف تکرارها توسط مربی تعیین می‌شود.</p><div class="field"><label for="final-available-weights">پله‌های واقعی دمبل (kg)، جداشده با ویرگول؛ اختیاری</label><input id="final-available-weights" type="text" inputmode="decimal" value="${escapeHtml((state.settings.availableDumbbellWeights||[]).join(', '))}" placeholder="مثال: 2, 4, 6, 8 فقط اگر واقعاً موجودند"></div><button class="btn outline" data-action="save-weights">ثبت وزن‌های واقعی</button><p class="hint">سوابق برنامه‌های قبلی به آرشیو منتقل شده‌اند، نه اینکه به‌عنوان جلسات جدید حساب شوند. تعداد نسخه‌های آرشیوی: ${nf(state.legacyArchive?.length||0)}.</p><button class="btn outline" data-action="export-archive">دریافت آرشیو برنامه‌های قبلی (JSON)</button></div>
 <div class="card"><div class="section-title"><h2>مشخصات و هدف</h2><span class="tag green">فقط روی دستگاه</span></div><form id="settings-form"><div class="form-grid"><div class="field"><label for="settings-height">قد (سانتی‌متر)</label><input id="settings-height" name="height" type="number" min="100" max="240" step="0.1" value="${escapeHtml(state.settings.height)}" required></div><div class="field"><label for="settings-start-date">تاریخ شروع برنامه</label><input id="settings-start-date" name="startDate" type="date" value="${escapeHtml(state.startDate)}" required></div></div><div class="form-actions"><button class="btn primary" type="submit">${icon('check')} ذخیره تنظیمات</button></div></form><div class="notice warn spaced">${icon('alert')}<span>تغییر تاریخ شروع، بازه‌های گزارش هفتگی را تغییر می‌دهد. جلسات انجام‌شده با تاریخ واقعی خودشان محفوظ می‌مانند، ولی قبل از تغییر تاریخ از فایل پشتیبان بگیر.</span></div></div>
 <div class="grid two spaced"><div class="card"><div class="section-title"><h2>پایگاه داده محلی</h2></div><div class="list-row"><span class="list-icon">${icon('file')}</span><div><div class="list-title" dir="ltr" style="text-align:right">fitness-data.sqlite</div><div class="list-subtitle">فایل در پوشه اصلی پروژه • بدون حساب کاربری</div></div></div><div class="form-actions">${btn(icon('download')+' دریافت فایل SQLite','download-sqlite','primary')}${btn('ساخت پشتیبان در پوشه backups','backup','outline')}</div><p class="footer-note">ذخیره خودکار پس از ثبت عملکرد، اندازه‌ها و تغییر تقویم انجام می‌شود. برنامه پس از ذخیره نخست هر روز یک پشتیبان خودکار ایجاد می‌کند (نگهداری تا ۱۴ نسخه روزانه). علاوه بر آن می‌توانی دستی پشتیبان بگیری.</p></div>
 <div class="card"><div class="section-title"><h2>خروجی و بازیابی</h2></div><div class="stack"><div class="notice">${icon('info')}<span>JSON برای انتقال کامل سوابق به نسخه دیگر برنامه، CSV برای تحلیل در Excel و SQLite برای پشتیبان‌گیری مستقیم در دسترس است.</span></div><div class="actions">${btn(icon('download')+' خروجی JSON','export-json','outline')}${btn(icon('download')+' CSV اندازه‌ها','export-measurements','outline')}${btn(icon('download')+' CSV تمرین‌ها','export-workouts','outline')}</div><div class="field"><label for="import-json">بازیابی از فایل JSON فرمینو</label><input type="file" id="import-json" accept="application/json,.json"><small>ورود داده جایگزین تمام داده‌های فعلی می‌شود؛ ابتدا پشتیبان تهیه کن.</small></div></div></div></div>
 <div class="card spaced"><div class="section-title"><h2>مهارت بارفیکس ایمن</h2></div><p class="subheading">برنامه بارفیکس کامل را فقط پس از ثبت دو اجرای آسان و موفق از سطح مهارتی قبلی و تأیید یک بارفیکس واقعی بدون کمک پیشنهاد می‌کند. بدون میله ایمن، جایگزین زیربغل را اجرا کن.</p><div class="form-actions">${state.settings.barReady?`${eTag('آمادگی بارفیکس تأیید شده','green')}${btn('لغو تأیید آمادگی بارفیکس','reset-bar-ready','outline')}`:eTag('بارفیکس کامل هنوز احراز نشده','amber')}${state.settings.exerciseUpgrades.activeHang==='oneArmRow'?btn('بازگشت به تمرین مهارتی بارفیکس','reset-bar-fallback','outline'):''}</div></div>
 <div class="card spaced"><div class="section-title"><h2>اصول طراحی برنامه</h2></div><p class="subheading">هدف: چربی‌سوزی و عضله‌سازی هم‌زمان، تقویت تمام عضلات، تمرکز ویژه بر سینه، شانه، پشت، بازو و عضلات شکم؛ حفظ تناسب پا و باسن، با افزایش تدریجی سختی در 24 هفته تمرینی و 3 جلسه مقاومتی تمام‌بدن و 2 جلسه هوازی در چرخه شناور. 2 روز استراحت در هفته در حالت عادی، مشروط به شیفت و امکان ریکاوری.</p><div class="hr"></div><p class="subheading">منابع علمی: <a target="_blank" rel="noopener" href="https://acsm.org/resistance-training-guidelines-update-2026/">ACSM 2026</a> درباره تمرین مقاومتی پیشرونده و <a target="_blank" rel="noopener" href="https://www.who.int/europe/news-room/fact-sheets/item/physical-activity">WHO</a> درباره فعالیت بدنی. این اپلیکیشن تشخیص پزشکی نمی‌دهد. امتیاز بدن، فرمول انگیزشی اختصاصی است، نه شاخص اعتبارسنجی‌شده سلامت.</p><div class="notice warn spaced">${icon('alert')}<span>در صورت درد تیرکشنده، بی‌حسی، ضعف غیرعادی، سرگیجه یا درد قفسه سینه، تمرین سنگین را متوقف کن و برای ارزیابی حرفه‌ای اقدام کن. چربی شکم یا باسن با تمرین موضعی به‌صورت انتخابی حذف نمی‌شود.</span></div></div>`;}
function parseCSV(rows){return '\ufeff'+rows.map(row=>row.map(value=>'"'+String(value??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');}
function downloadFile(content,type,filename){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportMeasurements(){const headers=['week','date',...defs.map(x=>x.key)];const rows=[headers,...[...state.measurements].sort((a,b)=>a.week-b.week).map(m=>headers.map(h=>h==='week'||h==='date'?m[h]:valueOf(m,h)))];downloadFile(parseCSV(rows),'text/csv;charset=utf-8','formino-measurements.csv');}
function exportWorkoutLogs(){const headers=['session','date','status','exercise_id','exercise_en','set','done','reps','reps_right','reps_left','weight_kg','RIR','minutes','notes'];let rows=[headers];for(const s of state.sessions)for(const x of s.exerciseLogs||[])x.sets.forEach((q,i)=>rows.push([s.sessionNumber,s.date,s.status,x.id,P.exercises[x.id]?.en||'',i+1,q.done?'yes':'no',q.reps,q.repsR,q.repsL,q.weight,q.rir,s.durationMin,s.notes]));downloadFile(parseCSV(rows),'text/csv;charset=utf-8','formino-workouts.csv');}
function exportWeeklyCSV(n){const r=weekReportData(n),rows=[['شاخص','این هفته','هفته قبل','درصد تغییر'],...defs.map(d=>{const a=valueOf(r.now,d.key),b=valueOf(r.prev,d.key);return [d.fa,a,b,a!==null&&b!==null?pct(a,b):''];}),[],['تعداد جلسات',r.logs.length],['جلسات کامل',r.done],['جلسات ناقص',r.partial],['تعداد ست‌ها',r.sets.length],['جمع تکرارها',r.reps],['مدت کل',r.times]];downloadFile(parseCSV(rows),'text/csv;charset=utf-8',`formino-report-week-${n}.csv`);}
const calendarFields=['shifts','unavailable','rest'];
const calendarStatusLabels={shift:'شیفت کاری',unavailable:'عدم امکان تمرین',rest:'استراحت',clear:'پاک‌کردن محدودیت'};
const restrictionFields={shift:'shifts',unavailable:'unavailable',rest:'rest'};
let calendarUndo=null,calendarSaving=false;

function calendarRestrictions(source){
 return Object.fromEntries(calendarFields.map(key=>[key,source[key]]));
}
function changedSessions(before,after){
 const numbers=new Set([...before.byNum.keys(),...after.byNum.keys()]);
 return [...numbers].sort((a,b)=>a-b).map(number=>({
  before:before.byNum.get(number),after:after.byNum.get(number),number
 })).filter(row=>row.before?.date!==row.after?.date);
}
async function commitCalendar(next){
 calendarSaving=true;
 const previous=calendarRestrictions(state);
 Object.assign(state,next);
 invalidateSchedule();
 try{await saveState();return true;}
 catch{Object.assign(state,previous);invalidateSchedule();return false;}
 finally{calendarSaving=false;}
}
async function changeCalendarDays(kind,dates,batch=false){
 if(calendarSaving)return;
 if(!dates.length){toast('ابتدا حداقل یک روز را انتخاب کن.','error');return;}
 const daySet=new Set(dates),before=calendarRestrictions(state);
 const next=Object.fromEntries(calendarFields.map(key=>{
  const values=before[key].filter(date=>!daySet.has(date));
  return [key,key===restrictionFields[kind]?[...values,...dates].sort():values];
 }));
 if(calendarFields.every(key=>sameValue([...before[key]].sort(),[...next[key]].sort()))){
  toast('وضعیت روزهای انتخاب‌شده تغییری نمی‌کند.');return;
 }
 const previewDate=today(),basis=state.sessions,previewStart=state.startDate;
 const moves=changedSessions(scheduleFor(state,previewDate),scheduleFor({...state,...next},previewDate));
 const renderMoves=rows=>`<ul>${rows.map(({before,after,number})=>`<li><b>جلسهٔ ${nf(number)} · ${escapeHtml((after||before).prescription.title)}</b>
  <span><b>قبلی:</b> ${before?escapeHtml(pd(before.date)):'بدون تاریخ'} · <b>جدید:</b> ${after?escapeHtml(pd(after.date)):'بدون تاریخ'}</span></li>`).join('')}</ul>`;
 const detailMarkup=moves.length?`<div class="calendar-preview"><p><b>${nf(moves.length)} جلسه با تاریخ متفاوت</b></p>
  ${renderMoves(moves.slice(0,3))}
  ${moves.length>3?`<details><summary>نمایش ${nf(moves.length-3)} جلسهٔ دیگر</summary>${renderMoves(moves.slice(3))}</details>`:''}</div>`:
  '<p class="hint">تاریخ جلسه‌های آینده تغییری نمی‌کند.</p>';
 const subject=dates.length===1?pd(dates[0]):nf(dates.length)+' روز انتخاب‌شده';
 if(!await askDialog(`${calendarStatusLabels[kind]} برای ${subject}`,{
  title:'پیش‌نمایش تغییر تقویم',confirmLabel:'اعمال در تقویم',detailMarkup
 }))return;
 if(previewDate!==today()||basis!==state.sessions||previewStart!==state.startDate||
    calendarFields.some(key=>!sameValue(before[key],state[key]))){
  toast('تقویم تغییر کرده است. پیش‌نمایش را دوباره باز کن.','error');return;
 }
 if(!await commitCalendar(next))return;
 calendarUndo={before,after:next};
 if(batch){calendarSelected.clear();calendarBatchMode=false;}
 render();toast('تغییر تقویم ذخیره شد.');
}
async function undoCalendarChange(){
 if(!calendarUndo||calendarSaving)return;
 if(calendarFields.some(key=>!sameValue(calendarUndo.after[key],state[key]))){
  calendarUndo=null;render();toast('تقویم پس از آخرین تغییر دوباره ویرایش شده است.','error');return;
 }
 if(!await commitCalendar(calendarUndo.before))return;
 calendarUndo=null;render();
 $('#day-editor h3')?.focus({preventScroll:true});
 toast('آخرین تغییر تقویم برگشت داده شد.');
}
async function setBatchStatus(kind){await changeCalendarDays(kind,[...calendarSelected],true);}
async function setDayStatus(kind){await changeCalendarDays(kind,[selectedCalendarDay]);}
async function finishWorkout(){const draft=state.activeSession;if(!draft)return;const all=draft.exerciseLogs.flatMap(x=>x.sets);const complete=all.filter(s=>s.done&&(num(s.reps)>0||(num(s.repsR)>0&&num(s.repsL)>0)));
 if(!complete.length&&!draft.cardioConfirmed){toast('برای ثبت، حداقل یک ست یا بخش هوازی واقعاً انجام‌شده لازم است.','error');return;}
 const pres=planFor(draft.sessionNumber,draft);
 const elapsedMins=Math.round(FORMINO_CLOCK.elapsedSeconds(draft.exerciseStartedAt||draft.startedAt)/60);
 if(!draft.durationMin&&elapsedMins>0&&elapsedMins<=360)draft.durationMin=elapsedMins;
 if(!draft.cardioConfirmed)draft.cardioMin=0;
 const stageComplete=Number(draft.planVersion)<7||(draft.warmupConfirmed&&draft.cooldownConfirmed);
 const stored={...draft,status:complete.length===all.length&&(!pres?.cardioMinutes||draft.cardioConfirmed)&&stageComplete?'completed':'partial',completedAt:new Date().toISOString()};const idx=state.sessions.findIndex(s=>s.id===stored.id);
 if(idx>=0)state.sessions[idx]=stored;else state.sessions.push(stored);state.sessions.sort((a,b)=>a.sessionNumber-b.sessionNumber);state.activeSession=null;endTimer();stopSessionClock();
 const saving=saveWorkoutProgress(draft.id);
 render();
 try{await saving;}catch{render();return;}
 go('dashboard');toast(stored.status==='completed'?'جلسه کامل ثبت شد.':'جلسه نیمه‌تمام ثبت شد.');
}
async function handleAction(action,el){switch(action){
 case 'retry-connection':await init();return;
 case 'undo-calendar':await undoCalendarChange();return;
 case 'review-workout-save':await reviewWorkoutSave();return;
 case 'jump-workout':{
  const draft=state.activeSession;
  if(!draft)return;
  const stages=['cardio','cooldown'];
  const exercisePending=draft.exerciseLogs.some(log=>log.sets.some(set=>!set.done&&!set.failed));
  const stage=!draft.warmupConfirmed?'warmup':exercisePending?null:stages.find(key=>!draft[key+'Confirmed']);
  if(stage){
   const section=$('#stage-'+stage);
   section.open=true;
   scrollToSection(section.querySelector('summary'));
  }else if(exercisePending){
   const section=$('#exercise-'+activeFocusIndex(draft));
   section.tabIndex=-1;
   scrollToSection(section);
  }else{
   scrollToSection($('#workout-summary h2'));
  }
  return;
 }
 case 'report-safety':{
   if(!state.activeSession)return;
   if(!state.activeSession.safetyFlag){
    state.activeSession.safetyFlag=true;endTimer();
    toast('تمرین را متوقف کن. برای درد تیز، ضعف عصبی یا سرگیجه نگران‌کننده، ارزیابی پزشکی لازم است.','error');
    await saveAndRenderWorkout();
   }else{
    if(!await askDialog('فقط پس از برطرف‌شدن علامت و در صورت اطمینان از ایمنی، وضعیت هشدار پاک شود؟'))return;
    state.activeSession.safetyFlag=false;await saveAndRenderWorkout();
   }return;
 }
 case 'toggle-busy':{
   const d=state.activeSession;if(!d||d.planVersion!==7)return;
   if(d.exerciseLogs.some(x=>x.sets.some(q=>q.done||q.failed))||d.warmupConfirmed){toast('نوع جلسه فقط پیش از شروع گرم‌کردن و ست‌ها قابل تغییر است.','error');return;}
   const mode=d.executionMode==='busy'?'full':'busy';
   const newDraft=buildDraft(d.sessionNumber,d.date,null,mode);
   if(!newDraft){toast('تغییر نسخه برای این جلسه ممکن نیست.','error');return;}
   if(!await askDialog(mode==='busy'?'نسخه کوتاه پژوهشی با حجم کمتر فعال شود؟ ست‌های حذف‌شده به‌عنوان انجام‌شده ثبت نمی‌شوند.':'به نسخه کامل جلسه بازگردیم؟'))return;
   newDraft.id=d.id;newDraft.startedAt=d.startedAt;newDraft.readiness=d.readiness;
   state.activeSession=newDraft;endTimer();await saveAndRenderWorkout();toast(mode==='busy'?'نسخه کوتاه فعال شد.':'نسخه کامل فعال شد.');return;
 }
 case 'confirm-warmup':{
  if(!state.activeSession)return;
  if(state.activeSession.warmupConfirmed&&completedSets(state.activeSession)>0){toast('بعد از شروع ست‌ها، گرم‌کردن را نمی‌توان به حالت انجام‌نشده برگرداند.','error');return;}
  state.activeSession.warmupConfirmed=!state.activeSession.warmupConfirmed;
  if(state.activeSession.warmupConfirmed)startSessionClock();
  await saveAndRenderWorkout();return;}
 case 'confirm-cooldown':{
  if(!state.activeSession)return;
  const d=state.activeSession,p=planFor(d.sessionNumber,d);
  if(!d.cooldownConfirmed&&(!d.exerciseLogs.every(x=>x.sets.every(q=>q.done))||!d.cardioConfirmed)){toast('ابتدا تمرین اصلی و هوازی را کامل کن.','error');return;}
  d.cooldownConfirmed=!d.cooldownConfirmed;await saveAndRenderWorkout();return;}
 case 'save-weights':{
  const raw=String($('#final-available-weights')?.value||'').trim();
  const entries=raw?raw.split(/[,،;]+/).map(x=>Number(x.trim())):[];
  if(entries.some(x=>!Number.isFinite(x)||x<2||x>8)||entries.length>15){toast('فقط وزن‌های واقعاً قابل تنظیم در بازه 2 تا 8 کیلوگرم وارد کن.','error');return;}
  state.settings.availableDumbbellWeights=[...new Set(entries)].sort((a,b)=>a-b);await saveState();render();toast('پله‌های واقعی دمبل ذخیره شدند.');return;}
 case 'export-archive':downloadFile(JSON.stringify(state.legacyArchive||[],null,2),'application/json;charset=utf-8','formino-legacy-archive.json');return;
 case 'postpone-workout':{if(!state.activeSession)return;const completed=state.activeSession.exerciseLogs.some(x=>x.sets.some(q=>q.done||q.failed));if(completed){toast('پس از شروع ست‌ها، جلسه را به صورت نیمه‌تمام ذخیره کن.','error');return;}if(!await askDialog('جلسه امروز انجام نمی‌شود و به اولین روز مناسب بعدی منتقل شود؟'))return;state.unavailable=[...new Set([...(state.unavailable||[]),today()])];state.activeSession=null;endTimer();stopSessionClock();await saveState();go('calendar');toast('روز امروز به عنوان عدم امکان تمرین ثبت شد و برنامه آینده بازچینی شد.');return;}
 case 'toggle-focus':focusMode=!focusMode;render();return;
 case 'toggle-sound':restSound=!restSound;state.settings.restSound=restSound;if(restSound)unlockRestAudio();await saveAndRenderWorkout();toast(restSound?'اعلان پایان استراحت فعال شد؛ با «آزمایش صدا» آن را بشنو.':'اعلان صوتی غیرفعال شد.');return;
 case 'test-rest-alarm':unlockRestAudio();if(!beepRest(true))toast('پخش صدا توسط مرورگر مسدود شده است.','error');return;
 case 'start-session-clock':{if(!state.activeSession)return; if(startSessionClock()){await saveAndRenderWorkout();toast('زمان‌سنج کل تمرین از همین لحظه شروع شد.');}return;}
 case 'reset-today-training':{
   const date=state.activeSession?.date||today(),info=FORMINO_CLOCK.trainingCountForDate(state,date);
   if(!info.total){toast('برای امروز داده تمرینی ثبت نشده است.');return;}
   if(!await askDialog(`اطلاعات تمرین مربوط به امروز (${date}) پاک شوند؟\nپیش‌نویس امروز: ${info.draft} • جلسه ذخیره‌شده امروز: ${info.saved}\nاطلاعات سایر روزها، اندازه‌های بدن و تنظیمات باقی می‌مانند. قبل از حذف، بکاپ SQLite گرفته می‌شود.`))return;
   const token=await askDialog('برای حذف ثبت‌های امروز، «ریست» را وارد کن.',{title:'تأیید نهایی حذف',field:'عبارت تأیید',confirmLabel:'حذف ثبت‌های امروز',danger:true});
   if(token!=='ریست'){if(token!==null)toast('ریست لغو شد؛ عبارت تأیید درست نبود.','error');return;}
   const previousState=JSON.parse(JSON.stringify(state)),previousTimerEnd=timerEnds,previousRestDuration=restSecondsTotal;
   try{await busy;const backup=await api('/api/backup',{method:'POST'});
    const existing=state.activeSession?.date===date?state.activeSession:null;
    const cleared=FORMINO_CLOCK.clearTrainingDate(state,date);
    endTimer();stopSessionClock();lastSetCompletionAt=0;state=cleared;
    if(existing)state.activeSession=buildDraft(existing.sessionNumber,date);
    invalidateSchedule();const before=revision;await saveState();
    if(revision<=before)throw new Error('ذخیره بازنشانی تأیید نشد. نسخه پشتیبان محفوظ است.');
    render();toast(`تمرین تاریخ ${date} بازنشانی شد. پشتیبان: ${backup.filename}`);
   }catch(err){
    state=previousState;invalidateSchedule();
    if(previousTimerEnd>Date.now()){timerEnds=previousTimerEnd;runTimer(previousRestDuration||60,true);}
    if(state.activeSession?.exerciseStartedAt&&!sessionClockTicker)sessionClockTicker=setInterval(paintSessionClock,1000);
    render();toast('ریست ذخیره نشد و اطلاعات روی صفحه بازیابی شد: '+err.message,'error');
   }
   return;
 }
 case 'view-final-report':finalReportMode=true;go('reports');return;
 case 'view-weekly-report':finalReportMode=false;go('reports');return;
 case 'export-final-csv':exportFinalCSV45();return;
 case 'export-all-csv':exportAllAnalyticsCSV45();return;
 case 'export-strength-png':await exportChartPNG45('strength');return;
 case 'export-measure-png':await exportChartPNG45('measure');return;
 case 'export-overlay-png':await exportChartPNG45('overlay');return;
 case 'export-symmetry-png':await exportChartPNG45('symmetry');return;
 case 'toggle-menu':setMenu(!$('#sidebar').classList.contains('open'));return;
 case 'close-menu':setMenu(false);return;
 case 'month-prev':calendarMonth=shiftMonth(calendarMonth,-1);selectedCalendarDay=monthStart(calendarMonth);render();return;
 case 'month-next':calendarMonth=shiftMonth(calendarMonth,1);selectedCalendarDay=monthStart(calendarMonth);render();return;
 case 'month-current':calendarMonth=today();selectedCalendarDay=today();render();return;
 case 'toggle-batch':calendarBatchMode=!calendarBatchMode;if(!calendarBatchMode)calendarSelected.clear();render();return;
 case 'batch-shift':await setBatchStatus('shift');return;
 case 'batch-unavailable':await setBatchStatus('unavailable');return;
 case 'batch-rest':await setBatchStatus('rest');return;
 case 'batch-clear':await setBatchStatus('clear');return;
 case 'batch-reset':calendarSelected.clear();render();return;
 case 'start-workout':{void requestScreenWakeLock();const next=nextSchedule();if(!next){toast('جلسه آینده موجود نیست.','error');return;}if(next.date>today()){toast('این جلسه برای '+pd(next.date)+' برنامه‌ریزی شده است؛ در تقویم وضعیت روزها را تنظیم کن.','error');return;}const pending=state.sessions.find(s=>s.sessionNumber===next.sessionNumber&&s.status==='partial');
   state.activeSession=buildDraft(next.sessionNumber,today(),pending||null);
   if(pending){state.activeSession.attemptDates=[...new Set([...(pending.attemptDates||[]),pending.date,today()])];}
   focusMode=true;go('workout');await saveWorkoutProgress();return;}
 case 'leave-workout':go('dashboard');if(!workoutPending)toast('پیش‌نویس تمرین در پایگاه داده محفوظ است.');return;
 case 'save-draft':await saveWorkoutProgress();notifySaved();return;
 case 'discard-draft':if(await askDialog('پیش‌نویس فعلی حذف شود؟',{title:'حذف پیش‌نویس تمرین',confirmLabel:'حذف پیش‌نویس',danger:true})){state.activeSession=null;endTimer();stopSessionClock();await saveState();render();}return;
 case 'finish-workout':await finishWorkout();return;
 case 'timer-60':runTimer(60);return;
 case 'timer-90':runTimer(90);return;
 case 'timer-stop':endTimer();if(state?.activeSession)await saveWorkoutProgress();return;
 case 'go-analytics':go('analytics');return;
 case 'go-measurements':selectedMeasureWeek=phaseWeek();go('measurements');return;
 case 'go-reports':reportWeek=currentWeek();go('reports');return;
 case 'reset-bar-ready':if(await askDialog('تأیید آمادگی بارفیکس کامل لغو شود؟')){
   state.settings.barReady=false;
   for(const [k,v] of Object.entries(state.settings.exerciseUpgrades))if(v==='chinUp')state.settings.exerciseUpgrades[k]='scapPull';
   await saveState();render();}return;
 case 'reset-bar-fallback':if(await askDialog('بارفیکس مهارتی از حالت جایگزین قایقی به مرحله اولیه برگردد؟ فقط اگر میله در دسترس و ایمن است.')){
   delete state.settings.exerciseUpgrades.activeHang;await saveState();render();}return;
 case 'copy-last-measures':{
   if(!await askDialog('مقادیر آخرین اندازه‌گیری را در فرم قرار بدهیم؟ فقط اگر واقعاً دوباره اندازه گرفته‌ای، آن‌ها را ذخیره کن.'))return;
   for(const d of defs.filter(x=>!x.derived)){const field=root.querySelector('#measure-'+d.key),value=latest(d.key);if(field&&value)field.value=value.value;}
   toast('مقادیر برای بررسی در فرم قرار گرفتند؛ هنوز ذخیره نشده‌اند.');return;
 }
 case 'remove-measure':{if(!measurementForWeek(selectedMeasureWeek))return;if(await askDialog('اندازه‌گیری این هفته حذف شود؟',{title:'حذف اندازه‌گیری',confirmLabel:'حذف اندازه‌گیری',danger:true})){state.measurements=state.measurements.filter(m=>Number(m.week)!==selectedMeasureWeek);await saveState();render();}return;}
 case 'export-json':downloadFile(JSON.stringify(state,null,2),'application/json;charset=utf-8','formino-full-backup.json');return;
 case 'export-measurements':exportMeasurements();return;
 case 'export-workouts':exportWorkoutLogs();return;
 case 'export-report-csv':exportWeeklyCSV(reportWeek);return;
 case 'print-report':document.body.classList.add('print-report');window.print();setTimeout(()=>document.body.classList.remove('print-report'),1000);return;
 case 'print-plan':document.body.classList.add('print-plan');window.print();setTimeout(()=>document.body.classList.remove('print-plan'),1000);return;
 case 'download-sqlite':window.location.assign('/api/database/download');return;
 case 'backup':{try{const res=await api('/api/backup',{method:'POST'});toast('نسخه پشتیبان ساخته شد: '+res.path);}catch(err){toast(err.message,'error');}return;}
 }}
root.addEventListener('click', e=>{
 void handleContentClick(e).catch(err=>toast(err.message,'error'));
});
async function handleContentClick(e){
 if(calendarSaving||recoverySaving)return;
 const control=e.target.closest('button');
 const safetyStop=control?.dataset.action==='report-safety'&&!state?.activeSession?.safetyFlag;
 const localWorkoutEdit=control?.matches(setControls+',[data-calibrate-weight],[data-action="timer-stop"],[data-exercise-difficulty]')&&canEditWorkout(workoutSaveStatus);
 if(workoutPending&&control&&!safetyStop&&!localWorkoutEdit&&!control.matches('[data-nav],[data-exercise],[data-action="review-workout-save"],[data-action="jump-workout"],[data-action="leave-workout"],[data-action="toggle-focus"]')){
  if(workoutSaveStatus!=='saving')toast('ابتدا وضعیت ثبت تمرین را بررسی کن.','error');
  return;
 }
 const weightBtn=e.target.closest('[data-calibrate-weight]');
 if(weightBtn&&state.activeSession?.planVersion===7){
  const idx=Number(weightBtn.dataset.calibrateWeight),rec=state.activeSession.exerciseLogs[idx];
  if(!rec||rec.sets.some(q=>q.done))return;
  const values=state.settings.availableDumbbellWeights||[];
  const answer=await askDialog('وزنی را وارد کن که روی دمبل قابل نصب است و با فرم صحیح می‌توانی آن را کنترل کنی.',{title:P.exercises[rec.id].fa,field:'وزن واقعی دمبل (۲ تا ۸ کیلوگرم)',value:String(values[0]||2),inputmode:'decimal',confirmLabel:'بررسی وزن'});
  if(answer===null)return;
  const weight=Number(answer.replace('،','.').replace(',','.'));
  if(!Number.isFinite(weight)||weight<2||weight>8){toast('وزن معتبر باید بین 2 تا 8 کیلوگرم باشد.','error');return;}
  if(!await askDialog(`آیا دمبل با وزن ${weight} کیلوگرم واقعاً در دسترس است و می‌توانی حرکت را با فرم ایمن انجام بدهی؟`))return;
  state.settings.finalCalibration[rec.familyId]={...(state.settings.finalCalibration[rec.familyId]||{}),variantId:rec.variantId,loadKg:weight};
  rec.calibrationPending=false;rec.sets.forEach(q=>q.coachLoad=weight);rec.coachReason='وزن '+weight+' کیلوگرم تأیید شد؛ پس از ثبت عملکرد، مربی زمان ارتقا را بررسی می‌کند.';
  await saveAndRenderWorkout();toast('وزن واقعی تمرین ثبت شد.');return;
 }
 const variantBtn=e.target.closest('[data-select-variant]');
 if(variantBtn&&state.activeSession?.planVersion===7){
  const idx=Number(variantBtn.dataset.selectVariant),rec=state.activeSession.exerciseLogs[idx];
  if(!rec||rec.sets.some(q=>q.done||q.failed))return;
  const fam=P.sourceExercises[rec.familyId],choices=fam.variants.filter(v=>ADAPT.approvedVariant(rec.familyId,v.id,state.settings));
  const menu=choices.map((v,i)=>`${i+1}. ${v.name_fa} (${v.id})`).join('\n');
  const choice=await askDialog(`شمارهٔ نسخه‌ای را وارد کن که می‌توانی اجرا کنی.\n${menu}`,{title:'انتخاب سطح حرکت',field:'شمارهٔ نسخه',value:String(choices.findIndex(v=>v.id===rec.variantId)+1||1),inputmode:'numeric',confirmLabel:'بررسی انتخاب'});
  if(choice===null)return;
  const n=Number(choice);if(!Number.isInteger(n)||n<1||n>choices.length){toast('شماره نسخه نامعتبر است.','error');return;}
  const variant=choices[n-1];if(variant.id===rec.variantId)return;
  if(!await askDialog('نسخه «'+variant.name_fa+'» از این به بعد برای این خانواده حرکت استفاده شود؟ فقط در صورت تسلط به تکنیک و بدون درد تأیید کن.'))return;
  const previous=rec.sets.length,load=rec.sets[0]?.coachLoad??null,ex=P.exercises[variant.id];
  rec.id=variant.id;rec.variantId=variant.id;rec.target=String(variant.initial_target)+' '+(variant.unit==='seconds'?'ثانیه':'تکرار');
  rec.sets=ADAPT.makeSets(Array(previous).fill(variant.initial_target),variant.unit,ex.type==='weight'?load:null);
  rec.calibrationPending=ex.type==='weight'&&load==null;
  rec.coachReason='نسخه جدید به‌عنوان سطح ارزیابی انتخاب شد؛ برای حرکت جدید، تعداد هدف پایه حفظ شده است.';
  state.settings.finalCalibration[rec.familyId]={...(state.settings.finalCalibration[rec.familyId]||{}),variantId:variant.id,loadKg:ex.type==='weight'?load:null};
  await saveAndRenderWorkout();toast('سطح حرکت انتخاب شد.');return;
 }
 const cardioBtn=e.target.closest('[data-cardio-confirm]');
 if(cardioBtn&&state.activeSession){
  const p=planFor(state.activeSession.sessionNumber,state.activeSession);
  if(state.activeSession.planVersion===7&&!state.activeSession.cardioConfirmed&&!state.activeSession.exerciseLogs.every(x=>x.sets.every(q=>q.done))){toast('ابتدا ست‌های تمرین اصلی را کامل کن. برای جلسات نیمه‌تمام، ذخیره و خروج استفاده کن.','error');return;}
  if(!state.activeSession.cardioConfirmed)startSessionClock();
  state.activeSession.cardioConfirmed=!state.activeSession.cardioConfirmed;
  state.activeSession.cardioMin=state.activeSession.cardioConfirmed?Number(p.cardioMinutes)||0:0;
  await saveAndRenderWorkout();toast(state.activeSession.cardioConfirmed?'هوازی کامل ثبت شد.':'تأیید هوازی برگشت داده شد.');
  document.getElementById('cardio-check')?.scrollIntoView({behavior:'smooth',block:'center'});return;
 }
 const readinessBtn=e.target.closest('[data-readiness]');
 if(readinessBtn&&state.activeSession){const v=readinessBtn.dataset.readiness;if(!['good','medium','poor'].includes(v))return;state.activeSession.readiness=v;readinessToday=v;await saveAndRenderWorkout();return;}
 const effortBtn=e.target.closest('[data-exercise-difficulty]');
 if(effortBtn&&state.activeSession){
  const [index,value]=effortBtn.dataset.exerciseDifficulty.split(':');
  if(!['easy','okay','hard'].includes(value))return;
  const rec=state.activeSession.exerciseLogs[Number(index)];
  if(!rec||!rec.sets.every(z=>z.done))return;
  rec.difficulty=value;await saveAndRenderWorkout();
  document.getElementById('exercise-'+index)?.scrollIntoView({behavior:'smooth',block:'center'});
  toast('بازخورد ثبت شد. مربی آن را در هدف جلسه بعد لحاظ می‌کند.');return;
 }
 const barBtn=e.target.closest('[data-bar-ready]');
 if(barBtn&&state.activeSession){
  if(!await askDialog('فقط اگر میله کاملاً ایمن و در دسترس است و یک بارفیکس کامل بدون پرش یا کمک و بدون درد انجام داده‌ای، این مورد را تأیید کن.'))return;
  state.settings.barReady=true;await saveAndRenderWorkout();toast('آمادگی پایه بارفیکس ثبت شد؛ ارتقا همچنان نیازمند اجرای آسان ست‌های فعلی است.');return;
 }
 const completeButton=e.target.closest('[data-complete-exercise-set]');
 const undoButton=e.target.closest('[data-undo-exercise-set]');
 const failButton=e.target.closest('[data-failed-exercise-set]');
 if((completeButton||undoButton||failButton)&&state.activeSession){
   const ei=Number(completeButton?.dataset.completeExerciseSet??undoButton?.dataset.undoExerciseSet??failButton?.dataset.failedExerciseSet);
   const rec=state.activeSession.exerciseLogs[ei],ex=rec&&P.exercises[rec.id];
   if(!rec||!ex)return;
   const targetSet=undoButton?[...rec.sets].reverse().find(s=>s.done||s.failed):rec.sets.find(s=>!s.done&&!s.failed);
   if(!targetSet)return;
   if(undoButton){
     lastWorkoutSet=null;lastSetCompletionAt=0;rec.difficulty=null;targetSet.done=false;targetSet.failed=false;targetSet.attempted=false;targetSet.failedAttempts=Math.max(0,Number(targetSet.failedAttempts||0)-1);targetSet.reps='';targetSet.repsR='';targetSet.repsL='';targetSet.weight='';targetSet.rir='';
     endTimer();await saveAndRenderWorkout();toast('آخرین ست این حرکت برگشت داده شد.');
     document.querySelector(`#exercise-${ei}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;
   }
   if(state.activeSession.planVersion===7){
    if(!state.activeSession.warmupConfirmed){toast('ابتدا گرم‌کردن را انجام بده و تأیید کن.','error');return;}
    if(state.activeSession.safetyFlag===true){toast('پس از علامت خطر، ادامه تمرین مجاز نیست.','error');return;}
    if(state.activeSession.readiness==='poor'&&planFor(state.activeSession.sessionNumber,state.activeSession)?.kind==='strength'){
      toast('در خستگی شدید، تمرین مقاومتی را به روز مناسب‌تر منتقل کن.','error');return;
    }
   }
   if(Date.now()-lastSetCompletionAt<650)return; // Ignore accidental rapid double-clicks.
   if(restSound)unlockRestAudio();
   startSessionClock();
   if(failButton){
     rec.difficulty='hard';targetSet.failed=true;targetSet.attempted=true;targetSet.done=false;
     targetSet.failedAttempts=(Number(targetSet.failedAttempts)||0)+1;
     targetSet.reps='';targetSet.repsR='';targetSet.repsL='';targetSet.weight='';targetSet.rir='';
     lastSetCompletionAt=Date.now();lastWorkoutSet={id:state.activeSession.id,index:ei};
     const nextIndex=state.activeSession.exerciseLogs.findIndex((r,i)=>i>ei&&r.sets.some(z=>!z.done&&!z.failed));
     runTimer(rec.coachRest||75);
     const saving=saveAndRenderWorkout();
     if(rec.sets.every(z=>z.done||z.failed)&&nextIndex>=0){
      requestAnimationFrame(()=>document.getElementById(`exercise-${nextIndex}`)?.scrollIntoView({block:'start'}));
     }
     await saving;
     toast('ست کامل نشد و به‌عنوان موفقیت ثبت نشده است. هدف جلسه بعد افزایش نمی‌یابد.');return;
   }
   const target=Number(targetSet.coachTarget);
   if(!Number.isFinite(target)||target<1){toast('هدف ست معتبر نیست.','error');return;}
   if(state.activeSession.planVersion===7){
    if(rec.calibrationPending){toast('برای این حرکت، ابتدا وزن واقعی دمبل را تأیید کن.','error');return;}
   }
   if(unilateral(rec.id,state.activeSession.planVersion)){
      targetSet.repsR=String(target);targetSet.repsL=String(target);
   }else targetSet.reps=String(target);
   if((ex.type==='weight'||ex.type==='band')&&targetSet.coachLoad!=null)targetSet.weight=String(targetSet.coachLoad);
   lastSetCompletionAt=Date.now();lastWorkoutSet={id:state.activeSession.id,index:ei};
   targetSet.done=true;targetSet.failed=false;targetSet.attempted=true;targetSet.rir=''; // Do not invent subjective exertion.
   const p=planFor(state.activeSession.sessionNumber,state.activeSession);
   const finishedExercise=rec.sets.every(s=>s.done);
   const allDone=completedSets(state.activeSession)===totalSets(state.activeSession)&&(!p?.cardioMinutes||state.activeSession.cardioConfirmed);
   if(!allDone)runTimer(p?.steps[ei]?.rest||rec.coachRest||60);else endTimer();
   const saving=saveAndRenderWorkout();
   const pendingExercise=state.activeSession.exerciseLogs.findIndex(r=>r.sets.some(z=>!z.done&&!z.failed));
   const targetId=allDone?'workout-summary':pendingExercise<0&&p?.cardioMinutes&&!state.activeSession.cardioConfirmed?
    (Number(state.activeSession.planVersion)>=7?'stage-cardio':'cardio-check'):`exercise-${finishedExercise&&pendingExercise>=0?pendingExercise:ei}`;
   if(finishedExercise)requestAnimationFrame(()=>{
    if(currentPage==='workout')document.getElementById(targetId)?.scrollIntoView({block:'start'});
   });
   await saving;
   toast(allDone?'تمام ست‌ها تکمیل شدند. جلسه را نهایی کن.':finishedExercise?'حرکت کامل شد! به حرکت بعدی برو.':'یک ست کامل ثبت شد.');
   return;
 }
 const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();if(nav.dataset.nav==='reports')finalReportMode=false;go(nav.dataset.nav);return;}
 const exercise=e.target.closest('[data-exercise]');if(exercise){openExercise(exercise.dataset.exercise);return;}
 const harder=e.target.closest('[data-upgrade-exercise]');
 if(harder&&state.activeSession){
  const i=Number(harder.dataset.upgradeExercise),rec=state.activeSession.exerciseLogs[i];
  const upgrade=upgradeFor(rec.id),plan=planFor(state.activeSession.sessionNumber,state.activeSession);
  if(!upgrade||!plan||rec.sets.some(q=>q.done)||!readyToUpgrade(rec.id,rec.target,state.activeSession.id))return;
  if(!await askDialog('نسخه سخت‌تر «'+P.exercises[upgrade.id].fa+'» انتخاب شود؟'+(upgrade.id==='chinUp'?' فقط اگر همین حالا حداقل یک بارفیکس کامل و کنترل‌شده را بدون پرش می‌توانی انجام بدهی.':' فقط در صورت توان اجرای صحیح و بدون درد.')))return;
  const original=plan.steps[i]?.original||plan.steps[i]?.id||rec.id;
  state.settings.exerciseUpgrades[original]=upgrade.id;
  rec.id=upgrade.id;rec.target=upgrade.reps;
  const suggested=perExerciseCoach({...plan.steps[i],id:upgrade.id,reps:upgrade.reps},upgrade.id,plan.week,state.activeSession.id);
  rec.coachReason=suggested.reason;rec.sets=COACH.makeSets({...suggested,targets:suggested.targets.slice(0,rec.sets.length)},[]);
  await saveAndRenderWorkout();toast('نسخه سخت‌تر برای جلسات بعدی هم انتخاب شد.');return;
 }
 const swap=e.target.closest('[data-swap-exercise]');
 if(swap&&state.activeSession){
  const i=Number(swap.dataset.swapExercise),rec=state.activeSession.exerciseLogs[i];
  const alt=alternativeFor(rec.id);
  if(!alt||rec.sets.some(z=>z.done))return;
  if(!await askDialog('این حرکت با «'+P.exercises[alt.id].fa+'» جایگزین شود؟ مقادیر واردشده برای ست‌های هنوز ثبت‌نشده پاک می‌شوند.'))return;
  const plan=planFor(state.activeSession.sessionNumber,state.activeSession);const original=plan?.steps?.[i]?.original||plan?.steps?.[i]?.id||rec.id;state.settings.exerciseUpgrades[original]=alt.id;
  rec.id=alt.id;rec.target=alt.reps;
  const suggested=perExerciseCoach({...plan.steps[i],id:alt.id,reps:alt.reps},alt.id,plan.week,state.activeSession.id);
  rec.coachReason=suggested.reason;rec.sets=COACH.makeSets({...suggested,targets:suggested.targets.slice(0,rec.sets.length)},[]);
  await saveAndRenderWorkout();toast('جایگزین ثبت و برای جلسات آینده نیز حفظ شد.');return;
 }

 const cal=e.target.closest('[data-day]');if(cal){if(calendarBatchMode){const d=cal.dataset.day;calendarSelected.has(d)?calendarSelected.delete(d):calendarSelected.add(d);render();return;}selectedCalendarDay=cal.dataset.day;render();const pane=$('#day-editor');if(mobileLayout.matches&&pane){pane.querySelector('h3').focus({preventScroll:true});pane.scrollIntoView({block:'start'});}return;}
 const dayControl=e.target.closest('[data-set-day]');if(dayControl){await setDayStatus(dayControl.dataset.setDay);return;}
 const week=e.target.closest('[data-plan-week]');if(week){selectedPlanWeek=Number(week.dataset.planWeek);render();return;}
 const session=e.target.closest('[data-plan-session]');if(session){selectedPlanCode=session.dataset.planSession;render();return;}
 const metric=e.target.closest('[data-metric]');if(metric){selectedMetric=metric.dataset.metric;render();window.scrollTo({top:450});return;}
 const group=e.target.closest('[data-metric-group]');if(group){selectedMetricGroup=group.dataset.metricGroup;render();return;}
 const edit=e.target.closest('[data-edit-session]');if(edit){const old=state.sessions.find(s=>s.id===edit.dataset.editSession);if(!old)return;if(state.activeSession&&!await askDialog('پیش‌نویس فعلی با جلسه انتخاب‌شده جایگزین شود؟'))return;state.activeSession=buildDraft(old.sessionNumber,old.date,old);focusMode=true;go('workout');await saveWorkoutProgress();return;}
 const action=e.target.closest('[data-action]');if(action){e.preventDefault();await handleAction(action.dataset.action,action);return;}
}
root.addEventListener('change',e=>{const t=e.target;if(calendarSaving||recoverySaving)return;
 if(workoutPending&&t.matches('#import-json,[data-draft],[data-set-field]')){toast('ابتدا وضعیت ثبت تمرین را بررسی کن.','error');return;}
 if(t.id==='exercise-category'){exerciseCategory=t.value;filterExercises();return;}
 if(t.id==='plan-week-select'){selectedPlanWeek=clamp(Number(t.value)||1,1,24);render();return;}
 if(t.id==='measure-week'){selectedMeasureWeek=Number(t.value);render();return;}
 if(t.id==='report-week'){reportWeek=Number(t.value);render();return;}
 if(t.id==='strength-exercise'){selectedStrengthId=t.value;render();return;}
 if(t.id==='volume-week'){selectedVolumeWeek=clamp(Number(t.value)||1,1,24);render();return;}
 if(t.id==='chart-span'){selectedChartSpan=clamp(Number(t.value)||24,4,24);render();return;}
 if(t.id==='overlay-a'){selectedOverlayA=t.value;render();return;}
 if(t.id==='overlay-b'){selectedOverlayB=t.value;render();return;}
 if(t.id==='symmetry-pair'){selectedSymmetry=t.value;render();return;}

 if(t.matches('[data-set-field]')&&state.activeSession){const [ei,si,key]=t.dataset.setField.split(':');const set=state.activeSession.exerciseLogs[Number(ei)]?.sets[Number(si)];if(!set)return;set[key]=key==='done'?t.checked:t.value;if(key==='done'){const stat=$('.session-summary .summary-cell b');if(stat)stat.textContent=`${nf(completedSets(state.activeSession))} / ${nf(totalSets(state.activeSession))}`;}saveState();return;}
 if(t.matches('[data-draft]')&&state.activeSession){state.activeSession[t.dataset.draft]=t.value;saveState();return;}
 if(t.id==='import-json'){const file=t.files?.[0];if(!file)return;file.text().then(async content=>{try{const imported=JSON.parse(content);if(!imported||![1,2,3,4,5,6,7].includes(imported.version)||!Array.isArray(imported.measurements)||!Array.isArray(imported.sessions)||!Array.isArray(imported.shifts)||!/^\d{4}-\d{2}-\d{2}$/.test(imported.startDate))throw new Error('فایل معتبر فرمینو نیست.');if(!await askDialog('تمام داده‌های فعلی با محتویات فایل JSON جایگزین شوند؟',{title:'بازیابی اطلاعات',confirmLabel:'پشتیبان‌گیری و بازیابی',danger:true})){t.value='';return;}await api('/api/backup',{method:'POST'});state=ensureState(imported);await saveState();go('dashboard');toast('اطلاعات بازیابی شد. نسخهٔ پشتیبان در پوشهٔ backups قرار دارد.');}catch(err){toast(err.message,'error');}finally{t.value='';}});return;}
});
root.addEventListener('compositionend',e=>{if(e.target.id==='exercise-search'){exerciseFilter=e.target.value;filterExercises();}});
root.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='exercise-search'){exerciseFilter=t.value;if(!e.isComposing)filterExercises();}
 if(t.matches('#measurement-form input[type="number"]')){
  t.closest('form').querySelectorAll('[aria-invalid="true"]').forEach(input=>{
   input.removeAttribute('aria-invalid');
   input.removeAttribute('aria-describedby');
  });
  $('#measurement-feedback').textContent='';
 }
 if(!workoutPending&&!recoverySaving&&state.activeSession&&(t.matches('[data-set-field]')||t.matches('[data-draft]'))){
   if(t.matches('[data-set-field]')){const [ei,si,key]=t.dataset.setField.split(':');const set=state.activeSession.exerciseLogs[+ei]?.sets[+si];if(set)set[key]=t.value;}
   if(t.matches('[data-draft]'))state.activeSession[t.dataset.draft]=t.value;
   clearTimeout(autoSaveDebounce);autoSaveDebounce=setTimeout(()=>saveState(),450);
 }
});
root.addEventListener('submit',async e=>{if(calendarSaving||recoverySaving||workoutPending){e.preventDefault();if(workoutPending)toast('ابتدا وضعیت ثبت تمرین را بررسی کن.','error');return;}if(e.target.id==='measurement-form'){e.preventDefault();const data=new FormData(e.target),row={week:selectedMeasureWeek,date:String(data.get('measure-date')||today())};let count=0;for(const d of defs.filter(x=>!x.derived)){const v=num(data.get('m-'+d.key));if(v!==null){if(v<=0||v>5000){
  const field=$('#measure-'+d.key);
  const feedback=$('#measurement-feedback');
  feedback.textContent='برای '+d.fa+' یک عدد معتبر وارد کن.';
  field.setAttribute('aria-invalid','true');
  field.setAttribute('aria-describedby',feedback.id);
  field.focus();
  return;
 }row[d.key]=v;count++;}}
 if(!count){
  const feedback=$('#measurement-feedback');
  feedback.textContent='حداقل یکی از اندازه‌ها را وارد کن.';
  feedback.focus();
  return;
 }const previous=state.measurements;
 const measurements=[...previous.filter(m=>Number(m.week)!==row.week),row].sort((a,b)=>a.week-b.week);
 state.measurements=measurements;
 try{await saveState();}
 catch{
  if(state.measurements===measurements)state.measurements=previous;
  $('#measurement-feedback').textContent='اندازه‌ها ذخیره نشدند. دوباره تلاش کن.';
  return;
 }
 render();notifySaved();return;}
 if(e.target.id==='settings-form'){e.preventDefault();const d=new FormData(e.target),height=Number(d.get('height'));if(height<100||height>240){toast('قد معتبر نیست.','error');return;}const previousHeight=state.settings.height,previousDate=state.startDate;
 state.settings.height=height;state.startDate=String(d.get('startDate'));
 try{await saveState();}
 catch{state.settings.height=previousHeight;state.startDate=previousDate;return;}
 render();notifySaved();return;}
});
document.querySelectorAll('aside [data-nav], .mobile-bottom-nav [data-nav]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
document.querySelector('#mobile-backdrop').addEventListener('click',()=>handleAction('close-menu'));
document.querySelector('.mobile-menu').addEventListener('click',()=>handleAction('toggle-menu'));
$('#modal').addEventListener('click',event=>{
 if(event.target.closest('#modal-close,[data-dialog-cancel]'))$('#modal').close('cancel');
 const related=event.target.closest('[data-guide-related]');
 if(related)openExercise(related.dataset.guideRelated);
});
setMenu(false);
async function init(){
 root.setAttribute('aria-busy','true');
 const retry=root.querySelector('[data-action="retry-connection"]');
 if(retry){retry.disabled=true;retry.textContent='در حال اتصال…';}
 try{if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('/sw.js').catch(()=>{});const res=await api('/api/state');revision=res.revision;const original=res.state?JSON.stringify(res.state):null;state=ensureState(res.state||defaultState());
  confirmedState=structuredClone(state);
  recoveryEntries=readRecoveryEntries();
  selectedMeasureWeek=phaseWeek();reportWeek=currentWeek();selectedPlanWeek=phaseWeek();if(original&&(JSON.parse(original).version!==7||JSON.parse(original).programKey!=='FORMINO-EVIDENCE-24W-20261113')){await api('/api/backup',{method:'POST'});}restSound=state.settings.restSound!==false;
  if(!original||original!==JSON.stringify(state))await saveState();
  syncWorkoutClocks();render();void requestScreenWakeLock();status('پایگاه داده محلی فعال');}catch(err){document.title='خطای اتصال | فرمینو';
 root.innerHTML=`<div class="card error-state"><h1 tabindex="-1">اتصال به پایگاه داده برقرار نشد</h1><p>${escapeHtml(err.message)}</p><p>اگر برنامه بسته است، فایل <bdi>start.bat</bdi> را اجرا کن و دوباره تلاش کن.</p><button class="btn primary" data-action="retry-connection">${icon('rotate')} تلاش دوباره</button></div>`;
 status('اتصال برقرار نشد','bad');
 if(retry)root.querySelector('[data-action="retry-connection"]').focus();
 }finally{root.removeAttribute('aria-busy');}
}
void init();
})();
