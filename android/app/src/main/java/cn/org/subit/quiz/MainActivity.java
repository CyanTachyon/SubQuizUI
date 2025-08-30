package cn.org.subit.quiz;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity 
{
    @Override
    protected void onCreate(Bundle savedInstanceState) 
    {
        super.onCreate(savedInstanceState);

        // 设置全屏并隐藏导航条
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, 
                            WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // 新添加的隐藏导航条代码
        final int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

        getWindow().getDecorView().setSystemUiVisibility(flags);

        // 当系统UI可见性变化时保持全屏
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                getWindow().getDecorView().setSystemUiVisibility(flags);
            }
        });
    }

//    public class X5WebView extends com.tencent.smtt.sdk.WebView {
//        public X5WebView(Context context) {
//            super(context);
//            initSettings();
//        }
//
//        private void initSettings() {
//            com.tencent.smtt.sdk.WebSettings settings = this.getSettings();
//            settings.setJavaScriptEnabled(true);
//            settings.setDomStorageEnabled(true);         // 启用 DOM 存储
//            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
//            settings.setUseWideViewPort(true);           // 适配屏幕
//            settings.setLoadWithOverviewMode(true);
//        }
//    }
}
