const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const audios=[],reports=[],fields=new Map();
class FakeAudio{constructor(){this.paused=true;this.currentTime=0;this.duration=4;audios.push(this);}play(){this.paused=false;this.onplaying?.();return Promise.resolve();}pause(){this.paused=true;this.onpause?.();}}
function el(id){if(!fields.has(id))fields.set(id,{value:'1',classList:{add(){},remove(){}},setAttribute(){},lastChild:{},style:{}});return fields.get(id);}
const context={console,Audio:FakeAudio,Date,Number,Math,setTimeout:()=>0,clearTimeout(){},window:{MurojaahCore:require('../app/src/main/assets/core.js')},document:{getElementById:el,body:{classList:{toggle(){}}}},localStorage:{setItem(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);context.window.onNativeEvent=(type,data)=>reports.push(data);
vm.runInContext("playPreview({s:1,a:1,b:2,q:'minshawi',repeat:2,ayahRepeat:3})",context);for(let i=0;i<12;i++)audios.at(-1).onended();
const sequence=reports.filter(x=>x.status==='loading').map(x=>[x.verse,x.verseRound,x.round]);assert.deepEqual(sequence,[[1,1,1],[1,2,1],[1,3,1],[2,1,1],[2,2,1],[2,3,1],[1,1,2],[1,2,2],[1,3,2],[2,1,2],[2,2,2],[2,3,2]]);assert.equal(reports.at(-1).status,'completed');
vm.runInContext("control('toggle')",context);assert.equal(reports.at(-1).verseRound,1);assert.equal(reports.at(-1).verse,1);audios.at(-1).onended();vm.runInContext("control('next')",context);assert.equal(reports.at(-1).verse,2);assert.equal(reports.at(-1).verseRound,1);
reports.length=0;vm.runInContext("playPreview({s:1,a:1,b:2,q:'minshawi',repeat:1})",context);audios.at(-1).onended();assert.equal(reports.at(-1).verse,2);audios.at(-1).onended();assert.equal(reports.at(-1).status,'completed');
console.log('Lulus: urutan ulang per ayat dan rentang, replay setelah selesai, skip manual reset hitungan, dan kompatibilitas pengulangan 1 kali.');

vm.runInContext("renderPlayback({status:'playing',surah:1,verse:1,first:1,last:2,ayahRepeat:3,verseRound:2,round:1,repeat:2,qari:'minshawi'})",context);assert.ok(el('playerMeta').textContent.startsWith('Ulang ayat 2/3'));
