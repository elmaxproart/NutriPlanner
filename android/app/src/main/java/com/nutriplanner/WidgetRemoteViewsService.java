package com.nutriplanner;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.List;

public class WidgetRemoteViewsService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new StackRemoteViewsFactory(this.getApplicationContext());
    }
}

class StackRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private Context context;
    private List<MenuItem> menuItems;

    StackRemoteViewsFactory(Context context) {
        this.context = context;
    }

    @Override
    public void onCreate() {
        // Récupérer l'ID utilisateur depuis SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("NutriPlannerPrefs", Context.MODE_PRIVATE);
        String userId = prefs.getString("userId", null);
        if (userId != null) {
            menuItems = NutriPlannerWidgetProvider.fetchMenus(context, userId);
        }
    }

    @Override
    public void onDataSetChanged() {
        SharedPreferences prefs = context.getSharedPreferences("NutriPlannerPrefs", Context.MODE_PRIVATE);
        String userId = prefs.getString("userId", null);
        if (userId != null) {
            menuItems = NutriPlannerWidgetProvider.fetchMenus(context, userId);
        }
    }

    @Override
    public void onDestroy() {
        menuItems = null;
    }

    @Override
    public int getCount() {
        return menuItems != null ? menuItems.size() : 0;
    }

    @Override
    public RemoteViews getViewAt(int position) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_item);

        if (menuItems != null && position < menuItems.size()) {
            MenuItem item = menuItems.get(position);
            rv.setTextViewText(R.id.widget_item_date, item.date);
            rv.setTextViewText(R.id.widget_item_menu, item.menuText);

            // Configurer le clic pour ouvrir MenuScreen avec la date spécifique
            Intent fillInIntent = new Intent();
            fillInIntent.putExtra(NutriPlannerWidgetProvider.EXTRA_MENU_DATE, item.date);
            rv.setOnClickFillInIntent(R.id.widget_item_layout, fillInIntent);
        }

        return rv;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
