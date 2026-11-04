package id.murojaah.app;

import android.app.*;
import android.app.job.*;
import android.content.*;
import android.content.pm.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

final class AppUpdater {
 static final ExecutorService IO=Executors.newSingleThreadExecutor();static final AtomicBoolean checking=new AtomicBoolean(false);
 static final String PREFS="maqri_updates";static final int JOB=6017;
 static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);}
 static long code(PackageInfo info){return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;}
 static PackageInfo installed(Context c)throws Exception{return c.getPackageManager().getPackageInfo(c.getPackageName(),Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES);}
 static File verifiedFile(Context c){return new File(c.getFilesDir(),"updates/MAQRI-update.apk");}
 static File downloadFile(Context c){return new File(c.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),"MAQRI-update.apk");}
 static void state(Context c,String state){prefs(c).edit().putString("state",state).apply();emit(c);}
 static JSONObject status(Context c){try{
  SharedPreferences p=prefs(c);String state=p.getString("state","idle");
  if("ready".equals(state)&&(!verifiedFile(c).isFile()||p.getLong("versionCode",0)<=code(installed(c)))){p.edit().putString("state","current").apply();state="current";}
  return new JSONObject().put("state",state).put("version",installed(c).versionName).put("newVersion",p.getString("versionName","")).put("percent",p.getInt("percent",0));
 }catch(Exception e){return new JSONObject();}}
 static void emit(Context c){MainActivity.emit("update",status(c));}
 static void schedule(Context c){try{
  c.getSystemService(JobScheduler.class).schedule(new JobInfo.Builder(JOB,new ComponentName(c,UpdateJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(12*60*60*1000L).setPersisted(true).build());
 }catch(Exception ignored){}}
 static void check(Context context,boolean manual){check(context,manual,null);}
 static void check(Context context,boolean manual,Runnable done){Context c=context.getApplicationContext();IO.execute(()->{try{checkNow(c,manual);}finally{if(done!=null)done.run();}});}
 static void checkNow(Context c,boolean manual){if(!checking.compareAndSet(false,true))return;
  try{
   refreshNow(c);SharedPreferences p=prefs(c);String current=p.getString("state","idle");
   if("ready".equals(current)||p.getLong("downloadId",-1)>0){emit(c);return;}
   JSONObject config;try(InputStream in=c.getAssets().open("update-config.json")){config=new JSONObject(new String(Store.read(in,10000),StandardCharsets.UTF_8));}
   String repo=config.getString("repository");if(!repo.matches("[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+"))throw new IOException();
   long interval=Math.max(1,config.optInt("checkIntervalHours",6))*3600000L;
   if(!manual&&System.currentTimeMillis()-p.getLong("lastCheck",0)<interval){emit(c);return;}
   state(c,"checking");p.edit().putLong("lastCheck",System.currentTimeMillis()).apply();
   JSONObject release;
   try{release=new JSONObject(new String(Store.fetch("https://api.github.com/repos/"+repo+"/releases/latest",1000000),StandardCharsets.UTF_8));}
   catch(IOException e){state(c,"unavailable");return;}
   if(release.optBoolean("draft")||release.optBoolean("prerelease")){state(c,"current");return;}
   JSONArray assets=release.getJSONArray("assets");JSONObject manifestAsset=null;
   for(int i=0;i<assets.length();i++){JSONObject asset=assets.getJSONObject(i);if("update.json".equals(asset.optString("name")))manifestAsset=asset;}
   if(manifestAsset==null){state(c,"current");return;}
   String manifestUrl=manifestAsset.getString("browser_download_url");if(!UpdatePolicy.trustedAsset(manifestUrl,repo))throw new IOException();
   JSONObject update=new JSONObject(new String(Store.fetch(manifestUrl,30000),StandardCharsets.UTF_8));
   long version=update.getLong("versionCode"),size=update.getLong("size");String filename=update.getString("apk"),sha=update.getString("sha256");
   UpdatePolicy.validate(c.getPackageName(),update.getString("packageName"),version,filename,sha,size);
   if(version<=code(installed(c))){state(c,"current");return;}
   JSONObject apk=null;for(int i=0;i<assets.length();i++){JSONObject asset=assets.getJSONObject(i);if(filename.equals(asset.optString("name")))apk=asset;}
   if(apk==null||apk.optLong("size")!=size)throw new IOException();String url=apk.getString("browser_download_url");if(!UpdatePolicy.trustedAsset(url,repo))throw new IOException();
   File old=downloadFile(c);if(old.exists())old.delete();
   DownloadManager.Request request=new DownloadManager.Request(Uri.parse(url)).setTitle("Pembaruan MAQRI").setDescription("Mengunduh versi "+update.getString("versionName")).setMimeType("application/vnd.android.package-archive").setAllowedOverRoaming(false).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE).setDestinationInExternalFilesDir(c,Environment.DIRECTORY_DOWNLOADS,"MAQRI-update.apk");
   // Metadata is saved first so a fast completed download can be verified.
   p.edit().putLong("versionCode",version).putString("versionName",update.getString("versionName")).putString("sha256",sha.toLowerCase(Locale.ROOT)).putLong("size",size).putInt("percent",0).apply();
   long id=c.getSystemService(DownloadManager.class).enqueue(request);p.edit().putLong("downloadId",id).apply();state(c,"downloading");
  }catch(Exception e){state(c,"error");}finally{checking.set(false);}
 }
 static void refresh(Context context){Context c=context.getApplicationContext();IO.execute(()->refreshNow(c));}
 static void refreshNow(Context c){SharedPreferences p=prefs(c);long id=p.getLong("downloadId",-1);if(id<0){emit(c);return;}
  try(Cursor cursor=c.getSystemService(DownloadManager.class).query(new DownloadManager.Query().setFilterById(id))){
   if(cursor==null||!cursor.moveToFirst()){p.edit().remove("downloadId").apply();state(c,"idle");return;}
   int status=cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
   if(status==DownloadManager.STATUS_FAILED){p.edit().remove("downloadId").apply();state(c,"error");return;}
   if(status!=DownloadManager.STATUS_SUCCESSFUL){long downloaded=cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)),total=cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));p.edit().putInt("percent",total>0?(int)(100*downloaded/total):0).apply();state(c,"downloading");return;}
   state(c,"verifying");File file=downloadFile(c);
   if(file.length()!=p.getLong("size",0)||!sha(file).equals(p.getString("sha256","")))throw new IOException();
   File verified=verifiedFile(c);verified.getParentFile().mkdirs();File stage=new File(verified.getParentFile(),"update.tmp");
   try(InputStream in=new FileInputStream(file);OutputStream out=new FileOutputStream(stage)){byte[] buffer=new byte[16384];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);}
   if(!sha(stage).equals(p.getString("sha256",""))||!stage.renameTo(verified))throw new IOException();
   if(!validApk(c,verified))throw new IOException();
   p.edit().remove("downloadId").putInt("percent",100).apply();c.getSystemService(DownloadManager.class).remove(id);state(c,"ready");notifyReady(c);
  }catch(Exception e){p.edit().remove("downloadId").apply();verifiedFile(c).delete();c.getSystemService(DownloadManager.class).remove(id);state(c,"error");}
 }
 static String sha(File file)throws Exception{MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(file)){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)digest.update(b,0,n);}StringBuilder result=new StringBuilder();for(byte b:digest.digest())result.append(String.format(Locale.ROOT,"%02x",b&255));return result.toString();}
 static Set<String> signatures(PackageInfo info){Set<String> result=new HashSet<>();android.content.pm.Signature[] signatures=Build.VERSION.SDK_INT>=28?(info.signingInfo==null?null:info.signingInfo.getApkContentsSigners()):info.signatures;if(signatures!=null)for(android.content.pm.Signature signature:signatures)result.add(signature.toCharsString());return result;}
 static boolean validApk(Context c,File file)throws Exception{
  int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;PackageInfo remote=c.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(),flags),local=installed(c);
  Set<String> expected=signatures(local);
  return remote!=null&&c.getPackageName().equals(remote.packageName)&&code(remote)>code(local)&&code(remote)==prefs(c).getLong("versionCode",0)&&!expected.isEmpty()&&expected.equals(signatures(remote));
 }
 static void notifyReady(Context c){try{NotificationManager nm=c.getSystemService(NotificationManager.class);nm.createNotificationChannel(new NotificationChannel("updates","Pembaruan aplikasi",NotificationManager.IMPORTANCE_DEFAULT));PendingIntent open=PendingIntent.getActivity(c,701,new Intent(c,MainActivity.class).setAction("install-update"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  nm.notify(701,new Notification.Builder(c,"updates").setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle("Pembaruan MAQRI siap").setContentText("Ketuk untuk memasang versi terbaru.").setContentIntent(open).setAutoCancel(true).build());}catch(Exception ignored){}}
 static void install(MainActivity activity){Context c=activity.getApplicationContext();IO.execute(()->{try{
  File file=verifiedFile(c);if(!sha(file).equals(prefs(c).getString("sha256",""))||!validApk(c,file))throw new IOException();
  activity.runOnUiThread(()->{
   if(!activity.getPackageManager().canRequestPackageInstalls()){
    new AlertDialog.Builder(activity).setTitle("Izinkan pemasangan pembaruan").setMessage("Android memerlukan izin pemasangan untuk MAQRI. Setelah mengizinkan, kembali ke aplikasi untuk melanjutkan.").setNegativeButton("Nanti",null).setPositiveButton("Buka pengaturan",(d,w)->{prefs(c).edit().putBoolean("resumeInstall",true).apply();activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+c.getPackageName())));}).show();return;
   }
   Intent intent=new Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse("content://"+c.getPackageName()+".updates/apk"),"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
   try{activity.startActivity(intent);}catch(Exception e){activity.message("Pemasang Android tidak dapat dibuka.");}
  });
 }catch(Exception e){state(c,"error");activity.message("Berkas pembaruan belum siap. Periksa pembaruan lagi.");}});}
}
