package id.murojaah.app;

import android.app.*;
import android.content.*;
import android.content.res.AssetFileDescriptor;
import android.media.*;
import android.media.session.*;
import android.os.*;
import org.json.*;
import java.io.*;
import java.util.concurrent.*;

public class PlaybackService extends Service {
 static PlaybackService instance; static volatile String lastState="{}";
 final Handler main=new Handler(Looper.getMainLooper()); final ExecutorService io=Executors.newSingleThreadExecutor();
 MediaPlayer player; MediaSession session; AudioManager audioManager;AudioFocusRequest focus;
 int surah=1,first=1,last=7,verse=1,repeat=1,round=1,ayahRepeat=1,verseRound=1,generation=0;String qari="minshawi",status="idle",error="";boolean ready=false,autoPlay=true,tafsir=false;long lastPersist=0;
 int[][] reviewQueue=null;
 int reviewIndex=0;
 public IBinder onBind(Intent intent){return null;}
 public void onCreate(){super.onCreate();instance=this;
  try{Store.init(this);}catch(Exception ignored){}
  NotificationManager nm=getSystemService(NotificationManager.class);nm.createNotificationChannel(new NotificationChannel("playback","Audio murojaah",NotificationManager.IMPORTANCE_LOW));
  audioManager=getSystemService(AudioManager.class);
  focus=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build()).setOnAudioFocusChangeListener(change->{if(change<0&&ready)toggle(false);},main).build();
  registerReceiver(noisy,new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
  session=new MediaSession(this,"MAQRI");session.setCallback(new MediaSession.Callback(){public void onPlay(){toggle(true);}public void onPause(){toggle(false);}public void onSkipToNext(){move(1);}public void onSkipToPrevious(){move(-1);}public void onStop(){stopPlayback();}public void onSeekTo(long pos){if(ready)player.seekTo((int)pos);}});session.setActive(true);
  main.post(ticker);
 }
 public int onStartCommand(Intent intent,int flags,int id){
  startForeground(1,notification());
  String action=intent==null?"":intent.getAction();
  if("tafsir".equals(action)){
   int s=intent.getIntExtra("surah",0);if(s<1||s>114){fail("Surat tafsir tidak valid.");return START_NOT_STICKY;}
   persist();reviewQueue=null;tafsir=true;surah=s;verse=first=last=round=repeat=ayahRepeat=verseRound=1;qari="tafsir-saadi";autoPlay=true;load();
  }else if("play".equals(action)||"review".equals(action)){
   persist();
   try{
    String q=intent.getStringExtra("qari");
    if(!Store.RECITERS.containsKey(q)&&!"local".equals(q))throw new Exception("Qari tidak tersedia");
    if("review".equals(action)){
     int[][] queue=parseReviewQueue(intent.getStringExtra("queue"));
     reviewQueue=queue;
     selectReviewVerse(0);
     repeat=1;
    }else{
     int s=intent.getIntExtra("surah",1),a=intent.getIntExtra("first",1),b=intent.getIntExtra("last",7);
     int startVerse=intent.getIntExtra("verse",a);
     Store.validate(s,a,b);
     if(startVerse<a||startVerse>b)throw new Exception("Ayat lanjutan di luar rentang.");
     reviewQueue=null;
     surah=s;
     first=a;
     last=b;
     verse=startVerse;
     repeat=Math.max(1,Math.min(99,intent.getIntExtra("repeat",1)));
    }
    tafsir=false;
    qari=q;
    round=verseRound=1;
    ayahRepeat=Math.max(1,Math.min(99,intent.getIntExtra("ayahRepeat",1)));
    autoPlay=true;
    load();
   }catch(Exception e){fail(e.getMessage());}
  }else if("toggle".equals(action)){toggle(!ready||!player.isPlaying());}
  else if("next".equals(action))move(1);else if("prev".equals(action))move(-1);else if("stop".equals(action))stopPlayback();
  return START_NOT_STICKY;
 }
 int[][] parseReviewQueue(String json) throws Exception {
  JSONArray items=new JSONArray(json);
  if(items.length()==0||items.length()>6236)throw new Exception("Daftar ayat tidak valid.");
  int[][] queue=new int[items.length()][2];
  for(int i=0;i<items.length();i++){
   JSONObject item=items.getJSONObject(i);
   int s=item.getInt("s"), a=item.getInt("a");
   Store.validate(s,a,a);
   queue[i][0]=s;
   queue[i][1]=a;
  }
  return queue;
 }
 void selectReviewVerse(int index){
  reviewIndex=index;
  surah=reviewQueue[index][0];
  verse=first=last=reviewQueue[index][1];
  verseRound=1;
 }
 void saveRecitationProgress(){
  if(tafsir||reviewQueue!=null)return;
  try{
   JSONObject range=new JSONObject().put("s",surah).put("a",first).put("b",last)
     .put("verse",verse).put("q",qari).put("repeat",repeat).put("ayahRepeat",ayahRepeat);
   getSharedPreferences("recitation-progress",MODE_PRIVATE).edit().putString("range",range.toString()).apply();
  }catch(JSONException ignored){}
 }
 void load(){
  saveRecitationProgress();
  int token=++generation;ready=false;release();status="loading";error="";emit();
  final int s=surah,a=verse;final String q=qari;
  io.execute(()->{try{
   File file=null;if(!"local".equals(q)&&!"tafsir-saadi".equals(q))file=Store.download(this,q,s,a);
   final File source=file;
   main.post(()->{if(token!=generation)return;try{
    player=new MediaPlayer();player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);
    if("tafsir-saadi".equals(q))player.setDataSource("https://media.way2quran.com/tafsir/al-saadi/saadi-tafsir-subhan-reading/"+String.format(java.util.Locale.US,"%03d.mp3",s));else if("local".equals(q)){try(AssetFileDescriptor fd=getAssets().openFd("audio/"+Store.filename(s,a))){player.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}}else player.setDataSource(source.getAbsolutePath());
    player.setOnPreparedListener(p->{if(token!=generation)return;ready=true;if(tafsir){int saved=getSharedPreferences("tafsir-audio",0).getInt("position-"+surah,0);if(saved>0&&saved<p.getDuration()-1000)p.seekTo(saved);}if(autoPlay&&audioManager.requestAudioFocus(focus)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED){p.start();status="playing";}else{status="paused";autoPlay=false;}update();});
    player.setOnCompletionListener(p->{if(token!=generation)return;if(tafsir){status="completed";autoPlay=false;persist();update();stopForeground(false);}else if(verseRound<ayahRepeat){verseRound++;load();}else if(reviewQueue!=null&&reviewIndex+1<reviewQueue.length){selectReviewVerse(reviewIndex+1);load();}else if(verse<last){verse++;verseRound=1;load();}else if(round<repeat){round++;verse=first;verseRound=1;load();}else{status="completed";autoPlay=false;update();stopForeground(false);}});
    player.setOnErrorListener((p,what,extra)->{fail(tafsir?"Audio tafsir belum dapat diputar. Periksa koneksi lalu coba lagi.":"Audio tidak dapat diputar. Coba ulang atau pilih qari lain.");return true;});player.prepareAsync();
   }catch(Exception e){fail("Audio gagal dibuka. Coba lagi.");}});
  }catch(Exception e){main.post(()->{if(token==generation)fail("Audio belum tersedia offline. Periksa koneksi lalu coba lagi.");});}});
 }
 void persist(){if(!tafsir||!ready||player==null)return;try{android.content.SharedPreferences.Editor edit=getSharedPreferences("tafsir-audio",0).edit();if("completed".equals(status))edit.remove("position-"+surah);else edit.putInt("position-"+surah,player.getCurrentPosition());edit.apply();lastPersist=android.os.SystemClock.elapsedRealtime();}catch(Exception ignored){}}
 void toggle(boolean play){autoPlay=play;if(ready){if(play){if("completed".equals(status)){round=1;if(reviewQueue!=null)selectReviewVerse(0);else{verse=first;verseRound=1;}load();return;}startForeground(1,notification());if(audioManager.requestAudioFocus(focus)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED){player.start();status="playing";}}else{player.pause();status="paused";audioManager.abandonAudioFocusRequest(focus);persist();}update();}else emit();}
 void move(int delta){if(tafsir){if(surah+delta<1||surah+delta>114)return;persist();surah+=delta;autoPlay=true;load();return;}if(reviewQueue!=null){
   int index=reviewIndex+delta;
   if(index>=0&&index<reviewQueue.length){selectReviewVerse(index);autoPlay=true;load();}
   return;
  }if(verse+delta<first||verse+delta>last)return;verse+=delta;verseRound=1;autoPlay=true;load();}
 void fail(String message){status="error";error=message==null?"Terjadi kesalahan audio":message;release();ready=false;update();stopForeground(false);}
 void stopPlayback(){persist();generation++;release();ready=false;status="idle";emit();stopForeground(true);stopSelf();}
 void release(){if(player!=null){try{player.release();}catch(Exception ignored){}player=null;}}
 final BroadcastReceiver noisy=new BroadcastReceiver(){public void onReceive(Context context,Intent intent){if(ready)toggle(false);}};
 void emit(){try{JSONObject obj=new JSONObject().put("kind",tafsir?"tafsir":reviewQueue!=null?"review":"recitation").put("status",status).put("surah",surah).put("verse",verse).put("first",first).put("last",last).put("round",round).put("repeat",repeat).put("ayahRepeat",ayahRepeat).put("verseRound",verseRound).put("qari",qari).put("error",error);
  if(reviewQueue!=null)obj.put("reviewIndex",reviewIndex).put("reviewCount",reviewQueue.length);
  int pos=0,duration=0;if(ready&&player!=null){try{pos=player.getCurrentPosition();duration=player.getDuration();}catch(Exception ignored){}}
  obj.put("position",pos).put("duration",duration);lastState=obj.toString();MainActivity.emit("playback",obj);
 }catch(Exception ignored){}}
 final Runnable ticker=new Runnable(){public void run(){emit();if(tafsir&&"playing".equals(status)&&android.os.SystemClock.elapsedRealtime()-lastPersist>=5000)persist();main.postDelayed(this,500);}};
 String title(){return tafsir?"Tafsir As-Sa\u2019di | "+Store.name(surah):Store.name(surah)+" | Ayat "+verse;}
 void update(){emit();session.setMetadata(new MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE,title()).putString(MediaMetadata.METADATA_KEY_ARTIST,(tafsir?"Abdulrahman Al-Subhan | Way2Quran":"MAQRI | Ulang ayat "+verseRound+"/"+ayahRepeat+" | Rentang "+round+"/"+repeat)).build());
  session.setPlaybackState(new PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_SKIP_TO_NEXT|PlaybackState.ACTION_SKIP_TO_PREVIOUS|PlaybackState.ACTION_STOP|PlaybackState.ACTION_SEEK_TO).setState("playing".equals(status)?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED,ready&&player!=null?player.getCurrentPosition():0,1f).build());getSystemService(NotificationManager.class).notify(1,notification());}
 PendingIntent action(String value){return PendingIntent.getService(this,value.hashCode(),new Intent(this,PlaybackService.class).setAction(value),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);}
 Notification notification(){PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  return new Notification.Builder(this,"playback").setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(title()).setContentText("loading".equals(status)?"Menyiapkan audio…":(tafsir?"Abdulrahman Al-Subhan · Way2Quran":"Ulang ayat "+verseRound+"/"+ayahRepeat+" | Rentang "+round+"/"+repeat)).setContentIntent(open).setOngoing("playing".equals(status)||"loading".equals(status))
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous,"Sebelumnya",action("prev")).build())
   .addAction(new Notification.Action.Builder("playing".equals(status)?android.R.drawable.ic_media_pause:android.R.drawable.ic_media_play,"playing".equals(status)?"Jeda":"Putar",action("toggle")).build())
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next,"Berikutnya",action("next")).build())
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel,"Hentikan",action("stop")).build())
   .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0,1,2)).build();}
 public void onDestroy(){persist();generation++;main.removeCallbacks(ticker);release();io.shutdownNow();session.release();audioManager.abandonAudioFocusRequest(focus);unregisterReceiver(noisy);instance=null;super.onDestroy();}
}
