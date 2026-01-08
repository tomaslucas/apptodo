/**
 * Vue 3 Composable for Form Validation
 * Provides reactive validation state management with real-time feedback
 */

import { ref, computed, watch, type Ref } from 'vue'
import {
  validateField,
  validateForm,
  createErrorMap,
  hasErrors,
  getErrorMessages,
  type ValidationRule,
  type FieldValidation,
} from '../utils/formValidation'

export interface UseFormValidationOptions {
  /**
   * Initial form data
   */
  initialValues: Record<string, any>

  /**
   * Validation rules for each field
   */
  validationRules: FieldValidation

  /**
   * Debounce delay for real-time validation (ms)
   */
  debounceDelay?: number

  /**
   * Validate on blur
   */
  validateOnBlur?: boolean

  /**
   * Validate on change (real-time)
   */
  validateOnChange?: boolean

  /**
   * Validate on mount
   */
  validateOnMount?: boolean
}

export interface FieldValidationState {
  isDirty: boolean
  isTouched: boolean
  error: string | null
  isValidating: boolean
}

export function useFormValidation(options: UseFormValidationOptions) {
  const {
    initialValues,
    validationRules: rules,
    debounceDelay = 300,
    validateOnBlur = true,
    validateOnChange = true,
    validateOnMount = false,
  } = options

  // Form state
  const formData = ref<Record<string, any>>({ ...initialValues })

  // Validation state per field
  const fieldStates = ref<Record<string, FieldValidationState>>({})

  // Overall validation errors
  const errorMap = ref<Record<string, string>>({})

  // Debounce timers
  const debounceTimers = new Map<string, NodeJS.Timeout>()

  /**
   * Initialize field states
   */
  function initializeFieldStates() {
    const states: Record<string, FieldValidationState> = {}
    for (const field of Object.keys(rules)) {
      states[field] = {
        isDirty: false,
        isTouched: false,
        error: null,
        isValidating: false,
      }
    }
    fieldStates.value = states
  }

  /**
   * Validate a single field
   */
  function validateSingleField(field: string): Promise<string | null> {
    return new Promise((resolve) => {
      const state = fieldStates.value[field]
      if (state) {
        state.isValidating = true
      }

      // Clear existing debounce timer
      if (debounceTimers.has(field)) {
        clearTimeout(debounceTimers.get(field)!)
      }

      const timer = setTimeout(() => {
        const fieldRules = rules[field]
        if (fieldRules) {
          const error = validateField(formData.value[field], fieldRules)
          if (state) {
            state.error = error
            state.isValidating = false
          }
          updateErrorMap()
          resolve(error)
        }
        debounceTimers.delete(field)
      }, debounceDelay)

      debounceTimers.set(field, timer)
    })
  }

  /**
   * Validate all fields
   */
  async function validateAllFields(): Promise<boolean> {
    const errors = validateForm(formData.value, rules)
    const newErrorMap = createErrorMap(errors)

    // Update field states
    for (const field of Object.keys(rules)) {
      const state = fieldStates.value[field]
      if (state) {
        state.error = newErrorMap[field] || null
      }
    }

    errorMap.value = newErrorMap
    return !hasErrors(newErrorMap)
  }

  /**
   * Update error map from field states
   */
  function updateErrorMap() {
    const newErrorMap: Record<string, string> = {}
    for (const [field, state] of Object.entries(fieldStates.value)) {
      if (state.error) {
        newErrorMap[field] = state.error
      }
    }
    errorMap.value = newErrorMap
  }

  /**
   * Handle field change
   */
  function handleFieldChange(field: string, value: any) {
    formData.value[field] = value

    const state = fieldStates.value[field]
    if (state) {
      state.isDirty = true
    }

    if (validateOnChange) {
      validateSingleField(field)
    }
  }

  /**
   * Handle field blur
   */
  function handleFieldBlur(field: string) {
    const state = fieldStates.value[field]
    if (state) {
      state.isTouched = true
    }

    if (validateOnBlur) {
      validateSingleField(field)
    }
  }

  /**
   * Handle field focus
   */
  function handleFieldFocus(field: string) {
    // Clear error on focus to provide better UX
    // Error will reappear on blur if still invalid
  }

  /**
   * Reset form to initial state
   */
  function resetForm() {
    formData.value = { ...initialValues }
    errorMap.value = {}
    initializeFieldStates()
  }

  /**
   * Set form data (useful for edit mode)
   */
  function setFormData(data: Record<string, any>) {
    formData.value = { ...data }
  }

  /**
   * Set field value
   */
  function setFieldValue(field: string, value: any) {
    formData.value[field] = value
  }

  /**
   * Get field error
   */
  function getFieldError(field: string): string | null {
    return fieldStates.value[field]?.error || null
  }

  /**
   * Get field state
   */
  function getFieldState(field: string): FieldValidationState {
    return (
      fieldStates.value[field] || {
        isDirty: false,
        isTouched: false,
        error: null,
        isValidating: false,
      }
    )
  }

  /**
   * Check if form is valid
   */
  const isValid = computed(() => !hasErrors(errorMap.value))

  /**
   * Check if form is dirty (has any changes)
   */
  const isDirty = computed(() => Object.values(fieldStates.value).some((state) => state.isDirty))

  /**
   * Get all validation errors
   */
  const errors = computed(() => getErrorMessages(errorMap.value))

  /**
   * Touch all fields (mark as touched)
   */
  function touchAllFields() {
    for (const field of Object.keys(fieldStates.value)) {
      fieldStates.value[field].isTouched = true
    }
  }

  /**
   * Cleanup debounce timers
   */
  function cleanup() {
    debounceTimers.forEach((timer) => clearTimeout(timer))
    debounceTimers.clear()
  }

  // Initialize on creation
  initializeFieldStates()

  // Optional: validate on mount
  if (validateOnMount) {
    validateAllFields()
  }

  return {
    // State
    formData,
    fieldStates,
    errorMap,

    // Computed
    isValid,
    isDirty,
    errors,

    // Methods
    validateSingleField,
    validateAllFields,
    handleFieldChange,
    handleFieldBlur,
    handleFieldFocus,
    resetForm,
    setFormData,
    setFieldValue,
    getFieldError,
    getFieldState,
    touchAllFields,
    cleanup,
  }
}
