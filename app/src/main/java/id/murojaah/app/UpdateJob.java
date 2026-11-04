package id.murojaah.app;
import android.app.job.*;

public class UpdateJob extends JobService {
 public boolean onStartJob(JobParameters params){AppUpdater.check(this,false,()->jobFinished(params,false));return true;}
 public boolean onStopJob(JobParameters params){return true;}
}
