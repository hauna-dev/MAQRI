package id.murojaah.app;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.text.Html;
import android.webkit.*;
import android.view.*;
import org.json.*;
import java.io.*;
import java.lang.ref.WeakReference;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
 static WeakReference<MainActivity> active=new WeakReference<>(null);WebView web;
 HafalanRecorder hafalan;boolean mushafImmersive=false;
 final ExecutorService workers=Executors.newFixedThreadPool(3);final AtomicBoolean downloading=new AtomicBoolean(false);
 final Handler updateHandler=new Handler(Looper.getMainLooper());
 final Runnable updatePoll=new Runnable(){public void run(){if(AppUpdater.prefs(MainActivity.this).getLong("downloadId",-1)>0)AppUpdater.refresh(MainActivity.this);updateHandler.postDelayed(this,2500);}};
 static void emit(String type,JSONObject data){MainActivity a=active.get();if(a!=null)a.runOnUiThread(()->{if(a.web!=null)a.web.evaluateJavascript("window.onNativeEvent&&window.onNativeEvent("+JSONObject.quote(type)+","+data.toString()+")",null);});}
 void message(String text){try{emit("error",new JSONObject().put("message",text));}catch(Exception ignored){}}
 boolean systemDark(){return (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES;}
 void applyChromeTheme(String mode,boolean dark){
  getPreferences(MODE_PRIVATE).edit().putString("theme",mode).apply();
  int color=dark?Color.rgb(12,16,11):Color.rgb(243,246,239);
  getWindow().setStatusBarColor(color);getWindow().setNavigationBarColor(color);
  getWindow().getDecorView().setSystemUiVisibility(dark?0:View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  if(web!=null){web.setBackgroundColor(color);if(web.getParent() instanceof View)((View)web.getParent()).setBackgroundColor(color);}
 }
 public void onCreate(Bundle saved){super.onCreate(saved);active=new WeakReference<>(this);hafalan=new HafalanRecorder(this);
  String theme=getPreferences(MODE_PRIVATE).getString("theme","dark");boolean dark="dark".equals(theme)||("system".equals(theme)&&systemDark());applyChromeTheme(theme,dark);
  try{Store.init(this);}catch(Exception e){new AlertDialog.Builder(this).setMessage("Data surat tidak dapat dibuka").show();return;}
  android.widget.FrameLayout host=new android.widget.FrameLayout(this);web=new WebView(this);host.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(host);host.setBackgroundColor(dark?Color.rgb(12,16,11):Color.rgb(243,246,239));web.setBackgroundColor(dark?Color.rgb(12,16,11):Color.rgb(243,246,239));
  // Keep the local UI clear of the system bars, including Android 15 edge-to-edge.
  host.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(mushafImmersive?0:insets.getSystemWindowInsetLeft(),mushafImmersive?0:insets.getSystemWindowInsetTop(),mushafImmersive?0:insets.getSystemWindowInsetRight(),mushafImmersive?0:insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setBuiltInZoomControls(false);settings.setMediaPlaybackRequiresUserGesture(true);
  if(Build.VERSION.SDK_INT>=29)settings.setForceDark(WebSettings.FORCE_DARK_OFF);
  web.addJavascriptInterface(new Bridge(),"Android");
  web.setWebViewClient(new WebViewClient(){
   public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){Uri uri=request.getUrl();if(!"app.murojaah.local".equals(uri.getHost()))return null;
    String name=uri.getPath();if(name!=null&&name.startsWith("/mushaf/")){
     try{int page=MushafCache.pageFromPath(name);return new WebResourceResponse("image/webp",null,200,"OK",Collections.singletonMap("Cache-Control","no-store"),MushafCache.open(MainActivity.this,page));}catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",503,"Page Unavailable",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    }if(name==null||name.equals("/"))name="/index.html";if(name.contains(".."))return null;
    String mime=name.endsWith(".css")?"text/css":name.endsWith(".js")?"application/javascript":name.endsWith(".json")?"application/json":name.endsWith(".png")?"image/png":name.endsWith(".webp")?"image/webp":name.endsWith(".svg")?"image/svg+xml":"text/html";
    try{return new WebResourceResponse(mime,"UTF-8",getAssets().open(name.substring(1)));}catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}}
   public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if("app.murojaah.local".equals(u.getHost()))return false;if("https".equals(u.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;}
   public void onPageFinished(WebView v,String url){try{emit("playback",new JSONObject(PlaybackService.lastState));AppUpdater.emit(MainActivity.this);}catch(Exception ignored){}}
  });web.loadUrl("https://app.murojaah.local/");
  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},9);
  AppUpdater.schedule(this);
 }
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){super.onRequestPermissionsResult(request,permissions,grants);if(request==71)hafalan.permissionResult(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED);}
 void readerFullscreen(boolean enabled){
  mushafImmersive=enabled;
  int flags=enabled?View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION:0;
  if(!enabled){String theme=getPreferences(MODE_PRIVATE).getString("theme","dark");boolean dark="dark".equals(theme)||("system".equals(theme)&&systemDark());if(!dark)flags=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;}
  getWindow().getDecorView().setSystemUiVisibility(flags);if(web.getParent() instanceof View)((View)web.getParent()).requestApplyInsets();
  if(Build.VERSION.SDK_INT>=30){WindowInsetsController controller=getWindow().getInsetsController();if(controller!=null){if(enabled){controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);controller.hide(WindowInsets.Type.systemBars());}else controller.show(WindowInsets.Type.systemBars());}}
 }
 class Bridge {
  @JavascriptInterface public void mushafCacheInfo(int page){workers.execute(()->{try{emit("mushafCache",MushafCache.info(MainActivity.this,page));}catch(Exception ignored){}});}

  @JavascriptInterface public void mushafFullscreen(boolean enabled){runOnUiThread(()->readerFullscreen(enabled));}
  @JavascriptInterface public void recordingDelete(String id){runOnUiThread(()->hafalan.confirmDelete(id));}

  @JavascriptInterface public void playTafsir(int s){runOnUiThread(()->{if(s<1||s>114)return;if(hafalan.busy()){message("Hentikan rekaman sebelum memutar audio tafsir.");return;}hafalan.control("stop");startForegroundService(new Intent(MainActivity.this,PlaybackService.class).setAction("tafsir").putExtra("surah",s));});}

  @JavascriptInterface public void recordStart(int s,int a,int b){runOnUiThread(()->hafalan.start(s,a,b));}
  @JavascriptInterface public void recordStop(){runOnUiThread(()->hafalan.stop());}
  @JavascriptInterface public void recordings(){runOnUiThread(()->hafalan.list());}
  @JavascriptInterface public void recordingPlay(String id){runOnUiThread(()->hafalan.play(id));}
  @JavascriptInterface public void recordingControl(String action){runOnUiThread(()->hafalan.control(action));}
  @JavascriptInterface public void recordingSeek(int ms){runOnUiThread(()->hafalan.seek(ms));}

  @JavascriptInterface public String config(){try{return new JSONObject().put("surahs",Store.surahs).put("pages",Store.pages).put("bundled",Store.bundled(MainActivity.this)).put("theme",getPreferences(MODE_PRIVATE).getString("theme","dark")).put("systemDark",systemDark()).toString();}catch(Exception e){return "{}";}}
  @JavascriptInterface public void theme(String mode,boolean dark){if(!Arrays.asList("light","dark","system").contains(mode))return;runOnUiThread(()->applyChromeTheme(mode,dark));}
  @JavascriptInterface public void checkUpdates(){AppUpdater.check(MainActivity.this,true);}
  @JavascriptInterface public void updateStatus(){AppUpdater.refresh(MainActivity.this);}
  @JavascriptInterface public void installUpdate(){AppUpdater.install(MainActivity.this);}
  @JavascriptInterface public void play(int s,int a,int b,String q,int repeats){playWithAyahRepeat(s,a,b,q,repeats,1);}
  @JavascriptInterface public void playWithAyahRepeat(int s,int a,int b,String q,int repeats,int ayahRepeats){runOnUiThread(()->{try{if(hafalan.busy()){message("Hentikan rekaman sebelum memutar murottal.");return;}hafalan.control("stop");Store.validate(s,a,b);Intent intent=new Intent(MainActivity.this,PlaybackService.class).setAction("play").putExtra("surah",s).putExtra("first",a).putExtra("last",b).putExtra("qari",q).putExtra("repeat",repeats).putExtra("ayahRepeat",ayahRepeats);startForegroundService(intent);}catch(Exception e){message(e.getMessage());}});}
  @JavascriptInterface public void control(String action){if(!Arrays.asList("toggle","next","prev","stop").contains(action))return;runOnUiThread(()->{if("toggle".equals(action)){if(hafalan.busy())return;hafalan.control("pause");}if(PlaybackService.instance!=null)startService(new Intent(MainActivity.this,PlaybackService.class).setAction(action));});}
  @JavascriptInterface public void seek(int position){runOnUiThread(()->{PlaybackService s=PlaybackService.instance;if(s!=null&&s.ready&&s.player!=null)s.player.seekTo(Math.max(0,Math.min(position,s.player.getDuration())));});}
  @JavascriptInterface public void download(int s,int a,int b,String q){
   try{Store.validate(s,a,b);if(!Store.RECITERS.containsKey(q))throw new Exception("Audio koleksi lokal sudah tersedia.");}catch(Exception e){message(e.getMessage());return;}
   if(!downloading.compareAndSet(false,true)){message("Unduhan sebelumnya masih berjalan.");return;}
   workers.execute(()->{try{for(int verse=a;verse<=b;verse++){Store.download(MainActivity.this,q,s,verse);emit("download",new JSONObject().put("done",verse-a+1).put("total",b-a+1).put("finished",verse==b));}library();}catch(Exception e){message("Unduhan berhenti. Ayat yang berhasil sudah disimpan; periksa internet lalu lanjutkan.");}finally{downloading.set(false);}});
  }
  @JavascriptInterface public void library(){workers.execute(()->{try{JSONArray rows=new JSONArray();long bytes=0;int total=0;
   for(String q:Store.RECITERS.keySet())for(int s=1;s<=114;s++){int count=0,min=999,max=0;long size=0;for(int a=1;a<=Store.surahs.getJSONObject(s-1).getInt("verses_count");a++){File f=Store.audio(MainActivity.this,q,s,a);if(f.isFile()&&f.length()>100){count++;min=Math.min(min,a);max=a;size+=f.length();}}if(count>0){rows.put(new JSONObject().put("surah",s).put("qari",q).put("count",count).put("first",min).put("last",max));total+=count;bytes+=size;}}
   emit("library",new JSONObject().put("rows",rows).put("count",total).put("bytes",bytes).put("bundled",Store.bundled(MainActivity.this)));
  }catch(Exception e){message("Daftar unduhan tidak dapat dibaca.");}});}
  @JavascriptInterface public void tafsirIndonesia(int s,int a,int b,String requestId){workers.execute(()->{try{
   Store.validate(s,a,b);File folder=new File(getFilesDir(),"tafsir-id");folder.mkdirs();File cached=new File(folder,s+".html");String html;
   if(cached.isFile()){try(InputStream in=new FileInputStream(cached)){html=new String(Store.read(in,12000000),StandardCharsets.UTF_8);}}
   else{html=new String(Store.fetch(IndonesianTafsir.url(s),12000000),StandardCharsets.UTF_8);}
   Map<Integer,IndonesianTafsir.Section> sections=IndonesianTafsir.parse(html);
   if(!cached.isFile()){File temp=File.createTempFile("surah-",".tmp",folder);try{try(FileOutputStream out=new FileOutputStream(temp)){out.write(html.getBytes(StandardCharsets.UTF_8));}if(!temp.renameTo(cached))throw new IOException("Tidak dapat menyimpan tafsir");}finally{temp.delete();}}
   JSONArray verses=new JSONArray();Set<IndonesianTafsir.Section> shown=new HashSet<>();for(int verse=a;verse<=b;verse++){IndonesianTafsir.Section section=sections.get(verse);if(section!=null&&!shown.add(section))continue;String text=section==null?"":Html.fromHtml(section.html,Html.FROM_HTML_MODE_LEGACY).toString().trim();int first=section==null?verse:section.first,last=section==null?verse:section.last;verses.put(new JSONObject().put("verse",first).put("lastVerse",last).put("text",text).put("url",IndonesianTafsir.url(s)+"#aya-"+first));}
   emit("tafsir",new JSONObject().put("id",requestId).put("language","id").put("surah",s).put("first",a).put("last",b).put("verses",verses));
  }catch(Exception e){try{emit("tafsirError",new JSONObject().put("id",requestId).put("message","Tafsir Indonesia belum dapat dimuat. Periksa koneksi lalu coba lagi."));}catch(Exception ignored){}}});}
  @JavascriptInterface public void tafsir(int s,int a,int b,String requestId){workers.execute(()->{try{Store.validate(s,a,b);JSONArray verses=new JSONArray();long deadline=System.currentTimeMillis()+120000;
   File folder=new File(getFilesDir(),"tafsir");folder.mkdirs();
   for(int verse=a;verse<=b;verse++){if(System.currentTimeMillis()>deadline)throw new IOException("Rentang terlalu panjang. Coba ayat lebih sedikit.");String key=String.format(Locale.US,"%03d%03d.txt",s,verse);File file=new File(folder,key);String text;
    if(file.isFile()){try(InputStream in=new FileInputStream(file)){text=new String(Store.read(in,2000000),StandardCharsets.UTF_8);}}else{
     byte[] response=Store.fetch("https://tafsir.app/get.php?src=saadi&s="+s+"&a="+verse+"&ver=1",2000000);JSONObject data=new JSONObject(new String(response,StandardCharsets.UTF_8));if(!data.has("data")||!(data.get("data") instanceof String))throw new IOException("Format situs tafsir berubah");String raw=data.getString("data");text=Html.fromHtml(raw,Html.FROM_HTML_MODE_LEGACY).toString().trim();
     if(!text.isEmpty()){try(FileOutputStream out=new FileOutputStream(file)){out.write(text.getBytes(StandardCharsets.UTF_8));}}
    }
    verses.put(new JSONObject().put("verse",verse).put("text",text).put("url","https://tafsir.app/saadi/"+s+"/"+verse));
   }
   emit("tafsir",new JSONObject().put("id",requestId).put("surah",s).put("first",a).put("last",b).put("verses",verses));
  }catch(Exception e){try{emit("tafsirError",new JSONObject().put("id",requestId).put("message","Tafsir belum dapat dimuat. Periksa internet atau minta rentang lebih pendek."));}catch(Exception ignored){}}});}
  @JavascriptInterface public void clearDownloads(){if(downloading.get()){message("Tunggu unduhan selesai dahulu.");return;}runOnUiThread(()->new AlertDialog.Builder(MainActivity.this).setTitle("Hapus audio unduhan?").setMessage("Audio dapat diunduh kembali. Pengaturan dan mushaf tetap tersedia.").setNegativeButton("Batal",null).setPositiveButton("Hapus",(d,w)->{if(PlaybackService.instance!=null)PlaybackService.instance.stopPlayback();workers.execute(()->{delete(new File(getFilesDir(),"audio"));library();});}).show());}
  @JavascriptInterface public void openSource(String url){if(!(url.startsWith("https://saadi.islamenc.com/")||url.startsWith("https://way2quran.com/")||url.startsWith("https://tafsir.app/")||url.startsWith("https://sayahafiz.com/")||url.startsWith("https://adhan.trinadhthatakula.com/")||url.startsWith("https://everyayah.com/")))return;runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception ignored){}});}
 }
 static void delete(File file){File[] children=file.listFiles();if(children!=null)for(File child:children)delete(child);file.delete();}
 @Override public void onBackPressed(){web.evaluateJavascript("window.handleBack&&window.handleBack()",result->{if(!"true".equals(result))super.onBackPressed();});}
 @Override protected void onResume(){super.onResume();updateHandler.removeCallbacks(updatePoll);updateHandler.post(updatePoll);AppUpdater.check(this,false);boolean requested="install-update".equals(getIntent().getAction());if(requested)getIntent().setAction(null);boolean resume=AppUpdater.prefs(this).getBoolean("resumeInstall",false);AppUpdater.prefs(this).edit().remove("resumeInstall").apply();if(requested||(resume&&getPackageManager().canRequestPackageInstalls()))AppUpdater.install(this);}
 @Override protected void onPause(){hafalan.stop();hafalan.control("pause");updateHandler.removeCallbacks(updatePoll);super.onPause();}
 @Override protected void onDestroy(){hafalan.close();updateHandler.removeCallbacks(updatePoll);if(active.get()==this)active.clear();if(web!=null){web.removeJavascriptInterface("Android");web.destroy();web=null;}workers.shutdownNow();super.onDestroy();}
}
