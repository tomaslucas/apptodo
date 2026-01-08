import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface Category {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasLoaded = ref(false)

  const categoriesById = computed(() => {
    const map: Record<string, Category> = {}
    categories.value.forEach((category) => {
      map[category.id] = category
    })
    return map
  })

  const fetchCategories = async () => {
    if (hasLoaded.value) return // Avoid redundant fetches

    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/v1/categories')
      categories.value = response.data
      hasLoaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch categories'
    } finally {
      isLoading.value = false
    }
  }

  const createCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/v1/categories', categoryData)
      categories.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.patch(`/api/v1/categories/${categoryId}`, updates)
      const index = categories.value.findIndex((c) => c.id === categoryId)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteCategory = async (categoryId: string) => {
    isLoading.value = true
    error.value = null
    try {
      await axios.delete(`/api/v1/categories/${categoryId}`)
      categories.value = categories.value.filter((c) => c.id !== categoryId)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const getCategory = (categoryId: string): Category | undefined => {
    return categoriesById.value[categoryId]
  }

  const hasCategoriesLoaded = (): boolean => {
    return hasLoaded.value
  }

  return {
    categories,
    isLoading,
    error,
    hasLoaded,
    categoriesById,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    hasCategoriesLoaded,
  }
})
