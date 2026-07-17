# 🚀 Quick Reference & Component Showcase
## Copy-Paste Ready Code Examples

---

## TABLE OF CONTENTS

1. [Button Variants](#buttons)
2. [Form Patterns](#forms)
3. [Cards & Layouts](#cards)
4. [Navigation Patterns](#navigation)
5. [Mobile Gestures](#gestures)
6. [Loading States](#loading)
7. [Common Patterns](#patterns)
8. [Testing Snippets](#testing)

---

## BUTTONS

### Primary CTA Button

```jsx
<button className="btn btn-primary btn-lg btn-full">
  Save Changes
</button>
```

### Secondary Button

```jsx
<button className="btn btn-secondary">
  Cancel
</button>
```

### Icon Button (Mobile-Friendly)

```jsx
import { FaPlus } from 'react-icons/fa';

<button className="btn btn-icon btn-primary" title="Add new">
  <FaPlus size={24} />
</button>
```

### Button Group (Mobile Responsive)

```jsx
<div style={{
  display: 'flex',
  gap: 'var(--space-3)',
  flexWrap: 'wrap'
}}>
  <button className="btn btn-primary" style={{ flex: 1, minWidth: '150px' }}>
    Confirm
  </button>
  <button className="btn btn-secondary" style={{ flex: 1, minWidth: '150px' }}>
    Cancel
  </button>
</div>
```

### Loading Button

```jsx
import { useState } from 'react';

export function LoadingButton() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // API call
      await new Promise(r => setTimeout(r, 2000));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleSubmit}
      disabled={loading}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {loading ? (
        <>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
          {' '}Processing...
        </>
      ) : (
        'Submit'
      )}
    </button>
  );
}
```

---

## FORMS

### Basic Form with Validation

```jsx
import { useState } from 'react';

export function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // API call
      console.log('Submitting:', form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <label style={{
          display: 'block',
          marginBottom: 'var(--space-2)',
          fontWeight: 'var(--font-weight-semibold)',
          fontSize: 'var(--font-size-sm)'
        }}>
          Email Address
        </label>
        <input
          type="email"
          className={`input ${errors.email ? 'input-error' : ''}`}
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          placeholder="your@email.com"
        />
        {errors.email && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
            {errors.email}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{
          display: 'block',
          marginBottom: 'var(--space-2)',
          fontWeight: 'var(--font-weight-semibold)',
          fontSize: 'var(--font-size-sm)'
        }}>
          Password
        </label>
        <input
          type="password"
          className={`input ${errors.password ? 'input-error' : ''}`}
          value={form.password}
          onChange={(e) => {
            setForm({ ...form, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          placeholder="••••••••"
        />
        {errors.password && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
            {errors.password}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Multi-Column Form (Responsive)

```jsx
export function ProfileForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <form style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 'var(--space-4)',
    }}>
      <div>
        <label className="form-label">First Name</label>
        <input
          type="text"
          className="input"
          value={form.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
        />
      </div>

      <div>
        <label className="form-label">Last Name</label>
        <input
          type="text"
          className="input"
          value={form.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Email</label>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>

      <div>
        <label className="form-label">Phone</label>
        <input
          type="tel"
          className="input"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Bio</label>
        <textarea
          className="input"
          value={form.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          style={{ minHeight: '120px', resize: 'vertical' }}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <button type="submit" className="btn btn-primary btn-full">
          Save Profile
        </button>
      </div>
    </form>
  );
}
```

### File Upload

```jsx
import { useState } from 'react';
import { FaUpload, FaTimes } from 'react-icons/fa';

export function FileUploadField() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        padding: 'var(--space-8)',
        border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-neutral-300)'}`,
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        transition: 'all var(--transition-base)',
        background: dragActive ? 'var(--color-primary-lightest)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={(e) => setFile(e.target.files?.[0])}
      />

      {file ? (
        <div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
            {file.name}
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="btn btn-ghost btn-sm"
          >
            <FaTimes /> Remove
          </button>
        </div>
      ) : (
        <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
          <FaUpload size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }} />
          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
            Click or drag files here
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
            Accepted formats: PDF, DOC, DOCX (Max 5MB)
          </div>
        </label>
      )}
    </div>
  );
}
```

---

## CARDS

### Basic Card

```jsx
<div className="card">
  <h3>Student Overview</h3>
  <p>Current enrollment: 245 students</p>
</div>
```

### Card with Stats

```jsx
<div className="card">
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 'var(--space-4)',
  }}>
    <div>
      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
        245
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
        Total Students
      </div>
    </div>
    <div>
      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
        98%
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
        Attendance
      </div>
    </div>
    <div>
      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)' }}>
        12
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
        Absent Today
      </div>
    </div>
  </div>
