/**
 * Accessibility utilities for WCAG AA compliance
 */

/**
 * Generate unique ID for form labels and inputs
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  role: 'status' | 'alert' | 'polite' | 'assertive' = 'polite',
  timeout: number = 1000
): void {
  const element = document.createElement('div')
  element.setAttribute('role', role === 'alert' ? 'alert' : 'status')
  element.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite')
  element.setAttribute('aria-atomic', 'true')
  element.className = 'sr-only'
  element.textContent = message

  document.body.appendChild(element)

  setTimeout(() => {
    document.body.removeChild(element)
  }, timeout)
}

/**
 * Check if element is visible and accessible
 */
export function isAccessible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetHeight > 0 &&
    element.offsetWidth > 0
  )
}

/**
 * Get screen reader text (hidden but announced)
 */
export function createSrOnlyText(text: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'sr-only'
  span.textContent = text
  return span
}

/**
 * Calculate color contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = getRGB(color1)
  const rgb2 = getRGB(color2)

  const l1 = getRelativeLuminance(rgb1)
  const l2 = getRelativeLuminance(rgb2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parse color string to RGB
 */
function getRGB(color: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = color
  return [
    parseInt(ctx.fillStyle.substr(1, 2), 16),
    parseInt(ctx.fillStyle.substr(3, 2), 16),
    parseInt(ctx.fillStyle.substr(5, 2), 16)
  ]
}

/**
 * Calculate relative luminance for contrast calculation
 */
function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const luminance = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b)
}

/**
 * Check WCAG AA compliance for contrast ratio
 * AA: 4.5:1 for normal text, 3:1 for large text
 * AAA: 7:1 for normal text, 4.5:1 for large text
 */
export function isContrastCompliant(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Create accessible button with proper ARIA attributes
 */
export function createAccessibleButton(
  label: string,
  ariaLabel?: string,
  attributes?: Record<string, string>
): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = label
  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel)
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      button.setAttribute(key, value)
    })
  }
  return button
}

/**
 * Create accessible form group with label and help text
 */
export function createAccessibleFormGroup(
  id: string,
  labelText: string,
  helpText?: string
): HTMLDivElement {
  const group = document.createElement('div')
  group.className = 'form-group'

  const label = document.createElement('label')
  label.htmlFor = id
  label.textContent = labelText

  group.appendChild(label)

  if (helpText) {
    const help = document.createElement('small')
    help.id = `${id}-help`
    help.className = 'form-help'
    help.textContent = helpText
    group.appendChild(help)
  }

  return group
}

/**
 * Set ARIA attributes for loading state
 */
export function setLoadingAria(
  element: HTMLElement,
  isLoading: boolean,
  label?: string
): void {
  if (isLoading) {
    element.setAttribute('aria-busy', 'true')
    if (label) {
      element.setAttribute('aria-label', label)
    }
  } else {
    element.setAttribute('aria-busy', 'false')
  }
}

/**
 * Focus on element with screen reader announcement
 */
export function focusWithAnnouncement(
  element: HTMLElement,
  announcement?: string
): void {
  element.focus()
  if (announcement) {
    announceToScreenReader(announcement)
  }
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  label: string = 'Skip to main content'
): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.textContent = label
  link.className = 'skip-link sr-only'
  return link
}
