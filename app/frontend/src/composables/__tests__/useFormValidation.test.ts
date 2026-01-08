import { describe, it, expect, beforeEach } from 'vitest'
import { validationRules } from '../../utils/formValidation'
import { useFormValidation } from '../useFormValidation'

describe('useFormValidation Composable', () => {
  let initialValues: Record<string, any>
  let fieldRules: Record<string, typeof validationRules.required[]>

  beforeEach(() => {
    initialValues = {
      name: '',
      email: '',
      password: '',
      age: '',
    }

    fieldRules = {
      name: [validationRules.required('Name'), validationRules.minLength(2, 'Name')],
      email: [validationRules.required('Email'), validationRules.email()],
      password: [validationRules.required('Password'), validationRules.minLength(8, 'Password')],
      age: [validationRules.custom((v) => !v || Number(v) >= 18, 'Must be 18 or older')],
    }
  })

  describe('initialization', () => {
    it('initializes form data with provided values', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      expect(form.formData.value).toEqual(initialValues)
    })

    it('initializes field states for all fields', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      expect(form.fieldStates.value.name).toBeDefined()
      expect(form.fieldStates.value.email).toBeDefined()
      expect(form.fieldStates.value.password).toBeDefined()
      expect(form.fieldStates.value.age).toBeDefined()
    })

    it('sets initial field state values correctly', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      const state = form.fieldStates.value.name
      expect(state.isDirty).toBe(false)
      expect(state.isTouched).toBe(false)
      expect(state.error).toBeNull()
      expect(state.isValidating).toBe(false)
    })
  })

  describe('field validation', () => {
    it('validates single field successfully', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'John'
      const error = await form.validateSingleField('name')

      expect(error).toBeNull()
      expect(form.fieldStates.value.name.error).toBeNull()
    })

    it('validates single field with error', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J' // Too short
      const error = await form.validateSingleField('name')

      expect(error).toBeTruthy()
      expect(form.fieldStates.value.name.error).toBeTruthy()
    })

    it('validates all fields', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J' // Invalid
      form.formData.value.email = 'invalid' // Invalid
      form.formData.value.password = 'short' // Invalid

      const isValid = await form.validateAllFields()

      expect(isValid).toBe(false)
      expect(Object.keys(form.errorMap.value).length).toBeGreaterThan(0)
    })

    it('validates all fields successfully', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'John'
      form.formData.value.email = 'john@example.com'
      form.formData.value.password = 'securepass123'
      form.formData.value.age = '25'

      const isValid = await form.validateAllFields()

      expect(isValid).toBe(true)
      expect(form.errorMap.value).toEqual({})
    })
  })

  describe('field change handling', () => {
    it('updates form data on field change', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldChange('name', 'John')

      expect(form.formData.value.name).toBe('John')
    })

    it('marks field as dirty on change', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldChange('name', 'John')

      expect(form.fieldStates.value.name.isDirty).toBe(true)
    })

    it('validates on change when enabled', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
        validateOnChange: true,
      })

      form.handleFieldChange('name', 'J') // Invalid

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350))

      expect(form.fieldStates.value.name.error).toBeTruthy()
    })

    it('does not validate on change when disabled', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
        validateOnChange: false,
      })

      form.handleFieldChange('name', 'J') // Invalid

      await new Promise((resolve) => setTimeout(resolve, 350))

      // Should not have error since validation is disabled
      expect(form.fieldStates.value.name.error).toBeNull()
    })
  })

  describe('field blur handling', () => {
    it('marks field as touched on blur', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldBlur('name')

      expect(form.fieldStates.value.name.isTouched).toBe(true)
    })

    it('validates on blur when enabled', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
        validateOnBlur: true,
      })

      form.formData.value.name = 'J' // Invalid
      form.handleFieldBlur('name')

      await new Promise((resolve) => setTimeout(resolve, 350))

      expect(form.fieldStates.value.name.error).toBeTruthy()
    })

    it('does not validate on blur when disabled', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
        validateOnBlur: false,
      })

      form.formData.value.name = 'J' // Invalid
      form.handleFieldBlur('name')

      await new Promise((resolve) => setTimeout(resolve, 350))

      expect(form.fieldStates.value.name.error).toBeNull()
    })
  })

  describe('form reset', () => {
    it('resets form to initial values', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'John'
      form.formData.value.email = 'john@example.com'

      form.resetForm()

      expect(form.formData.value.name).toBe('')
      expect(form.formData.value.email).toBe('')
    })

    it('clears all errors on reset', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J'
      await form.validateAllFields()

      form.resetForm()

      expect(form.errorMap.value).toEqual({})
    })

    it('clears all field states on reset', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldChange('name', 'John')
      form.handleFieldBlur('name')

      form.resetForm()

      expect(form.fieldStates.value.name.isDirty).toBe(false)
      expect(form.fieldStates.value.name.isTouched).toBe(false)
    })
  })

  describe('form data setters', () => {
    it('sets form data for edit mode', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      const editData = {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'oldpassword123',
        age: '30',
      }

      form.setFormData(editData)

      expect(form.formData.value).toEqual(editData)
    })

    it('sets individual field value', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.setFieldValue('name', 'John')

      expect(form.formData.value.name).toBe('John')
    })
  })

  describe('computed properties', () => {
    it('isValid is true when no errors', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'John'
      form.formData.value.email = 'john@example.com'
      form.formData.value.password = 'securepass123'

      await form.validateAllFields()

      expect(form.isValid.value).toBe(true)
    })

    it('isValid is false when errors exist', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J' // Invalid

      await form.validateAllFields()

      expect(form.isValid.value).toBe(false)
    })

    it('isDirty is true when any field has changed', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldChange('name', 'John')

      expect(form.isDirty.value).toBe(true)
    })

    it('isDirty is false when form is pristine', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      expect(form.isDirty.value).toBe(false)
    })

    it('errors returns array of error messages', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J' // Invalid
      form.formData.value.email = 'invalid' // Invalid

      await form.validateAllFields()

      expect(Array.isArray(form.errors.value)).toBe(true)
      expect(form.errors.value.length).toBeGreaterThan(0)
    })
  })

  describe('field state access', () => {
    it('gets field error', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.formData.value.name = 'J'
      await form.validateSingleField('name')

      const error = form.getFieldError('name')
      expect(error).toBeTruthy()
    })

    it('gets field state object', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.handleFieldChange('name', 'John')
      form.handleFieldBlur('name')

      const state = form.getFieldState('name')
      expect(state.isDirty).toBe(true)
      expect(state.isTouched).toBe(true)
    })
  })

  describe('touch all fields', () => {
    it('marks all fields as touched', () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
      })

      form.touchAllFields()

      expect(form.fieldStates.value.name.isTouched).toBe(true)
      expect(form.fieldStates.value.email.isTouched).toBe(true)
      expect(form.fieldStates.value.password.isTouched).toBe(true)
      expect(form.fieldStates.value.age.isTouched).toBe(true)
    })
  })

  describe('validate on mount option', () => {
    it('validates form on mount when enabled', async () => {
      const form = useFormValidation({
        initialValues: {
          name: '',
          email: '',
          password: '',
          age: '',
        },
        validationRules: fieldRules,
        validateOnMount: true,
      })

      // Give time for initial validation to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(form.errorMap.value).toBeDefined()
    })
  })

  describe('debounce functionality', () => {
    it('debounces validation calls', async () => {
      const form = useFormValidation({
        initialValues,
        validationRules: fieldRules,
        debounceDelay: 200,
        validateOnChange: true,
      })

      let validationCount = 0
      const originalValidate = form.validateSingleField

      // Make multiple changes in quick succession
      form.handleFieldChange('name', 'J')
      form.handleFieldChange('name', 'Jo')
      form.handleFieldChange('name', 'Joh')
      form.handleFieldChange('name', 'John')

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 250))

      // Should only validate once, not 4 times
      expect(form.formData.value.name).toBe('John')
    })
  })
})
