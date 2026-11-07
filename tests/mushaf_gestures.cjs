const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map(),handlers={},turns=[];let now=10000;
function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'',style:{setProperty(key,value){this[key]=value;}},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(k,v){handlers[k]=v;},getBoundingClientRect:()=>({left:0,width:400})});return elements.get(id);}
const context={console,Date:{now:()=>now},setTimeout:()=>0,clearTimeout(){},turns,window:{MurojaahCore:require('../app/src/main/assets/core.js')},document:{getElementById:el,body:{classList:{toggle(){},add(){},remove(){}}}},localStorage:{setItem(){}}};vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8').replace(/init\(\);\s*$/,''),context);vm.runInContext("screen='mushaf';page=42;loadPage=n=>{page=n;turns.push(n);};setupMushafGestures()",context);
function start(x,y=100){now+=1000;handlers.touchstart({touches:[{clientX:x,clientY:y}]});}
function end(x,y=100){now+=100;handlers.touchend({touches:[],changedTouches:[{clientX:x,clientY:y}]});}
start(100);end(300);assert.deepEqual(turns,[43]);start(300);end(100);assert.equal(turns.at(-1),42);
start(20);end(20);assert.equal(turns.at(-1),43);handlers.click({clientX:20,detail:1});assert.equal(turns.length,3,'Ignore synthetic click after touch');start(380);end(380);assert.equal(turns.at(-1),42);
let count=turns.length;start(200);end(200);start(100);end(105,350);assert.equal(turns.length,count,'Center taps and vertical scroll do not turn');
context.copyHits=[];
vm.runInContext('openCopyVerse=(x,y)=>copyHits.push([x,y])',context);
start(20);now+=600;end(20);
assert.equal(turns.length,count,'Long press does not turn');
assert.equal(JSON.stringify(context.copyHits),'[[20,100]]');
handlers.contextmenu({clientX:20,clientY:100,preventDefault(){}});
assert.equal(context.copyHits.length,1,'A second context event does not reopen the same verse');
start(100);handlers.touchmove({touches:[{clientX:300,clientY:100}],cancelable:true,preventDefault(){}});end(100);assert.equal(turns.length,count,'Dragging out and back is not a tap');
start(100);handlers.touchmove({touches:[{clientX:100,clientY:100},{clientX:200,clientY:100}]});end(300);assert.equal(turns.length,count,'Multi-touch does not turn');
vm.runInContext('zoom=125',context);start(100);end(300);start(20);end(20);assert.equal(turns.length,count,'Zoomed image retains pan/tap');vm.runInContext('zoom=100;page=604',context);start(100);end(300);assert.equal(turns.length,count,'Last page boundary');vm.runInContext('page=1',context);start(300);end(100);assert.equal(turns.length,count,'First page boundary');
vm.runInContext('page=42',context);now+=1000;handlers.click({clientX:20,detail:1});assert.equal(turns.at(-1),43);el('mushafImage').hidden=true;start(100);end(300);assert.equal(turns.at(-1),43,'No turn while image is loading');
console.log('Lulus: swipe kanan/kiri, tap tepi, batas halaman, gulir vertikal, long press, multi-touch, zoom/pan, dan pencegahan klik ganda.');

el('mushafImage').hidden=false;
vm.runInContext("tilawahReader=true;setMushafFullscreen(true)",context);
const controlsVisible=()=>vm.runInContext('tilawahControlsVisible',context);
assert.equal(controlsVisible(),false,'Tilawah starts with controls hidden');
start(200);end(200);
assert.equal(controlsVisible(),true);
handlers.click({clientX:200,detail:1});
assert.equal(controlsVisible(),true,'A synthetic click must not toggle controls twice');
start(100);end(300);
assert.equal(turns.at(-1),44);
assert.equal(controlsVisible(),true,'A swipe does not toggle controls');
start(200);end(200);
assert.equal(controlsVisible(),false);
console.log('Lulus: kontrol Tilawah tampil dengan ketuk tengah tanpa mengganggu swipe.');
