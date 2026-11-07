package id.murojaah.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import org.json.*;
import java.io.*;
import java.util.Locale;

/** Verified page images in persistent app storage, independent of WebView's HTTP cache. */
final class MushafCache {
 static File folder(Context c){return new File(c.getFilesDir(),"mushaf/madani-hafs-1441-v1");}
 static String filename(int page){if(page<1||page>604)throw new IllegalArgumentException("Halaman 1-604");return String.format(Locale.US,"%03d.webp",page);}
 static int pageFromPath(String path){if(path==null||!path.matches("/mushaf/[0-9]{3}[.]webp"))throw new IllegalArgumentException("Path halaman tidak valid");int page=Integer.parseInt(path.substring(8,11));filename(page);return page;}
 static String url(int page){return "https://adhan.trinadhthatakula.com/mushaf/madani-hafs-1441-v1/"+filename(page);}
 static boolean valid(File file){if(!file.isFile()||file.length()<32)return false;BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getPath(),options);return options.outWidth>0&&options.outHeight>0;}
 static InputStream open(Context c,int page)throws Exception{
  File target=new File(folder(c),filename(page));
  if(valid(target))return new FileInputStream(target);
  byte[] data=Store.fetch(url(page),8000000);
  BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(data,0,data.length,bounds);
  if(bounds.outWidth<1||bounds.outHeight<1||(long)bounds.outWidth*bounds.outHeight>20000000)throw new IOException("Gambar mushaf tidak valid");
  Bitmap bitmap=BitmapFactory.decodeByteArray(data,0,data.length);if(bitmap==null)throw new IOException("Gambar tidak lengkap");bitmap.recycle();
  File temp=null;
  try{
   if(!target.getParentFile().mkdirs()&&!target.getParentFile().isDirectory())throw new IOException("Penyimpanan");
   temp=File.createTempFile("page-",".tmp",target.getParentFile());
   try(FileOutputStream out=new FileOutputStream(temp)){out.write(data);out.getFD().sync();}
   if(!temp.renameTo(target))throw new IOException("Tidak dapat menyimpan halaman");
  }catch(IOException ignored){/* Reading still works if storage is full; UI reports not saved. */}
  finally{if(temp!=null)temp.delete();}
  return new ByteArrayInputStream(data);
 }
 static JSONObject info(Context c,int current)throws Exception{
  JSONArray pages=new JSONArray();long bytes=0;
  for(int page=1;page<=604;page++){File file=new File(folder(c),filename(page));if(valid(file)){pages.put(page);bytes+=file.length();}}
  return new JSONObject().put("page",current).put("saved",current>=1&&current<=604&&valid(new File(folder(c),filename(current)))).put("pages",pages).put("count",pages.length()).put("bytes",bytes);
 }
}
