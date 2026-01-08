import apiClient from './client'
import { Category } from '../stores/category'

export const categoryAPI = {
  // Get all categories
  getCategories: async () => {
    const response = await apiClient.get('/api/v1/categories')
    return response.data.data || response.data
  },

  // Get single category
  getCategory: async (categoryId: string) => {
    const response = await apiClient.get(`/api/v1/categories/${categoryId}`)
    return response.data.data || response.data
  },

  // Create category
  createCategory: async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const response = await apiClient.post('/api/v1/categories', categoryData)
    return response.data.data || response.data
  },

  // Update category
  updateCategory: async (categoryId: string, updates: Partial<Category>) => {
    const response = await apiClient.patch(`/api/v1/categories/${categoryId}`, updates)
    return response.data.data || response.data
  },

  // Delete category
  deleteCategory: async (categoryId: string) => {
    await apiClient.delete(`/api/v1/categories/${categoryId}`)
  },
}
