# Selvi Enterprise - Visual Design Guide
## Premium Corporate UI/UX System

---

## 🎨 Brand Overview

**Selvi Enterprise – Steel & Cement** is a professional B2B e-commerce platform for construction materials. The visual design reflects **trustworthiness, stability, and premium quality** — essential values for the construction industry.

### Design Philosophy
- **Professional & Corporate** - No flashy gradients or childish UI
- **Clean & Minimal** - Focus on content and functionality
- **Trust-Building** - Colors and typography that convey reliability
- **Business-Grade** - Looks like a ₹50,000+ professional commercial product

---

## 🎨 Color Palette

### Primary Colors (Steel Blue)
The primary color represents **trust, stability, and authority** — perfect for a construction materials business.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-500` | `#215898` | Primary buttons, links, headers |
| `--color-primary-600` | `#153660` | Hover states, dark accents |
| `--color-primary-700` | `#0A1628` | Dark backgrounds, footers |
| `--color-primary-400` | `#4A7AB8` | Light accents |
| `--color-primary-50` | `#EBF3FA` | Light backgrounds |

### Secondary Colors (Charcoal Gray)
Professional neutrals for text and secondary elements.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-secondary-900` | `#0A1628` | Headings, primary text |
| `--color-secondary-700` | `#1A2B42` | Subheadings |
| `--color-secondary-600` | `#3D424F` | Body text |
| `--color-secondary-400` | `#525866` | Secondary text |
| `--color-secondary-200` | `#E5E7EB` | Borders |

### Accent Colors (Gold)
Action-oriented accent for CTAs and highlights.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent-500` | `#F59E0B` | CTA buttons, highlights |
| `--color-accent-600` | `#D97706` | Hover states |
| `--color-accent-400` | `#FBBF24` | Light accents |
| `--color-accent-50` | `#FFFBEB` | Light backgrounds |

### Status Colors

| Status | Color | Token |
|--------|-------|-------|
| Success | `#22C55E` | `--color-success-500` |
| Warning | `#F59E0B` | `--color-warning-500` |
| Error | `#DC2626` | `--color-error-500` |
| Info | `#215898` | `--color-info-500` |

---

## 📝 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Inter is a modern, professional typeface with excellent readability and a clean, business-like appearance.

### Type Scale (Modular Scale 1.25)

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 2.441rem (39px) | 700 | Page titles |
| H2 | 1.953rem (31px) | 700 | Section headers |
| H3 | 1.563rem (25px) | 600 | Subsection headers |
| H4 | 1.25rem (20px) | 600 | Card titles |
| Body | 1rem (16px) | 400 | Body text |
| Small | 0.875rem (14px) | 400 | Captions, labels |
| XSmall | 0.75rem (12px) | 500 | Badges, tags |

### Text Colors

| Usage | Color | Token |
|-------|-------|-------|
| Headings | `#0A1628` | `--text-heading` |
| Body | `#3D424F` | `--text-body` |
| Secondary | `#525866` | `--text-secondary` |
| Muted | `#6B7280` | `--text-muted` |
| On Dark | `#FFFFFF` | `--text-white` |

---

## 📐 Spacing System

Based on a 4px unit grid for consistent spacing throughout the application.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Icon gaps, small padding |
| `--space-3` | 12px | Button padding |
| `--space-4` | 16px | Card padding |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Large section padding |
| `--space-12` | 48px | Section margins |
| `--space-16` | 64px | Page sections |

---

## 🔲 Border Radius

Professional, subtle rounding — not overly rounded.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements, badges |
| `--radius` | 8px | Buttons, inputs |
| `--radius-md` | 10px | Cards, containers |
| `--radius-lg` | 12px | Large cards |
| `--radius-xl` | 14px | Modal dialogs |

---

## 🌑 Shadows

Subtle, professional shadows that add depth without being overwhelming.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(10,22,40,0.04)` | Subtle elevation |
| `--shadow` | `0 4px 12px rgba(10,22,40,0.06)` | Cards |
| `--shadow-md` | `0 8px 24px rgba(10,22,40,0.08)` | Hover states |
| `--shadow-lg` | `0 12px 32px rgba(10,22,40,0.1)` | Modals |
| `--shadow-xl` | `0 20px 48px rgba(10,22,40,0.12)` | Popovers |

---

## 🎬 Animations

Smooth, professional transitions with subtle timing.

### Timing
- **Fast**: 150ms - Micro-interactions
- **Normal**: 200ms - Button hovers, focus states
- **Smooth**: 300ms - Card hovers, dropdowns
- **Slow**: 400ms - Page transitions

### Easing
- **Default**: `ease` - General transitions
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` - Natural motion
- **Bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Playful interactions

