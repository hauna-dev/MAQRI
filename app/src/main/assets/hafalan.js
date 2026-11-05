'use strict';
(()=>{
 let recording=false,pending=false,started=0,timer,rows=[],selected='',playing='';
 const oldEvent=window.onNativeEvent;
 const selectedRow=()=>rows.find(row=>row.id===$('recordingSelect').value);
 function status(text){$('recordStatus').textContent=text;}
 function finishUI(){recording=false;pending=false;clearInterval(timer);$('recordStart').disabled=false;$('recordStop').hidden=true;$('recordDot').classList.remove('recording');}
 function openPage(row){try{if(window.setRecordingPanel)window.setRecordingPanel(false);const n=core.pageForVerse(row.surah,row.first,surahs,pages);switchScreen('mushaf');loadPage(n);}catch(e){toast(e.message);}}
 function describe(row){return name(row.surah)+' · '+row.first+'–'+row.last+' · '+new Date(row.created).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+seconds(row.duration);}
 function updateSelection(){const row=selectedRow();$('recordingPlay').disabled=!row;$('recordingDelete').disabled=!row;$('recordingPage').disabled=!row;$('recordingInfo').textContent=row?describe(row):'Mulai rekaman dari tab Murojaah.';$('recordingListControls').hidden=!row;$('recordingEmpty').hidden=!!row;}
 function renderRows(data){rows=data.rows||[];const previous=selected||$('recordingSelect').value;$('recordingSelect').replaceChildren();for(const row of rows){const option=document.createElement('option');option.value=row.id;option.textContent=describe(row);$('recordingSelect').append(option);}if(!rows.length)$('recordingSelect').append(Object.assign(document.createElement('option'),{value:'',textContent:'Belum ada rekaman'}));if(rows.some(r=>r.id===previous))$('recordingSelect').value=previous;updateSelection();}
 window.onNativeEvent=(type,data)=>{
  if(type==='recordingDeleted'){if(selected===data.id||$('recordingSelect').value===data.id){selected='';$('reviewRecording').hidden=true;}toast('Rekaman berhasil dihapus.');return;}
  if(type==='recordings'){renderRows(data);return;}
  if(type==='recording'){
   status(data.message||'');
   if(data.state==='recording'){pending=false;recording=true;started=Date.now();$('recordStop').hidden=false;$('recordStart').disabled=true;$('reviewRecording').hidden=true;$('recordDot').classList.add('recording');$('recordTime').textContent='0:00';timer=setInterval(()=>$('recordTime').textContent=seconds(Date.now()-started),500);}
   else if(data.state==='saved'){finishUI();selected=data.recording.id;$('recordTime').textContent=seconds(data.recording.duration);$('reviewRecording').hidden=false;toast(data.message);}
   else if(data.state==='error'){finishUI();toast(data.message);}
   return;
  }
  if(type==='recordingPlayback'){playing=data.id||'';$('recordingTransport').hidden=!playing;document.body.classList.toggle('has-recording',!!playing);const row=rows.find(r=>r.id===playing);$('recordingNow').textContent=row?name(row.surah)+' · Ayat '+row.first+'–'+row.last:'Rekaman hafalan';$('recordingToggle').textContent=data.playing?'Jeda rekaman':'Lanjutkan rekaman';$('recordingSeek').max=Math.max(1,data.duration||1);$('recordingSeek').value=data.position||0;$('recordingPosition').textContent=seconds(data.position);$('recordingDuration').textContent=seconds(data.duration);return;}
  oldEvent(type,data);
 };
 window.Hafalan={beforeReciter(){if(recording||pending){toast('Hentikan rekaman sebelum memutar murottal.');return false;}if(native)native.recordingControl('pause');return true;}};
 $('recordStart').onclick=()=>{if(!native){toast('Merekam hafalan tersedia di aplikasi Android.');return;}try{const range=rangeFromForm();pending=true;$('recordStart').disabled=true;status('Menyiapkan mikrofon…');native.recordStart(range.s,range.a,range.b);}catch(e){finishUI();toast(e.message);}};
 $('recordStop').onclick=()=>{if(native)native.recordStop();};
 $('reviewRecording').onclick=()=>{const row=rows.find(r=>r.id===selected);if(row){$('recordingSelect').value=row.id;updateSelection();openPage(row);if(window.setRecordingPanel)window.setRecordingPanel(true);}else{switchScreen('mushaf');if(window.setRecordingPanel)window.setRecordingPanel(true);if(native)native.recordings();}};
 $('recordingSelect').onchange=()=>{selected=$('recordingSelect').value;if(native&&playing)native.recordingControl('stop');updateSelection();};
 $('recordingPlay').onclick=()=>{const row=selectedRow();if(!row||!native)return;if(recording||pending){toast('Hentikan rekaman dahulu.');return;}openPage(row);native.recordingPlay(row.id);};
 $('recordingPage').onclick=()=>{const row=selectedRow();if(row)openPage(row);};
 $('recordingDelete').onclick=()=>{if(recording||pending){toast('Hentikan perekaman sebelum menghapus rekaman.');return;}const row=selectedRow();if(row&&native)native.recordingDelete(row.id);};
 $('recordingCreate').onclick=()=>{if(window.setRecordingPanel)window.setRecordingPanel(false);switchScreen('audio');$('recordStart').scrollIntoView({block:'center',behavior:'smooth'});};
 $('recordingClose').onclick=()=>{if(native)native.recordingControl('stop');};
 $('recordingToggle').onclick=()=>{if(native)native.recordingControl('toggle');};
 $('recordingSeek').onchange=()=>{if(native)native.recordingSeek(Number($('recordingSeek').value));};
 if(native)native.recordings();else status('Perekaman tersedia di aplikasi Android.');
})();
