const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function element(){return{children:[],value:'2:255',classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this[k]=v;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}};}
const map=new Map(),calls=[];
const $=id=>{if(!map.has(id))map.set(id,element());return map.get(id);};
const context={console,setTimeout:()=>0,clearTimeout(){},Date,window:{MurojaahCore:require('../app/src/main/assets/core.js'),Android:{tafsirIndonesia:(...args)=>calls.push(['id',...args]),tafsir:(...args)=>calls.push(['ar',...args])}},document:{documentElement:{style:{setProperty(){}}},getElementById:$,querySelectorAll:()=>[],createElement:element,body:{classList:{toggle(){}}}},localStorage:{setItem(){}},metadata:JSON.parse(fs.readFileSync('app/src/main/assets/surahs.json','utf8'))};
vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);vm.runInContext('surahs=metadata;requestTafsir()',context);
assert.equal(calls[0][0],'id');assert.deepEqual(calls[0].slice(1,4),[2,255,255]);
let id=calls[0][4];context.window.onNativeEvent('tafsir',{id,language:'id',surah:2,verses:[{verse:8,lastVerse:9,text:'Indonesian grouped text',url:'https://saadi.islamenc.com/id/browse/sura/2#aya-8'}]});
let card=$('tafsirResults').children[0];assert.equal(card.children[0].children[0].textContent,'2:8–9');assert.equal(card.children.at(-1).className,'tafsir-indonesian');assert.equal(card.children.at(-1).lang,'id');assert.match(card.children[1].textContent,/gabungan/);
vm.runInContext("setTafsirLanguage('ar',true)",context);assert.equal(calls.at(-1)[0],'ar');
context.window.onNativeEvent('tafsir',{id,language:'id',surah:2,verses:[]});assert.equal($('tafsirBtn').disabled,true,'Stale language response must not unblock current request');
id=calls.at(-1)[4];context.window.onNativeEvent('tafsir',{id,surah:2,verses:[{verse:255,text:'Arabic text',url:'https://tafsir.app/saadi/2/255'}]});card=$('tafsirResults').children[0];assert.equal(card.children.at(-1).className,'tafsir-arabic');assert.equal(card.children.at(-1).lang,'ar');
console.log('Lulus: pilihan bahasa, rute sumber, pengelompokan ayat, arah teks dan respons bahasa kedaluwarsa.');