### Hover Effects
- Cards: Subtle lift (`translateY(-4px)`) with shadow increase
- Buttons: Slight lift (`translateY(-2px)`) with shadow
- Links: Underline reveal animation

---

## 🧱 Component Patterns

### Buttons

#### Primary Button
```css
background: linear-gradient(135deg, #215898 0%, #153660 100%);
color: #FFFFFF;
padding: 0.75rem 1.5rem;
border-radius: 10px;
font-weight: 600;
box-shadow: 0 4px 16px rgba(33, 88, 152, 0.25);
```

#### Secondary Button
```css
background: transparent;
color: #215898;
border: 2px solid #215898;
padding: 0.75rem 1.5rem;
border-radius: 10px;
font-weight: 600;
```

#### Accent Button (CTA)
```css
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
color: #0A1628;
padding: 0.75rem 1.5rem;
border-radius: 10px;
font-weight: 600;
box-shadow: 0 4px 16px rgba(245, 158, 11, 0.25);
```

### Cards
```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 12px;
padding: 1.5rem;
box-shadow: 0 4px 12px rgba(10, 22, 40, 0.06);
transition: all 0.3s ease;

/* Hover */
box-shadow: 0 8px 24px rgba(10, 22, 40, 0.1);
transform: translateY(-4px);
border-color: rgba(33, 88, 152, 0.2);
```

### Form Inputs
```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 10px;
padding: 0.875rem 1rem;
font-size: 0.9375rem;
transition: all 0.2s ease;

/* Focus */
border-color: #215898;
box-shadow: 0 0 0 3px rgba(33, 88, 152, 0.1);
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Value | Usage |
|------------|-------|-------|
| Mobile | < 480px | Single column, compact spacing |
| Mobile L | < 768px | Two columns, reduced padding |
| Tablet | < 1024px | Sidebar collapses |
| Desktop | ≥ 1024px | Full layout |
| Wide | ≥ 1280px | Wider containers |

---

## 🏗️ Layout Structure

### Navbar
- Fixed position, white background
- Height: 72px
- Subtle bottom shadow
- Steel Blue text and accents

### Footer
- Steel Blue gradient background (`#153660` → `#0A1628`)
- Gold accent stripe at top
- White text with good contrast

### Admin Sidebar
- Dark Steel Blue gradient (`#0F2544` → `#0A1628`)
- Gold indicators for active state
- 260px width (72px collapsed on tablet)

---

## ✅ Design Do's and Don'ts

### ✅ DO
- Use subtle shadows for depth
- Keep animations fast and smooth (200-300ms)
- Use Steel Blue for trust and authority
- Use Gold sparingly for CTAs
- Maintain consistent spacing
- Use Inter font for all text

### ❌ DON'T
- Use flashy gradients or neon colors
- Add unnecessary animations
- Use overly rounded corners (>16px)
- Mix too many colors
- Use heavy shadows
- Override the design system tokens

---

## 📁 File Structure

```
frontend/src/
├── styles/
│   └── design-system.css    # Core design tokens
├── index.css                 # Global styles
├── components/
│   ├── layout/
│   │   ├── Navbar.css       # Navigation styling
│   │   └── Footer.css       # Footer styling
│   ├── admin/
│   │   └── AdminLayout.css  # Admin dashboard
│   └── ProductCard.css      # Product cards
└── pages/
    ├── Home.css             # Home page
    ├── Products.css         # Products listing
    ├── ProductDetail.css    # Product detail
    ├── Auth.css             # Login/Register
    ├── About.css            # About page
    ├── Contact.css          # Contact page
    └── user/
        ├── Cart.css         # Cart page
        └── Checkout.css     # Checkout page
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-02 | Complete visual redesign - Steel Blue corporate theme |
| 1.0.0 | Initial | Purple/Violet theme |

---

*This design guide is maintained by the development team. For questions or updates, contact the design lead.*
