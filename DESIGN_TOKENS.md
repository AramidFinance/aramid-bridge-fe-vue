# Aramid Bridge Design System Tokens

## Overview

This document defines the semantic design token system for the Aramid Bridge application. The system consolidates 170+ ad-hoc color definitions into 25 semantic tokens organized by purpose, making the codebase more maintainable and consistent.

## Token Categories

### Brand Colors (4 tokens)

These are the core Aramid brand colors used throughout the application.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `primary` | `#FB7EFF` | Main brand pink - primary actions, highlights | Button backgrounds, status indicators |
| `primary-light` | `#FCD4FF` | Light pink - text on dark backgrounds | Button text, accent text |
| `primary-dark` | `#7400FF` | Deep purple - emphasis, gradients | Gradient endpoints, hover states |
| `accent` | `#8217BD` | Purple accent - borders, secondary highlights | Button borders, card outlines |

**Example Usage:**
```vue
<!-- Primary action button -->
<button class="bg-primary text-primary-light border-accent">
  Bridge Assets
</button>
```

---

### Background Colors (6 tokens)

Background colors for various surfaces and states.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `bg-main` | `#15002E` | Main dark purple background | Page backgrounds, primary containers |
| `bg-secondary` | `#190B29` | Darker purple - elevated surfaces | Cards, modals, elevated panels |
| `bg-card` | `rgba(22, 14, 37, 0.7)` | Card background with transparency | Content cards with glass effect |
| `bg-hover` | `rgba(14, 0, 31, 0.7)` | Hover state background | Interactive element hover states |
| `bg-overlay` | `rgba(0, 0, 0, 0.5)` | Modal overlays, backdrops | Dimming layers behind modals |
| `bg-elevated` | `rgba(246, 246, 246, 0.08)` | Slightly elevated surfaces | Input fields, dropdowns |

**Example Usage:**
```vue
<!-- Card with hover effect -->
<div class="bg-card hover:bg-hover transition-colors">
  <p>Transaction details</p>
</div>
```

---

### Text Colors (5 tokens)

Text colors for different hierarchy levels and purposes.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `text-primary` | `rgba(246, 246, 246, 1)` | Main text color | Body text, headings |
| `text-secondary` | `rgba(246, 246, 246, 0.7)` | Secondary text, labels | Form labels, secondary information |
| `text-muted` | `rgba(246, 246, 246, 0.4)` | Muted text, placeholders | Input placeholders, disabled text |
| `text-accent` | `#FB7EFF` | Accent text color | Highlighted text, links, emphasis |
| `text-link` | `#95D5FD` | Link color | Block explorer links, external links |

**Example Usage:**
```vue
<!-- Text hierarchy -->
<h1 class="text-primary">Bridge Assets</h1>
<p class="text-secondary">Select your source and destination chains</p>
<span class="text-muted">Optional memo field</span>
```

---

### Border Colors (4 tokens)

Border colors for various UI elements.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `border-primary` | `#FB7EFF` | Primary borders | Active element borders, progress indicators |
| `border-accent` | `rgba(251, 126, 255, 0.6)` | Accent borders (60% opacity) | Button outlines, card borders |
| `border-subtle` | `rgba(246, 246, 246, 0.16)` | Subtle dividers, light borders | Section dividers, input borders |
| `border-muted` | `rgba(143, 143, 143, 0.3)` | Muted borders | Inactive elements, subtle separators |

**Example Usage:**
```vue
<!-- Status step indicator -->
<div class="border-primary border-2 rounded-full">
  <span class="text-primary">1</span>
</div>
```

---

### State Colors (3 tokens)

Colors for various application states and feedback.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `success` | `#19FF89` | Success state | Completed transactions, confirmations |
| `warning` | `#FF9519` | Warning state | Caution messages, pending actions |
| `error` | `#FF4219` | Error state | Failed transactions, validation errors |

**Example Usage:**
```vue
<!-- Transaction status feedback -->
<div v-if="txSuccess" class="border-success text-success">
  Transaction completed successfully!
</div>
<div v-if="txError" class="border-error text-error">
  Transaction failed. Please try again.
</div>
```

---

### Utility Colors (3 tokens)

Utility colors for various UI elements.

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `divider` | `rgba(246, 246, 246, 0.16)` | Horizontal rules, separators | Section dividers, list separators |
| `shadow` | `rgba(0, 0, 0, 0.25)` | Drop shadows | Card shadows, elevated elements |
| `transparent` | `transparent` | Transparent color | Gradient transitions, overlays |

