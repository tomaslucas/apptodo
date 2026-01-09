<template>
  <div :class="`skeleton-screen skeleton-${variant}`">
    <div 
      v-for="i in count" 
      :key="i"
      :class="lineClass"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'card' | 'list-item' | 'full'
  count?: number
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  count: 3,
  animated: true
})

const lineClass = computed(() => {
  const variantClasses = {
    text: 'h-4 bg-gray-200 rounded mb-2 last:mb-0',
    card: 'h-12 bg-gray-200 rounded-lg mb-3 last:mb-0',
    'list-item': 'h-16 bg-gray-200 rounded-lg mb-3 last:mb-0',
    full: 'h-20 bg-gray-200 rounded-lg mb-4 last:mb-0'
  }
  
  const classes = [variantClasses[props.variant]]
  
  if (props.animated) {
    classes.push('animate-pulse')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.skeleton-screen {
  padding: 1rem;
}

.skeleton-text > div {
  width: 100%;
}

.skeleton-card > div {
  width: 100%;
}

.skeleton-list-item > div {
  width: 100%;
  display: flex;
  gap: 0.75rem;
}

.skeleton-list-item > div::before {
  content: '';
  width: 3rem;
  height: 3rem;
  background-color: rgb(229, 231, 235);
  border-radius: 0.5rem;
  flex-shrink: 0;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
