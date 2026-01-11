# Guía de Inicialización y Uso de Beads

Esta guía documenta las mejores prácticas para inicializar Beads correctamente y evitar problemas de sincronización entre máquinas.

## Referencias oficiales

- [SYNC.md](https://github.com/steveyegge/beads/blob/main/docs/SYNC.md) - Arquitectura de sincronización
- [TROUBLESHOOTING.md](https://github.com/steveyegge/beads/blob/main/docs/TROUBLESHOOTING.md) - Solución de problemas
- [BEADS_SETUP.md (Dicklesworthstone)](https://github.com/Dicklesworthstone/misc_coding_agent_tips_and_scripts/blob/main/BEADS_SETUP.md) - Guía de setup

---

## Arquitectura de Beads (sync-branch mode)

Beads usa un modelo de sincronización con **rama separada** (`beads-sync`):

```
Tu rama de trabajo (main, feature-x)
    │
    ├── .beads/beads.db      ← SQLite local (NO se sube a git)
    ├── .beads/issues.jsonl  ← Copia local (oculta con git index flags)
    │
    └── bd sync ──────────────► worktree en .git/beads-worktrees/beads-sync
                                   │
                                   ├── 3-way merge (base + local + remote)
                                   ├── Export DB → issues.jsonl
                                   ├── Commit + Push a rama beads-sync
                                   └── Worktree persiste para próximo sync
```

**Puntos clave**:
- Los JSONL se almacenan SOLO en la rama `beads-sync`, no en `main`
- Cada máquina tiene su propia DB SQLite (no se comparte)
- `bd sync` usa worktrees internos para no cambiar tu rama de trabajo
- El 3-way merge evita pérdida de datos (base + local + remote)

---

## Inicialización en proyecto nuevo

### 1. Inicializa Beads
```bash
# En tu repositorio git ya inicializado
bd init --prefix=nombre-proyecto
```

**Notas**:
- Si no especificas `--prefix`, usa el nombre del directorio actual
- Usa un prefijo descriptivo del proyecto (ej: `apptodo`, `myapp`)
- No uses prefijos genéricos como "test-"

### 2. Configura sync-branch (IMPORTANTE)
```bash
# Crear rama dedicada para beads
git branch beads-sync main
git push -u origin beads-sync

# Configurar beads para usar esa rama
bd config set sync.branch beads-sync
```

**¿Por qué sync-branch?**
- Beads usa git worktrees para sincronizar sin cambiar tu rama de trabajo
- Si apuntas a tu rama actual (ej: main), git no puede crear worktree
- La rama `beads-sync` es exclusiva para los JSONL de beads

### 3. Primer commit de configuración
```bash
git add .beads/
git commit -m "chore: Initialize Beads issue tracker"
git push origin main
```

### 4. Primera sincronización
```bash
bd sync
```

Esto:
- Crea el worktree en `.git/beads-worktrees/beads-sync`
- Exporta las issues a `beads-sync`
- Crea el `sync_base.jsonl` para futuros 3-way merges

### 5. Verifica
```bash
bd doctor
bd config list | grep sync   # Debe mostrar sync.branch = beads-sync
git worktree list            # Debe mostrar el worktree de beads-sync
```

---

## Clonar en nueva máquina

### Proceso correcto (PROBADO)
```bash
git clone <repo-url>
cd <repo>
bd init                                    # Detecta JSONL y crea DB
bd config set sync.branch beads-sync       # Configurar sync-branch
bd sync                                    # Sincronizar con remoto
```

`bd init` detecta automáticamente el `issues.jsonl` existente e importa todas las issues.

### Verificar que funciona
```bash
bd list              # Ver issues
bd show <issue-id>   # Ver detalle de una issue
bd doctor            # Diagnóstico completo
```

---

## Comandos de sincronización

| Comando | Descripción |
|---------|-------------|
| `bd sync` | Sync completo: pull → merge → export → push |
| `bd sync --import-only` | Solo importar desde remoto (no pushea) |
| `bd sync --no-pull` | Solo exportar y push (no trae cambios) |
| `bd sync --flush-only` | Solo exportar a JSONL (sin git) |
| `bd sync --status` | Ver diferencias sin sincronizar |

---

## Workflow diario

```bash
# Al trabajar
bd create --title="..." --type=task --priority=2
bd update <id> --status in_progress
bd close <id>

# Al cerrar sesión
bd sync                    # Sincroniza issues
git add .                  # Stage cambios de código
git commit -m "mensaje"
git push
```

---

## Comandos de diagnóstico

```bash
# Configuración
bd config list                           # Ver toda la config
bd config get sync.branch                # Ver rama de sync

# Estado
bd doctor                                # Diagnóstico completo
bd stats                                 # Estadísticas de issues
bd list --status all                     # Todas las issues

# Git/Worktrees
git worktree list                        # Ver worktrees
ls -la .git/beads-worktrees/             # Ver worktree de beads
git ls-remote --heads origin beads-sync  # Ver rama en remoto

# JSONL
grep "<issue-id>" .beads/issues.jsonl | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['status'])"
```

---

## Solución de problemas

### Problema: Issues no se sincronizan entre máquinas

**Síntomas**:
- `bd list` muestra estados diferentes en cada máquina
- Cerrar una issue en una máquina no se refleja en otra

**Diagnóstico**:
```bash
bd config get sync.branch    # ¿Está configurado?
git worktree list            # ¿Existe el worktree?
bd doctor                    # ¿Hay errores?
```

**Solución - Reinstalación limpia**:
```bash
# 1. Backup
cp .beads/issues.jsonl ~/backup-issues.jsonl

# 2. Limpiar todo
rm -rf .beads
rm -rf .git/beads-worktrees
git worktree prune

# 3. Reiniciar
git pull
bd init
bd config set sync.branch beads-sync
bd sync
```

### Problema: Worktree divergido (push rechazado)

**Síntomas**:
```
! [rejected] beads-sync -> beads-sync (non-fast-forward)
```

**Causa**: El worktree local tiene commits que divergen del remoto.

**Solución**:
```bash
cd .git/beads-worktrees/beads-sync
git pull --rebase origin beads-sync
git push origin beads-sync
```

### Problema: "No base state found"

**Causa**: Primera sincronización o `sync_base.jsonl` perdido.

**Efecto**: El 3-way merge no puede distinguir cambios, usa LWW (Last Write Wins) por timestamp.

**Solución**: Ejecutar `bd sync` crea el base state automáticamente.

### Problema: Una máquina sobrescribe cambios de otra

**Causa**: LWW (Last Write Wins) cuando no hay base state, gana el timestamp más reciente.

**Prevención**:
1. Siempre hacer `bd sync` antes de hacer cambios
2. Asegurar que ambas máquinas tienen `sync_base.jsonl`
3. Sincronizar frecuentemente

### Problema: Error "import requires SQLite storage backend"

**Causa**: `no-db: true` activo.

**Solución**:
```bash
# En .beads/config.yaml, cambiar o eliminar:
no-db: false
```

### Problema: "prefix mismatch" al clonar

**Causa**: El prefijo en config.yaml no coincide con las issues.

**Solución**: No cambiar el prefijo después de crear issues.

---

## Configuración recomendada

`.beads/config.yaml`:
```yaml
issue_prefix: apptodo
sync:
  branch: beads-sync
# no-db: false (o no incluirlo, false es default)
```

---

## Resumen de errores a evitar

❌ **NO hacer**:
- Cambiar el prefijo después de crear issues
- Usar `no-db: true` en proyectos colaborativos
- Hacer `bd sync` en una máquina sin hacer `bd sync` primero en la otra
- Editar manualmente `.beads/issues.jsonl`
- Borrar `.beads/sync_base.jsonl` (es el estado base para merge)

✅ **SÍ hacer**:
- Inicializar Beads temprano en el proyecto
- Usar prefijo consistente desde el inicio
- Ejecutar `bd sync` regularmente y ANTES de hacer cambios
- Confiar en `bd doctor` para diagnosticar
- Mantener sincronizadas todas las máquinas

---

## Archivos importantes

| Archivo | Propósito | ¿Git tracked? |
|---------|-----------|---------------|
| `.beads/beads.db` | Base de datos SQLite local | No |
| `.beads/issues.jsonl` | Issues en formato JSONL | Solo en beads-sync |
| `.beads/sync_base.jsonl` | Estado base para 3-way merge | No |
| `.beads/config.yaml` | Configuración | Sí (en main) |
| `.beads/.gitignore` | Ignora archivos locales | Sí (en main) |
| `.git/beads-worktrees/beads-sync` | Worktree para sync | N/A (git interno) |

---

*Última actualización: 2026-01-11*
*Basado en experiencia resolviendo problemas de sincronización en apptodo*
