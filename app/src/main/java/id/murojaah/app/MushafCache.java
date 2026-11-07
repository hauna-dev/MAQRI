package id.murojaah.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import org.json.*;
import java.io.*;
import java.util.Locale;

/** Verified page images in persistent app storage, independent of WebView's HTTP cache. */
final class MushafCache {
 enum Edition {
  MADANI_1441("1441","madani-hafs-1441-v1","/mushaf/","","webp",
    "https://adhan.trinadhthatakula.com/mushaf/madani-hafs-1441-v1/"),
  MADANI_1405("1405","madani-hafs-1405","/mushaf/1405/","page","png",
    "https://files.quran.app/hafs/madani/width_1260/");

  final String id,folder,pathPrefix,filenamePrefix,extension,baseUrl;
  Edition(String id,String folder,String pathPrefix,String filenamePrefix,String extension,String baseUrl){
   this.id=id;
   this.folder=folder;
   this.pathPrefix=pathPrefix;
   this.filenamePrefix=filenamePrefix;
   this.extension=extension;
   this.baseUrl=baseUrl;
  }
  static Edition byId(String id){
   for(Edition edition:values())if(edition.id.equals(id))return edition;
   throw new IllegalArgumentException("Edisi Mushaf tidak valid");
  }
  static Edition fromPath(String path){
   return path.startsWith(MADANI_1405.pathPrefix)?MADANI_1405:MADANI_1441;
  }
  int pageFromPath(String path){
   if(!path.startsWith(pathPrefix))throw new IllegalArgumentException("Path halaman tidak valid");
   String name=path.substring(pathPrefix.length());
   if(!name.matches("[0-9]{3}[.]"+extension))throw new IllegalArgumentException("Path halaman tidak valid");
   int page=Integer.parseInt(name.substring(0,3));
   filename(page);
   return page;
  }
  String filename(int page){
   if(page<1||page>604)throw new IllegalArgumentException("Halaman 1-604");
   return String.format(Locale.US,"%03d.%s",page,extension);
  }
  String mime(){return "image/"+extension;}
  String url(int page){return baseUrl+filenamePrefix+filename(page);}
  File file(Context context,int page){
   return new File(new File(context.getFilesDir(),"mushaf/"+folder),filename(page));
  }
 }
 static boolean valid(File file){if(!file.isFile()||file.length()<32)return false;BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getPath(),options);return options.outWidth>0&&options.outHeight>0;}
 static InputStream open(Context c,Edition edition,int page)throws Exception{
  File target=edition.file(c,page);
  if(valid(target))return new FileInputStream(target);
  byte[] data=Store.fetch(edition.url(page),8000000);
  BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(data,0,data.length,bounds);
  if(!edition.mime().equals(bounds.outMimeType)||bounds.outWidth<1||bounds.outHeight<1||(long)bounds.outWidth*bounds.outHeight>20000000)throw new IOException("Gambar mushaf tidak valid");
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
 static JSONObject info(Context c,Edition edition,int current)throws Exception{
  JSONArray pages=new JSONArray();long bytes=0;
  for(int page=1;page<=604;page++){File file=edition.file(c,page);if(valid(file)){pages.put(page);bytes+=file.length();}}
  return new JSONObject().put("edition",edition.id).put("page",current).put("saved",current>=1&&current<=604&&valid(edition.file(c,current))).put("pages",pages).put("count",pages.length()).put("bytes",bytes);
 }
}
