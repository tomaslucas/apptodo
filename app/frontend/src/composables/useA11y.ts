import { computed, ref, Ref, watch } from 'vue'
import {
  generateId,
  announceToScreenReader,
  setLoadingAria,
  focusWithAnnouncement,
  isContrastCompliant,
  getContrastRatio
} from '@/utils/accessibility'

/**
 * Composable for managing accessibility features
 */
export function useA11y() {
  const focusedElement = ref<HTMLElement | null>(null)
  const announcements = ref<string[]>([])

  /**
   * Generate accessible ID for form controls
   */
  const generateFormId = (name: string): string => {
    return generateId(name)
  }

  /**
   * Announce message to screen readers
   */
  const announce = (
    message: string,
    type: 'status' | 'alert' = 'status',
    duration?: number
  ): void => {
    announcements.value.push(message)
    announceToScreenReader(message, type, duration)
  }

  /**
   * Set loading state with ARIA attributes
   */
  const setLoading = (element: HTMLElement, isLoading: boolean): void => {
    setLoadingAria(element, isLoading)
  }

  /**
   * Focus element with announcement
   */
  const focusElement = (
    element: HTMLElement,
    announcement?: string
  ): void => {
    focusWithAnnouncement(element, announcement)
    focusedElement.value = element
  }

  /**
   * Create accessible skip link navigation
   */
  const createSkipNav = (targets: Array<{ id: string; label: string }>) => {
    const nav = document.createElement('nav')
    nav.className = 'skip-nav'
    nav.setAttribute('aria-label', 'Skip navigation')

    targets.forEach(({ id, label }) => {
      const link = document.createElement('a')
      link.href = `#${id}`
      link.textContent = label
      link.className = 'skip-link sr-only sr-only-focusable'
      nav.appendChild(link)
    })

    return nav
  }

  /**
   * Validate color contrast
   */
  const checkContrast = (
    color1: string,
    color2: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    const ratio = getContrastRatio(color1, color2)
    return isContrastCompliant(ratio, level)
  }

  /**
   * Setup keyboard navigation
   */
  const setupKeyboardNav = (
    element: HTMLElement,
    handler: (key: string) => void
  ): (() => void) => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(
          e.key
        )
      ) {
        e.preventDefault()
        handler(e.key)
      }
    }

    element.addEventListener('keydown', keydownHandler)

    return () => {
      element.removeEventListener('keydown', keydownHandler)
    }
  }

  /**
   * Manage focus trap (useful for modals)
   */
  const focusTrap = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return () => {}

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  /**
   * Handle error announcements
   */
  const announceError = (message: string): void => {
    announce(`Error: ${message}`, 'alert', 5000)
  }

  /**
   * Handle success announcements
   */
  const announceSuccess = (message: string): void => {
    announce(`Success: ${message}`, 'status', 3000)
  }

  return {
    focusedElement: focusedElement as Ref<HTMLElement | null>,
    announcements: announcements as Ref<string[]>,
    generateFormId,
    announce,
    setLoading,
    focusElement,
    createSkipNav,
    checkContrast,
    setupKeyboardNav,
    focusTrap,
    announceError,
    announceSuccess
  }
}
