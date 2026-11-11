package dev.phbrb.todo.assistant

import androidx.appfunctions.`internal`.AppFunctionInventory
import androidx.appfunctions.metadata.AppFunctionComponentsMetadata
import androidx.appfunctions.metadata.AppFunctionDataTypeMetadata
import androidx.appfunctions.metadata.AppFunctionLongTypeMetadata
import androidx.appfunctions.metadata.AppFunctionObjectTypeMetadata
import androidx.appfunctions.metadata.AppFunctionParameterMetadata
import androidx.appfunctions.metadata.AppFunctionReferenceTypeMetadata
import androidx.appfunctions.metadata.AppFunctionResponseMetadata
import androidx.appfunctions.metadata.AppFunctionSchemaMetadata
import androidx.appfunctions.metadata.AppFunctionStringTypeMetadata
import androidx.appfunctions.metadata.CompileTimeAppFunctionMetadata
import javax.`annotation`.processing.Generated
import kotlin.String
import kotlin.collections.List
import kotlin.collections.Map

/**
 * Source Files:
 * TodoAppFunctionService.kt
 */
@Generated("androidx.appfunctions.compiler.AppFunctionCompiler")
public class `$BaseTodoAppFunctionService_AppFunctionInventory` : AppFunctionInventory {
  override val functionIdToMetadataMap: Map<String, CompileTimeAppFunctionMetadata> = mapOf(
    "dev.phbrb.todo.assistant.BaseTodoAppFunctionService#createTestTask" to DevPhbrbTodoAssistantBaseTodoAppFunctionServiceCreateTestTaskMetadataObject.APP_FUNCTION_METADATA,
  )

  private val DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP_TASKID:
      AppFunctionLongTypeMetadata = AppFunctionLongTypeMetadata(
          isNullable = false,
          description = "The id of the created task."
      )

  private val DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP_TITLE:
      AppFunctionStringTypeMetadata = AppFunctionStringTypeMetadata(
          isNullable = false,
          description = "The title of the created task.",
          enumValues = null,
          patternMatchers = null,
          format = null,
      )

  private val DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP:
      Map<String, AppFunctionDataTypeMetadata> = mapOf(
    "taskId" to DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP_TASKID,
    "title" to DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP_TITLE,
  )

  private val DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_REQUIRED_PROPERTIES_LIST:
      List<String> = listOf(
    "taskId",
    "title",
  )

  private val DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE: AppFunctionObjectTypeMetadata =
      AppFunctionObjectTypeMetadata(
          properties = DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_PROPERTIES_MAP,
          required = DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE_REQUIRED_PROPERTIES_LIST,
          qualifiedName = "dev.phbrb.todo.assistant.TestTask",
          isNullable = true,
          description = "The test task created by the assistant."
      )

  private val componentsMetadataDataTypesMap: Map<String, AppFunctionDataTypeMetadata> = mapOf(
    "dev.phbrb.todo.assistant.TestTask" to DEV_PHBRB_TODO_ASSISTANT_TESTTASK_OBJECT_DATA_TYPE,
    )

  override val componentsMetadata: AppFunctionComponentsMetadata = AppFunctionComponentsMetadata(
          dataTypes = componentsMetadataDataTypesMap
      )

  private object DevPhbrbTodoAssistantBaseTodoAppFunctionServiceCreateTestTaskMetadataObject {
    private val SCHEMA_METADATA: AppFunctionSchemaMetadata? = null

    private val PARAMETER_METADATA_LIST: List<AppFunctionParameterMetadata> = listOf(
    )

    private val REFERENCE_RESPONSE_VALUE_TYPE: AppFunctionReferenceTypeMetadata =
        AppFunctionReferenceTypeMetadata(
            referenceDataType = "dev.phbrb.todo.assistant.TestTask",
            isNullable = false,
            description = ""
        )

    private val RESPONSE_METADATA: AppFunctionResponseMetadata = AppFunctionResponseMetadata(
            valueType = REFERENCE_RESPONSE_VALUE_TYPE,
            description = "the created test task"
        )

    public val APP_FUNCTION_METADATA: CompileTimeAppFunctionMetadata =
        CompileTimeAppFunctionMetadata(
            id = "dev.phbrb.todo.assistant.BaseTodoAppFunctionService#createTestTask",
            isEnabledByDefault = true,
            schema =  SCHEMA_METADATA,
            parameters = PARAMETER_METADATA_LIST,
            response = RESPONSE_METADATA,
        )
  }
}
