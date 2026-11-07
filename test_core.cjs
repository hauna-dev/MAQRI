const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('./app/src/main/assets/core.js');
const theme=require('./app/src/main/assets/theme.js');
assert.equal(theme.resolve('light',true),false);
assert.equal(theme.resolve('dark',false),true);
assert.equal(theme.resolve('system',true),true);
assert.equal(theme.resolve('system',false),false);
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'app/src/main/assets/surahs.json'),'utf8'));
const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'app/src/main/assets/pages.json'),'utf8'));
assert.equal(pages.length,604);
for(const [s,a,page] of [[1,1,1],[1,7,1],[2,1,2],[2,5,2],[2,6,3],[2,255,42],[114,1,604],[114,6,604]])assert.equal(core.pageForVerse(s,a,data,pages),page);
assert.throws(()=>core.pageForVerse(1,8,data,pages));
assert.equal(data.length,114);
assert.equal(data.reduce((n,s)=>n+s.verses_count,0),6236);
for(const input of ['2:25-30','2 25 30','tafsir 2:25–30'])assert.deepEqual(core.parse(input,data),{s:2,a:25,b:30});
assert.deepEqual(core.parse('114:6',data),{s:114,a:6,b:6});
for(const bad of ['0:1','115:1','1:8','2:0','2:9-2','2:1-101','114:7','../../001001.mp3','2:1-2 trailing'])assert.throws(()=>core.parse(bad,data));
assert.equal(core.audioUrl('alafasy',2,255),'https://everyayah.com/data/Alafasy_64kbps/002255.mp3');
assert.throws(()=>core.audioUrl('../arbitrary',2,255));
assert.equal(core.pageUrl(604,'1441'),'https://adhan.trinadhthatakula.com/mushaf/madani-hafs-1441-v1/604.webp');
for(const bad of [0,605,1.5,NaN])assert.throws(()=>core.pageUrl(bad));
console.log('Lulus: metadata 114 surat/6236 ayat, format permintaan, batas ayat, URL audio, dan halaman mushaf.');

const pages1440=require('./app/src/main/assets/pages-1440.json');
assert.equal(core.defaultMushafEdition,'1440');
assert.equal(core.pageUrl(282),'https://files.quran.app/hafs/madani_1440/width_1352/page282.png');
assert.equal(pages1440.length,604);
for(const [surah,ayah,page] of [[5,77,120],[5,78,121],[17,1,282],[55,17,531],[80,41,586],[114,1,604]]) {
 assert.equal(core.pageForVerse(surah,ayah,data,pages1440),page);
}
