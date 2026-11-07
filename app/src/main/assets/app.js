'use strict';
const $=id=>document.getElementById(id),core=window.MurojaahCore,native=window.Android;
let mushafFull=false,tafsirActiveRange=null,tafsirInputValue='',tafsirLanguage='id',tafsirTracks=[],surahs=[],pages=[],screen='audio',page=1,zoom=100,lastState={},tafsirRequest='',toastTimer,lastRange=null,previewPlayer=null;
const readSaved=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href','#i-'+name);svg.append(use);return svg;}
function name(s){return surahs[s-1]?.name_simple||'Surat '+s;}
function switchScreen(value){
 if(value!=='mushaf'){
  if(mushafFull)setMushafFullscreen(false);
  tilawahReader=false;
  mushafTarget=null;
  setTilawahControls(true);
  document.body.classList.remove('tilawah-reader');
 }
 screen=value;
 document.body.dataset.screen=value;
 document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===value+'Screen'));
 const tab=value==='mushaf'?'tilawah':value;
 document.querySelectorAll('.bottom-nav button').forEach(el=>el.classList.toggle('active',el.dataset.screen===tab));
 window.scrollTo({top:0,behavior:'instant'});
 if(value==='tilawah')renderTilawahResume();
 if(value==='library')loadLibrary();
}
function renderTilawahResume(){
 const ref=pages[(tilawahPage||1)-1];
 $('tilawahResumeTitle').textContent=tilawahPage?'Lanjutkan tilawah':'Mulai membaca';
 $('tilawahResumePage').textContent=(ref?name(ref.surah)+' · ':'')+'Halaman '+(tilawahPage||1);
}
function mushafPageKey(key,edition=mushafEdition){
 return edition==='1441'?key:key+'-'+edition;
}
function savedMushafPage(key,fallback=null,edition=mushafEdition){
 const n=Number(readSaved(mushafPageKey(key,edition),fallback));
 return Number.isInteger(n)&&n>=1&&n<=604?n:fallback;
}
function setMushafEdition(edition){
 if(!Object.hasOwn(core.mushafEditions,edition))edition=core.defaultMushafEdition;
 mushafEdition=edition;
 pages=edition==='1405'?standardPages:madani1440Pages;
 save(mushafEditionPreference,edition);
 page=savedMushafPage('mushafPage',1);
 tilawahPage=savedMushafPage('tilawahPage',savedMushafPage('mushafPage'));
 $('tilawahEdition').value=edition;
 $('offlineEdition').value=edition;
 const info=core.mushafEditions[edition];
 $('mushafEditionNote').textContent='Riwayat Hafs · 604 halaman · '+info.label;
 $('mushafSourceNote').textContent='Sumber gambar Mushaf: '+info.source+'.';
 renderTilawahResume();
 setTilawahMode(readSaved('tilawahMode','surat')==='juz'?'juz':'surat');
 renderMushafCache({edition,page:0,saved:false,pages:[],count:0,bytes:0});
 if(screen==='library'&&native?.mushafCacheInfo)native.mushafCacheInfo(0,edition);
}
function restoreMushafEdition(){
 const selected=readSaved(mushafEditionPreference,null);
 if(Object.hasOwn(core.mushafEditions,selected)){
  setMushafEdition(selected);
  return;
 }
 // On upgrade, use the old page's first ayah to find the same passage in 1440 H.
 const previous=readSaved('mushafEdition','1441')==='1405'?'1405':'1441';
 for(const key of ['mushafPage','tilawahPage']){
  const oldPage=savedMushafPage(key,null,previous);
  const ref=(previous==='1405'?standardPages:madani1440Pages)[oldPage-1];
  if(ref){
   const target=core.pageForVerse(ref.surah,ref.ayah,surahs,madani1440Pages);
   save(mushafPageKey(key,'1440'),target);
  }
 }
 setMushafEdition(core.defaultMushafEdition);
}
function openTilawahPage(n,target=null,returnScreen='tilawah'){
 tilawahReader=true;
 mushafReturnScreen=returnScreen;
 document.body.classList.add('tilawah-reader');
 switchScreen('mushaf');
 setMushafFullscreen(true);
 loadPage(n,target);
}
function setTilawahMode(mode){
 const byJuz=mode==='juz';
 const list=$('tilawahList');
 list.setAttribute('aria-label',byJuz?'Daftar 30 juz':'Daftar 114 surat');
 document.querySelectorAll('[data-tilawah-mode]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.tilawahMode===mode)));
 const rows=byJuz
  ?juzPages.map((start,index)=>({number:index+1,title:'Juz '+(index+1),detail:'Mulai juz',start}))
  :surahs.map(s=>({number:s.id,title:s.name_simple,detail:s.verses_count+' ayat',
    arabic:s.name_arabic,start:core.pageForVerse(s.id,1,surahs,pages)}));
 list.replaceChildren(...rows.map(({number,title,detail,arabic,start})=>{
  const row=document.createElement('li');
  const button=document.createElement('button');
  button.type='button';
  const badge=document.createElement('span');
  badge.className='tilawah-number';
  badge.textContent=number;
  badge.setAttribute('aria-hidden','true');
  const description=document.createElement('span');
  const label=document.createElement('strong');
  label.textContent=title;
  const subtitle=document.createElement('small');
  subtitle.textContent=detail;
  description.append(label,subtitle);
  button.append(badge,description);
  if(arabic){
   const script=document.createElement('span');
   script.className='tilawah-arabic';
   script.lang='ar';
   script.dir='rtl';
   script.textContent=arabic;
   button.append(script);
  }
  const pageLabel=document.createElement('small');
  pageLabel.className='tilawah-page';
  pageLabel.textContent='Hal. '+start;
  button.append(pageLabel);
  button.onclick=()=>openTilawahPage(start);
  row.append(button);
  return row;
 }));
 save('tilawahMode',mode);
 if(screen==='tilawah')window.scrollTo({top:0,behavior:'instant'});
}
function rangeFromForm(){return core.validate($('surah').value,$('from').value,$('to').value,surahs);}
function updateSurah(reset=true){const s=Number($('surah').value),count=surahs[s-1].verses_count;$('from').max=count;$('to').max=count;if(reset){$('from').value=1;$('to').value=Math.min(7,count);} }
function saveMurojaahSelection(){const s=Number($('surah').value);if(!Number.isInteger(s)||s<1||s>surahs.length)return;const previous=readSaved('murojaahSelection',null);let range;try{range=rangeFromForm();}catch{range=previous&&previous.s===s?previous:{s,a:1,b:Math.min(7,surahs[s-1].verses_count)};}save('murojaahSelection',{s,a:range.a,b:range.b,q:$('qari').value,repeat:Number($('repeat').value)||1,ayahRepeat:Number($('ayahRepeat').value)||1});}
function applyMurojaahSelection(range){core.validate(range.s,range.a,range.b,surahs);$('surah').value=String(range.s);updateSurah(false);$('from').value=range.a;$('to').value=range.b;if(range.q&&Array.from($('qari').options||[]).some(option=>option.value===range.q))$('qari').value=range.q;for(const key of ['repeat','ayahRepeat'])if(range[key]&&Array.from($(key).options||[]).some(option=>option.value===String(range[key])))$(key).value=String(range[key]);}
function restoreMurojaahSelection(){const saved=readSaved('murojaahSelection',null)||lastRange;if(saved){try{applyMurojaahSelection(saved);saveMurojaahSelection();}catch{updateSurah(false);}}}
let reviewVerses=[];
let tilawahReader=false;
let tilawahControlsVisible=true;
let tilawahPage=null;
let mushafReturnScreen='tilawah';
let mushafTarget=null;
let mushafTargetBoxes=[];
const ayahBounds=new Map();
let mushafEdition=core.defaultMushafEdition;
let standardPages=[],madani1440Pages=[];
const mushafEditionPreference='mushafEdition-v2';

// Madani juz boundaries (Quran Android's MadaniDataSource). Some start mid-page.
const juzPages=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,
 302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
function remember(range){
 const verse=Number(range.verse);
 range.verse=Number.isInteger(verse)&&verse>=range.a&&verse<=range.b?verse:Number(range.a);
 lastRange=range;
 if(!native)save('lastRange',range);
 $('continueCard').hidden=false;
 $('continueTitle').textContent=name(range.s)+' · Ayat '+range.verse;
 $('continueMeta').textContent='Rentang '+range.a+'–'+range.b+' · '+(core.reciters[range.q]?.name||'Audio');
}
function restoreRecitation(progress){
 for(const range of [progress,readSaved('lastRange',null)]){
  if(!range)continue;
  try{
   core.validate(range.s,range.a,range.b,surahs);
   remember(range);
   return;
  }catch{}
 }
}
function trackRecitation(state){
 if(state.kind!=='recitation'||!surahs.length||state.status==='idle')return;
 const range={s:state.surah,a:state.first,b:state.last,verse:state.verse,q:state.qari,repeat:state.repeat,ayahRepeat:state.ayahRepeat};
 if(lastRange&&Object.keys(range).every(key=>range[key]===lastRange[key]))return;
 remember(range);
}
function play(range){
 if(window.Hafalan&&!window.Hafalan.beforeReciter())return;
 const {s,a,b}=core.validate(range.s,range.a,range.b,surahs);
 range={...range,s,a,b,q:range.q||$('qari').value,repeat:Number(range.repeat||$('repeat').value),
  ayahRepeat:Math.max(1,Math.min(99,Math.floor(Number(range.ayahRepeat||$('ayahRepeat').value)||1)))};
 save('ayahRepeat',range.ayahRepeat);
 applyMurojaahSelection(range);
 saveMurojaahSelection();
 remember(range);
 if(native)native.playFromVerse(s,a,b,range.verse,range.q,range.repeat,range.ayahRepeat);
 else playPreview(range);
}
function verseIsMarked(s,a){
 return reviewVerses.some(verse=>verse.s===s&&verse.a===a);
}
function updateReviewMark(){
 const button=$('markVerse');
 button.hidden=lastState.kind==='tafsir'||!lastState.verse;
 const marked=verseIsMarked(lastState.surah,lastState.verse);
 button.setAttribute('aria-pressed',String(marked));
 button.lastChild.textContent=marked?'Ayat ditandai':'Ulangi Nanti';
}
function changeReviewMark(s,a){
 if(verseIsMarked(s,a)){
  reviewVerses=reviewVerses.filter(verse=>verse.s!==s||verse.a!==a);
  toast('Ayat dihapus dari Ulangi Nanti.');
 }else{
  reviewVerses.push(core.validate(s,a,a,surahs));
  toast('Ayat disimpan ke Ulangi Nanti.');
 }
 save('reviewVerses',reviewVerses);
 renderReviewList();
 updateReviewMark();
}
function restoreReviewList(){
 const saved=readSaved('reviewVerses',[]);
 if(Array.isArray(saved)){
  for(const item of saved){
   try{
    const {s,a}=core.validate(item.s,item.a,item.a,surahs);
    if(!verseIsMarked(s,a))reviewVerses.push({s,a});
   }catch{}
  }
 }
 renderReviewList();
}
function playReview(verses){
 if(!verses.length||(window.Hafalan&&!window.Hafalan.beforeReciter()))return;
 const queue=verses.map(({s,a})=>({s,a}));
 const q=$('qari').value,ayahRepeat=Number($('ayahRepeat').value)||1;
 if(native)native.playReview(JSON.stringify(queue),q,ayahRepeat);
 else playPreview({kind:'review',queue,q,repeat:1,ayahRepeat});
}
function renderReviewList(){
 $('reviewCount').textContent=reviewVerses.length+' ayat';
 $('reviewEmpty').hidden=reviewVerses.length>0;
 $('playReviewAll').hidden=!reviewVerses.length;
 const list=$('reviewList');
 list.replaceChildren();
 for(const verse of reviewVerses){
  const row=document.createElement('li');
  const title=document.createElement('strong');
  const label=name(verse.s)+' · Ayat '+verse.a;
  title.textContent=label;
  const playButton=document.createElement('button');
  playButton.type='button';
  playButton.className='secondary';
  playButton.textContent='Putar';
  playButton.setAttribute('aria-label','Putar '+label);
  playButton.onclick=()=>playReview([verse]);
  const removeButton=document.createElement('button');
  removeButton.type='button';
  removeButton.className='secondary';
  removeButton.textContent='Hapus';
  removeButton.setAttribute('aria-label','Hapus '+label+' dari Ulangi Nanti');
  removeButton.onclick=()=>changeReviewMark(verse.s,verse.a);
  row.append(title,playButton,removeButton);
  list.append(row);
 }
}
function playTafsir(s){if(!Number.isInteger(s)||s<1||s>114){toast('Pilih surat yang valid.');return;}if(window.Hafalan&&!window.Hafalan.beforeReciter())return;save('tafsirAudioSurah',s);if(native)native.playTafsir(s);else playPreview({s,a:1,b:1,q:'tafsir-saadi',repeat:1,kind:'tafsir'});}
function playPreview(range){
 if(previewPlayer)previewPlayer.audio.pause();
 const audio=new Audio();
 const state={...range,verse:range.verse||range.a,round:1,verseRound:1,status:'loading',reviewIndex:0};
 function selectReviewVerse(index){
  const {s,a}=range.queue[index];
  Object.assign(state,{reviewIndex:index,s,a,b:a,verse:a,verseRound:1});
 }
 if(range.queue)selectReviewVerse(0);
 previewPlayer={audio,state,selectReviewVerse};
 const current=()=>previewPlayer?.audio===audio;
 const report=()=>{
  if(!current())return;
  window.onNativeEvent('playback',{kind:range.kind||'recitation',status:state.status,surah:state.s,
   verse:state.verse,first:state.a,last:state.b,qari:range.q,round:state.round,repeat:range.repeat,
   verseRound:state.verseRound,ayahRepeat:range.ayahRepeat||1,reviewIndex:state.reviewIndex,
   reviewCount:range.queue?.length,position:audio.currentTime*1000||0,duration:audio.duration*1000||0});
 };
 const load=()=>{
  if(!current())return;
  state.status='loading';
  report();
  audio.src=range.kind==='tafsir'?tafsirTracks[state.s-1].url:core.audioUrl(range.q,state.s,state.verse);
  audio.play().catch(()=>{if(current()){state.status='error';report();toast('Audio belum dapat diputar. Periksa koneksi.');}});
 };
 audio.onplaying=()=>{state.status='playing';report();};
 audio.onpause=()=>{if(state.status!=='completed'){state.status='paused';report();}};
 audio.ontimeupdate=audio.onloadedmetadata=report;
 audio.onerror=()=>{if(current()){state.status='error';report();toast('Audio online belum tersedia. Coba lagi.');}};
 audio.onended=()=>{
  if(!current())return;
  if(state.verseRound<(range.ayahRepeat||1))state.verseRound++;
  else if(range.queue&&state.reviewIndex+1<range.queue.length)selectReviewVerse(state.reviewIndex+1);
  else if(state.verse<state.b){state.verse++;state.verseRound=1;}
  else if(state.round<range.repeat){state.round++;state.verse=state.a;state.verseRound=1;}
  else{state.status='completed';report();return;}
  load();
 };
 previewPlayer.load=load;
 load();
}
function control(action){
 if(action==='toggle'&&window.Hafalan&&!window.Hafalan.beforeReciter())return;
 if(native){native.control(action);return;}
 if(!previewPlayer)return;
 const {audio,state,load,selectReviewVerse}=previewPlayer;
 if(action==='stop'){
  previewPlayer=null;
  audio.pause();
  window.onNativeEvent('playback',{status:'idle'});
 }else if(action==='toggle'){
  if(state.status==='completed'){
   if(state.queue)selectReviewVerse(0);
   else{state.verse=state.a;state.round=1;state.verseRound=1;}
   load();
  }else if(audio.paused)audio.play().catch(()=>toast('Tidak dapat memutar audio.'));
  else audio.pause();
 }else{
  const delta=action==='next'?1:-1;
  if(state.kind==='tafsir'){playTafsir(state.s+delta);return;}
  if(state.queue){
   const index=state.reviewIndex+delta;
   if(index>=0&&index<state.queue.length){selectReviewVerse(index);load();}
  }else if(state.verse+delta>=state.a&&state.verse+delta<=state.b){
   state.verse+=delta;
   state.verseRound=1;
   load();
  }
 }
}
function seconds(ms){const n=Math.floor((ms||0)/1000);return n>=3600?Math.floor(n/3600)+':'+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
function renderPlayback(state){if(!state.status)return;lastState=state;const visible=state.status!=='idle';$('player').hidden=!visible;document.body.classList.toggle('has-player',visible);if(!visible)return;
 trackRecitation(state);
 updateReviewMark();
 const isTafsir=state.kind==='tafsir',isReview=state.kind==='review';$('playerTitle').textContent=isTafsir?'Tafsir As-Sa’di · '+name(state.surah):name(state.surah)+' · Ayat '+state.verse;$('playerMeta').textContent=state.status==='loading'?'Menyiapkan audio…':state.status==='completed'?(isTafsir?'Audio tafsir selesai':'Selesai · Semoga hafalan semakin kuat'):state.status==='error'?'Belum dapat memutar audio':isTafsir?'Abdulrahman Al-Subhan · Way2Quran':(state.ayahRepeat>1?'Ulang ayat '+state.verseRound+'/'+state.ayahRepeat+' · ':'')+(isReview?'Ulangi Nanti '+(state.reviewIndex+1)+'/'+state.reviewCount:'Rentang '+state.round+'/'+state.repeat)+' · '+(core.reciters[state.qari]?.name||'Audio');
 $('toggleIcon').setAttribute('href',state.status==='playing'?'#i-pause':'#i-play');$('seek').max=Math.max(1,state.duration||1);$('seek').value=state.position||0;$('positionLabel').textContent=seconds(state.position);$('durationLabel').textContent=seconds(state.duration);$('playerPrev').disabled=isTafsir?state.surah<=1:isReview?state.reviewIndex<=0:state.verse<=state.first;$('playerNext').disabled=isTafsir?state.surah>=114:isReview?state.reviewIndex>=state.reviewCount-1:state.verse>=state.last;$('playerTafsir').hidden=isTafsir;$('playerMushaf').lastChild.textContent=isTafsir?'Buka mushaf surat ini':'Buka mushaf ayat ini';$('playerPrev').setAttribute('aria-label',isTafsir?'Surat sebelumnya':'Ayat sebelumnya');$('playerNext').setAttribute('aria-label',isTafsir?'Surat berikutnya':'Ayat berikutnya');if(state.error&&state.error!==renderPlayback.error){renderPlayback.error=state.error;toast(state.error);}if(state.status!=='error')renderPlayback.error='';}
function openPlaybackMushaf(state){
 try{
  const s=Number(state.surah),a=Number(state.verse);
  const target=core.pageForVerse(s,a,surahs,pages);
  const returnScreen=screen==='mushaf'?mushafReturnScreen:screen;
  openTilawahPage(target,state.kind==='tafsir'?null:{s,a},returnScreen);
 }catch(e){toast(e.message);}
}
function verseBounds(edition){
 if(edition!=='1440'&&edition!=='1405')return Promise.resolve(null);
 if(!ayahBounds.has(edition)){
  const request=fetch('ayah-bounds-'+edition+'.json.gz').then(response=>{
   if(!response.ok)throw Error('Posisi ayat tidak tersedia.');
   if(native)return response.json();
   return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }).catch(()=>{
   ayahBounds.delete(edition);
   return null;
  });
  ayahBounds.set(edition,request);
 }
 return ayahBounds.get(edition);
}
function renderMushafTarget(scrollToVerse=false){
 const overlay=$('mushafHighlights');
 overlay.replaceChildren();
 const image=$('mushafImage');
 if(!mushafTarget||!mushafTargetBoxes.length||image.hidden||!image.naturalWidth||!image.naturalHeight)return;
 const scale=Math.min(image.clientWidth/image.naturalWidth,image.clientHeight/image.naturalHeight);
 const left=image.offsetLeft+(image.clientWidth-image.naturalWidth*scale)/2;
 const top=image.offsetTop+(image.clientHeight-image.naturalHeight*scale)/2;
 for(const [x,y,width,height] of mushafTargetBoxes){
  const box=document.createElement('span');
  box.style.left=left+x*scale+'px';
  box.style.top=top+y*scale+'px';
  box.style.width=width*scale+'px';
  box.style.height=height*scale+'px';
  overlay.append(box);
 }
 if(scrollToVerse){
  const viewport=$('mushafViewport');
  viewport.scrollTop=Math.max(0,top+mushafTargetBoxes[0][1]*scale-viewport.clientHeight*.2);
 }
}
async function focusMushafVerse(edition,n,target){
 const data=await verseBounds(edition);
 if(mushafTarget!==target||edition!==mushafEdition||page!==n)return;
 const entry=data?.[target.s+':'+target.a];
 if(entry?.[0]===n)mushafTargetBoxes=entry.slice(1);
 $('mushafTargetLabel').textContent=name(target.s)+' · Ayat '+target.a+(mushafTargetBoxes.length?'':' · Hal. '+n);
 $('mushafTargetLabel').hidden=false;
 renderMushafTarget(true);
}
function loadPage(n,target=null){
 const edition=mushafEdition;
 const forTilawah=tilawahReader;
 const persistent=!!native?.mushafCacheInfo;
 let url;
 try{url=core.pageUrl(n,edition,persistent);}
 catch(e){toast(e.message);return;}
 page=n;
 mushafTarget=target;
 mushafTargetBoxes=[];
 $('mushafTargetLabel').hidden=true;
 $('mushafHighlights').replaceChildren();
 if(!forTilawah)save(mushafPageKey('mushafPage',edition),n);
 $('pageInput').value=n;
 $('pageCounter').textContent=(forTilawah?'Hal. ':'Halaman ')+n+' / 604';
 $('prevPage').disabled=n===1;
 $('nextPage').disabled=n===604;
 $('pageStatus').hidden=false;
 $('pageStatus').textContent='Memuat halaman '+n+'…';
 const image=$('mushafImage');
 image.alt='Halaman '+n+' · '+core.mushafEditions[edition].label;
 image.hidden=true;
 $('retryPage').hidden=true;
 $('mushafOfflineStatus').textContent=persistent?'Membuka halaman tersimpan atau mengunduh halaman…':'Penyimpanan mushaf offline tersedia di aplikasi Android.';
 image.onload=()=>{
  if(edition!==mushafEdition)return;
  if(forTilawah){
   tilawahPage=n;
   save(mushafPageKey('tilawahPage',edition),n);
   if(screen==='tilawah')renderTilawahResume();
  }
  $('pageStatus').hidden=true;
  image.hidden=false;
  $('mushafViewport').scrollTop=0;
  $('mushafViewport').scrollLeft=0;
  if(persistent)native.mushafCacheInfo(n,edition);
  if(target)focusMushafVerse(edition,n,target);
 };
 image.onerror=()=>{
  if(edition!==mushafEdition)return;
  if(tilawahReader)setTilawahControls(true);
  $('pageStatus').textContent='Halaman ini belum tersedia offline atau belum dapat dimuat. Sambungkan internet lalu coba lagi.';
  $('mushafOfflineStatus').textContent='Halaman belum berhasil dibuka.';
  $('retryPage').hidden=false;
 };
 image.src=persistent?url+'?v='+Date.now():url;
}
function turnMushafPage(delta){if(screen!=='mushaf'||zoom>100||$('mushafImage').hidden)return;const target=page+delta;if(target<1||target>604){toast(target<1?'Ini halaman pertama mushaf.':'Ini halaman terakhir mushaf.');return;}loadPage(target);}
function setTilawahControls(visible){
 tilawahControlsVisible=visible;
 document.body.classList.toggle('tilawah-controls-hidden',tilawahReader&&mushafFull&&!visible);
}
function toggleTilawahControls(){
 if(tilawahReader&&mushafFull)setTilawahControls(!tilawahControlsVisible);
}
function setupMushafGestures(){const viewport=$('mushafViewport');let gesture=null,lastTouch=0;
 const ready=()=>screen==='mushaf'&&zoom===100&&!$('mushafImage').hidden;
 const tapAt=x=>{
  const box=viewport.getBoundingClientRect(),fraction=(x-box.left)/box.width;
  if(fraction<0||fraction>1)return;
  if(fraction<.24)turnMushafPage(1);
  else if(fraction>.76)turnMushafPage(-1);
  else toggleTilawahControls();
 };
 viewport.addEventListener('keydown',event=>{
  if(!tilawahReader||!mushafFull||zoom>100||$('mushafImage').hidden)return;
  if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleTilawahControls();}
 });
 viewport.addEventListener('touchstart',event=>{lastTouch=Date.now();if(!ready()||event.touches.length!==1){gesture=null;return;}const point=event.touches[0];gesture={x:point.clientX,y:point.clientY,time:Date.now(),maxX:0,maxY:0};},{passive:true});
 viewport.addEventListener('touchmove',event=>{if(!gesture)return;if(!ready()||event.touches.length!==1){gesture=null;return;}const point=event.touches[0],dx=point.clientX-gesture.x,dy=point.clientY-gesture.y;gesture.maxX=Math.max(gesture.maxX,Math.abs(dx));gesture.maxY=Math.max(gesture.maxY,Math.abs(dy));if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)*1.5&&event.cancelable)event.preventDefault();},{passive:false});
 viewport.addEventListener('touchend',event=>{lastTouch=Date.now();const start=gesture;gesture=null;if(!start||!ready()||event.touches.length||event.changedTouches.length!==1)return;const point=event.changedTouches[0],dx=point.clientX-start.x,dy=point.clientY-start.y,elapsed=Date.now()-start.time;const threshold=Math.max(40,viewport.getBoundingClientRect().width*.14);if(elapsed<1200&&Math.abs(dx)>=threshold&&Math.abs(dy)<Math.abs(dx)*.55&&start.maxY<Math.abs(dx)*.75){turnMushafPage(dx>0?1:-1);return;}if(elapsed<450&&Math.abs(dx)<12&&Math.abs(dy)<12&&start.maxX<12&&start.maxY<12)tapAt(point.clientX);},{passive:true});
 viewport.addEventListener('touchcancel',()=>{gesture=null;lastTouch=Date.now();},{passive:true});
 viewport.addEventListener('click',event=>{if(ready()&&Date.now()-lastTouch>800&&event.detail===1)tapAt(event.clientX);});
}
function setRecordingPanel(open){const panel=$('recordingPanel');if(open){if(!panel.open)panel.showModal();}else if(panel.open)panel.close();$('recordingPanelToggle').setAttribute('aria-expanded',String(!!open));}
function setTafsirMode(value){if(!['read','listen'].includes(value))return;$('tafsirReadPane').hidden=value!=='read';$('tafsirListenPane').hidden=value!=='listen';document.querySelectorAll('[data-tafsir-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tafsirMode===value)));save('tafsirMode',value);if(screen==='tafsir')window.scrollTo({top:0,behavior:'instant'});}
function applyMushafZoom(){
 const viewport=$('mushafViewport');
 viewport.classList.toggle('mushaf-zoomed',zoom>100);
 viewport.style.setProperty('--mushaf-zoom',zoom+'%');
}
function setMushafFullscreen(enabled){mushafFull=!!enabled;setTilawahControls(!mushafFull||!tilawahReader);$('mushafViewport').tabIndex=tilawahReader&&mushafFull?0:-1;document.body.classList.toggle('mushaf-fullscreen',mushafFull);$('mushafFullscreen').setAttribute('aria-pressed',String(mushafFull));$('mushafFullscreen').setAttribute('aria-label',mushafFull?'Keluar dari layar penuh':'Buka Mushaf layar penuh');$('mushafFullscreen').textContent=mushafFull?'×':'⛶';zoom=100;applyMushafZoom();if(native&&native.mushafFullscreen)native.mushafFullscreen(mushafFull);}
function tafsirRange(){return tafsirActiveRange&&$('tafsirRange').value===tafsirInputValue?tafsirActiveRange:core.parse($('tafsirRange').value,surahs);}
function updateTafsirNavigation(busy=false){try{const r=tafsirRange();$('tafsirCurrent').textContent=r.s+':'+r.a+(r.b!==r.a?'–'+r.b:'');$('tafsirPrev').disabled=busy||(r.s===1&&r.a===1);$('tafsirNext').disabled=busy||(r.s===114&&r.b===surahs[113].verses_count);}catch{$('tafsirCurrent').textContent='Pilih ayat';$('tafsirPrev').disabled=$('tafsirNext').disabled=true;}}
function moveTafsirVerse(delta){if($('tafsirBtn').disabled)return;try{const r=tafsirRange();let s=r.s,a=delta>0?r.b+1:r.a-1;if(a<1){if(s===1)return;s--;a=surahs[s-1].verses_count;}if(a>surahs[s-1].verses_count){if(s===114)return;s++;a=1;}$('tafsirRange').value=s+':'+a;requestTafsir();$('tafsirTools').scrollIntoView({block:'start',behavior:'smooth'});}catch(e){toast(e.message);}}
function tafsirFontSpec(){return tafsirLanguage==='id'?{base:15,min:12,max:27,step:1}:{base:24,min:18,max:40,step:2};}
function changeTafsirFont(delta=0,reset=false){const spec=tafsirFontSpec();let size=Number(readSaved('tafsirFont-'+tafsirLanguage,spec.base));if(!Number.isFinite(size))size=spec.base;size=reset?spec.base:Math.max(spec.min,Math.min(spec.max,size+delta*spec.step));save('tafsirFont-'+tafsirLanguage,size);document.documentElement.style.setProperty('--tafsir-'+tafsirLanguage+'-size',size+'px');$('tafsirFontSize').textContent=size+' px';$('tafsirFontDown').disabled=size<=spec.min;$('tafsirFontUp').disabled=size>=spec.max;}
function setTafsirLanguage(value,reload=false){if(!['id','ar'].includes(value))return;tafsirLanguage=value;changeTafsirFont();tafsirActiveRange=null;updateTafsirNavigation();save('tafsirLanguage',value);tafsirRequest='';$('tafsirBtn').disabled=false;document.querySelectorAll('[data-tafsir-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tafsirLanguage===value)));$('tafsirEditionNote').textContent=value==='id'?'Edisi bahasa Indonesia · Saadi.IslamEnc.com':'Teks asli bahasa Arab · tafsir.app';$('tafsirResults').replaceChildren();$('tafsirStatus').hidden=false;$('tafsirStatus').textContent=value==='id'?'Pilih ayat untuk membaca Tafsir As-Sa’di edisi bahasa Indonesia.':'Pilih ayat untuk membaca teks Tafsir As-Sa’di bahasa Arab.';if(reload)requestTafsir();}
function requestTafsir(){try{const r=core.parse($('tafsirRange').value,surahs);tafsirActiveRange=r;tafsirInputValue=$('tafsirRange').value;updateTafsirNavigation(true);tafsirRequest=String(Date.now())+'-'+tafsirLanguage;$('tafsirBtn').disabled=true;$('tafsirResults').replaceChildren();$('tafsirStatus').hidden=false;$('tafsirStatus').textContent='Mengambil Tafsir As-Sa’di untuk '+name(r.s)+' ayat '+r.a+'–'+r.b+'…';if(native){if(tafsirLanguage==='id')native.tafsirIndonesia(r.s,r.a,r.b,tafsirRequest);else native.tafsir(r.s,r.a,r.b,tafsirRequest);}else{
 const id=tafsirRequest;fetch('/api/tafsir?lang='+tafsirLanguage+'&s='+r.s+'&a='+r.a+'&b='+r.b).then(res=>{if(!res.ok)throw Error('Sumber tafsir tidak dapat diakses.');return res.json();}).then(data=>window.onNativeEvent('tafsir',{...data,id})).catch(e=>window.onNativeEvent('tafsirError',{id,message:e.message}));}
 }catch(e){$('tafsirBtn').disabled=false;updateTafsirNavigation();toast(e.message);}}
function renderTafsir(result){if(result.id!==tafsirRequest)return;if(tafsirActiveRange&&result.verses.length){tafsirActiveRange={s:result.surah,a:Math.min(tafsirActiveRange.a,...result.verses.map(v=>v.verse)),b:Math.max(tafsirActiveRange.b,...result.verses.map(v=>v.lastVerse||v.verse))};}updateTafsirNavigation();$('tafsirBtn').disabled=false;$('tafsirStatus').hidden=true;$('tafsirResults').replaceChildren();
 for(const item of result.verses){const card=document.createElement('article');card.className='tafsir-card';const head=document.createElement('header'),label=document.createElement('span');label.className='verse-label';label.textContent=result.surah+':'+item.verse+(item.lastVerse>item.verse?'–'+item.lastVerse:'');const source=document.createElement('button');source.className='source-link';source.textContent=result.language==='id'?'As-Sa’di · IslamEnc ↗':'As-Sa’di · tafsir.app ↗';source.onclick=()=>openSource(item.url);head.append(label,source);const body=document.createElement('div');body.className=item.text?(result.language==='id'?'tafsir-indonesian':'tafsir-arabic'):'tafsir-missing';body.textContent=item.text||'Situs tidak menyediakan teks tafsir tersendiri pada ayat ini.';if(item.text)body.lang=result.language==='id'?'id':'ar';card.append(head);if(item.lastVerse>item.verse){const note=document.createElement('p');note.className='source-note';note.textContent='Penjelasan gabungan ayat '+item.verse+'–'+item.lastVerse+' sesuai pengelompokan sumber.';card.append(note);}card.append(body);$('tafsirResults').append(card);}}
function loadLibrary(){if(native){if(native.mushafCacheInfo)native.mushafCacheInfo(0,mushafEdition);native.library();native.updateStatus();}else renderLibrary({rows:[],count:0,bytes:0});}
function renderMushafCache(data){if(data.edition!==mushafEdition)return;if(data.page===page)$('mushafOfflineStatus').textContent=data.saved?'✓ Halaman '+page+' tersimpan · Bisa dibaca offline':'Halaman ditampilkan, tetapi belum tersimpan. Periksa ruang penyimpanan lalu buka kembali.';$('mushafSavedCount').textContent=data.count+' halaman tersimpan';$('mushafSavedSize').textContent=(data.bytes/1024/1024).toFixed(1)+' MB · Tersimpan di perangkat ini';const select=$('offlinePageSelect'),previous=select.value;select.replaceChildren();for(const n of data.pages){select.append(Object.assign(document.createElement('option'),{value:String(n),textContent:'Halaman '+n}));}if(!data.pages.length)select.append(Object.assign(document.createElement('option'),{value:'',textContent:'Belum ada halaman tersimpan'}));else if(data.pages.includes(Number(previous)))select.value=previous;$('openOfflinePage').disabled=!data.pages.length;}
function renderLibrary(data){$('savedCount').replaceChildren(document.createTextNode(String(data.count)+' '),Object.assign(document.createElement('small'),{textContent:'ayat'}));$('savedSize').textContent=(data.bytes/1024/1024).toFixed(1)+' MB digunakan';$('clearBtn').hidden=data.count===0;$('libraryList').replaceChildren();
 if(!data.rows.length){const empty=document.createElement('div');empty.className='empty-card';empty.textContent=data.bundled?'Koleksi audio bawaan tersedia. Pilih “Koleksi lokal” pada menu qari.':'Belum ada unduhan. Pilih rentang ayat di tab Murojaah, lalu ketuk Unduh.';$('libraryList').append(empty);}
 for(const row of data.rows){const el=document.createElement('div');el.className='library-row';const num=document.createElement('span');num.className='verse-label';num.textContent=String(row.surah).padStart(2,'0');const info=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('p');title.textContent=name(row.surah);meta.textContent=row.count+' ayat tersimpan · '+(core.reciters[row.qari]?.name||'Audio');info.append(title,meta);const check=document.createElement('span');check.className='check';check.append(icon('check'));el.append(num,info,check);$('libraryList').append(el);}}
function openSource(url){if(native)native.openSource(url);else window.open(url,'_blank','noopener');}
function renderUpdate(data){
 const labels={idle:'Pembaruan diperiksa dan diunduh otomatis saat tersedia.',checking:'Memeriksa pembaruan…',downloading:'Mengunduh pembaruan '+(data.percent||0)+'%…',verifying:'Memeriksa berkas pembaruan…',ready:'Versi '+data.newVersion+' siap dipasang.',current:'Aplikasi sudah menggunakan versi terbaru.',unavailable:'Belum dapat memeriksa pembaruan. Coba lagi nanti.',error:'Pembaruan belum berhasil. Periksa koneksi lalu coba lagi.'};
 $('updateMessage').textContent=labels[data.state]||labels.idle;if(data.version)$('appVersion').textContent='Versi '+data.version;
 $('updateProgress').hidden=!['downloading','verifying'].includes(data.state);$('updateProgress').value=data.percent||0;
 $('installUpdate').hidden=data.state!=='ready';$('checkUpdate').disabled=['checking','downloading','verifying'].includes(data.state);
}
window.onNativeEvent=(type,data)=>{if(type==='mushafCache')renderMushafCache(data);else if(type==='update')renderUpdate(data);else if(type==='playback')renderPlayback(data);else if(type==='error'){toast(data.message);$('downloadBtn').disabled=false;$('downloadProgress').hidden=true;}else if(type==='tafsir')renderTafsir(data);else if(type==='tafsirError'){if(data.id!==tafsirRequest)return;$('tafsirBtn').disabled=false;$('tafsirStatus').hidden=false;$('tafsirStatus').textContent=data.message;updateTafsirNavigation();}else if(type==='library')renderLibrary(data);else if(type==='download'){$('downloadProgress').hidden=false;$('downloadText').textContent=data.finished?'Unduhan selesai': 'Mengunduh '+data.done+' dari '+data.total+' ayat';const percent=Math.round(data.done/data.total*100);$('downloadPercent').textContent=percent+'%';$('downloadBar').value=percent;if(data.finished){$('downloadBtn').disabled=false;toast('Audio tersimpan. Siap didengar tanpa internet.');}}};
window.handleBack=()=>{if($('recordingPanel').open){setRecordingPanel(false);return true;}if(tilawahReader){switchScreen(mushafReturnScreen);return true;}if(mushafFull){setMushafFullscreen(false);return true;}if(screen!=='audio'){switchScreen('audio');return true;}return false;};
async function init(){try{
 const loadJson=async path=>{
  const response=await fetch(path);
  if(!response.ok)throw Error('Data '+path+' tidak tersedia.');
  return response.json();
 };
 const [config,modernPages,tafsirAudio]=await Promise.all([
  native?JSON.parse(native.config()):Promise.all([loadJson('surahs.json'),loadJson('pages.json')])
   .then(([surahs,pages])=>({surahs,pages})),
  loadJson('pages-1440.json'),
  loadJson('tafsir-audio.json')
 ]);
 surahs=config.surahs;
 standardPages=config.pages;
 madani1440Pages=modernPages;
 tafsirTracks=tafsirAudio.tracks;
 if(surahs?.length!==114||standardPages?.length!==604||madani1440Pages?.length!==604)
  throw Error('Data Mushaf tidak lengkap.');
 for(const s of surahs){const option=document.createElement('option');option.value=s.id;option.textContent=String(s.id).padStart(2,'0')+'  '+s.name_simple+'  ·  '+s.verses_count+' ayat';$('surah').append(option);}
 for(const s of surahs){const track=tafsirTracks[s.id-1],option=document.createElement('option');option.value=s.id;option.textContent=String(s.id).padStart(2,'0')+'  '+s.name_simple+' · '+Math.round(track.duration/60)+' menit';$('tafsirAudioSurah').append(option);}
 const savedTafsir=Number(readSaved('tafsirAudioSurah',1));$('tafsirAudioSurah').value=savedTafsir>=1&&savedTafsir<=114?savedTafsir:1;
 const updateTafsirAudio=()=>{const track=tafsirTracks[Number($('tafsirAudioSurah').value)-1];$('tafsirAudioInfo').textContent='Durasi sekitar '+Math.round(track.duration/60)+' menit · Audio lengkap per surat';};
 $('tafsirAudioSurah').onchange=updateTafsirAudio;updateTafsirAudio();$('tafsirAudioPlay').onclick=()=>playTafsir(Number($('tafsirAudioSurah').value));
 if(config.bundled){$('qari').append(Object.assign(document.createElement('option'),{value:'local',textContent:'Koleksi lokal (bawaan)'}));$('qari').value='local';}
 $('dateLabel').textContent=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(new Date());
 const updateTheme=()=>{const theme=window.MaqriTheme;$('themeIcon').setAttribute('href',theme.dark?'#i-sun':'#i-moon');$('themeToggle').setAttribute('aria-label',theme.dark?'Aktifkan mode terang':'Aktifkan mode gelap');$('themeToggle').setAttribute('title',theme.dark?'Mode terang':'Mode gelap');document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme.mode)));};
 $('themeToggle').onclick=()=>window.MaqriTheme.set(window.MaqriTheme.dark?'light':'dark');
 document.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>window.MaqriTheme.set(button.dataset.themeChoice));
 window.addEventListener('maqriThemeChange',updateTheme);updateTheme();
 restoreRecitation(config.recitationProgress);
 restoreReviewList();
 $('playReviewAll').onclick=()=>playReview(reviewVerses);
 $('markVerse').onclick=()=>changeReviewMark(lastState.surah,lastState.verse);
 updateReviewMark();
 restoreMushafEdition();
 $('tilawahEdition').onchange=event=>setMushafEdition(event.target.value);
 $('offlineEdition').onchange=event=>setMushafEdition(event.target.value);
 $('tilawahResume').onclick=()=>openTilawahPage(tilawahPage||1);
 $('tilawahIndex').onclick=()=>switchScreen('tilawah');
 $('tilawahRecordings').onclick=()=>setRecordingPanel(true);
 document.querySelectorAll('[data-tilawah-mode]').forEach(button=>
  button.onclick=()=>setTilawahMode(button.dataset.tilawahMode));
 $('audioForm').onsubmit=e=>{e.preventDefault();try{play(rangeFromForm());}catch(err){toast(err.message);}};
 $('ayahRepeat').value=String(Math.max(1,Math.min(99,Number(readSaved('ayahRepeat',1))||1)));$('ayahRepeat').onchange=()=>{save('ayahRepeat',Number($('ayahRepeat').value));saveMurojaahSelection();};restoreMurojaahSelection();
 $('surah').onchange=()=>{updateSurah();saveMurojaahSelection();};for(const key of ['from','to'])$(key).oninput=saveMurojaahSelection;for(const key of ['qari','repeat'])$(key).onchange=saveMurojaahSelection;$('quickForm').onsubmit=e=>{e.preventDefault();try{const r=core.parse($('quick').value,surahs);$('surah').value=r.s;updateSurah(false);$('from').value=r.a;$('to').value=r.b;play(r);}catch(err){toast(err.message);}};
 $('downloadBtn').onclick=()=>{try{const r=rangeFromForm();if(!native){toast('Unduhan offline tersedia di aplikasi Android.');return;}$('downloadBtn').disabled=true;native.download(r.s,r.a,r.b,$('qari').value);}catch(e){toast(e.message);}};
 $('continueBtn').onclick=()=>{if(lastRange)play({...lastRange});};document.querySelector('.brand').onclick=e=>{e.preventDefault();switchScreen('audio');};
 document.querySelectorAll('[data-screen]').forEach(el=>el.onclick=()=>switchScreen(el.dataset.screen));
 setupMushafGestures();
 if(window.ResizeObserver)new ResizeObserver(()=>{
  if(mushafTargetBoxes.length)renderMushafTarget(true);
 }).observe($('mushafImage'));
 $('pageForm').onsubmit=e=>{e.preventDefault();zoom=100;applyMushafZoom();loadPage(Number($('pageInput').value));};$('prevPage').onclick=()=>loadPage(page-1);$('nextPage').onclick=()=>loadPage(page+1);$('retryPage').onclick=()=>loadPage(page,mushafTarget);
 $('recordingPanelToggle').onclick=()=>setRecordingPanel(true);$('recordingPanelClose').onclick=()=>setRecordingPanel(false);$('recordingPanel').addEventListener('close',()=>$('recordingPanelToggle').setAttribute('aria-expanded','false'));$('recordingPanel').addEventListener('click',event=>{if(event.target===$('recordingPanel')){const rect=$('recordingPanel').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)setRecordingPanel(false);}});
 $('mushafFullscreen').onclick=()=>setMushafFullscreen(!mushafFull);document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mushafFull)window.handleBack();});
 $('zoomIn').onclick=()=>{zoom=Math.min(250,zoom+25);applyMushafZoom();};$('zoomOut').onclick=()=>{zoom=Math.max(100,zoom-25);applyMushafZoom();};
 setTafsirMode('read');document.querySelectorAll('[data-tafsir-mode]').forEach(button=>button.onclick=()=>setTafsirMode(button.dataset.tafsirMode));
 setTafsirLanguage(readSaved('tafsirLanguage','id'));document.querySelectorAll('[data-tafsir-language]').forEach(button=>button.onclick=()=>setTafsirLanguage(button.dataset.tafsirLanguage,true));
 $('tafsirPrev').onclick=()=>moveTafsirVerse(-1);$('tafsirNext').onclick=()=>moveTafsirVerse(1);$('tafsirFontDown').onclick=()=>changeTafsirFont(-1);$('tafsirFontUp').onclick=()=>changeTafsirFont(1);$('tafsirFontReset').onclick=()=>changeTafsirFont(0,true);$('tafsirRange').oninput=()=>updateTafsirNavigation($('tafsirBtn').disabled);
 $('tafsirForm').onsubmit=e=>{e.preventDefault();requestTafsir();};document.querySelectorAll('[data-range]').forEach(el=>el.onclick=()=>{$('tafsirRange').value=el.dataset.range;requestTafsir();});
 $('openOfflinePage').onclick=()=>{const n=Number($('offlinePageSelect').value);if(n>=1&&n<=604){switchScreen('mushaf');loadPage(n);}};
 $('goDownload').onclick=()=>switchScreen('audio');$('clearBtn').onclick=()=>native&&native.clearDownloads();document.querySelectorAll('[data-url]').forEach(el=>el.onclick=()=>openSource(el.dataset.url));
 $('playerToggle').onclick=()=>control('toggle');$('playerNext').onclick=()=>control('next');$('playerPrev').onclick=()=>control('prev');$('playerClose').onclick=()=>control('stop');$('seek').onchange=()=>{if(native)native.seek(Number($('seek').value));else if(previewPlayer)previewPlayer.audio.currentTime=Number($('seek').value)/1000;};updateSurah(false);
 $('playerMushaf').onclick=()=>openPlaybackMushaf(lastState);
 $('playerTafsir').onclick=()=>{try{const r=core.validate(Number(lastState.surah),Number(lastState.verse),Number(lastState.verse),surahs);$('tafsirRange').value=r.s+':'+r.a;switchScreen('tafsir');setTafsirMode('read');requestTafsir();}catch(e){toast(e.message);}};
 $('checkUpdate').onclick=()=>{if(native){renderUpdate({state:'checking'});native.checkUpdates();}else toast('Pemeriksaan pembaruan tersedia di aplikasi Android.');};
 $('installUpdate').onclick=()=>{if(native)native.installUpdate();};
 }catch(e){toast('Aplikasi belum dapat dimuat: '+e.message);}}
init();
