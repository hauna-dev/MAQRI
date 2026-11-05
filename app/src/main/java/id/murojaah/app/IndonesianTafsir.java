package id.murojaah.app;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;

/** Extract the Indonesian portion belonging to each explicit ayah anchor. */
final class IndonesianTafsir {
 static final Pattern ANCHOR=Pattern.compile("<a\\b[^>]*\\bid\\s*=\\s*[\"']aya-(\\d+)[\"'][^>]*>",Pattern.CASE_INSENSITIVE);
 static final Pattern ARABIC=Pattern.compile("<div\\b[^>]*\\bclass\\s*=\\s*[\"'][^\"']*\\b_ar\\b[^\"']*[\"'][^>]*>.*?</div\\s*>",Pattern.CASE_INSENSITIVE|Pattern.DOTALL);
 static String url(int surah){if(surah<1||surah>114)throw new IllegalArgumentException("Surat tidak valid");return "https://saadi.islamenc.com/id/browse/sura/"+surah;}
 static final class Section {final int first,last;final String html;Section(int a,int b,String text){first=a;last=b;html=text;}}
 static Map<Integer,Section> parse(String html)throws IOException{
  Map<Integer,Section> result=new LinkedHashMap<>();
  Matcher anchors=ANCHOR.matcher(html);List<Integer> verses=new ArrayList<>(),starts=new ArrayList<>(),ends=new ArrayList<>();
  while(anchors.find()){verses.add(Integer.parseInt(anchors.group(1)));starts.add(anchors.start());ends.add(anchors.end());}
  if(verses.isEmpty())throw new IOException("Struktur sumber tafsir Indonesia berubah");
  int footer=html.toLowerCase(Locale.ROOT).indexOf("<footer",ends.get(ends.size()-1));
  if(footer<0)throw new IOException("Halaman tafsir tidak lengkap");
  List<Integer> pending=new ArrayList<>();
  for(int i=0;i<verses.size();i++){
   pending.add(verses.get(i));
   String section=html.substring(ends.get(i),i+1<starts.size()?starts.get(i+1):footer);
   if(!ARABIC.matcher(section).find()){if(!section.replaceAll("(?s)<[^>]+>","").trim().isEmpty())throw new IOException("Bagian teks tafsir tidak dikenali");continue;}
   section=ARABIC.matcher(section).replaceAll("");
   section=section.replaceAll("(?is)<a\\b[^>]*>.*?</a\\s*>","");
   section=section.replaceAll("(?is)<(script|style)\\b[^>]*>.*?</\\1\\s*>","");
   Section group=new Section(pending.get(0),pending.get(pending.size()-1),section);for(int verse:pending)result.put(verse,group);pending.clear();
  }
  if(!pending.isEmpty())throw new IOException("Teks tafsir tidak lengkap");
  return result;
 }
}
