package id.murojaah.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Local recordings, independent of the downloaded reciter collection. Main-thread only. */
final class HafalanRecorder {
 final MainActivity activity;
 final File folder;
 final Handler handler=new Handler(Looper.getMainLooper());
 MediaRecorder recorder;
 MediaPlayer player;
 JSONObject current;
 String playingId="";
 long started;
 int[] pending;
 HafalanRecorder(MainActivity a){activity=a;folder=new File(a.getFilesDir(),"hafalan");folder.mkdirs();}
 boolean busy(){return recorder!=null||pending!=null;}
 void event(String state,String message){try{JSONObject data=new JSONObject().put("state",state).put("message",message);if(current!=null)data.put("recording",current);MainActivity.emit("recording",data);}catch(Exception ignored){}}
 void start(int s,int a,int b){
  if(busy())return;
  try{Store.validate(s,a,b);}catch(Exception e){event("error",e.getMessage());return;}
  if(activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){pending=new int[]{s,a,b};event("permission","Izinkan mikrofon untuk merekam hafalan.");activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},71);return;}
  control("stop");
  if(PlaybackService.instance!=null)PlaybackService.instance.stopPlayback();
  try{
   String id=UUID.randomUUID().toString();
   current=new JSONObject().put("id",id).put("surah",s).put("first",a).put("last",b).put("created",System.currentTimeMillis());
   recorder=new MediaRecorder();recorder.setAudioSource(MediaRecorder.AudioSource.MIC);recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);recorder.setAudioEncodingBitRate(96000);recorder.setAudioSamplingRate(44100);recorder.setOutputFile(new File(folder,id+".m4a").getPath());
   recorder.setMaxDuration(30*60*1000);recorder.setOnInfoListener((r,what,extra)->{if(what==MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED)stop();});recorder.setOnErrorListener((r,what,extra)->stop());
   recorder.prepare();recorder.start();started=android.os.SystemClock.elapsedRealtime();activity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);event("recording","Sedang merekam. Bacakan hafalan Anda.");
  }catch(Exception e){discard();event("error","Mikrofon belum dapat digunakan. Periksa izin dan coba lagi.");}
 }
 void permissionResult(boolean granted){int[] range=pending;pending=null;if(granted&&range!=null)start(range[0],range[1],range[2]);else event("error","Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan aplikasi untuk merekam.");}
 void stop(){
  if(recorder==null)return;
  try{
   recorder.stop();recorder.release();recorder=null;activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
   current.put("duration",android.os.SystemClock.elapsedRealtime()-started);
   File temp=new File(folder,current.getString("id")+".tmp"),dest=new File(folder,current.getString("id")+".json");
   try(FileOutputStream out=new FileOutputStream(temp)){out.write(current.toString().getBytes(StandardCharsets.UTF_8));out.getFD().sync();}
   if(!temp.renameTo(dest))throw new IOException("metadata");
   event("saved","Rekaman tersimpan. Buka Mushaf untuk mengecek hafalan.");list();
  }catch(Exception e){discard();event("error","Rekaman belum tersimpan. Coba rekam beberapa detik lalu hentikan.");}
 }
 void discard(){if(recorder!=null){try{recorder.reset();recorder.release();}catch(Exception ignored){}recorder=null;}activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);if(current!=null){String id=current.optString("id");new File(folder,id+".m4a").delete();new File(folder,id+".tmp").delete();}current=null;}
 JSONObject read(String id)throws Exception{if(id==null||!id.matches("[a-f0-9-]{36}"))throw new IOException("id");try(InputStream in=new FileInputStream(new File(folder,id+".json"))){return new JSONObject(new String(Store.read(in,20000),StandardCharsets.UTF_8));}}
 void list(){try{List<JSONObject> rows=new ArrayList<>();File[] files=folder.listFiles();if(files!=null)for(File f:files)if(f.getName().endsWith(".json"))try{String id=f.getName().replace(".json","");JSONObject item=read(id);if(new File(folder,id+".m4a").isFile())rows.add(item);}catch(Exception ignored){}Collections.sort(rows,(a,b)->Long.compare(b.optLong("created"),a.optLong("created")));MainActivity.emit("recordings",new JSONObject().put("rows",new JSONArray(rows)));}catch(Exception e){event("error","Daftar rekaman belum dapat dibaca.");}}
 final Runnable tick=new Runnable(){public void run(){report();if(player!=null&&player.isPlaying())handler.postDelayed(this,300);}};
 void report(){try{MainActivity.emit("recordingPlayback",new JSONObject().put("id",playingId).put("playing",player!=null&&player.isPlaying()).put("position",player==null?0:player.getCurrentPosition()).put("duration",player==null?0:player.getDuration()));}catch(Exception ignored){}}
 void play(String id){if(busy()){event("error","Hentikan rekaman dahulu sebelum mendengarkan.");return;}control("stop");try{read(id);if(PlaybackService.instance!=null)PlaybackService.instance.stopPlayback();player=new MediaPlayer();player.setDataSource(new File(folder,id+".m4a").getPath());player.prepare();playingId=id;player.setOnCompletionListener(p->{handler.removeCallbacks(tick);report();});player.setOnErrorListener((p,w,e)->{control("stop");event("error","Rekaman belum dapat diputar.");return true;});player.start();tick.run();}catch(Exception e){control("stop");event("error","Rekaman belum dapat diputar.");}}
 void control(String action){if(player==null)return;try{if("stop".equals(action)){handler.removeCallbacks(tick);player.release();player=null;playingId="";report();}else if("pause".equals(action)){player.pause();handler.removeCallbacks(tick);report();}else if("toggle".equals(action)){if(player.isPlaying())control("pause");else{if(PlaybackService.instance!=null)PlaybackService.instance.stopPlayback();player.start();tick.run();}}}catch(Exception ignored){}}
 void seek(int ms){if(player!=null){player.seekTo(Math.max(0,Math.min(ms,player.getDuration())));report();}}
 void confirmDelete(String id){
  if(busy()){activity.message("Hentikan perekaman sebelum menghapus rekaman.");return;}
  try{JSONObject item=read(id);new android.app.AlertDialog.Builder(activity).setTitle("Hapus rekaman hafalan?").setMessage(Store.name(item.getInt("surah"))+" | Ayat "+item.getInt("first")+"-"+item.getInt("last")+"\nRekaman ini akan dihapus permanen dari perangkat.").setNegativeButton("Batal",null).setPositiveButton("Hapus",(dialog,which)->{
   try{if(id.equals(playingId))control("stop");File audio=new File(folder,id+".m4a"),meta=new File(folder,id+".json");if(audio.exists()&&!audio.delete())throw new IOException("audio");if(meta.exists()&&!meta.delete())throw new IOException("metadata");if(current!=null&&id.equals(current.optString("id")))current=null;MainActivity.emit("recordingDeleted",new JSONObject().put("id",id));list();}catch(Exception e){event("error","Rekaman belum dapat dihapus. Coba lagi.");list();}
  }).show();}catch(Exception e){event("error","Rekaman tidak ditemukan.");list();}
 }
 void close(){pending=null;stop();control("stop");handler.removeCallbacksAndMessages(null);}
}
