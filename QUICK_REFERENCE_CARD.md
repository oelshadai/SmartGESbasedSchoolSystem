# 🎯 QUICK REFERENCE CARD
## Mobile-First SaaS Redesign - Cheat Sheet

---

## BREAKPOINTS (Mobile-First)

```
Mobile XS   → 320-479px   → 1 column, full buttons
Mobile SM   → 480-639px   → 1-2 columns
Tablet      → 640-1023px  → 2-3 columns, sidebar optional
Desktop     → 1024-1279px → 3-4 columns, full sidebar
Large       → 1280px+     → 4+ columns, max 1200px width
```

---

## COLORS (Quick Reference)

| Color | Hex | Use |
|-------|-----|-----|
| Primary | `#4f46e5` | Buttons, links, active states |
| Success | `#10b981` | Confirmations, positive feedback |
| Warning | `#f59e0b` | Alerts, caution states |
| Error | `#ef4444` | Errors, dangerous actions |
| Neutral 500 | `#6b7280` | Disabled, secondary text |

---

## SPACING SCALE

```
Padding/Margin Values:
4px   8px   12px  16px  20px  24px  32px  40px  48px  64px
1     2     3     4     5     6     8     10    12    16
```

**Mobile**: Use 16px padding  
**Desktop**: Use 24-32px padding  

---

## TYPOGRAPHY

```
h1: 30px (700) — Page title
h2: 24px (600) — Section title
h3: 20px (600) — Subsection
p:  16px (400) — Body text (on mobile too!)
small: 14px (400) — Secondary text
```

---

## TOUCH TARGETS (WCAG 2.1)

```
Minimum: 44×44px  ✓ Acceptable
Recommended: 48×48px  ✓✓ Best
Spacing between: 8px minimum
```

**Always use 48px for buttons on mobile!**

---

## COMMON CSS CLASSES

```css
.btn              /* Base button (48px) */
.btn-primary      /* Blue button */
.btn-secondary    /* Gray button */
.btn-ghost        /* Transparent button */
.btn-sm           /* Small button (36px) */
.btn-lg           /* Large button (56px) */
.btn-full         /* 100% width */
.btn-icon         /* Circular icon button */

.input            /* Form input (48px height) */
.input-error      /* Error state */

.card             /* White box with shadow */
.card-compact     /* Smaller padding */

.grid             /* CSS Grid */
.gap-4            /* 16px gap */
.p-4              /* 16px padding */
.mb-4             /* 16px margin bottom */

.text-center      /* Center align */
.text-sm          /* 14px size */
.font-semibold    /* 600 weight */
```

---

## RESPONSIVE PATTERNS

### Stack to Side-by-Side
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr',  // Mobile: 1 column
  gap: '1rem'
}}>
  <div>Stacked on mobile</div>
  <div>Stacked on mobile</div>
</div>

@media (min-width: 640px) {
  gridTemplateColumns: '1fr 1fr';  // 2 columns on tablet
}
```

### Hide on Mobile
```css
@media (max-width: 639px) {
  .hidden-mobile { display: none; }
}
```

### Show Only on Mobile
```css
@media (max-width: 639px) {
  .mobile-only { display: block; }
}
@media (min-width: 640px) {
  .mobile-only { display: none; }
}
```

---

## COMPONENT CHECKLIST

### Buttons
- [ ] 48px minimum height
- [ ] Clear focus indicator
- [ ] Disabled state obvious
- [ ] Loading state shown

### Forms
- [ ] 16px font size (prevents iOS zoom)
- [ ] 48px input height
- [ ] Labels associated
- [ ] Error messages clear
- [ ] Submit doesn't hide on keyboard

### Tables
- [ ] Card view on mobile
- [ ] Horizontal scroll indicator
- [ ] Sticky header
- [ ] Touch-friendly row height

### Navigation
- [ ] Bottom nav on mobile
- [ ] Menu accessible
- [ ] Active state clear
- [ ] Touch targets 48px+

---

## DARK MODE

```jsx
// Apply dark mode
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --text: #f1f5f9;
  }
}

// Or use data attribute
[data-theme="dark"] {
  --bg: #0f172a;
  --text: #f1f5f9;
}
```

---

## SAFE AREA (Notches)

```css
/* Padding for notches */
body {
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Fixed bottom nav accounting for home indicator */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(60px + env(safe-area-inset-bottom));
}
```

---

## IMAGES

```jsx
/* Responsive image */
<picture>
  <source media="(min-width: 640px)" srcSet="desktop.webp" />
  <img src="mobile.webp" alt="..." />
</picture>

