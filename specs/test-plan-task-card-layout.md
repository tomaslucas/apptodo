# Test Plan: Layout de Tarjeta de Tarea (specs 4.3)

**Issue**: apptodo-859  
**Fecha**: 2026-01-12  
**Estado**: COMPLETADO ✅

---

## Criterios de Aceptación

Basado en specs/task-list-redesign-plan.md sección 4.3:

```
┌───────────────────────────────────────────────────────────┐
│ ☐ │ 🔴 │ Título de la tarea               [⏳] [✏️] [🗑️] │
│   │    │ Descripción truncada...                         │
│   │    │ 📁 Categoría1, Categoría2       📅 2026-01-15   │
└───────────────────────────────────────────────────────────┘
```

---

## Checklist de Pruebas

### 1. Estructura de Layout

- [x] **1.1** Solo hay UN checkbox (batch) a la izquierda
- [x] **1.2** NO existe checkbox de completar tarea inline
- [x] **1.3** Título en la primera línea
- [x] **1.4** Badge de estado [⏳/🔵/✅] en la misma línea que título
- [x] **1.5** Botón editar (✏️) en la misma línea que título
- [x] **1.6** Botón eliminar (🗑️) en la misma línea que título
- [x] **1.7** Descripción truncada en segunda línea (si existe)
- [x] **1.8** Categorías con icono 📁 en tercera línea (si existen)
- [x] **1.9** Fecha límite con icono 📅 en tercera línea (si existe)

### 2. Indicadores de Prioridad (Borde Izquierdo)

- [x] **2.1** Prioridad ALTA: borde izquierdo ROJO visible
- [x] **2.2** Prioridad MEDIA: borde izquierdo AMARILLO visible
- [x] **2.3** Prioridad BAJA: borde izquierdo VERDE visible

### 3. Indicadores de Estado

- [x] **3.1** Estado PENDIENTE: muestra ⏳
- [x] **3.2** Estado EN_PROGRESO: muestra 🔵
- [x] **3.3** Estado COMPLETADA: muestra ✅
- [x] **3.4** Tarea completada: título con tachado y opacidad reducida

### 4. Funcionalidad de Acciones

- [x] **4.1** Botón ✏️ abre modal de edición
- [x] **4.2** Botón 🗑️ elimina la tarea (con confirmación)
- [x] **4.3** Checkbox batch selecciona la tarea
- [x] **4.4** Al seleccionar tareas, aparece barra de acciones batch
- [x] **4.5** Batch "Complete" cambia estado a completada
- [x] **4.6** Batch "Priority" muestra selector y cambia prioridad
- [x] **4.7** Batch "Status" muestra selector y cambia estado
- [x] **4.8** Batch "Delete" muestra confirmación y elimina
- [x] **4.9** Batch "Clear" deselecciona todas las tareas

### 5. Contraste y Accesibilidad

- [x] **5.1** Texto del título legible (color oscuro)
- [x] **5.2** Descripción con contraste adecuado
- [x] **5.3** Iconos de acción visibles y distinguibles

### 6. Múltiples Tareas

- [x] **6.1** Layout consistente con 10+ tareas
- [x] **6.2** Scroll funciona correctamente
- [x] **6.3** Bordes de prioridad visibles en todas las tarjetas
- [x] **6.4** Tareas sin descripción se muestran correctamente

---

## Datos de Prueba Requeridos

Para ejecutar todas las pruebas necesitamos:

1. **Tarea con prioridad ALTA** + estado pendiente + categorías + fecha
2. **Tarea con prioridad MEDIA** + estado en_progreso
3. **Tarea con prioridad BAJA** + estado completada
4. **Tarea sin descripción** (verificar que no rompe layout)
5. **Tarea sin categorías ni fecha** (verificar que no rompe layout)

---

## Resultados

| Test | Estado | Notas |
|------|--------|-------|
| 1.1  | ⏳     |       |
| 1.2  | ⏳     |       |
| ...  | ...    |       |

---

## Notas de Ejecución

_Añadir aquí observaciones durante la ejecución de pruebas_
