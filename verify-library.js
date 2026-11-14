/* Verify coverage and exact search results without the app or database. */
'use strict';
const assert=require('node:assert/strict');
global.window=global;
for(const name of ['workouts-v2','workouts-v3','workouts-v4','workouts-v43','workouts-v411','research-data','workouts'])require('./'+name);
const plan=FITNESS_PLAN, guides=FORMINO_EXERCISE_GUIDES;
const activityNames=new Set();
for(let n=1;n<=plan.research.sessions.length;n++){
 for(const session of [plan.forNumber(n),plan.busyForNumber(n)]){
  for(const exercise of session.steps)assert.ok(guides.get(exercise.id),exercise.id);
  for(const [category,items] of [['warmup',session.warmupItems],['cardio',session.cardioDetails.steps],['cooldown',session.cooldownItems]]){
   for(const item of items){
    activityNames.add(item.name_en);
    const guide=guides.forStage(item.name_en);
    assert.ok(guide?.categories.includes(category),item.name_en);
    assert.ok(guides.search(item.name_fa,category).includes(guide),item.name_fa);
   }
  }
 }
}
for(const version of ['2','3','4','43','411']){
 for(const [id,exercise] of Object.entries(window['FITNESS_PLAN_V'+version].exercises)){
  assert.ok(guides.get(id,Number(version)),id);
  assert.ok(guides.search(exercise.en,'legacy').length,id);
  assert.ok(guides.search(exercise.fa,'legacy').length,id);
 }
}
for(const id of Object.keys(plan.sourceVariants))assert.ok(guides.get(id),id);
assert.notEqual(guides.get('inclinePushup',2).en,guides.get('inclinePushup',6).en);
assert.notEqual(guides.get('oneArmRow',2).equip,guides.get('oneArmRow',6).equip);

for(const guide of guides.entries){
 assert.ok(guide.fa&&guide.en&&guide.query&&guide.equip,guide.id);
 assert.ok(guide.how.length>=2,guide.id);
 assert.ok(guides.search(guide.fa).includes(guide),guide.fa);
 assert.ok(guides.search(guide.en).includes(guide),guide.en);
 assert.deepEqual(guides.search(guide.id),[guide]);
 if(guide.reference)assert.equal(new URL(guide.reference[1]).protocol,'https:');
 for(const id of [guide.easierId,guide.harderId,...(guide.related||[])].filter(Boolean)){
  assert.notEqual(id,guide.id);assert.ok(guides.get(id),id);
 }
}
assert.equal(guides.get('FP-V0').en,'Single-Arm Dumbbell Floor Press');
assert.match(guides.get('ROW-V2').query,/thigh.*pause.*no bench/i);
assert.match(guides.get('RDL-V3').query,/free hand on wall/);
assert.match(guides.get('PULL-V1').how.join(' '),/آرنج‌های صاف/);
assert.doesNotMatch(guides.get('RC-V0').how.join(' '),/جدا شود/);
assert.equal(guides.search('heel tap dead bug')[0].id,'DB-V0');
assert.equal(guides.search('بِی اِستنس')[0].id,'RDL-V2');
assert.equal(guides.search('SP–V۰')[0].id,'SP-V0');
assert.equal(guides.search('پروانه بدون پرش')[0].id,'stage:step-jack');
assert.equal(guides.search('زير بغل دمبل تک دست')[0].id,'ROW-V0');
assert.equal(guides.search('impossible guide name 27455').length,0);
console.log(`PASS: ${Object.keys(plan.sourceVariants).length} current variants, ${activityNames.size} stage activities, all legacy plan IDs and ${guides.entries.length} searchable guides.`);
