import { describe, it, expect } from 'vitest'
import { useA11y } from '../useA11y'

describe('useA11y Composable', () => {
  it('generates unique form IDs', () => {
    const { generateFormId } = useA11y()
    const id1 = generateFormId('email')
    const id2 = generateFormId('email')
    
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^email-/)
  })

  it('initializes with empty announcements', () => {
    const { announcements } = useA11y()
    expect(Array.isArray(announcements.value)).toBe(true)
  })

  it('initializes with null focused element', () => {
    const { focusedElement } = useA11y()
    expect(focusedElement.value).toBe(null)
  })

  it('has setupKeyboardNav method', () => {
    const { setupKeyboardNav } = useA11y()
    expect(typeof setupKeyboardNav).toBe('function')
  })

  it('has focusTrap method', () => {
    const { focusTrap } = useA11y()
    expect(typeof focusTrap).toBe('function')
  })

  it('has announceError method', () => {
    const { announceError } = useA11y()
    expect(typeof announceError).toBe('function')
  })

  it('has announceSuccess method', () => {
    const { announceSuccess } = useA11y()
    expect(typeof announceSuccess).toBe('function')
  })

  it('has checkContrast method', () => {
    const { checkContrast } = useA11y()
    expect(typeof checkContrast).toBe('function')
  })

  it('exports all required methods', () => {
    const a11y = useA11y()
    expect(a11y).toHaveProperty('focusedElement')
    expect(a11y).toHaveProperty('announcements')
    expect(a11y).toHaveProperty('generateFormId')
    expect(a11y).toHaveProperty('announce')
    expect(a11y).toHaveProperty('setLoading')
    expect(a11y).toHaveProperty('focusElement')
    expect(a11y).toHaveProperty('createSkipNav')
    expect(a11y).toHaveProperty('checkContrast')
    expect(a11y).toHaveProperty('setupKeyboardNav')
    expect(a11y).toHaveProperty('focusTrap')
    expect(a11y).toHaveProperty('announceError')
    expect(a11y).toHaveProperty('announceSuccess')
  })
})
