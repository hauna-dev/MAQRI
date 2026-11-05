package id.murojaah.app;
import java.util.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;

public class IndonesianTafsirTest {
 public static void main(String[] args)throws Exception{
  String html="<a id='aya-1'></a><a href='#aya-1'>#</a><div class='_ar'>Arabic section</div><p>Indonesian <span>one</span>.</p><a id=\"aya-2\"></a><div class=\"_ar\">Arabic two</div><p>Indonesian two.</p><footer>Footer links</footer>";
  Map<Integer,IndonesianTafsir.Section> result=IndonesianTafsir.parse(html);
  if(result.size()!=2||result.get(1).html.contains("Arabic")||result.get(1).html.contains("#")||!result.get(1).html.contains("Indonesian")||result.get(2).html.contains("Footer"))throw new AssertionError("Section extraction");
  String grouped=html.replace("<a id='aya-1'>","<a id='aya-8'></a><a id='aya-9'>");Map<Integer,IndonesianTafsir.Section> groups=IndonesianTafsir.parse(grouped);if(groups.get(8)!=groups.get(9)||groups.get(8).first!=8||groups.get(8).last!=9)throw new AssertionError("Explicit grouped anchors");
  if(result.containsKey(3))throw new AssertionError("Never inherit text for an absent ayah");
  try{IndonesianTafsir.parse("<html>Login required</html>");throw new AssertionError("Reject changed source");}catch(java.io.IOException expected){}
  try{IndonesianTafsir.url(115);throw new AssertionError("Range");}catch(IllegalArgumentException expected){}
  for(String file:args){Map<Integer,IndonesianTafsir.Section> sections=IndonesianTafsir.parse(new String(Files.readAllBytes(Paths.get(file)),StandardCharsets.UTF_8));System.out.println(file+": "+sections.size()+" explicit ayah sections");}
  System.out.println("Indonesian tafsir extraction passed");
 }
}
