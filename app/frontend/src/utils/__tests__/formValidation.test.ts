import { describe, it, expect } from 'vitest'
import {
  validationRules,
  validateField,
  validateForm,
  createErrorMap,
  hasErrors,
  getErrorMessages,
  taskValidationRules,
} from '../formValidation'

describe('Form Validation Utils', () => {
  describe('validationRules', () => {
    it('required rule validates non-empty strings', () => {
      const rule = validationRules.required('Field')
      expect(rule.validate('hello')).toBe(true)
      expect(rule.validate('')).toBe(false)
      expect(rule.validate('   ')).toBe(false)
    })

    it('minLength rule validates string length', () => {
      const rule = validationRules.minLength(3)
      expect(rule.validate('hello')).toBe(true)
      expect(rule.validate('hi')).toBe(false)
      expect(rule.validate('')).toBe(false)
    })

    it('maxLength rule validates string length', () => {
      const rule = validationRules.maxLength(5)
      expect(rule.validate('hello')).toBe(true)
      expect(rule.validate('hello world')).toBe(false)
      expect(rule.validate('')).toBe(true)
    })

    it('validDate rule validates date format', () => {
      const rule = validationRules.validDate()
      expect(rule.validate('2025-12-25')).toBe(true)
      expect(rule.validate('')).toBe(true) // Optional
      expect(rule.validate('invalid')).toBe(false)
    })

    it('futureDate rule validates future dates', () => {
      const rule = validationRules.futureDate()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      expect(rule.validate(tomorrowStr)).toBe(true)
      expect(rule.validate(yesterdayStr)).toBe(false)
      expect(rule.validate('')).toBe(true) // Optional
    })

    it('email rule validates email addresses', () => {
      const rule = validationRules.email()
      expect(rule.validate('test@example.com')).toBe(true)
      expect(rule.validate('invalid-email')).toBe(false)
      expect(rule.validate('')).toBe(true) // Optional
    })

    it('url rule validates URLs', () => {
      const rule = validationRules.url()
      expect(rule.validate('https://example.com')).toBe(true)
      expect(rule.validate('http://test.org')).toBe(true)
      expect(rule.validate('not a url')).toBe(false)
      expect(rule.validate('')).toBe(true) // Optional
    })

    it('enum rule validates allowed values', () => {
      const rule = validationRules.enum(['low', 'medium', 'high'])
      expect(rule.validate('low')).toBe(true)
      expect(rule.validate('high')).toBe(true)
      expect(rule.validate('critical')).toBe(false)
    })

    it('minItems rule validates array length', () => {
      const rule = validationRules.minItems(2)
      expect(rule.validate(['a', 'b'])).toBe(true)
      expect(rule.validate(['a'])).toBe(false)
      expect(rule.validate([])).toBe(false)
    })

    it('maxItems rule validates array length', () => {
      const rule = validationRules.maxItems(3)
      expect(rule.validate(['a', 'b', 'c'])).toBe(true)
      expect(rule.validate(['a', 'b', 'c', 'd'])).toBe(false)
      expect(rule.validate([])).toBe(true)
    })

    it('custom rule applies custom validator', () => {
      const rule = validationRules.custom(
        (value) => value.length > 5,
        'Must be longer than 5 characters'
      )
      expect(rule.validate('hello world')).toBe(true)
      expect(rule.validate('hi')).toBe(false)
    })
  })

  describe('validateField', () => {
    it('returns null when all rules pass', () => {
      const rules = [validationRules.required('Field'), validationRules.minLength(3)]
      expect(validateField('hello', rules)).toBeNull()
    })

    it('returns error message for first failing rule', () => {
      const rules = [validationRules.required('Field'), validationRules.minLength(5)]
      const error = validateField('hi', rules)
      expect(error).toBeTruthy()
      expect(error).toContain('5 characters')
    })

    it('handles empty value with required rule', () => {
      const rules = [validationRules.required('Field')]
      expect(validateField('', rules)).toBeTruthy()
    })
  })

  describe('validateForm', () => {
    it('validates all fields and returns errors', () => {
      const formData = {
        title: '',
        description: 'test',
        priority: 'invalid',
      }

      const rules = {
        title: [validationRules.required('Title')],
        description: [validationRules.maxLength(10)],
        priority: [validationRules.enum(['low', 'medium', 'high'])],
      }

      const errors = validateForm(formData, rules)
      expect(errors).toHaveLength(2) // title and priority
      expect(errors[0].field).toBe('title')
      expect(errors[1].field).toBe('priority')
    })

    it('returns empty array for valid form', () => {
      const formData = {
        title: 'My Task',
        description: 'A description',
        priority: 'high',
      }

      const rules = {
        title: [validationRules.required('Title')],
        description: [validationRules.maxLength(100)],
        priority: [validationRules.enum(['low', 'medium', 'high'])],
      }

      const errors = validateForm(formData, rules)
      expect(errors).toHaveLength(0)
    })
  })

  describe('createErrorMap', () => {
    it('creates a map from errors array', () => {
      const errors = [
        { field: 'title', message: 'Title is required' },
        { field: 'email', message: 'Invalid email' },
      ]

      const errorMap = createErrorMap(errors)
      expect(errorMap.title).toBe('Title is required')
      expect(errorMap.email).toBe('Invalid email')
    })

    it('returns empty object for empty errors', () => {
      const errorMap = createErrorMap([])
      expect(Object.keys(errorMap)).toHaveLength(0)
    })
  })

  describe('hasErrors', () => {
    it('returns true when error map has entries', () => {
      expect(hasErrors({ field: 'error' })).toBe(true)
    })

    it('returns false when error map is empty', () => {
      expect(hasErrors({})).toBe(false)
    })
  })

  describe('getErrorMessages', () => {
    it('returns all error messages as array', () => {
      const errorMap = {
        title: 'Title is required',
        email: 'Invalid email',
        password: 'Password too short',
      }

      const messages = getErrorMessages(errorMap)
      expect(messages).toContain('Title is required')
      expect(messages).toContain('Invalid email')
      expect(messages).toContain('Password too short')
      expect(messages).toHaveLength(3)
    })

    it('filters out empty strings', () => {
      const errorMap = {
        title: 'Title is required',
        email: '',
        password: 'Password too short',
      }

      const messages = getErrorMessages(errorMap)
      expect(messages).toHaveLength(2)
      expect(messages).not.toContain('')
    })
  })

  describe('taskValidationRules', () => {
    it('validates task title is required and has length limits', () => {
      const titleRules = taskValidationRules.title

      expect(validateField('', titleRules)).toBeTruthy() // Required
      expect(validateField('Valid Task', titleRules)).toBeNull() // Valid
      expect(validateField('a'.repeat(256), titleRules)).toBeTruthy() // Too long
    })

    it('validates priority is required and enum', () => {
      const priorityRules = taskValidationRules.priority

      expect(validateField('', priorityRules)).toBeTruthy() // Required
      expect(validateField('low', priorityRules)).toBeNull() // Valid
      expect(validateField('critical', priorityRules)).toBeTruthy() // Invalid value
    })

    it('validates status is required and enum', () => {
      const statusRules = taskValidationRules.status

      expect(validateField('', statusRules)).toBeTruthy() // Required
      expect(validateField('completed', statusRules)).toBeNull() // Valid
      expect(validateField('done', statusRules)).toBeTruthy() // Invalid value
    })

    it('validates deadline is a valid optional date', () => {
      const deadlineRules = taskValidationRules.deadline

      expect(validateField('', deadlineRules)).toBeNull() // Optional
      expect(validateField('2027-12-25', deadlineRules)).toBeNull() // Valid future date
      expect(validateField('invalid-date', deadlineRules)).toBeTruthy() // Invalid date
    })

    it('validates categories max items', () => {
      const categoriesRules = taskValidationRules.categories

      expect(validateField([], categoriesRules)).toBeNull() // Empty is ok
      expect(validateField(['cat1', 'cat2'], categoriesRules)).toBeNull() // Valid
      expect(validateField(new Array(11).fill('cat'), categoriesRules)).toBeTruthy() // Too many
    })

    it('validates description max length', () => {
      const descriptionRules = taskValidationRules.description

      expect(validateField('', descriptionRules)).toBeNull() // Optional
      expect(validateField('A'.repeat(2000), descriptionRules)).toBeNull() // Valid
      expect(validateField('A'.repeat(2001), descriptionRules)).toBeTruthy() // Too long
    })

    it('validates complete task form', () => {
      const validTask = {
        title: 'My Task',
        description: 'A description',
        priority: 'high',
        deadline: '2027-12-25',
        categories: ['cat1'],
        status: 'pending',
      }

      const errors = validateForm(validTask, taskValidationRules)
      expect(errors).toHaveLength(0)
    })

    it('validates invalid complete task form', () => {
      const invalidTask = {
        title: '', // Required
        description: 'A'.repeat(2001), // Too long
        priority: 'critical', // Invalid enum
        deadline: 'invalid', // Invalid date
        categories: new Array(11).fill('cat'), // Too many
        status: 'done', // Invalid enum
      }

      const errors = validateForm(invalidTask, taskValidationRules)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => e.field === 'title')).toBe(true)
      expect(errors.some((e) => e.field === 'priority')).toBe(true)
    })
  })
})
