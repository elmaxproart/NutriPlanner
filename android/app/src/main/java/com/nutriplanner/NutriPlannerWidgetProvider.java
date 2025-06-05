package com.nutriplanner;

   import android.appwidget.AppWidgetManager;
   import android.appwidget.AppWidgetProvider;
   import android.content.Context;
   import android.content.Intent;
   import android.content.SharedPreferences;
   import android.widget.RemoteViews;
   import com.google.firebase.firestore.FirebaseFirestore;
   import com.google.firebase.firestore.QuerySnapshot;
   import java.text.SimpleDateFormat;
   import java.util.Date;
   import java.util.Locale;

   public class NutriPlannerWidgetProvider extends AppWidgetProvider {

       private static final String PREFS_NAME = "NutriPlannerPrefs";
       private static final String KEY_USER_ID = "userId";

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
               views.setTextViewText(R.id.widget_menu, "Utilisateur non connecté");
               appWidgetManager.updateAppWidget(appWidgetId, views);
               return;
           }

           // Date actuelle au format yyyy-MM-dd
           String currentDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

           // Récupérer les données via Firestore
           FirebaseFirestore db = FirebaseFirestore.getInstance();
           db.collection("users").document(userId)
                   .collection("mymenu")
                   .whereEqualTo("date", currentDate)
                   .get()
                   .addOnCompleteListener(task -> {
                       if (task.isSuccessful()) {
                           QuerySnapshot snapshot = task.getResult();
                           String menuText = "Menu du jour : Aucun menu planifié";
                           if (snapshot != null && !snapshot.isEmpty()) {
                               StringBuilder menuBuilder = new StringBuilder("Menu du jour : ");
                               for (var doc : snapshot.getDocuments()) {
                                   String foodName = doc.getString("foodName");
                                   if (foodName != null) {
                                       menuBuilder.append(foodName).append(", ");
                                   }
                               }
                               menuText = menuBuilder.toString().trim();
                               if (menuText.endsWith(",")) {
                                   menuText = menuText.substring(0, menuText.length() - 1);
                               }
                           }
                           views.setTextViewText(R.id.widget_menu, menuText);
                       } else {
                           views.setTextViewText(R.id.widget_menu, "Erreur lors du chargement");
                       }
                       appWidgetManager.updateAppWidget(appWidgetId, views);
                   });
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
   }