/* Lazy loading */
<img src="placeholder.jpg" data-src="full.jpg" loading="lazy" />
```

---

## PERFORMANCE TARGETS

```
Lighthouse Score: 90+
Page Load Time: < 2 seconds
LCP: < 2.5 seconds
CLS: < 0.1
Bundle Size: < 300 KB (gzipped)
Accessibility: WCAG AA
```

---

## ACCESSIBILITY ESSENTIALS

```
Color Contrast: 4.5:1 minimum
Touch Target: 48×48px minimum
Focus Indicator: Visible always
Form Labels: Associated with inputs
Alt Text: On all images
Semantic HTML: <button>, <a>, <nav>
```

---

## COMMON MISTAKES TO AVOID

❌ **Font size < 16px on mobile** (prevents zoom)  
❌ **Button < 48px** (hard to tap)  
❌ **Fixed headers that cover content**  
❌ **Form inputs on mobile keyboard**  
❌ **Horizontal scroll on small screens**  
❌ **No loading states**  
❌ **Poor color contrast**  
❌ **Nested clickables**  
❌ **Too much padding/margin on mobile**  
❌ **Images not responsive**  

---

## QUICK WINS (First Week)

1. **Copy CSS framework** (30 min)
2. **Add bottom navigation** (2 hours)
3. **Make one table responsive** (1 hour)
4. **Test on real phone** (30 min)
5. **Run Lighthouse** (15 min)

**Total**: ~4 hours  
**Impact**: Huge improvement visible

---

## USEFUL TOOLS

| Tool | Purpose |
|------|---------|
| Chrome DevTools | Device emulation, debugging |
| Lighthouse | Performance audit |
| axe DevTools | Accessibility check |
| WAVE | Color contrast check |
| Figma | Design mockups |
| BrowserStack | Real device testing |
| Sentry | Error tracking |
| Google Analytics | User behavior |

---

## CSS VARIABLES (Most Used)

```css
/* Colors */
var(--color-primary)           /* #4f46e5 */
var(--color-success)           /* #10b981 */
var(--color-error)             /* #ef4444 */

/* Spacing */
var(--space-2)  /* 8px */
var(--space-4)  /* 16px */
var(--space-6)  /* 24px */

/* Typography */
var(--font-size-base)          /* 16px */
var(--font-weight-semibold)    /* 600 */

/* Effects */
var(--shadow-md)               /* Elevation */
var(--radius-lg)               /* 16px rounded */
var(--transition-base)         /* 200ms easing */
```

---

## REACT COMPONENT IMPORTS

```jsx
import {
  BottomNav,
  ResponsiveTable,
  ResponsiveModal,
  ResponsiveForm,
  ResponsiveHeader,
  SkeletonLoader,
  FloatingActionButton,
} from '../components/ResponsiveComponents'
```

---

## COMMON VIEWPORT WIDTHS (Test These)

```
iPhone SE:     375px (4")
iPhone 8:      375px (4.7")
iPhone 12:     390px (6.1")
iPhone 14 PM:  430px (6.7")
Galaxy S21:    360px (6.2")
Galaxy S23:    412px (6.1")
iPad:          768px (9.7")
Desktop:       1920px
```

---

## MOBILE KEYBOARD FIX

```jsx
// Problem: Keyboard hides button
// Solution: 
<div style={{ 
  position: 'relative',
  minHeight: 'calc(100vh - env(keyboard-height, 0px))'
}}>
  {/* Content */}
</div>
```

---

## Z-INDEX SCALE

```
-1    Hidden
0     Default
10    Dropdown
20    Sticky header
30    Fixed nav
40    Modal backdrop
50    Modal
70    Notification
80    Tooltip
```

---

## BEFORE YOU DEPLOY

- [ ] Test on iPhone + Android
- [ ] Run Lighthouse (target 90+)
- [ ] Check accessibility (axe)
- [ ] Test keyboard navigation
- [ ] Check dark mode
- [ ] Test offline (Chrome DevTools)
- [ ] Monitor bundle size
- [ ] Setup error tracking
- [ ] Plan rollback strategy

---

## GETTING HELP

**CSS Issues** → Check `DESIGN_SYSTEM.md`  
**Component Help** → Check `COMPONENT_SHOWCASE.md`  
**Implementation** → Check `IMPLEMENTATION_GUIDE.md`  
**Timeline** → Check `COMPLETE_IMPLEMENTATION_ROADMAP.md`  

---

## KEY METRICS TO MONITOR

```
Weekly:
  • Lighthouse score
  • Page load time
  • Error rate
  
Monthly:
  • Mobile traffic %
  • Mobile conversion
  • User retention
  • Support tickets
  
Quarterly:
  • NPS score
  • Feature adoption
  • Performance trending
```

---

## REMEMBER

✅ **Mobile-first** = Design for mobile, enhance for desktop  
✅ **Progressive enhancement** = Works without JavaScript  
✅ **Accessible always** = Benefits everyone  
✅ **Performance matters** = Every millisecond counts  
✅ **Test on real devices** = Emulation isn't enough  

---

**Print this page. Keep it handy. Reference it constantly.**

Last Updated: January 9, 2026  
Status: ✅ Ready to Use
