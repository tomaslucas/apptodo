# Plan: Rediseño del Listado de Tareas

**Issue**: apptodo-p44  
**Fecha**: 2026-01-11  
**Estado**: APROBADO

---

## 1. Problema Actual

### 1.1 Visibilidad deficiente
- El estado y la prioridad de las tareas no se distinguen claramente en el listado
- No hay indicadores visuales fuertes (colores, iconos, badges)

### 1.2 Acciones inline confusas
- El botón "+" para añadir categoría está en el listado, pero no permite cambiar estado/prioridad
- Inconsistencia: algunas acciones son inline, otras requieren abrir modal
- Falta botón de editar visible en la tarjeta

### 1.3 Modo batch poco claro
- No está claro para qué sirve el checkbox de selección

---

## 2. Decisión: Opción A (Todo en Modal)

**Enfoque elegido**: Simplicidad y consistencia

- ✅ Eliminar acciones inline excepto: eliminar (🗑️) y editar (✏️)
- ✅ El "+" de categoría pasa al modal de edición
- ✅ Cambio de estado y prioridad solo en modal o batch
- ✅ Checkbox batch con tooltip explicativo

**Pros**: Consistencia, menos cluttering, implementación rápida  

---

## 3. Acciones en Tarjeta (Definitivo)

| Acción | Ubicación | Elemento |
|--------|-----------|----------|
| Selección batch | Inline (izquierda) | ☐ Checkbox + tooltip |
| Editar tarea | Inline (derecha) | ✏️ Icono |
| Eliminar tarea | Inline (derecha) | 🗑️ Icono |
| Añadir categoría | Modal | Campo en formulario |
| Cambiar estado | Modal / Batch | Dropdown |
| Cambiar prioridad | Modal / Batch | Dropdown |

---

## 4. Mejoras Visuales

### 4.1 Prioridad
```
P1 (Alta):    🔴 Badge rojo + borde izquierdo rojo
P2 (Media):   🟡 Badge amarillo + borde izquierdo amarillo  
P3 (Baja):    🟢 Badge verde + borde izquierdo verde
```

### 4.2 Estado
```
Pending:      ⏳ Gris/neutro
In Progress:  🔵 Azul + indicador animado sutil
Completed:    ✅ Verde + tachado opcional en título
```

### 4.3 Layout de Tarjeta (Definitivo)
```
┌───────────────────────────────────────────────────────────┐
│ ☐ │ 🔴 │ Título de la tarea               [⏳] [✏️] [🗑️] │
│   │    │ Descripción truncada...                         │
│   │    │ 📁 Categoría1, Categoría2       📅 2026-01-15   │
└───────────────────────────────────────────────────────────┘
  ↑    ↑                                  ↑    ↑    ↑
  │    │                                  │    │    └─ Eliminar
  │    │                                  │    └─ Editar (abre modal)
  │    │                                  └─ Badge estado
  │    └─ Borde color prioridad
  └─ Checkbox batch (tooltip: "Seleccionar para acciones en lote")
```

---

## 5. Siguientes Pasos

1. ✅ Plan aprobado
2. Crear issues específicas:
   - Issue: Implementar badges visuales de prioridad (colores + borde)
   - Issue: Implementar badges visuales de estado (iconos)
   - Issue: Añadir botón editar (✏️) a cada tarjeta
   - Issue: Mover "+" categoría al modal de edición
   - Issue: Añadir tooltip al checkbox batch
3. Implementar en fases:
   - **Fase 1**: Mejoras visuales (badges, colores, iconos)
   - **Fase 2**: Reorganización de acciones (editar, eliminar +/- categoría)
   - **Fase 3**: UX batch (tooltip)

---

## 6. Issues Relacionadas

- **apptodo-og5**: Bug de edición (DEBE resolverse ANTES de este rediseño)
- **apptodo-p44**: Esta feature (rediseño UI)
