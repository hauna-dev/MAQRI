const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fields=new Map(),saved=new Map(),calls=[],styles={};
function el(id){if(!fields.has(id))fields.set(id,{value:'1:1-7',disabled:false,style:{setProperty(key,value){this[key]=value;}},setAttribute(k,v){this[k]=v;},classList:{toggle(){}},replaceChildren(){},scrollIntoView(){}});return fields.get(id);}
const context={console,Date,Number,Math,setTimeout:()=>0,clearTimeout(){},window:{MurojaahCore:require('../app/src/main/assets/core.js'),Android:{mushafFullscreen:v=>calls.push(['full',v]),tafsirIndonesia:(...args)=>calls.push(['tafsir',...args]),tafsir:(...args)=>calls.push(['arab',...args])}},document:{getElementById:el,querySelectorAll:()=>[],documentElement:{style:{setProperty(k,v){styles[k]=v;}}},body:{classList:{toggle(){}}}},localStorage:{setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)},metadata:JSON.parse(fs.readFileSync('app/src/main/assets/surahs.json','utf8'))};
vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);vm.runInContext('surahs=metadata',context);
function navigate(value,delta){el('tafsirBtn').disabled=false;el('tafsirRange').value=value;vm.runInContext('tafsirActiveRange=null;moveTafsirVerse('+delta+')',context);}
navigate('1:7',1);assert.deepEqual(calls.at(-1).slice(0,4),['tafsir',2,1,1]);navigate('2:1',-1);assert.deepEqual(calls.at(-1).slice(0,4),['tafsir',1,7,7]);let count=calls.length;navigate('114:6',1);assert.equal(calls.length,count);navigate('1:1',-1);assert.equal(calls.length,count);
el('tafsirBtn').disabled=false;el('tafsirRange').value='2:8';vm.runInContext("tafsirActiveRange={s:2,a:8,b:9};tafsirInputValue='2:8';moveTafsirVerse(1)",context);assert.equal(el('tafsirRange').value,'2:10');
vm.runInContext("setTafsirLanguage('id');changeTafsirFont(1)",context);assert.equal(styles['--tafsir-id-size'],'16px');vm.runInContext("setTafsirLanguage('ar');changeTafsirFont(1)",context);assert.equal(styles['--tafsir-ar-size'],'26px');vm.runInContext("setTafsirLanguage('id')",context);assert.equal(el('tafsirFontSize').textContent,'16 px');vm.runInContext('changeTafsirFont(100)',context);assert.equal(el('tafsirFontSize').textContent,'27 px');vm.runInContext('changeTafsirFont(0,true)',context);assert.equal(el('tafsirFontSize').textContent,'15 px');
vm.runInContext('zoom=150;setMushafFullscreen(true)',context);assert.deepEqual(calls.at(-1),['full',true]);assert.equal(el('mushafViewport').style['--mushaf-zoom'],'100%');assert.equal(context.window.handleBack(),true);assert.deepEqual(calls.at(-1),['full',false]);
console.log('Lulus: navigasi antar surat, batas Quran, kelompok ayat, ukuran font terpisah/persisten, dan keluar layar penuh melalui Back.');

vm.runInContext("setTafsirMode('listen')",context);assert.equal(el('tafsirReadPane').hidden,true);assert.equal(el('tafsirListenPane').hidden,false);vm.runInContext("setTafsirMode('read')",context);assert.equal(el('tafsirReadPane').hidden,false);assert.equal(el('tafsirListenPane').hidden,true);
const panel=el('recordingPanel');panel.open=false;panel.showModal=function(){this.open=true;};panel.close=function(){this.open=false;};vm.runInContext('setRecordingPanel(true)',context);assert.equal(panel.open,true);assert.equal(context.window.handleBack(),true);assert.equal(panel.open,false);assert.equal(el('recordingPanelToggle')['aria-expanded'],'false');
console.log('Lulus: pemisahan Baca/Dengar dan penutupan panel rekaman melalui Back.');

function element(){
 return {
  children:[],
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=children;},
  setAttribute(key,value){this[key]=value;}
 };
}
context.document.createElement=element;
el('tilawahList').replaceChildren=function(...children){this.children=children;};
context.pageMetadata=require('../app/src/main/assets/pages.json');
vm.runInContext("pages=pageMetadata;setTilawahMode('surat')",context);
const tilawahList=el('tilawahList');
const rowPage=index=>tilawahList.children[index].children[0].children.at(-1).textContent;
assert.equal(tilawahList.children.length,114);
assert.equal(rowPage(16),'Hal. 282','Al-Isra opens on the correct Madani page');
assert.equal(rowPage(113),'Hal. 604');
vm.runInContext("setTilawahMode('juz')",context);
assert.equal(tilawahList.children.length,30);
assert.equal(rowPage(6),'Hal. 121','Juz 7 starts partway through page 121');
assert.equal(rowPage(29),'Hal. 582');
console.log('Lulus: indeks 114 surat dan 30 juz, termasuk awal Al-Isra dan Juz 30.');

el('offlinePageSelect').append=()=>{};
context.pageMetadata1440=require('../app/src/main/assets/pages-1440.json');
vm.runInContext("standardPages=pageMetadata;madani1440Pages=pageMetadata1440",context);
saved.set('mushafEdition',JSON.stringify('1405'));
saved.set('tilawahPage-1405',JSON.stringify(121));
vm.runInContext('restoreMushafEdition()',context);
assert.equal(el('tilawahEdition').value,'1440');
assert.equal(JSON.parse(saved.get('tilawahPage-1440')),120,'Keep Al-Maidah 77 when changing layouts');
assert.equal(JSON.parse(saved.get('tilawahPage-1405')),121);
vm.runInContext("setMushafEdition('1405');restoreMushafEdition()",context);
assert.equal(el('tilawahEdition').value,'1405','The migration runs once and respects later choices');
console.log('Lulus: 1440 H sebagai edisi utama, migrasi posisi ayat, dan pilihan edisi berikutnya.');
