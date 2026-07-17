# 🚀 Quick Reference Card - Professional SaaS UI

## 📋 Quick Links

| Item | URL |
|------|-----|
| Landing Page | http://localhost:3000/ |
| Features Page | http://localhost:3000/features |
| Sign In | http://localhost:3000/login |
| Register | http://localhost:3000/register-school |
| Backend | http://localhost:8000 |

---

## 🎨 Color Quick Reference

```
Primary:    #3ecf8e (Green - use for main buttons)
Dark:       #2db876 (Hover state)
Secondary:  #2dd4bf (Accents)
Accent:     #06d6a0 (Highlights)

Text:       #1a202c (Headers)
Text Light: #718096 (Body text)
BG Light:   #f7fafc (Section backgrounds)
Border:     #e2e8f0 (Dividers)
```

---

## 📐 Responsive Breakpoints

```
Mobile:     0 - 480px
Tablet:     480 - 768px
Desktop:    768px+
```

---

## 🔘 Button Classes

```jsx
// Primary green button
<button className="btn btn-primary">Click Me</button>

// Secondary transparent button
<button className="btn btn-secondary">Click Me</button>

// Large button
<button className="btn btn-primary btn-large">Click Me</button>

// Full width button
<button className="btn btn-primary btn-block">Click Me</button>
```

---

## 🏗️ Section Structure

```jsx
<section className="features-section">
  <div className="section-container">
    <div className="section-header">
      <h2>Section Title</h2>
      <p>Subtitle text</p>
    </div>
    {/* Content goes here */}
  </div>
</section>
```

---

## 📱 Responsive Grid

```css
/* 3-column grid that adapts to mobile */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
```

---

## ✨ Common CSS Classes

| Class | Purpose |
|-------|---------|
| `.professional-landing` | Main wrapper |
| `.section-container` | Max-width container |
| `.section-header` | Centered titles |
| `.feature-card` | Feature card |
| `.testimonial-card` | Testimonial card |
| `.hero-section` | Hero area |
| `.footer` | Footer styling |

---

## 🎯 Component Examples

### Feature Card
```jsx
<div className="feature-card">
  <div className="feature-icon">📊</div>
  <h3>Feature Name</h3>
  <p>Description here...</p>
</div>
```

### Button with Icon
```jsx
<Link to="/register" className="btn btn-primary btn-large">
  Get Started
  <FaArrowRight />
</Link>
```

### Testimonial
```jsx
<div className="testimonial-card">
  <div className="testimonial-header">
    <div className="testimonial-avatar">AB</div>
    <div>
      <h4>Person Name</h4>
      <p>Title/Role</p>
    </div>
  </div>
  <p>Testimonial content...</p>
</div>
```

---

## 🎨 Shadow Levels

```css
--shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 🔄 Animations

### Hover Effects
```css
/* Button lift */
transform: translateY(-2px);

/* Card lift */
transform: translateY(-8px);
```

### Standard Transition
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📝 Typography Sizes

| Element | Size | Weight |
|---------|------|--------|
| Display | 3.5rem | 800 |
| H1 | 2.5rem | 800 |
| H2 | 1.75rem | 700 |
| H3 | 1.3rem | 700 |
| Body | 1rem | 400 |
| Small | 0.9rem | 500 |

---

## 📁 File Locations

```
Components:
  frontend/src/components/ProfessionalNavbar.jsx

Pages:
  frontend/src/pages/ProfessionalLanding.jsx
  frontend/src/pages/FeaturesPage.jsx

Styles:
  frontend/src/styles/professional-navbar.css
  frontend/src/styles/professional-landing.css

Docs:
  frontend/DESIGN_SYSTEM_PROFESSIONAL.md
  frontend/PROFESSIONAL_UI_GUIDE.md
```

---

## 🚀 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎯 Common Tasks

### Add New Page
```jsx
// 1. Create pages/NewPage.jsx
// 2. Import navbar
// 3. Import styles
// 4. Add route in App.jsx

<Route path="/new-page" element={<NewPage />} />
```

### Change Primary Color
```css
/* In professional-landing.css */
:root {
  --primary-color: #your-color;
  --primary-dark: #your-dark-color;
}
```

### Make Element Responsive
```css
@media (max-width: 768px) {
  .your-element {
    /* Mobile styles */
  }
}
```

---

## ♿ Accessibility Checklist

- [ ] Proper heading hierarchy (H1, H2, H3)
- [ ] Color contrast ratio 4.5:1
- [ ] Keyboard navigation works
- [ ] Alt text on images
- [ ] ARIA labels where needed
- [ ] Focus indicators visible

---

## ✅ Pre-Launch Checklist

- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Test on desktop
- [ ] Check accessibility (axe)
- [ ] Verify all links work
- [ ] Test forms
- [ ] Check images load
- [ ] Verify animations smooth
- [ ] Test keyboard navigation
- [ ] Check performance

---

## 🐛 Troubleshooting

**Issue: Navbar not sticky**
- Solution: Check z-index and position values

**Issue: Grid not responsive**
- Solution: Use `grid-template-columns: repeat(auto-fit, minmax(width, 1fr))`

**Issue: Mobile menu not showing**
- Solution: Verify media query breakpoint

**Issue: Animations jittery**
- Solution: Use `will-change` sparingly, check transform vs left/top

---

## 📚 Documentation

- **Full Design System:** DESIGN_SYSTEM_PROFESSIONAL.md
- **Implementation Guide:** PROFESSIONAL_UI_GUIDE.md
- **Completion Summary:** PROFESSIONAL_LANDING_PAGE_COMPLETE.md

---

## 🔗 External Resources

- React Docs: https://react.dev
- CSS Grid: https://web.dev/learn/css/grid/
- Flexbox: https://web.dev/learn/css/flexbox/
- A11y: https://www.a11y-101.com/

---

## 💡 Pro Tips

1. **Use CSS variables** - Easy to customize globally
2. **Mobile-first** - Start with mobile, enhance for desktop
3. **Reuse components** - Copy-paste feature cards, testimonials
4. **Test often** - Check on real devices
5. **Keep it simple** - Don't over-complicate styling
6. **Document changes** - Update guides when modifying
7. **Performance first** - Optimize images and animations
8. **Accessibility matters** - Test with accessibility tools

---

## 📞 Quick Support

**Need to...**

Add a new button?
```jsx
<Link to="/link" className="btn btn-primary">Text</Link>
```

Add a new section?
```jsx
<section className="features-section">
  <div className="section-container">
    {/* content */}
  </div>
</section>
```

Add a grid?
```jsx
<div className="features-grid">
  {/* items */}
</div>
```

---

**Last Updated:** January 2026  
**Version:** 1.0  
✅ **READY TO USE**
