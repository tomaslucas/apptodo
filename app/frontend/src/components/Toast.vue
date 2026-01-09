<template>
  <Transition
    name="toast"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div 
      v-if="isVisible"
      :class="containerClass"
      :role="toastRole"
      :aria-live="ariaLive"
      :aria-atomic="true"
    >
      <div :class="contentClass">
        <div
          :class="iconClass"
          aria-hidden="true"
        >
          <component :is="iconComponent" />
        </div>
        <div class="flex-1">
          <p
            v-if="title"
            :class="titleClass"
          >
            {{ title }}
          </p>
          <p :class="messageClass">
            {{ message }}
          </p>
        </div>
        <button
          v-if="closeable"
          :class="closeButtonClass"
          aria-label="Close notification"
          type="button"
          @click="close"
        >
          ×
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number | null
  closeable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  duration: 3000,
  closeable: true
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)
const timeoutId = ref<NodeJS.Timeout | null>(null)

const typeConfig = {
  success: { bg: 'bg-success-50', border: 'border-success-300', icon: 'text-success-600' },
  error: { bg: 'bg-danger-50', border: 'border-danger-300', icon: 'text-danger-600' },
  warning: { bg: 'bg-warning-50', border: 'border-warning-300', icon: 'text-warning-600' },
  info: { bg: 'bg-info-50', border: 'border-info-300', icon: 'text-info-600' }
}

const config = typeConfig[props.type]

const containerClass = computed(() => {
  return `
    fixed bottom-4 right-4 z-50
    max-w-sm w-full
  `.trim().replace(/\s+/g, ' ')
})

const contentClass = computed(() => {
  return `
    flex items-start gap-3
    ${config.bg}
    border border-l-4
    ${config.border}
    rounded-lg
    p-4
    shadow-lg
  `.trim().replace(/\s+/g, ' ')
})

const iconClass = computed(() => {
  return `flex-shrink-0 text-lg ${config.icon}`
})

const titleClass = 'font-semibold text-gray-900 mb-1'
const messageClass = 'text-sm text-gray-700'

const closeButtonClass = computed(() => {
  return `
    flex-shrink-0 text-gray-400 hover:text-gray-600
    transition-colors duration-200
    text-xl leading-none focus:outline-none focus:ring-2 focus:ring-offset-2
  `.trim().replace(/\s+/g, ' ')
})

const toastRole = computed(() => {
  return props.type === 'error' ? 'alert' : 'status'
})

const ariaLive = computed(() => {
  return props.type === 'error' ? 'assertive' : 'polite'
})

const iconComponent = computed(() => {
  const icons = {
    success: 'span',
    error: 'span',
    warning: 'span',
    info: 'span'
  }
  
  return icons[props.type]
})

const close = () => {
  isVisible.value = false
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
  }
  emit('close')
}

const onEnter = (el: Element) => {
  if (props.duration) {
    timeoutId.value = setTimeout(() => {
      close()
    }, props.duration)
  }
}

const onLeave = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
  }
}

onMounted(() => {
  if (props.duration) {
    timeoutId.value = setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
