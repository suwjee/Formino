/* Program state boundaries and fixed-dose workout records for Formino 8. */
(function(root){
'use strict';

const version=8;
const programKey='FORMINO-FIXED-24W-V8';

function migrate(source,date){
 if(source.version===version&&source.programKey===programKey)return source;
 const hasPrevious=Boolean(source.programKey||source.activeSession||source.sessions?.length||source.measurements?.length);
 const prior=hasPrevious?{
  archivedAt:new Date().toISOString(),fromVersion:source.version,programKey:source.programKey,
  startDate:source.startDate,settings:source.settings||{},sessions:source.sessions||[],
  activeSession:source.activeSession||null,measurements:source.measurements||[],oldMeasures:source.oldMeasures||{},
  shifts:source.shifts||[],unavailable:source.unavailable||[],rest:source.rest||[]
 }:null;
 return {...source,version,programKey,startDate:date,
  legacyArchive:[...(source.legacyArchive||[]),...(prior?[prior]:[])],
  sessions:[],activeSession:null,settings:{...source.settings,bandChecked:false,pullupBarVerified:false,strictPullupConfirmed:false}
 };
}

function nextNumber(sessions,limit=120){
 const completed=new Set(sessions.filter(row=>row.status==='completed').map(row=>Number(row.sessionNumber)));
 for(let n=1;n<=limit;n++)if(!completed.has(n))return n;
 return null;
}

function candidateWeights(settings){
 return [...new Set([4,...(settings.availableDumbbellWeights||[]).map(Number)])]
  .filter(weight=>Number.isFinite(weight)&&weight>=4&&weight<=8).sort((a,b)=>a-b);
}

function resolveLoad(step,session,settings,sessions){
 if(step.kind!=='weight')return null;
 const weights=candidateWeights(settings);
 const relevant=sessions.filter(log=>Number(log.planVersion)===version&&log.sessionNumber<session.sessionNumber)
  .sort((a,b)=>b.sessionNumber-a.sessionNumber)
  .flatMap(log=>(log.exerciseLogs||[]).filter(row=>row.id===step.id).map(row=>({log,row})));
 const last=relevant[0];
 const lastLoad=Number(last?.row.sets?.[0]?.coachLoad);
 const current=lastLoad>=4&&lastLoad<=8?lastLoad:4;
 if(!weights.includes(current))return current;
 const next=weights.find(weight=>weight>current);
 const sameLoadCompleted=relevant.slice(0,2).length===2&&relevant.slice(0,2).every(({log,row})=>
  log.status==='completed'&&!log.safetyFlag&&row.sets?.length&&row.sets.every(set=>
   set.done&&!set.failed&&Number(set.weight)===current&&Number(set.failedAttempts||0)===0));
 const checkpoint=Boolean(step.loadCheckpoint);
 const ordinal=typeof step.loadCheckpoint==='number'?step.loadCheckpoint:weights.length-1;
 const allowed=weights.indexOf(current)<ordinal;
 return checkpoint&&allowed&&next!==undefined&&sameLoadCompleted?next:current;
}

function buildLogs(session,settings,sessions){
 return session.steps.map(step=>{
  const weight=resolveLoad(step,session,settings,sessions);
  return {id:step.id,variantId:step.id,familyId:step.familyId,side:step.side,coachRest:step.rest,
   coachRestSides:step.restSides,kind:step.kind,coachReason:step.rationale||session.performanceRule,
   sets:step.targets.map(target=>({
    coachTarget:target,coachUnit:step.unit==='seconds'?'ثانیه':'تکرار',coachLoad:weight,
    done:false,failed:false,attempted:false,failedAttempts:0,reps:'',repsR:'',repsL:'',weight:'',rir:''
   }))
  };
 });
}

function retryLogs(logs){
 return logs.map(log=>({...log,sets:log.sets.map(set=>set.failed&&!set.done?{...set,failed:false,attempted:false}:{...set})}));
}

function optionalSkills(session,settings){
 return (session.optionalSkills||[]).filter(skill=>
  settings.pullupBarVerified&&(skill.id!=='PULL-V1'||settings.supportedHangConfirmed)&&
  (skill.id!=='PULL-V2'||settings.activeHangConfirmed)&&(skill.id!=='PULL-V3'||settings.strictPullupConfirmed));
}

const api=Object.freeze({version,programKey,migrate,nextNumber,candidateWeights,resolveLoad,buildLogs,retryLogs,optionalSkills});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.FORMINO_FIXED=api;
})(globalThis);
