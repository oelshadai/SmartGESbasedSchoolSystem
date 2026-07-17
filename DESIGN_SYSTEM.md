# 📐 Design System & Specifications
## Production-Ready SaaS UI/UX Guidelines

---

## 1. COLOR SYSTEM

### Primary Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Deep Indigo | `#4f46e5` | CTA buttons, links, active states |
| **Primary Dark** | Dark Indigo | `#4338ca` | Hover states, darker backgrounds |
| **Primary Light** | Light Indigo | `#ede9fe` | Backgrounds, disabled states |
| **Secondary** | Purple | `#8b5cf6` | Accent elements, highlights |
| **Tertiary** | Teal | `#14b8a6` | Data visualization, special highlights |

### Semantic Colors

| Intent | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Success** | Emerald | `#10b981` | Confirmations, success states, positive data |
| **Warning** | Amber | `#f59e0b` | Alerts, warnings, caution states |
| **Error** | Red | `#ef4444` | Errors, deletions, critical actions |
| **Info** | Blue | `#3b82f6` | Information, help, secondary actions |

### Neutral Scale

```
Level  Color           Hex       Use Cases
────────────────────────────────────────
50     Almost White    #f9fafb   Backgrounds
100    Very Light      #f3f4f6   Subtle backgrounds
200    Light           #e5e7eb   Borders, dividers
300    Medium-Light    #d1d5db   Input borders
400    Medium          #9ca3af   Disabled text
500    Medium-Dark     #6b7280   Muted text
600    Dark            #4b5563   Secondary text
700    Darker          #374151   Primary text (light)
800    Very Dark       #1f2937   Primary text
900    Darkest         #111827   Text, dark backgrounds
```

### Dark Mode Colors

```css
:root {
  --dark-bg: #0f172a;              /* Main background */
  --dark-surface: #1e293b;         /* Card/component background */
  --dark-surface-variant: #334155; /* Elevated surfaces */
  --dark-border: #475569;          /* Border color */
  --dark-text: #f1f5f9;            /* Primary text */
  --dark-text-secondary: #cbd5e1;  /* Secondary text */
}
```

### Accessibility - Color Contrast

All colors meet **WCAG AAA** standards (7:1 minimum ratio):

- White text on #4f46e5: ✓ 8.5:1
- Black text on #f9fafb: ✓ 12:1
- Error red on white: ✓ 4.5:1
- Dark gray on white: ✓ 7:1

---

## 2. TYPOGRAPHY SYSTEM

### Font Stack (Production-Optimized)

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'Menlo', 'Monaco', 'Courier New', monospace;
```

**Why this stack?**
- `-apple-system`: Native iOS font
- `BlinkMacSystemFont`: macOS San Francisco
- `Segoe UI`: Windows native font
- `Roboto`: Android native font
- Graceful fallback to generic sans-serif

### Font Scale (Modular - 1.125 ratio)

| Level | Size | Weight | Use Case |
|-------|------|--------|----------|
| **xs** | 12px | 400 | Small labels, captions |
| **sm** | 14px | 400/500 | Body copy, buttons |
| **base** | 16px | 400/500 | Default body, input |
| **lg** | 18px | 500/600 | Subheadings |
| **xl** | 20px | 600 | Section headings |
| **2xl** | 24px | 600/700 | Page headings |
| **3xl** | 30px | 700 | Hero titles |
| **4xl** | 36px | 700 | Extra large titles |

### Font Weights

```css
--font-weight-light: 300;      /* Never use for body text */
--font-weight-normal: 400;     /* Default body, regular text */
--font-weight-medium: 500;     /* Slight emphasis, some buttons */
--font-weight-semibold: 600;   /* Subheadings, important labels */
--font-weight-bold: 700;       /* Headings, strong emphasis */
```

### Line Heights

```css
--line-height-tight: 1.2;      /* Headings (h1-h4) */
--line-height-normal: 1.5;     /* Body text, regular */
--line-height-relaxed: 1.75;   /* Long-form content, readability */
```

### Typography Examples

```css
/* Heading 1 - Page Title */
h1 {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

/* Heading 2 - Section Title */
h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 16px;
}

