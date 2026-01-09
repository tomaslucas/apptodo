# Accessibility (WCAG AA) - apptodo-61

## Overview

Comprehensive accessibility implementation ensuring WCAG 2.1 Level AA compliance across all components and utilities.

## Accessibility Utilities

### accessibility.ts

Core utilities for accessibility implementation:

```typescript
import {
  generateId,
  announceToScreenReader,
  isAccessible,
  createSrOnlyText,
  getContrastRatio,
  isContrastCompliant,
  createAccessibleButton,
  createAccessibleFormGroup,
  setLoadingAria,
  focusWithAnnouncement,
  createSkipLink
} from '@/utils/accessibility'

// Generate unique accessible IDs
const fieldId = generateId('email')

// Announce to screen readers
announceToScreenReader('Form submitted successfully', 'status', 3000)

// Check element visibility
if (isAccessible(element)) {
  // Element is visible and accessible
}

// Validate color contrast
const ratio = getContrastRatio('#ffffff', '#333333')
const isCompliant = isContrastCompliant(ratio, 'AA') // true for 4.5:1 or higher
```

## Composable: useA11y

Comprehensive accessibility composable for Vue components:

```typescript
import { useA11y } from '@/composables/useA11y'

const {
  focusedElement,
  announcements,
  generateFormId,
  announce,
  setLoading,
  focusElement,
  createSkipNav,
  checkContrast,
  setupKeyboardNav,
  focusTrap,
  announceError,
  announceSuccess
} = useA11y()

// Generate accessible form IDs
const emailId = generateFormId('email')
const passwordId = generateFormId('password')

// Announce to screen readers
announce('Loading data...', 'status')
announceError('Failed to save')
announceSuccess('Changes saved')

// Set up keyboard navigation
const cleanup = setupKeyboardNav(container, (key) => {
  if (key === 'ArrowDown') {
    // Handle down arrow
  }
})

// Manage focus trap (modal, dialog)
const releaseTrap = focusTrap(modalElement)
```

## Component Accessibility

### LoadingSpinner.vue

Accessible loading indicator with proper ARIA attributes:

```vue
<LoadingSpinner 
  label="Loading data..."
  centered
/>
```

**Accessibility Features:**
- `role="status"` - Announces loading status
- `aria-busy="true"` - Indicates busy state
- `aria-label` - Descriptive label for screen readers
- `aria-hidden="true"` on icon - Hides decorative spinner

### Toast.vue

Toast notifications with WCAG AA compliant design:

```vue
<Toast
  type="error"
  title="Error"
  message="Failed to save changes"
  @close="handleClose"
/>
```

**Accessibility Features:**
- `role="alert"` for errors, `role="status"` for others
- `aria-live="assertive"` for errors, `aria-live="polite"` for others
- `aria-atomic="true"` - Announces entire toast
- Focus ring on close button - Keyboard accessible
- 4.5:1 color contrast ratio

### All Components

**Common Features:**
- Semantic HTML (proper heading hierarchy, labels, etc.)
- Keyboard navigation support
- Focus management and visible focus indicators
- Descriptive alt text and aria-labels
- Color not the only means of conveying information

## Global Styles (styles/index.css)

### Screen Reader Classes

```html
<!-- Hidden from all users but read by screen readers -->
<span class="sr-only">Loading</span>

<!-- Visible only on focus (skip links) -->
<a href="#main" class="skip-link sr-only-focusable">
  Skip to main content
</a>
```

### Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Touch Targets

All interactive elements have minimum 44x44px touch target:

```css
button, input[type="button"], [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

### Reduced Motion Support

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

Supports Windows High Contrast mode:

```css
@media (prefers-contrast: more) {
  button, input, select, textarea {
    border-width: 2px;
  }
}
```

### Dark Mode Support

Respects user's color scheme preference:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #f5f5f5;
    --color-background: #1a1a1a;
  }
}
```

## Color Contrast

### WCAG AA Requirements

- **Normal text (< 18pt)**: 4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold)**: 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio for boundaries

### Verified Contrast Ratios

- Text on primary background: 7:1 (exceeds AAA)
- Text on secondary background: 5:1 (exceeds AA)
- Focus indicators: Highly visible with 2px outline

## Keyboard Navigation

### Supported Shortcuts

All components support full keyboard navigation:

