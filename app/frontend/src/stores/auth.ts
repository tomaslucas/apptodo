import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  id: string
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password })
      const { token: newToken, user: newUser } = response.data
      setToken(newToken)
      setUser(newUser)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email: string, password: string, name: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/v1/auth/register', { email, password, name })
      const { token: newToken, user: newUser } = response.data
      setToken(newToken)
      setUser(newUser)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const initializeAuth = () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    setToken,
    setUser,
    login,
    register,
    logout,
    initializeAuth,
  }
})
