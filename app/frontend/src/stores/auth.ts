import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  id: string | number
  email: string
  username: string
  created_at?: string
  updated_at?: string
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

  const login = async (userEmail: string, userPassword: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/v1/auth/login', { 
        email: userEmail, 
        password: userPassword 
      })
      
      // Backend returns: { status, data: { access_token, token_type, user }, error, timestamp }
      const accessToken = response.data.data.access_token
      const userData = response.data.data.user
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response from server')
      }
      
      setToken(accessToken)
      setUser(userData)
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      error.value = errorMsg
      console.error('Login error:', errorMsg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userEmail: string, userPassword: string, username: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/v1/auth/register', { 
        email: userEmail, 
        password: userPassword, 
        username 
      })
      
      // Backend returns: { status, data: { user }, error, timestamp }
      const userData = response.data.data.user
      
      if (!userData) {
        throw new Error('Registration failed')
      }
      
      // After registration, user should login
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed'
      error.value = errorMsg
      console.error('Register error:', errorMsg)
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
