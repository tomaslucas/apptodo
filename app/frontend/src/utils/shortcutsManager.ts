import { ref, Ref } from 'vue'

export interface Shortcut {
  id: string
  keys: string[] // e.g., ['Meta', 'K'] or ['Control', 'Shift', 'N']
  description: string
  handler: () => void | Promise<void>
  enabled: boolean
}

class ShortcutsManager {
  private shortcuts: Map<string, Shortcut> = new Map()
  private isListening = false
  private pressedKeys: Set<string> = new Set()

  register(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut)
  }

  unregister(shortcutId: string): void {
    this.shortcuts.delete(shortcutId)
  }

  enable(shortcutId: string): void {
    const shortcut = this.shortcuts.get(shortcutId)
    if (shortcut) {
      shortcut.enabled = true
    }
  }

  disable(shortcutId: string): void {
    const shortcut = this.shortcuts.get(shortcutId)
    if (shortcut) {
      shortcut.enabled = false
    }
  }

  start(): void {
    if (this.isListening) return

    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    this.isListening = true
  }

  stop(): void {
    if (!this.isListening) return

    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.isListening = false
    this.pressedKeys.clear()
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.getNormalizedKey(event)
    this.pressedKeys.add(key)

    // Check all shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue

      // Check if this shortcut matches the current key combination
      if (this.matchesShortcut(shortcut)) {
        event.preventDefault()
        shortcut.handler().catch((err) => {
          console.error(`Shortcut ${shortcut.id} handler error:`, err)
        })
        break // Execute only the first matching shortcut
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = this.getNormalizedKey(event)
    this.pressedKeys.delete(key)
  }

  private getNormalizedKey(event: KeyboardEvent): string {
    // Map special keys to their names
    const specialKeys: Record<string, string> = {
      'Meta': 'Meta',
      'Control': 'Control',
      'Shift': 'Shift',
      'Alt': 'Alt',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Tab': 'Tab',
      ' ': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
    }

    if (event.key in specialKeys) {
      return specialKeys[event.key]
    }

    // For regular keys, use uppercase letter
    if (event.key.length === 1) {
      return event.key.toUpperCase()
    }

    return event.key
  }

  private matchesShortcut(shortcut: Shortcut): boolean {
    // Check if all required keys are pressed
    if (shortcut.keys.length !== this.pressedKeys.size) {
      return false
    }

    for (const key of shortcut.keys) {
      if (!this.pressedKeys.has(key)) {
        return false
      }
    }

    return true
  }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  get(shortcutId: string): Shortcut | undefined {
    return this.shortcuts.get(shortcutId)
  }

  clear(): void {
    this.shortcuts.clear()
    this.pressedKeys.clear()
  }
}

// Singleton instance
const manager = new ShortcutsManager()

export const useShortcuts = () => {
  const shortcuts: Ref<Shortcut[]> = ref([])

  const register = (shortcut: Shortcut) => {
    manager.register(shortcut)
    shortcuts.value = manager.getAll()
  }

  const unregister = (shortcutId: string) => {
    manager.unregister(shortcutId)
    shortcuts.value = manager.getAll()
  }

  const enable = (shortcutId: string) => {
    manager.enable(shortcutId)
  }

  const disable = (shortcutId: string) => {
    manager.disable(shortcutId)
  }

  const start = () => {
    manager.start()
  }

  const stop = () => {
    manager.stop()
  }

  const getAll = () => {
    return manager.getAll()
  }

  return {
    shortcuts,
    register,
    unregister,
    enable,
    disable,
    start,
    stop,
    getAll,
  }
}

export default manager
