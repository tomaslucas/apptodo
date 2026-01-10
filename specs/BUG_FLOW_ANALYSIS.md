# Diagrama de Flujo de Componentes (Análisis de Bugs)

Este diagrama modela el flujo de estados de las transacciones afectadas (Creación de Tarea y Acciones Batch) para ayudar a identificar el punto de fallo en `apptodo-b77`.

## 1. Creación de Tarea con Categoría

```mermaid
stateDiagram-v2
    direction LR

    state "Frontend: TaskForm.vue" as FE_Form {
        [*] --> UserInput
        UserInput --> FormValidation : Validar datos
        FormValidation --> PayloadPrep : Mapear category_ids
        PayloadPrep --> StoreAction : dispatch createTask()
    }

    state "Frontend: Store (task.ts)" as FE_Store {
        StoreAction --> APIRequest : apiClient.post('/tasks')
    }

    state "Backend: Router/Service" as BE_Logic {
        APIRequest --> DBCreateTask : Insertar Task
        DBCreateTask --> CheckCategories : ¿Tiene category_ids?
        
        state "PUNTO CRÍTICO 1" as Critical1
        CheckCategories --> LinkCategories : Sí (Iterar & Insertar)
        LinkCategories --> FetchUpdated : Recargar Tarea
        CheckCategories --> FetchUpdated : No
        
        FetchUpdated --> ReturnResponse : Serializar (incluyendo cats)
    }

    state "Frontend: Update UI" as FE_Update {
        ReturnResponse --> StoreUpdate : Push to task list
        StoreUpdate --> [*] : Renderizar lista (Check Tags)
    }

    note right of LinkCategories
        Bug Reportado:
        Las categorías no se guardan.
        Posibles causas:
        1. Payload no envía 'category_ids'
        2. Backend no recibe 'category_ids'
        3. Lógica de asociación falla silenciosamente
    end note
```

## 2. Acciones Batch (Cambio de Prioridad)

```mermaid
stateDiagram-v2
    direction LR

    state "Frontend: BatchActionsBar.vue" as FE_Batch {
        [*] --> Selection : Seleccionar Tareas
        Selection --> ActionSelect : Elegir Prioridad
        ActionSelect --> BatchDispatch : dispatch batchUpdate()
    }

    state "Frontend: Store (task.ts)" as FE_StoreBatch {
        BatchDispatch --> BatchRequest : apiClient.patch('/tasks/batch/update')
    }

    state "Backend: Router (tasks.py)" as BE_Batch {
        BatchRequest --> DBBatchUpdate : Update tasks table
        
        state "PUNTO CRÍTICO 2" as Critical2
        DBBatchUpdate --> CreateEvents : Log TaskEvents
        CreateEvents --> BatchReturn : Retornar contador
    }

    state "Frontend: Refresh" as FE_Refresh {
        BatchReturn --> LocalUpdate : Actualizar Store (Optimistic?)
        LocalUpdate --> [*] : UI Refleja cambio
    }

    note right of BatchRequest
        Bug Reportado:
        Cambio de prioridad no se refleja.
        Posibles causas:
        1. Request body mal formado
        2. Backend no procesa campos opcionales
        3. Store no actualiza UI tras respuesta
    end note
```
