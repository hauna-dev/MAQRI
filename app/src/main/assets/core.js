(function(root){
 'use strict';
 const reciters={alafasy:{name:'Mishary Alafasy',folder:'Alafasy_64kbps'},husary:{name:'Mahmoud Al-Husary',folder:'Husary_64kbps'},sudais:{name:'Abdurrahman As-Sudais',folder:'Abdurrahmaan_As-Sudais_64kbps'},minshawi:{name:'Muhammad Siddiq Al-Minshawi',folder:'Minshawy_Murattal_128kbps'},local:{name:'Koleksi lokal',folder:null}};
 function validate(s,a,b,surahs){s=Number(s);a=Number(a);b=Number(b);if(![s,a,b].every(Number.isInteger)||s<1||s>114||a<1||b<a||b>surahs[s-1].verses_count||b-a+1>100)throw Error('Periksa nomor surat dan ayat. Maksimal 100 ayat per rentang.');return {s,a,b};}
 function parse(text,surahs){text=text.trim().replace(/^(?:tafsir\s+)?/i,'').replace(/[–—]/g,'-');const m=text.match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/)||text.match(/^(\d+)\s+(\d+)(?:\s+(\d+))?$/);if(!m)throw Error('Gunakan format 2:25-30 atau 2:255.');return validate(m[1],m[2],m[3]||m[2],surahs);}
 function audioUrl(q,s,a){if(!reciters[q]||!reciters[q].folder)throw Error('Qari online tidak tersedia.');return 'https://everyayah.com/data/'+reciters[q].folder+'/'+String(s).padStart(3,'0')+String(a).padStart(3,'0')+'.mp3';}
 function pageUrl(n){if(!Number.isInteger(n)||n<1||n>604)throw Error('Nomor halaman harus 1–604.');return 'https://adhan.trinadhthatakula.com/mushaf/madani-hafs-1441-v1/'+String(n).padStart(3,'0')+'.webp';}
 function pageForVerse(s,a,surahs,pages){validate(s,a,a,surahs);if(pages.length!==604)throw Error('Data halaman belum tersedia.');let low=0,high=pages.length-1,result=0;while(low<=high){const mid=(low+high)>>1,ref=pages[mid];if(ref.surah<s||(ref.surah===s&&ref.ayah<=a)){result=mid;low=mid+1;}else high=mid-1;}return result+1;}
 const api={reciters,validate,parse,audioUrl,pageUrl,pageForVerse};if(typeof module==='object'&&module.exports)module.exports=api;else root.MurojaahCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
