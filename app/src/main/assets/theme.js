(function(root){
 'use strict';
 const modes=['light','dark','system'];
 function resolve(mode,systemDark){return mode==='dark'||(mode==='system'&&systemDark);}
 if(typeof module==='object'&&module.exports){module.exports={resolve,modes};return;}
 let config={};try{if(root.Android)config=JSON.parse(root.Android.config());}catch{}
 const media=root.matchMedia('(prefers-color-scheme: dark)');
 let saved='dark';try{saved=localStorage.getItem('maqriTheme')||'dark';}catch{}
 let mode=modes.includes(config.theme)?config.theme:modes.includes(saved)?saved:'dark';
 function systemDark(){return root.Android&&typeof config.systemDark==='boolean'?config.systemDark:media.matches;}
 function set(value){
  if(!modes.includes(value))return;
  mode=value;const dark=resolve(mode,systemDark());
  document.documentElement.dataset.theme=dark?'dark':'light';
  document.documentElement.style.colorScheme=dark?'dark':'light';
  try{localStorage.setItem('maqriTheme',mode);}catch{}
  try{if(root.Android)root.Android.theme(mode,dark);}catch{}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#0c100b':'#f3f6ef');
  root.dispatchEvent(new CustomEvent('maqriThemeChange',{detail:{mode,dark}}));
 }
 root.MaqriTheme={set,get mode(){return mode;},get dark(){return resolve(mode,systemDark());}};
 const change=()=>{if(mode==='system')set('system');};
 if(media.addEventListener)media.addEventListener('change',change);else media.addListener(change);
 set(mode);
})(typeof window!=='undefined'?window:globalThis);
