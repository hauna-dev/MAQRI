package id.murojaah.app;
public class MushafCachePolicyTest {
 public static void main(String[] args){
  if(MushafCache.pageFromPath("/mushaf/001.webp")!=1||MushafCache.pageFromPath("/mushaf/604.webp")!=604)throw new AssertionError();
  for(String value:new String[]{"/mushaf/000.webp","/mushaf/605.webp","/mushaf/../001.webp","/mushaf/1.webp","/mushaf/001.png","/mushaf/001.webp/other","/mushaf/001.webp?other"})try{MushafCache.pageFromPath(value);throw new AssertionError(value);}catch(IllegalArgumentException expected){}
  if(!MushafCache.url(42).endsWith("/042.webp"))throw new AssertionError();
  System.out.println("Mushaf cache page limits, source URL and traversal rejection passed");
 }
}