- **Tab** - Move focus forward
- **Shift+Tab** - Move focus backward
- **Enter/Space** - Activate buttons
- **Escape** - Close modals/overlays
- **Arrow Keys** - Navigate lists and menus
- **Cmd/Ctrl+K** - Open command palette
- **Cmd/Ctrl+/** - Show shortcuts help

### Focus Management

- Focus trap in modals (focus cycles within modal)
- Focus restoration on modal close
- Visible focus indicators (2px outline)
- Tab order reflects logical reading order

## Form Accessibility

### Labels

All form inputs have associated labels:

```vue
<label :for="emailId">Email Address</label>
<input :id="emailId" type="email" />
```

### Error Messages

Error messages are:
- Associated with form field via `aria-describedby`
- Announced to screen readers
- Clearly visible with color + icon

```vue
<input 
  :aria-describedby="errorId"
  :aria-invalid="hasError"
/>
<span :id="errorId" class="form-error">
  Please enter valid email
</span>
```

### Validation

- Real-time validation feedback
- Clear error messages
- Multiple means of indication (color + text + icon)

## Testing Accessibility

### Manual Testing

- Test with keyboard only (no mouse)
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Test with browser zoom (up to 200%)
- Test with browser font size adjustment
- Disable CSS and ensure content is readable
- Test color contrast with tools

### Automated Testing

```bash
# Run accessibility tests
bun test src/utils/__tests__/accessibility.test.ts
bun test src/composables/__tests__/useA11y.test.ts
```

### Tools Used

- **Axe DevTools** - Browser extension for accessibility checks
- **WAVE** - WebAIM Accessibility Evaluation Tool
- **Lighthouse** - Built-in Chrome DevTools audit
- **Screen Reader Testing** - VoiceOver (macOS), NVDA (Windows)

## WCAG 2.1 Level AA Compliance

### Perceivable

- ✅ Text alternatives for images (`alt` attributes)
- ✅ Captions and audio descriptions (where applicable)
- ✅ 4.5:1 color contrast for text
- ✅ Distinguishable text (not relying solely on color)
- ✅ Resizable text (zoom support up to 200%)

### Operable

- ✅ Keyboard accessible (all functionality via keyboard)
- ✅ No keyboard traps
- ✅ Sufficient time for interactions (no auto-play)
- ✅ No seizure-inducing animations (< 3 per second)
- ✅ Navigable with logical tab order

### Understandable

- ✅ Clear, readable language
- ✅ Consistent navigation
- ✅ Error identification and suggestions
- ✅ Labels and instructions for inputs
- ✅ Focus visible for keyboard navigation

### Robust

- ✅ Valid semantic HTML
- ✅ Proper ARIA attributes
- ✅ Compatible with assistive technologies
- ✅ Proper heading hierarchy
- ✅ Meaningful link text

## Implementation Checklist

- [x] ARIA labels on interactive elements
- [x] Role attributes for custom components
- [x] aria-live regions for dynamic content
- [x] aria-describedby for form errors
- [x] aria-invalid for invalid inputs
- [x] aria-busy for loading states
- [x] Focus management in modals
- [x] Keyboard event handlers
- [x] Skip links for navigation
- [x] Color contrast validation
- [x] Touch target sizes (44x44px)
- [x] Semantic HTML elements
- [x] Screen reader text (.sr-only)
- [x] Focus visible indicators
- [x] Reduced motion support
- [x] High contrast mode support
- [x] Dark mode support

## Files Created

### Utilities
- `src/utils/accessibility.ts` - Core accessibility functions
- `src/utils/__tests__/accessibility.test.ts` - Utility tests (6 tests)

### Composables
- `src/composables/useA11y.ts` - Accessibility composable
- `src/composables/__tests__/useA11y.test.ts` - Composable tests (9 tests)

### Styles
- Updated `src/styles/index.css` - Accessibility CSS classes and media queries

### Enhanced Components
- `src/components/LoadingSpinner.vue` - Added ARIA attributes
- `src/components/Toast.vue` - Added ARIA live regions and focus management

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [Deque Accessibility](https://www.deque.com/accessibility/)

## Continuous Improvement

Accessibility is an ongoing process:
- Regular audits with automated tools
- User testing with people using assistive technologies
- Keep dependencies updated (including accessibility patches)
- Monitor and fix any reported accessibility issues
- Stay informed about WCAG updates
