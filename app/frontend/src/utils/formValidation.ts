/**
 * Form Validation Utilities
 * Provides comprehensive validation rules and helper functions for form fields
 */

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface FieldValidation {
  [field: string]: ValidationRule[]
}

/**
 * Common validation rules
 */
export const validationRules = {
  // Text validation
  required: (fieldName = 'This field'): ValidationRule => ({
    validate: (value: string) => value?.trim() !== '',
    message: `${fieldName} is required`,
  }),

  minLength: (min: number, fieldName = 'This field'): ValidationRule => ({
    validate: (value: string) => (value?.length || 0) >= min,
    message: `${fieldName} must be at least ${min} characters`,
  }),

  maxLength: (max: number, fieldName = 'This field'): ValidationRule => ({
    validate: (value: string) => (value?.length || 0) <= max,
    message: `${fieldName} must not exceed ${max} characters`,
  }),

  // Date validation
  validDate: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional field
      const date = new Date(value)
      return date instanceof Date && !isNaN(date.getTime())
    },
    message: 'Please enter a valid date',
  }),

  futureDate: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional field
      const deadline = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return deadline >= today
    },
    message: 'Deadline must be today or in the future',
  }),

  noDateInPast: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional field
      const deadline = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return deadline >= today
    },
    message: 'Deadline cannot be in the past',
  }),

  // Pattern validation
  email: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional field
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message: 'Please enter a valid email address',
  }),

  url: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional field
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message: 'Please enter a valid URL',
  }),

  // Enum validation
  enum: (allowedValues: string[], fieldName = 'This field'): ValidationRule => ({
    validate: (value: string) => allowedValues.includes(value),
    message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
  }),

  // Array validation
  minItems: (min: number, fieldName = 'This field'): ValidationRule => ({
    validate: (value: any[]) => (value?.length || 0) >= min,
    message: `Select at least ${min} ${fieldName}`,
  }),

  maxItems: (max: number, fieldName = 'This field'): ValidationRule => ({
    validate: (value: any[]) => (value?.length || 0) <= max,
    message: `Select at most ${max} ${fieldName}`,
  }),

  // Custom validator
  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
}

/**
 * Validates a single field against multiple rules
 */
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

/**
 * Validates all form fields
 */
export function validateForm(formData: Record<string, any>, fieldValidations: FieldValidation): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, rules] of Object.entries(fieldValidations)) {
    const error = validateField(formData[field], rules)
    if (error) {
      errors.push({ field, message: error })
    }
  }

  return errors
}

/**
 * Create a validation error map for easy lookup
 */
export function createErrorMap(errors: ValidationError[]): Record<string, string> {
  const errorMap: Record<string, string> = {}
  for (const error of errors) {
    errorMap[error.field] = error.message
  }
  return errorMap
}

/**
 * Task-specific validation rules
 */
export const taskValidationRules: FieldValidation = {
  title: [
    validationRules.required('Task title'),
    validationRules.minLength(1, 'Task title'),
    validationRules.maxLength(255, 'Task title'),
  ],
  description: [validationRules.maxLength(2000, 'Description')],
  priority: [
    validationRules.required('Priority'),
    validationRules.enum(['baja', 'media', 'alta'], 'Priority'),
  ],
  deadline: [
    validationRules.validDate(),
    validationRules.noDateInPast(),
  ],
  categories: [
    validationRules.maxItems(10, 'categories'),
  ],
  status: [
    validationRules.required('Status'),
    validationRules.enum(['pendiente', 'en_progreso', 'completada'], 'Status'),
  ],
}

/**
 * Composite validator function for real-time field validation
 */
export function createFieldValidator(rules: ValidationRule[]) {
  return (value: any): { isValid: boolean; error: string | null } => {
    const error = validateField(value, rules)
    return {
      isValid: error === null,
      error,
    }
  }
}

/**
 * Debounced validation for real-time feedback
 */
export function createDebouncedValidator(
  validator: (value: any) => { isValid: boolean; error: string | null },
  delayMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  return (value: any, onValidate: (result: { isValid: boolean; error: string | null }) => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      const result = validator(value)
      onValidate(result)
    }, delayMs)
  }
}

/**
 * Check if form has any errors
 */
export function hasErrors(errorMap: Record<string, string>): boolean {
  return Object.keys(errorMap).length > 0
}

/**
 * Get all error messages
 */
export function getErrorMessages(errorMap: Record<string, string>): string[] {
  return Object.values(errorMap).filter(Boolean)
}
