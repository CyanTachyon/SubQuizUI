package cn.org.subit.quiz;

/*
import android.content.Context;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
 */

public class X5CapacitorBridge {
/*
    public static void setup(Bridge bridge) {
        WebView systemWebView = bridge.getWebView();
        Context context = systemWebView.getContext();

        // 创建 X5 WebView（但不添加到视图树）
        com.tencent.smtt.sdk.WebView x5WebView = new com.tencent.smtt.sdk.WebView(context);

        // 代理所有系统 WebView 的操作到 X5 WebView
        systemWebView.setWebViewClient(new X5ProxyWebViewClient(x5WebView, bridge));
        systemWebView.setWebChromeClient(new X5ProxyWebChromeClient(x5WebView, bridge));

        // 同步加载状态
        x5WebView.setWebViewClient(new InternalX5WebViewClient(systemWebView));
    }

    private static class X5ProxyWebViewClient extends BridgeWebViewClient {
        private final com.tencent.smtt.sdk.WebView x5WebView;

        public X5ProxyWebViewClient(com.tencent.smtt.sdk.WebView x5WebView, Bridge bridge) {
            super(bridge);
            this.x5WebView = x5WebView;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            x5WebView.loadUrl(url); // 同步加载到 X5
            super.onPageFinished(view, url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return x5WebView.getWebViewClient().shouldOverrideUrlLoading(x5WebView, url);
        }
    }

    private static class InternalX5WebViewClient extends com.tencent.smtt.sdk.WebViewClient {
        private final WebView systemWebView;

        public InternalX5WebViewClient(WebView systemWebView) {
            this.systemWebView = systemWebView;
        }

        @Override
        public void onPageFinished(com.tencent.smtt.sdk.WebView view, String url) {
            // 将 X5 的渲染结果同步到系统 WebView
            systemWebView.loadUrl("javascript:document.write(document.documentElement.outerHTML)");
        }
    }

    private static class X5ProxyWebChromeClient extends BridgeWebChromeClient {
        private final com.tencent.smtt.sdk.WebView x5WebView;

        public X5ProxyWebChromeClient(com.tencent.smtt.sdk.WebView x5WebView, Bridge bridge) {
            super(bridge);
            this.x5WebView = x5WebView;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            x5WebView.setWebChromeClient(new com.tencent.smtt.sdk.WebChromeClient() {
                @Override
                public void onProgressChanged(com.tencent.smtt.sdk.WebView view, int progress) {
                    super.onProgressChanged(view, progress);
                }
            });
            super.onProgressChanged(view, newProgress);
        }
    }
 */
}