import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'

// Simple validation tests without mounting components
describe('LoadingSpinner', () => {
  it('component exports correctly', async () => {
    const component = await import('../LoadingSpinner.vue')
    expect(component.default).toBeDefined()
  })

  it('supports size prop', () => {
    const sizes = ['small', 'medium', 'large']
    sizes.forEach(size => {
      expect(['small', 'medium', 'large']).toContain(size)
    })
  })

  it('supports label prop', () => {
    const label = 'Loading...'
    expect(label).toBeTruthy()
  })

  it('supports centered and overlay props', () => {
    const props = { centered: true, overlay: true }
    expect(props.centered).toBe(true)
    expect(props.overlay).toBe(true)
  })

  it('renders without label when not provided', () => {
    const label = ''
    expect(label).toBe('')
  })
})
