const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync('app/src/main/assets/tafsir-audio.json','utf8'));
assert.equal(data.tracks.length,114);
for(let i=0;i<114;i++){assert.equal(data.tracks[i].surah,i+1);assert.equal(data.tracks[i].url,'https://media.way2quran.com/tafsir/al-saadi/saadi-tafsir-subhan-reading/'+String(i+1).padStart(3,'0')+'.mp3');assert.ok(data.tracks[i].duration>0);}
const elements=new Map(),calls=[];
function el(id){if(!elements.has(id))elements.set(id,{classList:{add(){},remove(){}},setAttribute(k,v){this[k]=v;},lastChild:{textContent:''}});return elements.get(id);}
const context={console,setTimeout:()=>0,clearTimeout(){},window:{Android:{playTafsir:s=>calls.push(s)},MurojaahCore:require("../app/src/main/assets/core.js")},document:{getElementById:el,body:{classList:{toggle(){}}}},localStorage:{setItem(){}}};
let src=fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,'');vm.createContext(context);vm.runInContext(src,context);
vm.runInContext('playTafsir(1);playTafsir(114);playTafsir(0);playTafsir(115);playTafsir(1.5)',context);assert.deepEqual(calls,[1,114]);
context.window.Hafalan={beforeReciter:()=>false};vm.runInContext('playTafsir(2)',context);assert.deepEqual(calls,[1,114]);
context.window.onNativeEvent('playback',{kind:'tafsir',status:'playing',surah:1,verse:1,first:1,last:1,position:90000,duration:462000});assert.equal(el('playerPrev').disabled,true);assert.equal(el('playerNext').disabled,false);assert.equal(el('playerTafsir').hidden,true);assert.equal(el('positionLabel').textContent,'1:30');assert.match(el('playerTitle').textContent,/Tafsir/);
context.window.onNativeEvent('playback',{kind:'tafsir',status:'playing',surah:114,verse:1,first:1,last:1});assert.equal(el('playerNext').disabled,true);
context.window.onNativeEvent('playback',{kind:'recitation',status:'playing',surah:1,verse:2,first:1,last:7,round:1,repeat:1,qari:'minshawi'});assert.equal(el('playerTafsir').hidden,false);assert.match(el('playerTitle').textContent,/Ayat 2/);
assert.equal(vm.runInContext('seconds(29100000)',context),'8:05:00');
console.log('Lulus: 114 sumber audio, batas surat, pencegahan rekaman bersamaan, tampilan tafsir/murottal, kontrol surat dan durasi panjang.');
