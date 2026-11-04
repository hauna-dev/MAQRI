package id.murojaah.app;

import android.content.Context;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class Store {
 static final Map<String,String> RECITERS = new LinkedHashMap<>();
 static { RECITERS.put("alafasy", "Alafasy_64kbps"); RECITERS.put("husary", "Husary_64kbps"); RECITERS.put("sudais", "Abdurrahmaan_As-Sudais_64kbps"); RECITERS.put("minshawi", "Minshawy_Murattal_128kbps"); }
 static JSONArray surahs,pages;
 static synchronized void init(Context context) throws Exception {
  if (surahs == null) try(InputStream in=context.getAssets().open("surahs.json")){surahs=new JSONArray(new String(read(in,200000),StandardCharsets.UTF_8));}
  if (pages == null) try(InputStream in=context.getAssets().open("pages.json")){pages=new JSONArray(new String(read(in,100000),StandardCharsets.UTF_8));}
 }
 static void validate(int s,int a,int b) throws Exception {
  if(s<1||s>114||a<1||b<a||b>surahs.getJSONObject(s-1).getInt("verses_count")||b-a+1>100) throw new Exception("Periksa surat dan rentang ayat. Maksimal 100 ayat.");
 }
 static String name(int s) {try{return surahs.getJSONObject(s-1).getString("name_simple");}catch(Exception e){return "Surat "+s;}}
 static String filename(int s,int a){return String.format(Locale.US,"%03d%03d.mp3",s,a);}
 static File audio(Context c,String q,int s,int a){return new File(new File(c.getFilesDir(),"audio/"+q),filename(s,a));}
 static byte[] read(InputStream in,int max) throws IOException {
  ByteArrayOutputStream out=new ByteArrayOutputStream(); byte[] buf=new byte[16384];int n;
  while((n=in.read(buf))!=-1){if(out.size()+n>max)throw new IOException("Data terlalu besar");out.write(buf,0,n);}return out.toByteArray();
 }
 static byte[] fetch(String url,int max) throws Exception {
  if(!url.startsWith("https://"))throw new IOException("Koneksi harus HTTPS");
  HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection(); c.setConnectTimeout(15000);c.setReadTimeout(25000);
  c.setRequestProperty("User-Agent","Mozilla/5.0 Murojaah/1.0");
  try {if(c.getResponseCode()!=200)throw new IOException("Sumber online tidak tersedia ("+c.getResponseCode()+")");try(InputStream in=c.getInputStream()){return read(in,max);}} finally{c.disconnect();}
 }
 static synchronized File download(Context c,String q,int s,int a) throws Exception {
  String folder=RECITERS.get(q);if(folder==null)throw new IOException("Qari tidak dikenali");
  File target=audio(c,q,s,a);if(target.isFile()&&target.length()>100)return target;
  byte[] data=fetch("https://everyayah.com/data/"+folder+"/"+filename(s,a),12000000);
  if(data.length<100||!(data[0]=='I'&&data[1]=='D'&&data[2]=='3')&&!((data[0]&255)==255&&(data[1]&224)==224))throw new IOException("Sumber tidak mengirim MP3 yang valid");
  target.getParentFile().mkdirs(); File temp=File.createTempFile("audio-",".tmp",target.getParentFile());
  try{try(FileOutputStream out=new FileOutputStream(temp)){out.write(data);}if(!temp.renameTo(target))throw new IOException("Tidak dapat menyimpan audio");}finally{temp.delete();}return target;
 }
 static boolean bundled(Context c){try{return c.getAssets().list("audio").length>0;}catch(Exception e){return false;}}
}
