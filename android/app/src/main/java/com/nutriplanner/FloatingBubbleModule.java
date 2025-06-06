package com.nutriplanner;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.content.Intent;
import android.os.Build;

public class FloatingBubbleModule extends ReactContextBaseJavaModule {

    FloatingBubbleModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "FloatingBubbleModule";
    }

    @ReactMethod
    public void startBubbleService() {
        ReactApplicationContext context = getReactApplicationContext();
        Intent intent = new Intent(context, FloatingBubbleService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @ReactMethod
    public void stopBubbleService() {
        ReactApplicationContext context = getReactApplicationContext();
        Intent intent = new Intent(context, FloatingBubbleService.class);
        context.stopService(intent);
    }
}
