'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const beginning=src.indexOf('function unlockRestAudio(){');
const end=src.indexOf('function paintSessionClock(){',beginning);
assert(beginning>0&&end>beginning,'Audio helpers not found');
const starts=[],stops=[];
class TestAudioContext{
 constructor(){this.currentTime=100;this.state='running';this.destination={};}
 createOscillator(){return {type:null,frequency:{value:0,setValueAtTime(){}},connect(){},start(t){starts.push(t)},stop(t){stops.push(t)}};}
 createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
 createDynamicsCompressor(){return {threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0},connect(){}};}
 resume(){return Promise.resolve()}
}
const ctx={window:{AudioContext:TestAudioContext},restSound:true,beepContext:null};
vm.createContext(ctx);
vm.runInContext(src.slice(beginning,end),ctx);
assert.equal(vm.runInContext('beepRest(true)',ctx),true);
assert.equal(starts.length,8);
assert.equal(stops.length,8);
const duration=Math.max(...stops)-Math.min(...starts);
assert(duration>1.8 && duration<2.1,`Alarm duration ${duration}`);
assert.equal(new Set(starts).size,4,'Should be four timed pulses');
console.log(`PASS: audible alarm scheduled as 4 dual-tone pulses over ${duration.toFixed(2)} seconds`);
