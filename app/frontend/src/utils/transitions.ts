/**
 * Vue Transition utilities for common animations
 */

export interface TransitionConfig {
  name: string
  duration?: number
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
}

/**
 * Fade transition configuration
 */
export const fadeTransition: TransitionConfig = {
  name: 'fade',
  duration: 300,
  enterFromClass: 'opacity-0',
  enterActiveClass: 'transition-opacity duration-300',
  enterToClass: 'opacity-100',
  leaveFromClass: 'opacity-100',
  leaveActiveClass: 'transition-opacity duration-300',
  leaveToClass: 'opacity-0',
}

/**
 * Slide up transition configuration
 */
export const slideUpTransition: TransitionConfig = {
  name: 'slide-up',
  duration: 300,
  enterFromClass: 'opacity-0 translate-y-2',
  enterActiveClass: 'transition-all duration-300',
  enterToClass: 'opacity-100 translate-y-0',
  leaveFromClass: 'opacity-100 translate-y-0',
  leaveActiveClass: 'transition-all duration-300',
  leaveToClass: 'opacity-0 translate-y-2',
}

/**
 * Slide down transition configuration
 */
export const slideDownTransition: TransitionConfig = {
  name: 'slide-down',
  duration: 300,
  enterFromClass: 'opacity-0 -translate-y-2',
  enterActiveClass: 'transition-all duration-300',
  enterToClass: 'opacity-100 translate-y-0',
  leaveFromClass: 'opacity-100 translate-y-0',
  leaveActiveClass: 'transition-all duration-300',
  leaveToClass: 'opacity-0 -translate-y-2',
}

/**
 * Scale transition configuration
 */
export const scaleTransition: TransitionConfig = {
  name: 'scale',
  duration: 200,
  enterFromClass: 'opacity-0 scale-95',
  enterActiveClass: 'transition-all duration-200',
  enterToClass: 'opacity-100 scale-100',
  leaveFromClass: 'opacity-100 scale-100',
  leaveActiveClass: 'transition-all duration-200',
  leaveToClass: 'opacity-0 scale-95',
}

/**
 * Bounce animation for interactive feedback
 */
export const bounceAnimation = () => {
  return {
    class: 'animate-bounce',
    duration: 500,
  }
}

/**
 * Pulse animation for loading or attention-seeking
 */
export const pulseAnimation = () => {
  return {
    class: 'animate-pulse',
    duration: 2000,
  }
}

/**
 * Apply bounce animation to an element
 */
export const applyBounce = (element: HTMLElement, duration = 500) => {
  element.style.animation = `bounce ${duration}ms ease-in-out`
  setTimeout(() => {
    element.style.animation = ''
  }, duration)
}

/**
 * Smooth scroll to element with animation
 */
export const smoothScrollTo = (element: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
  element.scrollIntoView({
    behavior,
    block: 'nearest',
    inline: 'nearest',
  })
}

/**
 * Fade in element with optional delay
 */
export const fadeInElement = (element: HTMLElement, delay = 0) => {
  setTimeout(() => {
    element.classList.add('animate-fade-in')
  }, delay)
}

/**
 * Fade out element and remove it
 */
export const fadeOutElement = (element: HTMLElement, onComplete?: () => void) => {
  element.classList.add('animate-fade-out')
  setTimeout(() => {
    onComplete?.()
  }, 300)
}

/**
 * Transition classes utility
 */
export const transitionClasses = {
  fade: 'transition-opacity duration-300',
  slideUp: 'transition-all duration-300',
  slideDown: 'transition-all duration-300',
  scale: 'transition-all duration-200',
  transform: 'transition-transform duration-300',
  all: 'transition-all duration-300',
}
