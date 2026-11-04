package id.murojaah.app;

public class UpdatePolicyTest {
 static void check(boolean value){if(!value)throw new AssertionError();}
 static void reject(Runnable task){try{task.run();throw new AssertionError();}catch(IllegalArgumentException expected){}}
 public static void main(String[] args){
  String repo="hauna-dev/MAQRI",good="https://github.com/hauna-dev/MAQRI/releases/download/v1.0.10/MAQRI-1.0.10.apk";
  check(UpdatePolicy.trustedAsset(good,repo));
  for(String bad:new String[]{good.replace("https:","http:"),good.replace("github.com","github.com.evil.example"),good.replace("hauna-dev/MAQRI","other/repo"),good+"?redirect=evil",good.replace("github.com/","evil@github.com/"),good.replace("v1.0.10","../other")})check(!UpdatePolicy.trustedAsset(bad,repo));
  String hash=new String(new char[64]).replace('\0','a');
  UpdatePolicy.validate("id.murojaah.app","id.murojaah.app",11,"MAQRI-1.0.10.apk",hash,400000);
  reject(()->UpdatePolicy.validate("id.murojaah.app","evil.app",11,"MAQRI-1.0.10.apk",hash,400000));
  reject(()->UpdatePolicy.validate("id.murojaah.app","id.murojaah.app",11,"../../evil.apk",hash,400000));
  reject(()->UpdatePolicy.validate("id.murojaah.app","id.murojaah.app",11,"MAQRI-1.0.10.apk","invalid",400000));
  reject(()->UpdatePolicy.validate("id.murojaah.app","id.murojaah.app",11,"MAQRI-1.0.10.apk",hash,200000000));
  System.out.println("Update policy: trusted source, repository path, package, hash, filename, and size validated.");
 }
}
