import { describe, it, expect } from 'vitest'
import {
  generateId,
  isAccessible,
  isContrastCompliant,
  getContrastRatio,
  createSrOnlyText
} from '../accessibility'

describe('Accessibility Utilities', () => {
  describe('ID Generation', () => {
    it('generates unique IDs', () => {
      const id1 = generateId('form')
      const id2 = generateId('form')
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^form-/)
      expect(id2).toMatch(/^form-/)
    })

    it('generates IDs with correct prefix', () => {
      const id = generateId('input')
      expect(id).toMatch(/^input-[a-z0-9]+$/)
    })
  })

  describe('Color Contrast', () => {
    it('validates WCAG AA compliance for normal text', () => {
      // 4.5:1 ratio should pass AA for normal text
      expect(isContrastCompliant(4.5, 'AA', false)).toBe(true)
      expect(isContrastCompliant(3.5, 'AA', false)).toBe(false)
    })

    it('validates WCAG AAA compliance for normal text', () => {
      // 7:1 ratio should pass AAA for normal text
      expect(isContrastCompliant(7, 'AAA', false)).toBe(true)
      expect(isContrastCompliant(6, 'AAA', false)).toBe(false)
    })

    it('considers large text AA compliance', () => {
      // 3:1 ratio should pass AA for large text
      expect(isContrastCompliant(3, 'AA', true)).toBe(true)
      expect(isContrastCompliant(2.5, 'AA', true)).toBe(false)
    })

    it('considers large text AAA compliance', () => {
      // 4.5:1 ratio should pass AAA for large text
      expect(isContrastCompliant(4.5, 'AAA', true)).toBe(true)
      expect(isContrastCompliant(4, 'AAA', true)).toBe(false)
    })
  })
})
