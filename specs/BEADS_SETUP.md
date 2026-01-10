# Guía de Inicialización y Uso de Beads

## Inicialización correcta de Beads en un proyecto nuevo

Esta guía documenta las mejores prácticas para inicializar Beads correctamente en un proyecto nuevo y evitar problemas de sincronización entre máquinas.

### 1. **Inicializa Beads ANTES de crear issues**
```bash
# En tu repositorio git ya inicializado
bd init --prefix=nombre-proyecto --branch=beads-sync
```

**Importante**: Usa un prefijo descriptivo del proyecto desde el inicio. No uses prefijos genéricos como "test-beads-".

### 2. **Configura el modo de trabajo recomendado**

Para equipos y sincronización multi-máquina, **NO uses `no-db: true`**. Déjalo en modo database (por defecto):

```bash
# Verifica que no-db esté en false o comentado en .beads/config.yaml
cat .beads/config.yaml | grep "no-db"
```

**Razón**: El modo `no-db: true` está pensado para desarrollo individual y puede causar conflictos de sincronización.

### 3. **Primer commit del proyecto**
```bash
git add .beads/
git commit -m "chore: Initialize Beads issue tracker"
git push origin main
```

### 4. **Crea tu primera issue de prueba**
```bash
bd create --title="Setup project" --type=task --priority=2
bd stats  # Verifica que funciona
```

### 5. **Primera sincronización**
```bash
bd sync
```

Esto creará y pusheará la rama `beads-sync` al remoto con tu primera issue.

### 6. **Verifica que todo esté sincronizado**
```bash
bd doctor
```

Si todo está bien, deberías ver mayormente checks verdes (✓).

## Workflow diario recomendado

Después de la inicialización, sigue este flujo:

```bash
# Al cerrar sesión de trabajo
bd sync                    # Sincroniza cambios locales
git add .                  # Stage tus cambios de código
git commit -m "mensaje"    # Commit de código
git push                   # Push todo junto
```

**Tip**: Los hooks de Beads automatizan mucho de esto, pero es bueno conocer el flujo manual.

## Configuración recomendada para equipos

En `.beads/config.yaml`:
```yaml
issue-prefix: "nombre-proyecto"
no-db: false              # O comentado (usar database)
sync-branch: "beads-sync"  # Mismo para todo el equipo
```

## Verificación en nueva máquina

Cuando alguien clone por primera vez:
```bash
git clone <repo>
cd <repo>
bd stats  # Debería funcionar inmediatamente
```

Si necesitan crear issues:
```bash
bd create --title="..." --type=task --priority=2
bd sync  # Sincronizar al terminar
```

## Resumen de errores a evitar

❌ **NO hacer**:
- Cambiar el prefijo después de crear issues
- Usar `no-db: true` en proyectos colaborativos
- Olvidar ejecutar `bd sync` antes de hacer push
- Editar manualmente `.beads/issues.jsonl`

✅ **SÍ hacer**:
- Inicializar Beads temprano en el proyecto
- Usar prefijo consistente desde el inicio
- Ejecutar `bd sync` regularmente
- Confiar en `bd doctor` para diagnosticar problemas

## Solución de problemas comunes

### Problema: Issues aparecen como abiertas en otra máquina cuando están cerradas

**Causa**: Desincronización entre las ramas `main` y `beads-sync`.

**Solución**:
```bash
# En la máquina con el estado correcto
bd sync  # Sincronizar con remoto

# Actualizar issues.jsonl en main si es necesario
git update-index --no-skip-worktree .beads/issues.jsonl
git show beads-sync:.beads/issues.jsonl > .beads/issues.jsonl
git add .beads/issues.jsonl
git commit -m "sync: Update issues.jsonl from beads-sync"
git update-index --skip-worktree .beads/issues.jsonl
git push
```

### Problema: Error "prefix mismatch" al clonar

**Causa**: El prefijo en `.beads/config.yaml` no coincide con el prefijo de las issues existentes.

**Solución**: No cambies el prefijo después de crear issues. Si es necesario, usa `bd migrate` o reinicializa el proyecto.

### Problema: "import requires SQLite storage backend"

**Causa**: El modo `no-db: true` está activo pero se requiere sincronización.

**Solución**:
```bash
# Cambiar a modo database temporalmente
sed -i '' 's/no-db: true/no-db: false/' .beads/config.yaml
bd sync
# Opcional: volver a no-db si es necesario
sed -i '' 's/no-db: false/no-db: true/' .beads/config.yaml
```

## Comandos útiles de diagnóstico

```bash
bd doctor           # Diagnóstico completo del sistema
bd stats            # Estadísticas de issues
bd list             # Listar todas las issues
bd ready            # Ver issues listas para trabajar
bd sync --status    # Ver estado de sincronización sin sincronizar
```

---

**Nota**: Esta guía se basa en la experiencia de resolver problemas de sincronización en el proyecto apptodo. Sigue estos pasos desde el inicio para evitar complicaciones.
