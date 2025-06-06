package com.nutriplanner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QuerySnapshot;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NutriPlannerWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "NutriPlannerPrefs";
    private static final String KEY_USER_ID = "userId";
    public static final String ACTION_OPEN_MENU_SCREEN = "com.nutriplanner.OPEN_MENU_SCREEN";
    public static final String EXTRA_MENU_DATE = "extra_menu_date";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.nutriplanner_widget);

        // Récupérer l'ID utilisateur depuis SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String userId = prefs.getString(KEY_USER_ID, null);

        if (userId == null) {
            views.setTextViewText(R.id.widget_title, "Utilisateur non connecté");
            appWidgetManager.updateAppWidget(appWidgetId, views);
            return;
        }

        // Configurer le RemoteViewsService pour le StackView
        Intent intent = new Intent(context, WidgetRemoteViewsService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.stack_view, intent);

        // Intent pour gérer les clics sur les éléments du StackView
        Intent clickIntent = new Intent(context, MainActivity.class);
        clickIntent.setAction(ACTION_OPEN_MENU_SCREEN);
        clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.getActivity(context, 0, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE)
                : PendingIntent.getActivity(context, 0, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        views.setPendingIntentTemplate(R.id.stack_view, pendingIntent);

        // Mettre à jour le titre
        views.setTextViewText(R.id.widget_title, "Menus à venir");

        appWidgetManager.updateAppWidget(appWidgetId, views);
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.stack_view);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            int[] appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS);
            if (appWidgetIds != null) {
                onUpdate(context, AppWidgetManager.getInstance(context), appWidgetIds);
            }
        }
    }

    // Méthode utilitaire pour récupérer les menus des prochains jours
    public static List<MenuItem> fetchMenus(Context context, String userId) {
        List<MenuItem> menuItems = new ArrayList<>();
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        Calendar calendar = Calendar.getInstance();

        for (int i = 0; i < 7; i++) {
            String date = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.getTime());
            final String finalDate = date;
            db.collection("users").document(userId)
                    .collection("mymenu")
                    .whereEqualTo("date", date)
                    .get()
                    .addOnCompleteListener(task -> {
                        if (task.isSuccessful()) {
                            QuerySnapshot snapshot = task.getResult();
                            StringBuilder menuBuilder = new StringBuilder();
                            if (snapshot != null && !snapshot.isEmpty()) {
                                for (var doc : snapshot.getDocuments()) {
                                    String foodName = doc.getString("foodName");
                                    if (foodName != null) {
                                        menuBuilder.append(foodName).append(", ");
                                    }
                                }
                            }
                            String menuText = menuBuilder.length() > 0
                                    ? menuBuilder.toString().trim().replaceAll(", $", "")
                                    : "Aucun menu planifié";
                            menuItems.add(new MenuItem(finalDate, menuText));
                            sendWidgetUpdateToReact(context, finalDate, menuText);
                        }
                    });
            calendar.add(Calendar.DAY_OF_YEAR, 1);
        }
        return menuItems;
    }

    private static void sendWidgetUpdateToReact(Context context, String date, String menuText) {
        Intent updateIntent = new Intent("com.nutriplanner.WIDGET_UPDATE");
        updateIntent.putExtra("date", date);
        updateIntent.putExtra("menuText", menuText);
        context.sendBroadcast(updateIntent);
    }
}

// Classe utilitaire pour représenter un menu
class MenuItem {
    String date;
    String menuText;

    MenuItem(String date, String menuText) {
        this.date = date;
        this.menuText = menuText;
    }
}
