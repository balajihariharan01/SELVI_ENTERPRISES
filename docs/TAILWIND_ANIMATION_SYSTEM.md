# Selvi Enterprise - Tailwind CSS v4 Animation System

## 📋 Overview

A comprehensive, production-grade animation system built on **Tailwind CSS v4** for consistent, elegant motion across the entire application. Uses Tailwind v4's CSS-first configuration approach.

---

## 🎯 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Subtle & Professional** | Animations enhance UX without distracting from content |
| **Consistent Timing** | Same timing across all animations for unified feel |
| **GPU Optimized** | Transform-based animations for smooth 60fps |
| **Accessible** | Respects `prefers-reduced-motion` system preference |
| **Mobile-Safe** | Lightweight animations that work on all devices |

---

## ⏱️ Timing Standards

| Token | Duration | Use Case |
|-------|----------|----------|
| `duration-fast` | 150ms | Button press, hover states |
| `duration-normal` | 250ms | Standard transitions |
| `duration-slow` | 350ms | Card animations, modals |
| `duration-slower` | 500ms | Page transitions |
| `duration-page` | 300ms | Route changes |

---

## 🎨 Easing Curves

| Token | Curve | Use Case |
|-------|-------|----------|
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard (Material) |
| `ease-smooth-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `ease-smooth-in` | `cubic-bezier(0.4, 0, 1, 1)` | Enter animations |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful feedback |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Modal/popup |

---

## 📦 Animation Classes

### Page Transitions

```jsx
// Tailwind classes
<div className="animate-page-enter">...</div>
<div className="animate-fade-in-up">...</div>
<div className="animate-fade-in-left">...</div>

// React component
import { TwPageTransition } from '../components/animations';

<TwPageTransition variant="default">
  <YourPage />
</TwPageTransition>
```

**Available Variants:**
- `default` - Fade in + slide up (300ms)
- `fast` - Simple fade (200ms)
- `slide` - Full slide up
- `scale` - Scale in from center
- `left` - Fade in from left
- `right` - Fade in from right

---

### Button Animations

```jsx
// Basic animated button
<button className="btn-animated">Click Me</button>

// With glow effect
<button className="btn-animated-primary">Primary</button>
<button className="btn-animated-accent">Accent</button>

// Press feedback only
<button className="btn-press">Press Me</button>

// With ripple
<button className="btn-ripple">Ripple</button>
```

**Behaviors:**
- Hover: Scale to 1.02, shadow increase
- Active: Scale to 0.98
- Primary: Blue glow on hover
- Accent: Gold glow on hover

---

### Hover Effects

```jsx
// Lift on hover (translate Y + shadow)
<div className="hover-lift">Card</div>
<div className="hover-lift-lg">Large lift</div>

// Scale on hover
<div className="hover-scale">Scale up</div>
<div className="hover-scale-press">Scale with press</div>

// Glow on hover
<div className="hover-glow">Blue glow</div>
<div className="hover-glow-accent">Gold glow</div>

// Border highlight
<div className="hover-border">Border appears</div>
```

---

### Card Animations

```jsx
// Single animated card
<div className="card-animated">
  Card content
</div>

// Staggered cards (auto-delays children)
<div className="cards-stagger">
  <div>Card 1</div>  {/* 50ms delay */}
  <div>Card 2</div>  {/* 100ms delay */}
  <div>Card 3</div>  {/* 150ms delay */}
</div>

// Using React component
import { TwStaggerContainer } from '../components/animations';

<TwStaggerContainer staggerDelay={50}>
  <Card />
  <Card />
  <Card />
</TwStaggerContainer>
```

---

### Form Animations

```jsx
// Animated input with focus glow
<input className="input-animated" />

// Input with glow effect
<input className="input-glow" />

// Error state (with shake)
<input className="input-error" />

// Success state (with pulse)
<input className="input-success" />

// Floating label pattern
<div className="input-float-container">
  <input placeholder=" " />
  <label>Email</label>
</div>
```

---

### Modal Animations

```jsx
// Overlay with blur
<div className="modal-overlay-animated">
  
  // Modal content with scale
  <div className="modal-animated">
    Modal content
  </div>
  
</div>

// Slide-up modal variant
<div className="modal-slide">
  Modal content
</div>
```

---

### Dropdown Animations

```jsx
// Dropdown menu
<div className="dropdown-animated">
  <a className="dropdown-item">Option 1</a>
  <a className="dropdown-item">Option 2</a>
</div>

// Closing state
<div className="dropdown-animated closing">
  ...
</div>
```

---

### Loading States

```jsx
// Spinner
<div className="spinner"></div>
<div className="spinner spinner-sm"></div>
<div className="spinner spinner-lg"></div>

// Skeleton loaders
<div className="skeleton-animated h-4 w-full"></div>
<div className="skeleton-text"></div>
<div className="skeleton-title"></div>
<div className="skeleton-avatar"></div>
<div className="skeleton-card"></div>

// Pulse effect
<div className="pulse-loader">Loading...</div>

// Dot loader
<div className="loading-dots">
  <span></span>
  <span></span>
  <span></span>
</div>
```

---

### Dashboard Animations

```jsx
// Stat card with counter animation
<div className="stat-animated">
  <span>Total Orders</span>
  <strong>1,234</strong>
</div>

