package dev.phbrb.todo.assistant

import android.webkit.WebView
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.PluginMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

object WebViewHolder {
    @Volatile
    var webView: WebView? = null
}

@CapacitorPlugin(name = "TodoAssistant")
class TodoAssistantPlugin : Plugin() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun load() {
        WebViewHolder.webView = bridge?.webView
    }

    /**
     * One-way mirror of the web app's localStorage state into DataStore.
     * The WebView remains the source of truth; native components (widget, app
     * functions) read the mirror. Also refreshes the home-screen widget.
     */
    @PluginMethod
    fun mirrorState(call: PluginCall) {
        val ctx = bridge?.context
        if (ctx == null) {
            call.error("no context")
            return
        }
        val stateJson = call.getString("state") ?: "{}"
        val widgetJson = call.getString("widget") ?: "[]"
        scope.launch {
            ctx.mirrorDataStore.updateData { prefs ->
                prefs.toMutablePreferences().apply {
                    put(MirrorKeys.STATE_JSON, stateJson)
                    put(MirrorKeys.WIDGET_JSON, widgetJson)
                }
            }
            TodoWidgetProvider.cachedWidgetJson = widgetJson
            withContext(Dispatchers.Main) {
                TodoWidgetProvider.updateAll(ctx)
                call.success()
            }
        }
    }
}
