<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Register</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
          >
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
          >
          <div
            v-if="emailError"
            class="error-message"
          >
            {{ emailError }}
          </div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            @input="validatePassword"
          >
          <div class="password-requirements">
            <div :class="['req-item', { met: passwordMet.length }]">
              {{ passwordMet.length ? '✓' : '○' }} At least 8 characters
            </div>
            <div :class="['req-item', { met: passwordMet.uppercase }]">
              {{ passwordMet.uppercase ? '✓' : '○' }} At least 1 uppercase letter
            </div>
            <div :class="['req-item', { met: passwordMet.digit }]">
              {{ passwordMet.digit ? '✓' : '○' }} At least 1 number
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
          >
        </div>
        <div
          v-if="passwordError"
          class="error-message"
        >
          {{ passwordError }}
        </div>
        <div
          v-if="authStore.error"
          class="error-message"
        >
          {{ authStore.error }}
        </div>
        <button
          type="submit"
          :disabled="authStore.isLoading || !isFormValid"
          class="btn-submit"
        >
          {{ authStore.isLoading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <p class="login-link">
        Already have an account? <router-link to="/login">
          Login here
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()
const authStore = useAuthStore()

const passwordMet = computed(() => ({
  length: password.value.length >= 8,
  uppercase: /[A-Z]/.test(password.value),
  digit: /[0-9]/.test(password.value)
}))

const passwordError = computed(() => {
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    return 'Passwords do not match'
  }
  return null
})

const emailError = computed(() => {
  if (!email.value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    return 'Invalid email format'
  }
  // Reject reserved domains
  const reservedDomains = ['test.test', 'example.com', 'test', 'localhost']
  const domain = email.value.split('@')[1]?.toLowerCase()
  if (domain && reservedDomains.includes(domain)) {
    return 'Please use a real email domain (e.g., gmail.com, yahoo.com)'
  }
  return null
})

const isFormValid = computed(() => {
  return (
    name.value.trim().length >= 3 &&
    email.value.length > 0 &&
    !emailError.value &&
    passwordMet.value.length &&
    passwordMet.value.uppercase &&
    passwordMet.value.digit &&
    password.value === confirmPassword.value &&
    !passwordError.value
  )
})

const validatePassword = () => {
  // Validation happens in computed properties
}

const handleRegister = async () => {
  if (passwordError.value || !isFormValid.value) return

  if (await authStore.register(email.value, password.value, name.value)) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-card h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  color: #222;
  font-weight: 500;
}

.form-group input::placeholder {
  color: #999;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #4CAF50;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.password-requirements {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9rem;
}

.req-item {
  color: #999;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.req-item.met {
  color: #4CAF50;
  font-weight: 500;
}

.req-item:last-child {
  margin-bottom: 0;
}
</style>
