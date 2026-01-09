import { vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

// Mock Tailwind CSS processing for components that use it
global.CSS = {
  ...global.CSS,
  supports: vi.fn(() => false),
}

// Suppress PostCSS warnings in tests
const originalWarn = console.warn
console.warn = function (...args: any[]) {
  if (typeof args[0] === 'string' && args[0].includes('tailwindcss')) {
    return
  }
  originalWarn.apply(console, args)
}

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
