package id.murojaah.app;

import java.net.URI;

final class UpdatePolicy {
 static boolean trustedAsset(String url,String repo){
  try{URI u=new URI(url);return "https".equals(u.getScheme())&&"github.com".equals(u.getHost())&&u.getUserInfo()==null&&u.getPort()==-1&&u.getRawPath().startsWith("/"+repo+"/releases/download/")&&!u.getRawPath().contains("..")&&u.getQuery()==null&&u.getFragment()==null;}catch(Exception e){return false;}
 }
 static void validate(String expectedPackage,String remotePackage,long version,String filename,String sha,long bytes){
  if(!expectedPackage.equals(remotePackage)||version<1||!filename.matches("MAQRI-[0-9]+\\.[0-9]+\\.[0-9]+\\.apk")||!sha.matches("[a-fA-F0-9]{64}")||bytes<1024||bytes>100_000_000)throw new IllegalArgumentException("Invalid update metadata");
 }
}