// Progress bar
<div className="progress-animated">
  <div 
    className="progress-fill" 
    style={{ '--progress-value': '75%' }}
  ></div>
</div>

// Badge with pop effect
<span className="badge-animated">New</span>
```

---

### Scroll Animations

```jsx
import { TwAnimatedSection } from '../components/animations';

// Animate when section enters viewport
<TwAnimatedSection animation="fade-in-up">
  <h2>Section Title</h2>
</TwAnimatedSection>

// With delay
<TwAnimatedSection animation="fade-in-left" delay={200}>
  <p>Delayed content</p>
</TwAnimatedSection>

// Available animations:
// - fade-in
// - fade-in-up
// - fade-in-down
// - fade-in-left
// - fade-in-right
// - scale-in
// - slide-in-up
```

---

### Stagger Delays

```jsx
// Using utility classes
<div className="animate-stagger-1">Item 1</div>  {/* 50ms */}
<div className="animate-stagger-2">Item 2</div>  {/* 100ms */}
<div className="animate-stagger-3">Item 3</div>  {/* 150ms */}
<div className="animate-stagger-4">Item 4</div>  {/* 200ms */}

// Using delay utilities
<div className="animate-fade-in-up delay-100">...</div>
<div className="animate-fade-in-up delay-200">...</div>
<div className="animate-fade-in-up delay-300">...</div>
```

---

## 🔧 Utility Classes

### Animation Delays

| Class | Delay |
|-------|-------|
| `delay-50` | 50ms |
| `delay-100` | 100ms |
| `delay-150` | 150ms |
| `delay-200` | 200ms |
| `delay-250` | 250ms |
| `delay-300` | 300ms |
| `delay-400` | 400ms |
| `delay-500` | 500ms |

### Fill Modes

| Class | Effect |
|-------|--------|
| `fill-forwards` | Keep final state after animation |
| `fill-backwards` | Apply initial state before animation |
| `fill-both` | Both forwards and backwards |

### Performance

| Class | Effect |
|-------|--------|
| `gpu-accelerated` | Force GPU layer (`translateZ(0)`) |
| `animate-init` | Hidden until animation starts |

---

## ♿ Accessibility

The system automatically respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
  /* Transforms removed */
  /* Transitions minimized */
}
```

**In components:**
```jsx
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion) {
  // Skip or simplify animation
}
```

---

## 📱 Mobile Considerations

1. **Keep animations short** (< 300ms)
2. **Use transform/opacity only** (GPU accelerated)
3. **Avoid animating layout properties** (width, height, margin)
4. **Test on real devices**
5. **Consider battery impact**

---

## ✅ Animation Checklist

### Every Page Should Have:
- [ ] Page enter animation
- [ ] Smooth section reveals
- [ ] Consistent button interactions

### Every Card Should Have:
- [ ] Fade-in on load
- [ ] Hover lift effect
- [ ] Stagger if in a list

### Every Form Should Have:
- [ ] Input focus animation
- [ ] Error shake feedback
- [ ] Success confirmation

### Every Modal Should Have:
- [ ] Overlay fade
- [ ] Content scale/slide
- [ ] Body scroll lock

### Every Button Should Have:
- [ ] Hover scale (1.02)
- [ ] Active press (0.98)
- [ ] Color transition

---

## 📁 File Structure

```
frontend/
├── postcss.config.js                 # PostCSS with @tailwindcss/postcss
└── src/
    ├── styles/
    │   └── tailwind-animations.css   # Tailwind v4 CSS-first config + animations
    └── components/
        └── animations/
            ├── TwPageTransition.jsx  # Tailwind page wrapper
            ├── PageTransition.jsx    # Framer Motion wrapper
            └── index.js              # All exports
```

**Note:** Tailwind v4 uses CSS-first configuration via `@theme` in the CSS file, not a JavaScript config file.

---

## 🚀 Quick Start

```jsx
// 1. Wrap your page
import { TwPageTransition } from '../components/animations';

const MyPage = () => (
  <TwPageTransition>
    <div className="cards-stagger">
      <div className="card-animated hover-lift">Card 1</div>
      <div className="card-animated hover-lift">Card 2</div>
    </div>
    
    <button className="btn-animated-primary">
      Submit
    </button>
  </TwPageTransition>
);

// 2. Add loading states
{loading ? (
  <div className="skeleton-card" />
) : (
  <div className="card-animated">Content</div>
)}

// 3. Animate sections on scroll
<TwAnimatedSection animation="fade-in-up">
  <FeatureSection />
</TwAnimatedSection>
```

---

## 🎬 Animation Comparison

| Use Case | Tailwind Class | Framer Motion |
|----------|----------------|---------------|
| Simple fade | `animate-fade-in` | `fadeInUp` variant |
| Complex sequences | ❌ Use Framer | `AnimatePresence` |
| Scroll trigger | `TwAnimatedSection` | `useInView` |
| Page transition | `TwPageTransition` | `PageTransition` |
| List stagger | `cards-stagger` | `staggerContainer` |
| Drag/gesture | ❌ Use Framer | `motion.div` with drag |

**Recommendation:** Use Tailwind for simple, performance-critical animations. Use Framer Motion for complex sequences, gestures, and physics-based motion.

---

*Animation system created for Selvi Enterprise - Steel & Cement*
