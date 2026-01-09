import { describe, it, expect, vi } from 'vitest'
import {
  memoize,
  debounce,
  throttle,
  TTLCache,
  LRUCache
} from '../performance'

describe('Performance Utilities', () => {
  describe('Memoization', () => {
    it('caches function results', () => {
      const fn = vi.fn((a: number, b: number) => a + b)
      const memoized = memoize(fn)

      const result1 = memoized(2, 3)
      const result2 = memoized(2, 3)

      expect(result1).toBe(5)
      expect(result2).toBe(5)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('returns different results for different arguments', () => {
      const fn = vi.fn((a: number) => a * 2)
      const memoized = memoize(fn)

      memoized(5)
      memoized(10)

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Debounce', () => {
    it('returns a function', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      expect(typeof debounced).toBe('function')
    })
  })

  describe('Throttle', () => {
    it('returns a function', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      expect(typeof throttled).toBe('function')
    })
  })

  describe('TTL Cache', () => {
    it('stores and retrieves values', () => {
      const cache = new TTLCache<string>(1000)

      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('checks if key exists', () => {
      const cache = new TTLCache<string>()

      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('deletes values', () => {
      const cache = new TTLCache<string>()

      cache.set('key1', 'value1')
      cache.delete('key1')
      expect(cache.get('key1')).toBeNull()
    })

    it('clears all values', () => {
      const cache = new TTLCache<string>()

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      expect(cache.size()).toBe(2)

      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('LRU Cache', () => {
    it('stores and retrieves values', () => {
      const cache = new LRUCache<string, string>(2)

      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('evicts oldest items when capacity exceeded', () => {
      const cache = new LRUCache<string, string>(2)

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
    })

    it('moves accessed items to end', () => {
      const cache = new LRUCache<string, string>(2)

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.get('key1') // Access key1

      cache.set('key3', 'value3')

      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBeNull()
    })

    it('clears cache', () => {
      const cache = new LRUCache<string, string>(2)

      cache.set('key1', 'value1')
      cache.clear()

      expect(cache.size()).toBe(0)
    })
  })
})
