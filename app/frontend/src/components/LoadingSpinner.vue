<template>
  <div :class="containerClass">
    <div :class="spinnerClass"></div>
    <p v-if="label" :class="labelClass">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  label?: string
  centered?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  label: '',
  centered: false,
  overlay: false
})

const containerClass = computed(() => {
  const classes = ['flex flex-col items-center justify-center']
  
  if (props.centered) {
    classes.push('h-full')
  }
  
  if (props.overlay) {
    classes.push('fixed inset-0 bg-black/50 z-50')
  }
  
  return classes.join(' ')
})

const spinnerClass = computed(() => {
  const sizeMap = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }
  
  return `
    border-t-primary-500 border-r-primary-500 border-b-transparent border-l-transparent
    rounded-full animate-spin
    ${sizeMap[props.size]}
  `.trim().replace(/\s+/g, ' ')
})

const labelClass = computed(() => {
  const sizeMap = {
    small: 'text-xs mt-1',
    medium: 'text-sm mt-2',
    large: 'text-base mt-3'
  }
  
  return `text-gray-600 ${sizeMap[props.size]}`.trim()
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg)
  }
  to {
    transform: rotate(360deg)
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
