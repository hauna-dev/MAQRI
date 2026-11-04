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
 int surah=1,first=1,last=7,verse=1,repeat=1,round=1,generation=0;String qari="minshawi",status="idle",error="";boolean ready=false,autoPlay=true;
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
  if("play".equals(action)){
   try{int s=intent.getIntExtra("surah",1),a=intent.getIntExtra("first",1),b=intent.getIntExtra("last",7);Store.validate(s,a,b);
    String q=intent.getStringExtra("qari");if(!Store.RECITERS.containsKey(q)&&!"local".equals(q))throw new Exception("Qari tidak tersedia");
    surah=s;first=a;last=b;verse=a;qari=q;repeat=Math.max(1,Math.min(99,intent.getIntExtra("repeat",1)));round=1;autoPlay=true;load();
   }catch(Exception e){fail(e.getMessage());}
  }else if("toggle".equals(action)){toggle(!ready||!player.isPlaying());}
  else if("next".equals(action))move(1);else if("prev".equals(action))move(-1);else if("stop".equals(action))stopPlayback();
  return START_NOT_STICKY;
 }
 void load(){
  int token=++generation;ready=false;release();status="loading";error="";emit();
  final int s=surah,a=verse;final String q=qari;
  io.execute(()->{try{
   File file=null;if(!"local".equals(q))file=Store.download(this,q,s,a);
   final File source=file;
   main.post(()->{if(token!=generation)return;try{
    player=new MediaPlayer();player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);
    if("local".equals(q)){try(AssetFileDescriptor fd=getAssets().openFd("audio/"+Store.filename(s,a))){player.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}}else player.setDataSource(source.getAbsolutePath());
    player.setOnPreparedListener(p->{if(token!=generation)return;ready=true;if(autoPlay&&audioManager.requestAudioFocus(focus)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED){p.start();status="playing";}else{status="paused";autoPlay=false;}update();});
    player.setOnCompletionListener(p->{if(verse<last){verse++;load();}else if(round<repeat){round++;verse=first;load();}else{status="completed";autoPlay=false;update();stopForeground(false);}});
    player.setOnErrorListener((p,what,extra)->{fail("Audio tidak dapat diputar. Coba ulang atau pilih qari lain.");return true;});player.prepareAsync();
   }catch(Exception e){fail("Audio gagal dibuka. Coba lagi.");}});
  }catch(Exception e){main.post(()->{if(token==generation)fail("Audio belum tersedia offline. Periksa koneksi lalu coba lagi.");});}});
 }
 void toggle(boolean play){autoPlay=play;if(ready){if(play){if("completed".equals(status)){round=1;verse=first;load();return;}startForeground(1,notification());if(audioManager.requestAudioFocus(focus)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED){player.start();status="playing";}}else{player.pause();status="paused";audioManager.abandonAudioFocusRequest(focus);}update();}else emit();}
 void move(int delta){if(verse+delta<first||verse+delta>last)return;verse+=delta;autoPlay=true;load();}
 void fail(String message){status="error";error=message==null?"Terjadi kesalahan audio":message;release();ready=false;update();stopForeground(false);}
 void stopPlayback(){generation++;release();ready=false;status="idle";emit();stopForeground(true);stopSelf();}
 void release(){if(player!=null){try{player.release();}catch(Exception ignored){}player=null;}}
 final BroadcastReceiver noisy=new BroadcastReceiver(){public void onReceive(Context context,Intent intent){if(ready)toggle(false);}};
 void emit(){try{JSONObject obj=new JSONObject().put("status",status).put("surah",surah).put("verse",verse).put("first",first).put("last",last).put("round",round).put("repeat",repeat).put("qari",qari).put("error",error);
  int pos=0,duration=0;if(ready&&player!=null){try{pos=player.getCurrentPosition();duration=player.getDuration();}catch(Exception ignored){}}
  obj.put("position",pos).put("duration",duration);lastState=obj.toString();MainActivity.emit("playback",obj);
 }catch(Exception ignored){}}
 final Runnable ticker=new Runnable(){public void run(){emit();main.postDelayed(this,500);}};
 void update(){emit();session.setMetadata(new MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE,Store.name(surah)+" · Ayat "+verse).putString(MediaMetadata.METADATA_KEY_ARTIST,"MAQRI · Putaran "+round+"/"+repeat).build());
  session.setPlaybackState(new PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_SKIP_TO_NEXT|PlaybackState.ACTION_SKIP_TO_PREVIOUS|PlaybackState.ACTION_STOP|PlaybackState.ACTION_SEEK_TO).setState("playing".equals(status)?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED,0,1f).build());getSystemService(NotificationManager.class).notify(1,notification());}
 PendingIntent action(String value){return PendingIntent.getService(this,value.hashCode(),new Intent(this,PlaybackService.class).setAction(value),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);}
 Notification notification(){PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  return new Notification.Builder(this,"playback").setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(Store.name(surah)+" · Ayat "+verse).setContentText("loading".equals(status)?"Menyiapkan audio…":"Putaran "+round+" dari "+repeat).setContentIntent(open).setOngoing("playing".equals(status)||"loading".equals(status))
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous,"Sebelumnya",action("prev")).build())
   .addAction(new Notification.Action.Builder("playing".equals(status)?android.R.drawable.ic_media_pause:android.R.drawable.ic_media_play,"playing".equals(status)?"Jeda":"Putar",action("toggle")).build())
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next,"Berikutnya",action("next")).build())
   .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel,"Hentikan",action("stop")).build())
   .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0,1,2)).build();}
 public void onDestroy(){generation++;main.removeCallbacks(ticker);release();io.shutdownNow();session.release();audioManager.abandonAudioFocusRequest(focus);unregisterReceiver(noisy);instance=null;super.onDestroy();}
}
