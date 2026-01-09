<template>
  <div :class="containerClass">
    <div :class="trackClass">
      <div :class="barClass" />
    </div>
    <div
      v-if="showLabel"
      :class="labelClass"
    >
      {{ percentage }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showLabel: false,
  size: 'medium',
  color: 'primary',
  animated: true
})

const percentage = computed(() => {
  return Math.min(Math.round((props.value / props.max) * 100), 100)
})

const sizeMap = {
  small: { track: 'h-1', label: 'text-xs' },
  medium: { track: 'h-2', label: 'text-sm' },
  large: { track: 'h-3', label: 'text-base' }
}

const colorMap = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500'
}

const containerClass = computed(() => {
  return 'flex items-center gap-2'
})

const trackClass = computed(() => {
  return `
    flex-1
    bg-gray-200
    rounded-full
    overflow-hidden
    ${sizeMap[props.size].track}
  `.trim().replace(/\s+/g, ' ')
})

const barClass = computed(() => {
  const classes = [
    'h-full transition-all duration-300 ease-out',
    colorMap[props.color],
    `w-[${percentage.value}%]`
  ]
  
  if (props.animated) {
    classes.push('animate-pulse-glow')
  }
  
  return classes.join(' ')
})

const labelClass = computed(() => {
  return `font-semibold text-gray-700 ${sizeMap[props.size].label}`
})
</script>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(var(--color-primary-500), 0.5);
  }
  50% {
    box-shadow: 0 0 4px rgba(var(--color-primary-500), 0.3);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