/* Body Text */
p {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: #374151;
}

/* Small Text */
.text-sm {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #6b7280;
}

/* Form Labels */
label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: #1f2937;
}
```

---

## 3. SPACING SYSTEM

### Scale (4px Base Unit)

```
0    - 0px
1    - 4px
2    - 8px
3    - 12px
4    - 16px    (base)
5    - 20px
6    - 24px
7    - 28px
8    - 32px
10   - 40px
12   - 48px
16   - 64px
20   - 80px
24   - 96px
```

### Application Rules

```css
/* Padding Guidelines */
--card-padding-mobile: 16px;
--card-padding-desktop: 24px;
--form-gap: 16px;
--section-gap: 24px;
--page-gap: 32px;

/* Margin Guidelines */
--element-spacing: 16px;
--section-spacing: 32px;
--page-padding-mobile: 16px;
--page-padding-desktop: 32px;
```

### Responsive Spacing

```css
/* Mobile (320px - 639px) */
.container {
  padding: 1rem;        /* 16px */
  gap: 1rem;
}

/* Tablet (640px - 1023px) */
@media (min-width: 640px) {
  .container {
    padding: 1.5rem;    /* 24px */
    gap: 1.5rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;      /* 32px */
    gap: 2rem;
  }
}
```

---

## 4. COMPONENT SPECIFICATIONS

### Buttons

#### Touch Targets (Mobile Accessibility)

```
Default Button:
├─ Height: 48px (3:1 ratio for accessibility)
├─ Min Width: 48px
├─ Padding: 12px 16px
├─ Icon Size: 20px
├─ Text Size: 14px (font-weight: 600)
└─ Corner Radius: 8px

Small Button:
├─ Height: 36px
├─ Padding: 8px 12px
├─ Text Size: 12px
└─ Use for: Secondary, compact actions

Large Button:
├─ Height: 56px
├─ Padding: 16px 24px
├─ Text Size: 16px
└─ Use for: Primary CTAs, hero actions

Icon Button (Circular):
├─ Size: 48px × 48px
├─ Icon: 24px
├─ Corner Radius: 50% (circular)
└─ Use for: Navigation, quick actions
```

#### Button Styles

```css
/* Primary Button */
.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease-in-out;
}

