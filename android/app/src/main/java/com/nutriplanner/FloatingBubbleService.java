package com.nutriplanner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class FloatingBubbleService extends Service {

    private WindowManager windowManager;
    private View bubbleView;
    private WindowManager.LayoutParams params;
    private float initialX, initialY;
    private float initialTouchX, initialTouchY;
    private boolean isMoving = false;
    private ReactContext reactContext;

    private static final String CHANNEL_ID = "FloatingBubbleChannel";
    private static final int NOTIFICATION_ID = 101;

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialiser le contexte React
        reactContext = (ReactContext) getApplicationContext();

        // Créer un canal de notification pour Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Floating Bubble Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }

        // Créer une notification pour le foreground service
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NutriPlanner")
            .setContentText("Floating bubble is active")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();

        // Démarrer le service en avant-plan
        startForeground(NOTIFICATION_ID, notification);

        // Initialisation de la bulle flottante
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        bubbleView = LayoutInflater.from(this).inflate(R.layout.floating_bubble_layout, null);

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 100;

        try {
            windowManager.addView(bubbleView, params);
        } catch (Exception e) {
            e.printStackTrace();
            stopSelf();
            return;
        }

        // Gestion des interactions
        ImageView bubbleIcon = bubbleView.findViewById(R.id.bubble_icon);
        ImageView closeIcon = bubbleView.findViewById(R.id.close_bubble);

        bubbleIcon.setOnTouchListener((v, event) -> {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    initialX = params.x;
                    initialY = params.y;
                    initialTouchX = event.getRawX();
                    initialTouchY = event.getRawY();
                    isMoving = false;
                    return true;

                case MotionEvent.ACTION_MOVE:
                    params.x = (int) (initialX + (event.getRawX() - initialTouchX));
                    params.y = (int) (initialY + (event.getRawY() - initialTouchY));
                    try {
                        windowManager.updateViewLayout(bubbleView, params);
                        sendPositionToReact(params.x, params.y);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    isMoving = true;
                    return true;

                case MotionEvent.ACTION_UP:
                    if (!isMoving) {
                        sendEventToReact("bubbleClick");
                        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        try {
                            startActivity(intent);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                    return true;
            }
            return false;
        });

        closeIcon.setOnClickListener(v -> {
            sendEventToReact("bubbleClose");
            stopSelf();
        });
    }

    private void sendPositionToReact(int x, int y) {
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("FloatingBubblePosition", new float[]{(float) x, (float) y});
        }
    }

    private void sendEventToReact(String eventName) {
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, null);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (bubbleView != null) {
            try {
                windowManager.removeView(bubbleView);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        stopForeground(true);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
