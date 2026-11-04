package id.murojaah.app;
import android.app.DownloadManager;
import android.content.*;

public class UpdateReceiver extends BroadcastReceiver {
 public void onReceive(Context context,Intent intent){if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())||intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-2)!=AppUpdater.prefs(context).getLong("downloadId",-1))return;PendingResult result=goAsync();AppUpdater.IO.execute(()->{try{AppUpdater.refreshNow(context.getApplicationContext());}finally{result.finish();}});}
}
