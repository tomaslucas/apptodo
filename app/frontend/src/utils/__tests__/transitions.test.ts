import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  fadeTransition,
  slideUpTransition,
  slideDownTransition,
  scaleTransition,
  transitionClasses,
  bounceAnimation,
  pulseAnimation,
  applyBounce,
  smoothScrollTo,
  fadeInElement,
  fadeOutElement,
} from '../transitions'

describe('Transitions Utilities', () => {
  describe('Transition Configurations', () => {
    it('should export fade transition config', () => {
      expect(fadeTransition.name).toBe('fade')
      expect(fadeTransition.duration).toBe(300)
      expect(fadeTransition.enterFromClass).toBe('opacity-0')
      expect(fadeTransition.leaveToClass).toBe('opacity-0')
    })

    it('should export slide up transition config', () => {
      expect(slideUpTransition.name).toBe('slide-up')
      expect(slideUpTransition.duration).toBe(300)
      expect(slideUpTransition.enterFromClass).toContain('opacity-0')
      expect(slideUpTransition.enterFromClass).toContain('translate-y-2')
    })

    it('should export slide down transition config', () => {
      expect(slideDownTransition.name).toBe('slide-down')
      expect(slideDownTransition.duration).toBe(300)
      expect(slideDownTransition.enterFromClass).toContain('opacity-0')
      expect(slideDownTransition.enterFromClass).toContain('-translate-y-2')
    })

    it('should export scale transition config', () => {
      expect(scaleTransition.name).toBe('scale')
      expect(scaleTransition.duration).toBe(200)
      expect(scaleTransition.enterFromClass).toContain('scale-95')
    })
  })

  describe('Animation Utilities', () => {
    it('should return bounce animation config', () => {
      const bounce = bounceAnimation()
      expect(bounce.class).toBe('animate-bounce')
      expect(bounce.duration).toBe(500)
    })

    it('should return pulse animation config', () => {
      const pulse = pulseAnimation()
      expect(pulse.class).toBe('animate-pulse')
      expect(pulse.duration).toBe(2000)
    })

    it('should export transition classes', () => {
      expect(transitionClasses.fade).toContain('transition-opacity')
      expect(transitionClasses.slideUp).toContain('transition-all')
      expect(transitionClasses.scale).toContain('transition-all')
      expect(transitionClasses.all).toBe('transition-all duration-300')
    })
  })

  describe('DOM Animation Functions', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
      document.body.appendChild(element)
    })

    afterEach(() => {
      document.body.removeChild(element)
    })

    it('should apply bounce animation to element', async () => {
      applyBounce(element, 500)
      expect(element.style.animation).toContain('bounce')
      expect(element.style.animation).toContain('500ms')

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(element.style.animation).toBe('')
    })

    it('should add fade-in class to element', () => {
      fadeInElement(element, 0)
      expect(element.classList.contains('animate-fade-in')).toBe(true)
    })

    it('should fade out element and call callback', async () => {
      const callback = vi.fn()
      fadeOutElement(element, callback)
      expect(element.classList.contains('animate-fade-out')).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(callback).toHaveBeenCalled()
    })

    it('should smooth scroll to element', () => {
      const scrollIntoViewMock = vi.fn()
      element.scrollIntoView = scrollIntoViewMock

      smoothScrollTo(element, 'smooth')

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    })
  })

  describe('Transition Duration', () => {
    it('should have consistent duration values', () => {
      expect(fadeTransition.duration).toBe(slideUpTransition.duration)
      expect(fadeTransition.duration).toBe(slideDownTransition.duration)
      expect(scaleTransition.duration).toBe(200)
    })
  })

  describe('Enter and Leave Classes', () => {
    it('should have matching opacity states for fade transition', () => {
      expect(fadeTransition.enterFromClass).toBe('opacity-0')
      expect(fadeTransition.leaveToClass).toBe('opacity-0')
      expect(fadeTransition.enterToClass).toBe('opacity-100')
      expect(fadeTransition.leaveFromClass).toBe('opacity-100')
    })

    it('should have matching transform states for scale transition', () => {
      expect(scaleTransition.enterFromClass).toContain('scale-95')
      expect(scaleTransition.leaveToClass).toContain('scale-95')
      expect(scaleTransition.enterToClass).toContain('scale-100')
      expect(scaleTransition.leaveFromClass).toContain('scale-100')
    })
  })
})
