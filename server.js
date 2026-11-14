/** Fitness24: local-only HTTP service + SQLite database, zero npm dependencies. Node.js >= 22.13 (recommended >= 24). */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync, backup } = require('node:sqlite');
const ROOT = __dirname;
let PORT = Number(process.env.PORT || 4318);
const HOST = '127.0.0.1';
const DB_PATH = path.join(ROOT, 'fitness-data.sqlite');
const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=DELETE; PRAGMA busy_timeout=4000;
CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS change_log (id INTEGER PRIMARY KEY AUTOINCREMENT, changed_at TEXT NOT NULL, revision INTEGER NOT NULL, operation TEXT NOT NULL);`);
const select = db.prepare("SELECT json, revision, updated_at FROM app_state WHERE key='main'");
const insert = db.prepare("INSERT INTO app_state (key,json,revision,updated_at) VALUES ('main', ?, ?, ?)");
const update = db.prepare("UPDATE app_state SET json=?, revision=?, updated_at=? WHERE key='main' AND revision=?");
const audit = db.prepare('INSERT INTO change_log (changed_at,revision,operation) VALUES (?,?,?)');
const BACKUPS=path.join(ROOT,'backups');
let autoBackupRunning=false;
async function autoBackup(){
 if(autoBackupRunning)return;
 fs.mkdirSync(BACKUPS,{recursive:true});
 const today=new Date().toISOString().slice(0,10);
 const dest=path.join(BACKUPS,`auto-${today}.sqlite`);
 if(fs.existsSync(dest))return;
 autoBackupRunning=true;
 try{
  await backup(db,dest);
  const files=fs.readdirSync(BACKUPS).filter(x=>/^auto-\d{4}-\d{2}-\d{2}\.sqlite$/.test(x)).sort();
  for(const obsolete of files.slice(0,Math.max(0,files.length-14)))fs.unlinkSync(path.join(BACKUPS,obsolete));
 }catch(e){console.error('Automatic backup failed:',e);}
 finally{autoBackupRunning=false;}
}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.ico':'image/x-icon'};
const allowed = new Set(['index.html','style.css','app.js','workouts-v2.js','workouts-v3.js','workouts-v4.js','workouts-v43.js','workouts-v411.js','research-data.js','workouts.js','coach.js','adaptive-final.js','analytics45.js','session-clock.js','manifest.webmanifest','favicon.svg','sw.js','fonts/Vazirmatn.woff2','program-v8.js','fixed-workout-v8.js','tutorials-v8.js']);
function send(res,code,obj) {const body=JSON.stringify(obj);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':Buffer.byteLength(body),'X-Content-Type-Options':'nosniff'});res.end(body);}
function readBody(req){return new Promise((resolve,reject)=>{let chunks=[],size=0;req.on('data',c=>{size+=c.length;if(size>5*1024*1024){reject(new Error('حجم داده بیش از حد مجاز است'));req.destroy();return;}chunks.push(c);});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch(e){reject(new Error('JSON نامعتبر'))}});req.on('error',reject);});}
const measurementKeys=new Set(['week','date','neck','shoulder','chest','armR','armL','forearmR','forearmL','abdomen','waist','hip','thighR','thighL','calfR','calfL']);
function validState(s){return s&&typeof s==='object'&&!Array.isArray(s)&&[2,3,4,5,6,7,8].includes(s.version)&&/^\d{4}-\d{2}-\d{2}$/.test(s.startDate||'')&&s.settings&&Array.isArray(s.shifts)&&Array.isArray(s.unavailable)&&Array.isArray(s.rest)&&Array.isArray(s.measurements)&&Array.isArray(s.sessions)&&s.measurements.length<=500&&s.sessions.length<=1000&&s.shifts.length<=3000&&s.measurements.every(m=>m&&typeof m==='object'&&Object.keys(m).every(k=>measurementKeys.has(k)));}

const server=http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    // Local-only host and same-origin write guard (prevents typical browser cross-site writes).
    const hostHeader=String(req.headers.host||'');
    if(![`${HOST}:${PORT}`,`localhost:${PORT}`].includes(hostHeader))return send(res,403,{error:'مبدأ درخواست مجاز نیست.'});
    if(req.method!=='GET'&&req.method!=='HEAD'&&req.headers.origin&&!['http://'+HOST+':'+PORT,'http://localhost:'+PORT].includes(req.headers.origin))return send(res,403,{error:'درخواست از مبدأ دیگری مجاز نیست.'});
    if(url.pathname==='/api/health'){return send(res,200,{ok:true,storage:'SQLite',file:'fitness-data.sqlite'});}
    if(url.pathname==='/api/state' && req.method==='GET'){
      const row=select.get();return send(res,200,{state:row?JSON.parse(row.json):null,revision:row?row.revision:0,updatedAt:row?.updated_at||null});
    }
    if(url.pathname==='/api/state' && req.method==='PUT'){
      const {state,expectedRevision}=await readBody(req);
      if(!validState(state)) return send(res,400,{error:'ساختار داده نامعتبر است.'});
      const raw=JSON.stringify(state);
      if(Buffer.byteLength(raw)>4*1024*1024)return send(res,413,{error:'حجم داده بیشتر از حد مجاز است.'});
      const row=select.get();const revision=row?.revision||0;
      if(expectedRevision!==revision) return send(res,409,{error:'داده‌ها در پنجره دیگری تغییر کرده‌اند؛ صفحه را تازه‌سازی کنید.',revision});
      const previous=row?JSON.parse(row.json):null;
      if(previous?.version===8&&state.version<8)return send(res,409,{error:'این پنجره نسخهٔ قدیمی فرمینو را اجرا می‌کند. آن را تازه‌سازی کن.'});
      const next=revision+1, now=new Date().toISOString();
      if(row){const result=update.run(raw,next,now,revision);if(result.changes!==1)return send(res,409,{error:'تداخل ثبت داده'});}
      else insert.run(raw,next,now);
      audit.run(now,next,'save');void autoBackup();return send(res,200,{ok:true,revision:next,updatedAt:now});
    }
    if(url.pathname==='/api/backup' && req.method==='POST'){
      fs.mkdirSync(path.join(ROOT,'backups'),{recursive:true});
      const filename='fitness-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite';
      const dest=path.join(ROOT,'backups',filename);
      await backup(db,dest);
      return send(res,200,{ok:true,filename,path:'backups/'+filename});
    }
    if(url.pathname==='/api/database/download' && req.method==='GET'){
      const dest=path.join(ROOT,'backups','download-temp-'+Date.now()+'.sqlite');
      fs.mkdirSync(path.dirname(dest),{recursive:true});await backup(db,dest);
      const stream=fs.createReadStream(dest);
      res.writeHead(200,{'Content-Type':'application/vnd.sqlite3','Content-Disposition':'attachment; filename="fitness-data.sqlite"','Cache-Control':'no-store'});
      stream.pipe(res);res.on('close',()=>fs.unlink(dest,()=>{}));return;
    }
    if(req.method==='GET'){
      const file=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
      if(!allowed.has(file)) return send(res,404,{error:'یافت نشد'});
      const filepath=path.join(ROOT,file);if(!fs.existsSync(filepath))return send(res,404,{error:'یافت نشد'});
      res.writeHead(200,{'Content-Type':mime[path.extname(filepath)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      fs.createReadStream(filepath).pipe(res);return;
    }
    send(res,405,{error:'درخواست پشتیبانی نمی‌شود'});
  }catch(err){console.error(err);if(!res.headersSent)send(res,500,{error:err.message||'خطای سرور'});else res.end();}
});
function keepWindowsAwake(){
 if(process.platform!=='win32' || process.env.FORMINO_KEEP_AWAKE==='0')return;
 try{
  const {spawn}=require('node:child_process');
  const helper=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',path.join(ROOT,'keep-awake.ps1'),'-ServerPID',String(process.pid)],{windowsHide:true,detached:true,stdio:'ignore'});
  helper.on('error',e=>console.error('Wake helper:',e.message));helper.unref();
 }catch(e){console.error('Wake helper unavailable:',e.message);}
}
server.on('error',err=>{
 if(err.code==='EADDRINUSE'&&PORT<4327){console.error(`Port ${PORT} busy; trying ${PORT+1} ...`);PORT++;setTimeout(()=>server.listen(PORT,HOST),130);return;}
 console.error('Cannot start Formino server:',err.message);process.exit(1);
});
server.listen(PORT,HOST,()=>{
 fs.writeFileSync(path.join(ROOT,'formino-port.txt'),String(PORT));
 keepWindowsAwake();
 console.log(`\n  FORMINO • Local fitness app\n  http://${HOST}:${PORT}\n  Database: ${DB_PATH}\n  Press Ctrl+C to stop.\n`);
});
