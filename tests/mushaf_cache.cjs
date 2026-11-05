const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fields=new Map(),calls=[];
function el(id){if(!fields.has(id))fields.set(id,{value:'',style:{},children:[],setAttribute(){},replaceChildren(){this.children=[];this.value='';},append(child){this.children.push(child);if(!this.value)this.value=child.value;},classList:{toggle(){}}});return fields.get(id);}
const context={console,Date,window:{Android:{mushafCacheInfo:n=>calls.push(n)},MurojaahCore:require('../app/src/main/assets/core.js')},document:{getElementById:el,createElement:()=>({}),body:{classList:{toggle(){}}}},localStorage:{setItem(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);
vm.runInContext('loadPage(42)',context);assert.match(el('mushafImage').src,/app\.murojaah\.local\/mushaf\/042\.webp\?v=/);el('mushafImage').onload();assert.deepEqual(calls,[42]);
context.window.onNativeEvent('mushafCache',{page:42,saved:true,pages:[1,42],count:2,bytes:1048576});assert.match(el('mushafOfflineStatus').textContent,/Bisa dibaca offline/);assert.equal(el('mushafSavedCount').textContent,'2 halaman tersimpan');assert.equal(el('offlinePageSelect').children.length,2);
vm.runInContext('loadPage(43)',context);context.window.onNativeEvent('mushafCache',{page:42,saved:true,pages:[1,42],count:2,bytes:1048576});assert.doesNotMatch(el('mushafOfflineStatus').textContent,/Halaman 42 tersimpan/);el('mushafImage').onerror();assert.match(el('pageStatus').textContent,/belum tersedia offline/);
context.window.onNativeEvent('mushafCache',{page:43,saved:false,pages:[],count:0,bytes:0});assert.equal(el('openOfflinePage').disabled,true);assert.match(el('mushafOfflineStatus').textContent,/belum tersimpan/);
console.log('Lulus: sumber cache native, status offline, daftar/ukuran simpanan, respons halaman kedaluwarsa dan kegagalan penyimpanan.');
