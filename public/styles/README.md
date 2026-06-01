# CSS Architecture

This document describes the modular CSS structure for NotThisDate.

## Overview

The styles have been split into smaller, maintainable files organized by purpose. This improves:
- **Maintainability**: Easier to find and update specific styles
- **Performance**: Only load what you need (if using build tools)
- **Collaboration**: Multiple developers can work on different files
- **Organization**: Clear separation of concerns

## File Structure

```
public/
├── styles.css (legacy - kept for backwards compatibility)
├── styles-modular.css (new main entry point)
└── styles/
    ├── variables.css          # CSS custom properties (colors, spacing, etc.)
    ├── base.css               # Reset, utilities, base styles
    ├── components/
    │   ├── buttons.css        # Button styles
    │   ├── forms.css          # Form elements and inputs
    │   ├── modals.css         # Modal and verification components
    │   └── calendar.css       # Calendar-specific components
    ├── layout/
    │   ├── header.css         # Header and navigation
    │   └── footer.css         # Footer styles
    ├── pages/
    │   ├── landing.css        # Landing page styles
    │   └── dashboard.css      # Dashboard page styles
    └── responsive.css         # All media queries
```

## File Descriptions

### Core Files

#### `variables.css`
Contains all CSS custom properties (CSS variables) used throughout the app:
- Color palette
- Typography settings
- Spacing (shadows, border radius)
- Font families

#### `base.css`
Foundation styles:
- CSS reset
- Utility classes (`.hidden`, `.visually-hidden`)
- Base layout containers
- Loading and error states

#### `responsive.css`
All media queries for responsive design:
- Mobile optimizations (max-width: 768px, 480px)
- Landscape optimizations
- Touch-friendly improvements

### Components

#### `components/buttons.css`
All button variants:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`
- Size modifiers (`.btn-small`, `.btn-large`)
- Special buttons (back button)

#### `components/forms.css`
Form elements and patterns:
- Input fields, textareas, selects
- Radio buttons and checkboxes
- Password field with toggle
- Tags input for participants
- Form validation displays

#### `components/modals.css`
Modal dialogs and overlays:
- Base modal structure
- Share modal
- Email verification UI
- Name entry components

#### `components/calendar.css`
Calendar-specific components:
- Calendar page layout
- Tabs interface
- Date picker customization (Flatpickr)
- Calendar grid and day cells
- Participant badges
- Selected/submitted date displays

### Layout

#### `layout/header.css`
Header and navigation:
- App header
- Logo
- Navigation links
- Language toggle
- User menu

#### `layout/footer.css`
Footer components:
- Footer layout
- Footer links
- Footer branding

### Pages

#### `pages/landing.css`
Landing page specific styles:
- Hero section
- Hero decorations
- Features grid
- Feature cards

#### `pages/dashboard.css`
Dashboard page styles:
- Dashboard header
- Calendar cards grid
- Empty states

## Usage

### For HTML Files

Replace the single `styles.css` import with the modular version:

```html
<!-- Old way -->
<link rel="stylesheet" href="/styles.css">

<!-- New way - imports all modules -->
<link rel="stylesheet" href="/styles-modular.css">
```

### For React Components (src/)

You can import specific modules in your components:

```jsx
// Import only what you need
import '../styles/components/buttons.css';
import '../styles/components/forms.css';

// Or import everything
import '../styles/index.css';
```

## Migration Plan

1. **Phase 1**: Keep both `styles.css` (legacy) and `styles-modular.css` (new)
2. **Phase 2**: Update HTML files to use `styles-modular.css`
3. **Phase 3**: Test thoroughly across all pages
4. **Phase 4**: Remove old `styles.css` once migration is complete

## Benefits

### Before (Single File)
- ❌ 2200+ lines in one file
- ❌ Hard to find specific styles
- ❌ Git conflicts when multiple people edit
- ❌ No clear organization

### After (Modular)
- ✅ Clear, logical organization
- ✅ Easy to find and update styles
- ✅ Better collaboration
- ✅ Easier maintenance
- ✅ Can load only what's needed

## Adding New Styles

When adding new styles:

1. **Identify the category**: Component, layout, or page?
2. **Choose the right file**: Add to existing or create new module
3. **Update imports**: Add to `styles-modular.css` if new file
4. **Use variables**: Reference CSS custom properties from `variables.css`
5. **Mobile-first**: Add responsive rules to `responsive.css`

## Best Practices

1. **Use CSS Variables**: Always use `var(--primary-color)` instead of hardcoded colors
2. **Mobile-First**: Write base styles for mobile, add desktop enhancements in media queries
3. **Keep Related Styles Together**: Button hover states go in `buttons.css`, not scattered
4. **Avoid Deep Nesting**: Keep selectors simple and performant
5. **Comment Sections**: Use clear section headers with `/* ===== SECTION ===== */`

## Troubleshooting

### Styles Not Loading
- Check that `styles-modular.css` is in `/public/`
- Verify all `@import` paths are correct
- Check browser console for 404 errors

### Import Order Issues
The order in `styles-modular.css` matters:
1. Variables first (needed by everything)
2. Base/reset styles
3. Layout components
4. Specific components
5. Pages
6. Responsive (should override everything)

### CSS Variable Not Working
- Ensure `variables.css` is imported first
- Check the variable name: `--primary-color` not `--primaryColor`
- Verify it's defined in `:root` selector

