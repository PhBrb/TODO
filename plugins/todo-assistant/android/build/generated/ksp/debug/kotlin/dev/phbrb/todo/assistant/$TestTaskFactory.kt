package dev.phbrb.todo.assistant

import androidx.`annotation`.RequiresApi
import androidx.appfunctions.AppFunctionData
import androidx.appfunctions.AppFunctionDataSpec
import androidx.appfunctions.`internal`.AppFunctionSerializableFactory
import javax.`annotation`.processing.Generated

@RequiresApi(33)
@Generated("androidx.appfunctions.compiler.AppFunctionCompiler")
public class `$TestTaskFactory` : AppFunctionSerializableFactory<TestTask> {
  override fun fromAppFunctionData(appFunctionData: AppFunctionData): TestTask {
    val appFunctionDataWithSpec = getAppFunctionDataWithSpec(appFunctionData = appFunctionData, qualifiedName = "dev.phbrb.todo.assistant.TestTask")

    val taskId = checkNotNull(appFunctionDataWithSpec.getLongOrNull("taskId"))
    val title = checkNotNull(appFunctionDataWithSpec.getStringOrNull("title"))

    val resultTestTask = TestTask(taskId, title)
    return resultTestTask
  }

  override fun toAppFunctionData(spec: AppFunctionDataSpec?, appFunctionSerializable: TestTask): AppFunctionData {
    val testTask_appFunctionSerializable = appFunctionSerializable

    val builder = getAppFunctionDataBuilder(spec, "dev.phbrb.todo.assistant.TestTask")
    val taskId = testTask_appFunctionSerializable.taskId
    builder.setLong("taskId", taskId)
    val title = testTask_appFunctionSerializable.title
    builder.setString("title", title)

    return builder.build()
  }
}