**Example Usage:**
```vue
<!-- Horizontal divider -->
<hr class="bg-divider border-0 h-[1px]" />
```

---

## Migration Guide

### Old to New Token Mapping

This table shows how the old hardcoded colors map to the new semantic tokens:

| Old Color | New Token | Context |
|-----------|-----------|---------|
| `#15002E` | `bg-main` | Main background |
| `#190B29` | `bg-secondary` | Secondary background |
| `#FCD4FF` | `primary-light` | Light pink text |
| `#FB7EFF` | `primary` or `text-accent` | Pink accent |
| `#FB7EFF99` | `border-accent` | Pink border with opacity |
| `#8217BD` | `accent` | Purple accent |
| `#F6F6F629` | `divider` | White divider |
| `#F6F6F61A` | `border-subtle` | Subtle border |
| `#47556980` | `border-muted` | Gray border with opacity |

### Migration Examples

#### Before:
```vue
<div class="bg-[#15002E] border-[#8217BD] text-[#FCD4FF]">
  Action Button
</div>
```

#### After:
```vue
<div class="bg-main border-accent text-primary-light">
  Action Button
</div>
```

---

## Design Principles

### 1. Semantic Naming
Use semantic names that describe the purpose, not the visual appearance:
- ✅ Good: `bg-main`, `text-muted`, `border-accent`
- ❌ Bad: `bg-purple-500`, `text-pink-200`, `border-blue-300`

### 2. Consistency
Always use design tokens instead of hardcoded colors:
- ✅ Good: `class="bg-primary"`
- ❌ Bad: `class="bg-[#FB7EFF]"`

### 3. Hierarchy
Use the appropriate token for text hierarchy:
- Primary text: Use `text-primary` for main content
- Secondary text: Use `text-secondary` for labels and supporting text
- Muted text: Use `text-muted` for placeholders and disabled states

### 4. State Communication
Use state colors consistently:
- Success: Green (`success`)
- Warning: Orange (`warning`)
- Error: Red (`error`)

---

## Gradients

Some components use gradients for visual effects. These should use gradient utility classes with semantic tokens:

```vue
<!-- Network button gradient -->
<div class="bg-gradient-[90deg] from-gradient-pink-start to-gradient-pink-end">
  Select Network
</div>
```

---

## Deprecated Colors

The following colors are marked as deprecated and kept only for backwards compatibility. Migrate to semantic tokens when updating components:

- `white-rgba`
- `white-0.2`
- `confirm-btn-grey`
- `confirm-btn-grey-hover`
- `network-btn-tl`
- `network-btn-br`
- `blockexplorer-default`
- `blockexplorer-hover`
- `search-blue`
- `search-blue-hover`

---

## Theme Support

The design token system is built to support future theming capabilities. All tokens are defined in `tailwind.config.js` and can be extended for light mode or other theme variations in the future.

---

## Best Practices

1. **Use semantic tokens in all new components**
2. **Migrate hardcoded colors during component updates**
3. **Test visual consistency after migrations**
4. **Document any new token additions**
5. **Remove deprecated colors once all usages are migrated**

---

## Resources

- [Tailwind Config](/tailwind.config.js) - Color token definitions
- [Component Examples](/src/components) - Real-world usage examples
- [Design System Guide](https://www.figma.com/...) - Figma design system (if available)

---

## Migration Status

**✅ Migration Complete: 100% of components migrated to semantic tokens**

### Completed Changes:
- All 43 components now use semantic design tokens
- 0 hardcoded hex colors remaining
- 0 undefined Tailwind classes
- Standardized border radius across all components
- Added missing colors to tailwind.config.js

### Added Colors (for compatibility):
- `dark-elevation`: Maps to `border-subtle`
- `dark-placeholder`: Maps to `text-muted`
- `dark-label`: Maps to `text-secondary`
- `topleft-purple` & `bottomright-purple`: Gradient colors
- `white-0.3`: Glass effect variant

### Gradient Utilities Added:
- `bg-gradient-brand`: Main brand gradient (135deg)
- `bg-gradient-brand-subtle`: Subtle brand gradient
- `bg-gradient-button`: Button gradient (90deg)

### Standardized Border Radius:
- Small components: `rounded-lg` (8px)
- Medium components: `rounded-xl` (12px)
- Large components: `rounded-2xl` (16px)
- Buttons: `rounded-3xl` (24px) or `rounded-full`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-18 | Initial semantic design token system implementation |
| 2.0.0 | 2025-11-18 | Complete migration to semantic tokens (100% coverage) |

---

## Contact

For questions about the design system or token usage, contact the Design System Consolidation Team.
