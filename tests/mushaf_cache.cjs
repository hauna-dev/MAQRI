const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fields=new Map(),calls=[];
function el(id){if(!fields.has(id))fields.set(id,{value:'',style:{},children:[],setAttribute(){},replaceChildren(){this.children=[];this.value='';},append(child){this.children.push(child);if(!this.value)this.value=child.value;},classList:{toggle(){}}});return fields.get(id);}
const context={console,Date,window:{Android:{mushafCacheInfo:(n,edition)=>calls.push([n,edition])},MurojaahCore:require('../app/src/main/assets/core.js')},document:{getElementById:el,createElement:()=>({}),body:{classList:{toggle(){}}}},localStorage:{setItem(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);
vm.runInContext("mushafEdition='1441';loadPage(42)",context);assert.match(el('mushafImage').src,/app\.murojaah\.local\/mushaf\/042\.webp\?v=/);el('mushafImage').onload();assert.deepEqual(calls,[[42,'1441']]);
context.window.onNativeEvent('mushafCache',{edition:'1441',page:42,saved:true,pages:[1,42],count:2,bytes:1048576});assert.match(el('mushafOfflineStatus').textContent,/Bisa dibaca offline/);assert.equal(el('mushafSavedCount').textContent,'2 halaman tersimpan');assert.equal(el('offlinePageSelect').children.length,2);
vm.runInContext('loadPage(43)',context);context.window.onNativeEvent('mushafCache',{edition:'1441',page:42,saved:true,pages:[1,42],count:2,bytes:1048576});assert.doesNotMatch(el('mushafOfflineStatus').textContent,/Halaman 42 tersimpan/);el('mushafImage').onerror();assert.match(el('pageStatus').textContent,/belum tersedia offline/);
context.window.onNativeEvent('mushafCache',{edition:'1441',page:43,saved:false,pages:[],count:0,bytes:0});assert.equal(el('openOfflinePage').disabled,true);assert.match(el('mushafOfflineStatus').textContent,/belum tersimpan/);
console.log('Lulus: sumber cache native, status offline, daftar/ukuran simpanan, respons halaman kedaluwarsa dan kegagalan penyimpanan.');

vm.runInContext("mushafEdition='1405';loadPage(282)",context);
assert.match(el('mushafImage').src,/mushaf\/1405\/282\.png\?v=/);
el('mushafImage').onload();
assert.deepEqual(calls.at(-1),[282,'1405']);
context.window.onNativeEvent('mushafCache',{edition:'1405',page:282,saved:true,pages:[282],count:1,bytes:118624});
context.window.onNativeEvent('mushafCache',{edition:'1441',page:282,saved:false,pages:[],count:0,bytes:0});
assert.match(el('mushafOfflineStatus').textContent,/Bisa dibaca offline/);
assert.equal(el('offlinePageSelect').children[0].value,'282');
assert.equal(context.window.MurojaahCore.pageUrl(282,'1405'),'https://files.quran.app/hafs/madani/width_1260/page282.png');
console.log('Lulus: rute Madani Klasik dan daftar offline terpisah per edisi.');

vm.runInContext("mushafEdition='1440';loadPage(121)",context);
assert.match(el('mushafImage').src,/mushaf\/1440\/121\.png\?v=/);
el('mushafImage').onload();
assert.deepEqual(calls.at(-1),[121,'1440']);