</div>
```

### Card with Actions

```jsx
<div className="card">
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: 'var(--space-4)',
  }}>
    <div>
      <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Assignment Due</h3>
      <p style={{ margin: 0, color: 'var(--color-neutral-500)' }}>English Composition - Due today</p>
    </div>
    <span className="badge badge-warning">Due Today</span>
  </div>
  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>View Details</button>
    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Postpone</button>
  </div>
</div>
```

---

## NAVIGATION

### Responsive Header

```jsx
import { useState } from 'react';
import { FaBars, FaTimes, FaHome, FaUser, FaCog } from 'react-icons/fa';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { label: 'Home', href: '/', icon: FaHome },
    { label: 'Profile', href: '/profile', icon: FaUser },
    { label: 'Settings', href: '/settings', icon: FaCog },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'var(--color-neutral-0)',
      borderBottom: '1px solid var(--color-neutral-200)',
      zIndex: 'var(--z-sticky)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-4)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          Elite
        </h1>

        {!isMobile && (
          <nav style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {menuItems.map((item) => (
              <a key={item.label} href={item.href} style={{
                color: 'var(--color-neutral-700)',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
                transition: 'color var(--transition-fast)',
              }}>
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost"
            style={{ padding: 'var(--space-3)' }}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>

      {isMobile && mobileMenuOpen && (
        <nav style={{
          borderTop: '1px solid var(--color-neutral-200)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          {menuItems.map((item) => (
            <a key={item.label} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast)',
            }}>
              <item.icon size={18} />
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
```

---

## GESTURES

### Swipe to Delete Pattern

```jsx
import { useRef, useState } from 'react';

export function SwipeableItem({ item, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -120));
    }
  };

  const handleTouchEnd = () => {
    if (translateX < -60) {
      onDelete(item);
    }
    setTranslateX(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '120px',
        height: '100%',
        background: 'var(--color-error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => onDelete(item)}
          className="btn btn-danger"
          style={{ whiteSpace: 'nowrap' }}
        >
          Delete
        </button>
      </div>

      <div className="card" style={{
        transform: `translateX(${translateX}px)`,
        transition: translateX === 0 ? 'transform 200ms ease-out' : 'none',
        cursor: 'pointer',
      }}>
        <h4 style={{ margin: 0 }}>{item.name}</h4>
        <p style={{ margin: '8px 0 0 0', color: 'var(--color-neutral-500)' }}>
          {item.description}
        </p>
      </div>
    </div>
  );
}
```

### Long Press Menu

```jsx
import { useRef, useState } from 'react';

export function LongPressMenu({ item, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pressTimer = useRef(null);

  const handleMouseDown = () => {
    pressTimer.current = setTimeout(() => {
      setMenuOpen(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <div className="card" style={{ userSelect: 'none' }}>
        <h4>{item.name}</h4>
        <p>{item.email}</p>
      </div>

      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal-backdrop)',
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'var(--color-neutral-0)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-modal)',
          }}>
            <button
              onClick={() => {
                onAction('edit');
                setMenuOpen(false);
              }}
              className="btn btn-ghost"
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: 'var(--space-3)' }}
            >
              Edit
            </button>
            <button
              onClick={() => {
                onAction('delete');
                setMenuOpen(false);
              }}
              className="btn btn-danger"
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: 'var(--space-3)' }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## LOADING

### Skeleton Loader

```jsx
export function CardSkeleton() {
  return (
    <div className="card" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
      <div
        style={{
          height: '24px',
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
        }}
      />
      <div
        style={{
          height: '16px',
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-3)',
        }}
      />
      <div
        style={{
          height: '16px',
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--radius-md)',
          width: '80%',
        }}
      />
    </div>
  );
}
```

### Shimmer Loading

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Spinner

```jsx
export function Spinner() {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--color-neutral-200)',
      borderTop: '3px solid var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
  );
}
```

---

## PATTERNS

### Empty State

```jsx
import { FaBoxOpen } from 'react-icons/fa';

export function EmptyState({ title = 'No data', description = 'Start by adding your first item' }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-12)',
    }}>
      <FaBoxOpen
        size={64}
        style={{
          color: 'var(--color-neutral-300)',
          marginBottom: 'var(--space-4)',
        }}
      />
      <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-neutral-700)' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--color-neutral-500)' }}>
        {description}
      </p>
    </div>
  );
}
```

### Alert / Toast

```jsx
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

export function Toast({ type = 'success', message, onClose }) {
  const icons = {
    success: <FaCheckCircle />,
    warning: <FaExclamationTriangle />,
    error: <FaTimesCircle />,
  };

  const colors = {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-4)',
      right: 'var(--space-4)',
      zIndex: 'var(--z-notification)',
      animation: 'slideInUp var(--transition-base)',
    }}>
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
        background: 'var(--color-neutral-0)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        border: `2px solid ${colors[type]}`,
      }}>
        <span style={{ color: colors[type], fontSize: 'var(--font-size-lg)' }}>
          {icons[type]}
        </span>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{ padding: 'var(--space-2)' }}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
```

### Badge / Tag

```jsx
export function Badge({ text, variant = 'default' }) {
  const variants = {
    default: { bg: 'var(--color-neutral-200)', color: 'var(--color-neutral-900)' },
    primary: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
    success: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', color: '#92400e' },
    error: { bg: 'var(--color-error-light)', color: 'var(--color-error)' },
  };

  const style = variants[variant];

  return (
    <span
      className="badge"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {text}
    </span>
  );
}
```

---

## TESTING

### Mobile Viewport Testing

```jsx
// Test on multiple viewports
const testViewports = {
  'mobile-xs': { width: 320, height: 568 },    // iPhone SE
  'mobile-sm': { width: 375, height: 667 },    // iPhone 8
  'mobile-md': { width: 390, height: 844 },    // iPhone 12
  'mobile-lg': { width: 430, height: 932 },    // iPhone 14 Pro Max
  'tablet': { width: 768, height: 1024 },      // iPad
  'desktop': { width: 1920, height: 1080 },    // Desktop
};
```

### Performance Testing Hook

```jsx
import { useEffect } from 'react';

export function useWebVitals() {
  useEffect(() => {
    if ('web-vital' in window) {
      const vitals = window['web-vital'];
      console.log('Web Vitals:', vitals);
    }
  }, []);
}
```

### Accessibility Testing

```jsx
// Check button sizes
export function checkA11y() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    if (rect.width < 48 || rect.height < 48) {
      console.warn('Button too small:', btn, rect);
    }
  });
}
```

---

## QUICK INTEGRATION CHECKLIST

- [ ] Copy responsive CSS system: `styles-responsive-system.css`
- [ ] Import in main layout: `import '../styles-responsive-system.css'`
- [ ] Add responsive meta tags to `index.html`
- [ ] Create bottom navigation for mobile routes
- [ ] Convert tables to card view on mobile
- [ ] Add form validation feedback
- [ ] Implement loading states
- [ ] Test on real devices (iOS + Android)
- [ ] Run Lighthouse audit
- [ ] Check accessibility (axe DevTools)
- [ ] Optimize images (use WebP)
- [ ] Lazy load non-critical content
- [ ] Monitor Web Vitals in production

---

**Happy Building! 🚀**