.btn-primary:hover {
  background: #4338ca;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary Button */
.btn-secondary {
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #4f46e5;
  border: 1px solid #e5e7eb;
}

.btn-ghost:hover {
  background: #ede9fe;
}

/* Danger Button */
.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
```

### Form Inputs

#### Input Specifications

```
Standard Input:
├─ Height: 48px
├─ Padding: 12px 16px
├─ Border: 2px solid #d1d5db
├─ Border Radius: 8px
├─ Font Size: 16px (prevents iOS zoom)
├─ Focus State:
│  ├─ Border Color: #4f46e5
│  └─ Box Shadow: 0 0 0 3px rgba(79, 70, 229, 0.1)
└─ Disabled State:
   ├─ Background: #f3f4f6
   ├─ Color: #9ca3af
   └─ Cursor: not-allowed

Textarea:
├─ Min Height: 120px
├─ Resizable: vertical
├─ Same border/padding as input
└─ Line Height: 1.5
```

#### Mobile Keyboard Handling

```css
/* Prevent iOS zoom on input focus */
input, select, textarea {
  font-size: 16px; /* Must be ≥16px */
}

/* Viewport scaling fix */
@viewport {
  zoom: 1;
}

/* Remove iOS default styling */
input[type="search"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="search"]::-webkit-search-cancel-button {
  display: none;
}
```

### Cards

```
Card Component:
├─ Padding: 24px (desktop), 16px (mobile)
├─ Background: #ffffff
├─ Border: 1px solid #e5e7eb
├─ Border Radius: 12px
├─ Box Shadow: 0 1px 2px rgba(0, 0, 0, 0.05)
├─ Hover Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
└─ Hover Transform: translateY(-2px)

Card Variants:
├─ .card-compact (padding: 12px)
├─ .card-flat (no shadow, subtle border)
├─ .card-elevated (stronger shadow)
└─ .card-interactive (pointer cursor, hover effect)
```

### Modals

#### Desktop Modal
```
Desktop Modal:
├─ Width: calc(100% - 32px)
├─ Max Width: 500px
├─ Position: Centered (transform: translate(-50%, -50%))
├─ Animation: slideInUp 200ms
├─ Backdrop: rgba(0, 0, 0, 0.5)
├─ Escape Key: Close modal
└─ Focus Trap: Enabled
```

#### Mobile Bottom Sheet
```
Bottom Sheet (Mobile):
├─ Position: Fixed bottom
├─ Height: max-height 85vh
├─ Border Radius: 16px 16px 0 0 (rounded top)
├─ Animation: slideInUp 300ms
├─ Drag Handle: 36px × 4px (visible)
├─ Safe Area: Padding for notches
├─ Swipe Down: Dismiss gesture
└─ Backdrop: Blurred (optional)
```

### Tables

#### Desktop Table Styling

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
}

th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 150ms ease;
}

tbody tr:hover {
  background: #f9fafb;
}

td {
  padding: 16px;
  color: #1f2937;
}
```

#### Mobile Card View (for tables)

```jsx
// Transform table data to card layout
Card Layout:
├─ Each row = one card
├─ Key/value pairs displayed
├─ Actions in footer
├─ Tap to expand details
└─ No horizontal scroll
```

### Navigation

#### Bottom Navigation (Mobile)

```
Bottom Tab Nav:
├─ Position: Fixed bottom
├─ Height: 60px + safe-area-inset
├─ Background: #ffffff
├─ Border Top: 1px solid #e5e7eb
├─ Items:
│  ├─ Icon: 24px
│  ├─ Label: 12px (semibold)
│  ├─ Active Color: #4f46e5
│  ├─ Inactive Color: #9ca3af
│  └─ Min Width: 50px
├─ Touch Target: Full height (60px)
└─ Animation: Smooth color transition
```

#### Top Navigation (Desktop)

```
Header Navigation:
├─ Height: 64px
├─ Background: #ffffff
├─ Border Bottom: 1px solid #e5e7eb
├─ Padding: 16px 24px
├─ Logo: 32px × 32px
├─ Menu Items:
│  ├─ Text: 14px (medium)
│  ├─ Padding: 8px 12px
│  ├─ Active Indicator: Underline (2px)
│  └─ Active Color: #4f46e5
└─ Sticky: Yes (z-index: 20)
```

---

## 5. SHADOW SYSTEM

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

**Usage:**
- `--shadow-xs`: Subtle effects, interactive states
- `--shadow-sm`: Default cards
- `--shadow-base`: Buttons on hover
- `--shadow-md`: Floating elements, dropdowns
- `--shadow-lg`: Modals, important overlays
- `--shadow-xl`: Emphasized depth, hero images

---

## 6. BORDER RADIUS

```css
--radius-none: 0;
--radius-xs: 0.25rem;      /* 4px - very tight corners */
--radius-sm: 0.375rem;     /* 6px - form inputs */
--radius-base: 0.5rem;     /* 8px - buttons, cards */
--radius-md: 0.75rem;      /* 12px - larger buttons */
--radius-lg: 1rem;         /* 16px - cards, modals */
--radius-xl: 1.5rem;       /* 24px - modal headers */
--radius-2xl: 2rem;        /* 32px - large panels */
--radius-full: 9999px;     /* Circular (buttons, avatars) */
```

---

## 7. Z-INDEX SCALE

```css
--z-hide: -1;                    /* Hidden elements */
--z-base: 0;                     /* Default stacking */
--z-dropdown: 10;                /* Dropdowns, select menus */
--z-sticky: 20;                  /* Sticky headers */
--z-fixed: 30;                   /* Fixed nav, FAB */
--z-offcanvas: 35;               /* Sidebars */
--z-modal-backdrop: 40;          /* Modal background */
--z-modal: 50;                   /* Modals, dialogs */
--z-popover: 60;                 /* Popovers, tooltips */
--z-notification: 70;            /* Toast notifications */
--z-tooltip: 80;                 /* Tooltips (always on top) */
```

---

## 8. ANIMATION & TRANSITIONS

### Transition Timing

```css
--transition-fast: 150ms ease-in-out;    /* Subtle interactions */
--transition-base: 200ms ease-in-out;    /* Standard transitions */
--transition-slow: 300ms ease-in-out;    /* Important changes */
```

### Key Animations

```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 9. INTERACTION PATTERNS

### Button States

```
Default:  Background #4f46e5, cursor: pointer
Hover:    Background #4338ca, shadow elevated
Active:   Transform scale(0.98)
Focus:    Outline 2px solid #4f46e5
Disabled: Opacity 0.5, cursor: not-allowed
```

### Link States

```
Default:  Color #4f46e5, no underline
Hover:    Color #4338ca, underline
Visited:  Color #7c3aed (purple)
Focus:    Outline 2px offset 2px
```

### Form Input States

```
Default:  Border #d1d5db, background white
Hover:    Border #bfdbfe (light blue)
Focus:    Border #4f46e5, shadow 0 0 0 3px rgba(79,70,229,0.1)
Error:    Border #ef4444, shadow red
Disabled: Background #f3f4f6, color #9ca3af
```

---

## 10. RESPONSIVE LAYOUT BREAKPOINTS

```
Mobile XS (320px - 479px):
├─ 1 column layout
├─ Full-width buttons
├─ Stacked form fields
└─ Large touch targets

Mobile SM (480px - 639px):
├─ 1-2 column layout
├─ Optimized for landscape
├─ Compact form layout
└─ Bottom navigation

Tablet (640px - 1023px):
├─ 2-3 column layout
├─ Sidebar navigation (optional)
├─ Multi-column forms
└─ Horizontal scroll tables

Desktop (1024px - 1279px):
├─ 3-4 column layout
├─ Sidebar navigation
├─ Full-width forms
└─ Interactive tables

Large Desktop (1280px+):
├─ 4+ column layout
├─ Full sidebar
├─ Advanced layouts
└─ Maximum content width: 1200px
```

---

## 11. ACCESSIBILITY GUIDELINES

### Color Contrast (WCAG AAA)

- Body text: 7:1 minimum ratio
- Large text: 4.5:1 minimum ratio
- UI components: 3:1 minimum ratio

### Touch Targets (WCAG 2.5.5)

- Minimum size: 44×44px (target)
- Recommended: 48×48px (comfortable)
- Spacing between targets: ≥8px

### Focus Indicators

```css
:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
```

### Semantic HTML

- Use `<button>` for buttons (not `<div>`)
- Use `<a>` for links
- Use `<label>` for form fields
- Use `<nav>` for navigation
- Use `<main>`, `<section>`, `<article>` for content

---

## 12. DARK MODE SPECIFICATIONS

### Color Mappings

```
Light → Dark
────────────────────────
#ffffff → #111827 (bg)
#f9fafb → #1f2937
#f3f4f6 → #374151
#e5e7eb → #4b5563
#1f2937 → #f3f4f6 (text)
#111827 → #f9fafb (text)
```

### Dark Mode Activation

```css
/* System preference */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
  }
}

/* Manual toggle (data attribute) */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text: #f1f5f9;
}
```

---

## Design Checklist

- [ ] All colors meet WCAG AAA contrast
- [ ] Typography scale consistent across app
- [ ] Spacing uses defined scale (no random values)
- [ ] All buttons are ≥48px touch targets
- [ ] Modals responsive (sheet on mobile, modal on desktop)
- [ ] Tables have card fallback for mobile
- [ ] Focus indicators visible on all interactive elements
- [ ] Dark mode works throughout app
- [ ] Animations use defined transitions
- [ ] Z-index follows scale system
- [ ] All icons are properly sized
- [ ] Form validation feedback clear
- [ ] Loading states shown appropriately
- [ ] Error states distinct and helpful

---

**End of Design System**
