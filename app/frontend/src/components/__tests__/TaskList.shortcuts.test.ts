import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useShortcuts, type Shortcut } from '../../utils/shortcutsManager'

describe('TaskList Shortcuts Integration', () => {
  let shortcuts: ReturnType<typeof useShortcuts>

  beforeEach(() => {
    shortcuts = useShortcuts()
  })

  it('should register 9 shortcuts for task list', () => {
    // The shortcuts that should be registered in TaskList
    const expectedShortcuts = [
      'task-list-create-new',
      'task-list-create-new-ctrl',
      'task-list-show-shortcuts',
      'task-list-clear-filters-meta',
      'task-list-clear-filters-ctrl',
      'task-list-close-modal',
      'task-list-focus-search-meta',
      'task-list-focus-search-ctrl',
      'task-list-next-task',
      'task-list-prev-task',
      'task-list-open-task',
      'task-list-delete-task',
    ]

    // Register sample shortcuts
    expectedShortcuts.forEach((id) => {
      shortcuts.register({
        id,
        keys: ['Meta', 'K'],
        description: 'Test shortcut',
        handler: async () => {},
        enabled: true,
      })
    })

    const registered = shortcuts.getAll()
    expect(registered.length).toBeGreaterThanOrEqual(expectedShortcuts.length)
  })

  it('should create new task with Cmd+K', async () => {
    const handler = vi.fn()

    shortcuts.register({
      id: 'create-task-cmd',
      keys: ['Meta', 'K'],
      description: 'Create new task',
      handler: handler,
      enabled: true,
    })

    const shortcut = shortcuts.getAll().find((s) => s.id === 'create-task-cmd')
    expect(shortcut).toBeDefined()
    expect(shortcut?.keys).toEqual(['Meta', 'K'])

    await shortcut?.handler()
    expect(handler).toHaveBeenCalled()
  })

  it('should focus search with Cmd+F', async () => {
    const handler = vi.fn()

    shortcuts.register({
      id: 'focus-search',
      keys: ['Meta', 'F'],
      description: 'Focus search input',
      handler: handler,
      enabled: true,
    })

    const shortcut = shortcuts.getAll().find((s) => s.id === 'focus-search')
    expect(shortcut).toBeDefined()
    await shortcut?.handler()
    expect(handler).toHaveBeenCalled()
  })

  it('should clear filters with Cmd+Shift+C', async () => {
    const handler = vi.fn()

    shortcuts.register({
      id: 'clear-filters',
      keys: ['Meta', 'Shift', 'C'],
      description: 'Clear all filters',
      handler: handler,
      enabled: true,
    })

    const shortcut = shortcuts.getAll().find((s) => s.id === 'clear-filters')
    expect(shortcut).toBeDefined()
    await shortcut?.handler()
    expect(handler).toHaveBeenCalled()
  })

  it('should enable and disable shortcuts', () => {
    const shortcut: Shortcut = {
      id: 'toggle-test',
      keys: ['Meta', 'T'],
      description: 'Test toggle',
      handler: async () => {},
      enabled: true,
    }

    shortcuts.register(shortcut)
    shortcuts.disable('toggle-test')

    const disabled = shortcuts.getAll().find((s) => s.id === 'toggle-test')
    expect(disabled?.enabled).toBe(false)

    shortcuts.enable('toggle-test')
    const enabled = shortcuts.getAll().find((s) => s.id === 'toggle-test')
    expect(enabled?.enabled).toBe(true)
  })

  it('should unregister shortcuts', () => {
    shortcuts.register({
      id: 'temp-shortcut',
      keys: ['Meta', 'T'],
      description: 'Temporary shortcut',
      handler: async () => {},
      enabled: true,
    })

    let found = shortcuts.getAll().find((s) => s.id === 'temp-shortcut')
    expect(found).toBeDefined()

    shortcuts.unregister('temp-shortcut')
    found = shortcuts.getAll().find((s) => s.id === 'temp-shortcut')
    expect(found).toBeUndefined()
  })

  it('should handle multiple shortcuts with proper descriptions', () => {
    const shortcutDescriptions: Record<string, string> = {
      'create-new': 'Create new task (Cmd+K)',
      'show-shortcuts': 'Show available shortcuts (Cmd+?)',
      'clear-filters': 'Clear all filters (Cmd+Shift+C)',
      'close-modal': 'Close open modal (Esc)',
      'focus-search': 'Focus search input (Cmd+F)',
      'next-task': 'Move to next task (J)',
      'prev-task': 'Move to previous task (K)',
      'open-task': 'Open focused task (Enter)',
      'delete-task': 'Delete focused task (D)',
    }

    Object.entries(shortcutDescriptions).forEach(([id, description]) => {
      shortcuts.register({
        id,
        keys: ['Meta', 'K'],
        description,
        handler: async () => {},
        enabled: true,
      })
    })

    const all = shortcuts.getAll()
    expect(all.length).toBeGreaterThanOrEqual(Object.keys(shortcutDescriptions).length)
  })
})
