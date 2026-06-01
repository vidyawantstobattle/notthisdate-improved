# CSS Modular Architecture - Quick Reference

## What We Did

Split the monolithic CSS files into 11 focused, maintainable modules.

## File Structure

```
public/styles/
├── variables.css         → CSS custom properties (colors, spacing, fonts)
├── base.css             → Reset, utilities, loading states
├── components/
│   ├── buttons.css      → All button styles (.btn, .btn-primary, etc.)
│   ├── forms.css        → Forms, inputs, validation, tags
│   ├── modals.css       → Modals, verification flows
│   └── calendar.css     → Calendar grid, tabs, flatpickr
├── layout/
│   ├── header.css       → Header, nav, logo, language toggle
│   └── footer.css       → Footer, links, bottom bar
├── pages/
│   ├── landing.css      → Hero, features, illustrations
│   └── dashboard.css    → Calendar cards, empty states
└── responsive.css       → All media queries (mobile/tablet)
```

## Import Order (Important!)

```css
1. variables.css    ← Must be first (defines CSS vars)
2. base.css         ← Resets and utilities
3. layout/*         ← Header, footer
4. components/*     ← Buttons, forms, modals, calendar
5. pages/*          ← Page-specific styles
6. responsive.css   ← Must be last (overrides everything)
```

## Usage Examples

### HTML Pages
```html
<!-- New way -->
<link rel="stylesheet" href="/styles-modular.css">
```

### React Components
```jsx
// Already configured in src/styles/index.css
import '../styles/index.css';
```

### Adding New Styles

**1. Component styles** → `components/[name].css`
```css
/* components/tooltip.css */
.tooltip {
    background: var(--bg-white);
    box-shadow: var(--shadow);
}
```

**2. Update main file**
```css
/* styles-modular.css */
@import './styles/components/tooltip.css';
```

**3. Mobile styles**
```css
/* responsive.css */
@media (max-width: 768px) {
    .tooltip { font-size: 0.9rem; }
}
```

## Common Tasks

### Find a Style
- Buttons? → `components/buttons.css`
- Forms? → `components/forms.css`
- Mobile? → `responsive.css`
- Colors? → `variables.css`

### Add a New Color
```css
/* variables.css */
:root {
    --info-color: #17a2b8;
}
```

### Update Button Styles
```css
/* components/buttons.css */
.btn-info {
    background: var(--info-color);
    color: white;
}
```

### Add Mobile Styles
```css
/* responsive.css - at the appropriate breakpoint */
@media (max-width: 768px) {
    .new-component { /* mobile styles */ }
}
```

## Benefits

| Before | After |
|--------|-------|
| 2,213 lines in 1 file | ~200 lines per file |
| Hard to find styles | Clear organization |
| Git conflicts common | Isolated changes |
| Duplicate code | Single source |

## Troubleshooting

**Styles not loading?**
1. Check browser console for 404s
2. Verify `@import` paths in `styles-modular.css`
3. Clear browser cache

**CSS variable not working?**
1. Ensure `variables.css` imported first
2. Use `var(--variable-name)` syntax
3. Check `:root` selector in variables.css

**Build errors?**
1. Run `npm run validate:imports`
2. Check for missing semicolons
3. Verify file paths are correct

## Key Files

- 📋 `CSS_MIGRATION.md` - Full migration documentation
- 📘 `public/styles/README.md` - Detailed architecture guide
- 📦 `public/styles-modular.css` - Main entry point
- ⚛️ `src/styles/index.css` - React imports

## Testing Checklist

- [x] Build succeeds (`npm run build`)
- [x] No console errors
- [x] Imports validated
- [ ] Test all pages visually
- [ ] Test mobile responsiveness
- [ ] Test in production

---

**Quick Links:**
- [Full Migration Doc](./CSS_MIGRATION.md)
- [Architecture Guide](./public/styles/README.md)
- [Variables Reference](./public/styles/variables.css)

