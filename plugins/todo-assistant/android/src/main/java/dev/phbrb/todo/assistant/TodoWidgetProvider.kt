package dev.phbrb.todo.assistant

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.json.JSONArray

/**
 * Home-screen widget showing a very compact view of the highlighted tasks.
 * Reads the mirrored state from [mirrorDataStore] (cold start) or the in-memory
 * cache (warm), so it works even while the app is not running.
 */
class TodoWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) updateWidget(context, appWidgetManager, id)
    }

    companion object {
        private const val MAX_ROWS = 5
        private val ROW_IDS = intArrayOf(R.id.row0, R.id.row1, R.id.row2, R.id.row3, R.id.row4)

        /** Last widget payload seen in this process; avoids a disk read when warm. */
        @Volatile
        var cachedWidgetJson: String? = null

        private fun readWidgetJson(context: Context): String {
            cachedWidgetJson?.let { return it }
            // Cold start: read the mirror from DataStore (small file, one-shot).
            return runBlocking { context.mirrorDataStore.data.first()[MirrorKeys.WIDGET_JSON] } ?: "[]"
        }

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.todo_widget)
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                views.setOnClickPendingIntent(
                    R.id.widget_root,
                    PendingIntent.getActivity(
                        context,
                        0,
                        launch,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                )
            }
            val items = try {
                JSONArray(readWidgetJson(context))
            } catch (_: Exception) {
                JSONArray()
            }
            var shown = 0
            for (i in 0 until minOf(items.length(), MAX_ROWS)) {
                val obj = items.optJSONObject(i) ?: continue
                views.setTextViewText(ROW_IDS[i], obj.optString("title", ""))
                views.setViewVisibility(ROW_IDS[i], View.VISIBLE)
                shown++
            }
            for (i in shown until MAX_ROWS) views.setViewVisibility(ROW_IDS[i], View.GONE)
            views.setViewVisibility(R.id.widget_empty, if (shown == 0) View.VISIBLE else View.GONE)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAll(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, TodoWidgetProvider::class.java))
            for (id in ids) updateWidget(context, mgr, id)
        }
    }
}
