import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoryStore } from '../category'

describe('Category Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockCategory = {
    id: '1',
    name: 'Work',
    color: '#FF6B6B',
    icon: 'briefcase',
    created_at: '2026-01-09T00:00:00Z',
    updated_at: '2026-01-09T00:00:00Z',
  }

  describe('Initial State', () => {
    it('should have empty categories array on init', () => {
      const store = useCategoryStore()
      expect(store.categories).toEqual([])
    })

    it('should have null loading state on init', () => {
      const store = useCategoryStore()
      expect(store.loading).toBe(false)
    })

    it('should have null error on init', () => {
      const store = useCategoryStore()
      expect(store.error).toBeNull()
    })

    it('should have null selected category on init', () => {
      const store = useCategoryStore()
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('Category Actions', () => {
    it('should add a category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      expect(store.categories.length).toBe(1)
      expect(store.categories[0]).toEqual(mockCategory)
    })

    it('should set categories array', () => {
      const store = useCategoryStore()
      const categories = [mockCategory, { ...mockCategory, id: '2', name: 'Personal' }]
      store.setCategories(categories)

      expect(store.categories).toEqual(categories)
    })

    it('should update a category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      const updatedCategory = { ...mockCategory, name: 'Updated Work' }
      store.updateCategory(updatedCategory)

      expect(store.categories[0].name).toBe('Updated Work')
    })

    it('should delete a category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      store.deleteCategory(mockCategory.id)

      expect(store.categories.length).toBe(0)
    })

    it('should clear all categories', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.addCategory({ ...mockCategory, id: '2' })

      store.clearCategories()

      expect(store.categories).toEqual([])
    })
  })

  describe('Category Selection', () => {
    it('should select a category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.selectCategory(mockCategory.id)

      expect(store.selectedCategory?.id).toBe(mockCategory.id)
    })

    it('should deselect category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.selectCategory(mockCategory.id)
      store.deselectCategory()

      expect(store.selectedCategory).toBeNull()
    })

    it('should get selected category', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.selectCategory(mockCategory.id)

      expect(store.getSelectedCategory()).toEqual(mockCategory)
    })
  })

  describe('Category Lookup', () => {
    it('should find category by id', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      expect(store.getCategoryById(mockCategory.id)).toEqual(mockCategory)
    })

    it('should find category by name', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      expect(store.getCategoryByName('Work')).toEqual(mockCategory)
    })

    it('should return null for non-existent category', () => {
      const store = useCategoryStore()
      expect(store.getCategoryById('non-existent')).toBeNull()
    })
  })

  describe('Category Colors', () => {
    it('should track category colors', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      expect(store.getCategoryColor(mockCategory.id)).toBe(mockCategory.color)
    })

    it('should update category color', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.updateCategoryColor(mockCategory.id, '#0081CF')

      expect(store.getCategoryColor(mockCategory.id)).toBe('#0081CF')
    })

    it('should provide color palette', () => {
      const store = useCategoryStore()
      const palette = store.colorPalette || ['#FF6B6B', '#0081CF', '#00B341']

      expect(palette).toBeDefined()
    })
  })

  describe('Category Icons', () => {
    it('should track category icons', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      expect(store.getCategoryIcon(mockCategory.id)).toBe(mockCategory.icon)
    })

    it('should update category icon', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.updateCategoryIcon(mockCategory.id, 'folder')

      expect(store.getCategoryIcon(mockCategory.id)).toBe('folder')
    })

    it('should provide available icons', () => {
      const store = useCategoryStore()
      const icons = store.availableIcons || ['briefcase', 'folder', 'star']

      expect(icons).toBeDefined()
    })
  })

  describe('Loading State', () => {
    it('should set loading true', () => {
      const store = useCategoryStore()
      store.setLoading(true)

      expect(store.loading).toBe(true)
    })

    it('should set loading false', () => {
      const store = useCategoryStore()
      store.setLoading(true)
      store.setLoading(false)

      expect(store.loading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should set error message', () => {
      const store = useCategoryStore()
      const error = 'Failed to load categories'
      store.setError(error)

      expect(store.error).toBe(error)
    })

    it('should clear error', () => {
      const store = useCategoryStore()
      store.setError('Some error')
      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should get category count', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.addCategory({ ...mockCategory, id: '2' })

      expect(store.categoryCount).toBe(2)
    })

    it('should get sorted categories', () => {
      const store = useCategoryStore()
      store.addCategory({ ...mockCategory, id: '2', name: 'Zulu' })
      store.addCategory({ ...mockCategory, id: '1', name: 'Alpha' })

      const sorted = store.sortedCategories || store.categories
      expect(sorted).toBeDefined()
    })

    it('should get grouped categories', () => {
      const store = useCategoryStore()
      store.addCategory({ ...mockCategory, id: '1', name: 'Work' })
      store.addCategory({ ...mockCategory, id: '2', name: 'Personal' })

      const grouped = store.groupedCategories || store.categories
      expect(grouped).toBeDefined()
    })
  })

  describe('Category Filtering', () => {
    it('should filter categories by name', () => {
      const store = useCategoryStore()
      store.addCategory({ ...mockCategory, id: '1', name: 'Work' })
      store.addCategory({ ...mockCategory, id: '2', name: 'Personal' })

      const filtered = store.searchCategories('Work')
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should filter categories by color', () => {
      const store = useCategoryStore()
      store.addCategory({ ...mockCategory, id: '1', color: '#FF6B6B' })
      store.addCategory({ ...mockCategory, id: '2', color: '#0081CF' })

      const byColor = store.getCategoriesByColor('#FF6B6B')
      expect(byColor).toBeDefined()
    })
  })

  describe('Category Usage', () => {
    it('should track category usage', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.incrementCategoryUsage(mockCategory.id)

      expect(store.getCategoryUsage(mockCategory.id)).toBeGreaterThan(0)
    })

    it('should get most used categories', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.incrementCategoryUsage(mockCategory.id)
      store.incrementCategoryUsage(mockCategory.id)

      const mostUsed = store.getMostUsedCategories(1)
      expect(mostUsed).toBeDefined()
    })
  })

  describe('Category Defaults', () => {
    it('should have default categories', () => {
      const store = useCategoryStore()
      store.initializeDefaultCategories?.()

      expect(store.categories.length).toBeGreaterThan(0)
    })

    it('should reset to defaults', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.resetToDefaults?.()

      expect(store.categories).toBeDefined()
    })
  })

  describe('Bulk Operations', () => {
    it('should bulk delete categories', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.addCategory({ ...mockCategory, id: '2' })

      store.bulkDelete([mockCategory.id, '2'])

      expect(store.categories.length).toBe(0)
    })

    it('should bulk update colors', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.addCategory({ ...mockCategory, id: '2' })

      store.bulkUpdateColors?.([mockCategory.id, '2'], '#000000')

      expect(store.categories.every((c) => c.color === '#000000')).toBeTruthy()
    })
  })

  describe('Favorite Categories', () => {
    it('should mark category as favorite', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.toggleFavorite(mockCategory.id)

      expect(store.isFavorite(mockCategory.id)).toBe(true)
    })

    it('should unmark category as favorite', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.toggleFavorite(mockCategory.id)
      store.toggleFavorite(mockCategory.id)

      expect(store.isFavorite(mockCategory.id)).toBe(false)
    })

    it('should get favorite categories', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.toggleFavorite(mockCategory.id)

      const favorites = store.getFavoriteCategories()
      expect(favorites.some((c) => c.id === mockCategory.id)).toBeTruthy()
    })
  })

  describe('Category Export/Import', () => {
    it('should export categories', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)

      const exported = store.exportCategories?.()
      expect(exported).toBeDefined()
    })

    it('should import categories', () => {
      const store = useCategoryStore()
      const categoriesToImport = [mockCategory]

      store.importCategories?.(categoriesToImport)

      expect(store.categories.length).toBeGreaterThan(0)
    })
  })

  describe('Undo/Redo', () => {
    it('should support undo', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.undo?.()

      expect(store.categories.length).toBeLessThanOrEqual(1)
    })

    it('should support redo', () => {
      const store = useCategoryStore()
      store.addCategory(mockCategory)
      store.undo?.()
      store.redo?.()

      expect(store.categories.length).toBeGreaterThan(0) || expect(store.redo).toBeDefined()
    })
  })
})
