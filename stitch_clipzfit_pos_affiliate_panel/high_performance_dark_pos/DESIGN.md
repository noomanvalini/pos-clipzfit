---
name: High-Performance Dark POS
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0c0f0e'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2a'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c8c8b1'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3130'
  outline: '#91927d'
  outline-variant: '#474836'
  surface-tint: '#c2cf46'
  primary: '#effe6f'
  on-primary: '#2e3300'
  primary-container: '#d3e156'
  on-primary-container: '#5a6300'
  inverse-primary: '#5b6400'
  secondary: '#ffb4ab'
  on-secondary: '#690005'
  secondary-container: '#8b1916'
  on-secondary-container: '#ff9a8e'
  tertiary: '#eff4ff'
  on-tertiary: '#003257'
  tertiary-container: '#bddaff'
  on-tertiary-container: '#0061a0'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#deec60'
  primary-fixed-dim: '#c2cf46'
  on-primary-fixed: '#1a1d00'
  on-primary-fixed-variant: '#444b00'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#8b1916'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9dcaff'
  on-tertiary-fixed: '#001d35'
  on-tertiary-fixed-variant: '#00497b'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is engineered for high-velocity financial environments and affiliate management. It prioritizes clarity, speed of recognition, and a distraction-free user experience.

The visual style is **Corporate Modern with a Functional Edge**. It leverages a deep, monochromatic foundation to make action-oriented colors pop with high intentionality. By utilizing a "dark-first" approach, we reduce eye strain for power users who manage transactions and data-heavy dashboards for extended periods. The aesthetic is clean and objective, removing unnecessary decorative flourishes in favor of information density and logical hierarchy.

**Key Principles:**
- **Objective:** Every element serves a functional purpose; if it doesn't aid the user's workflow, it is removed.
- **High-Performance:** Visual cues for success, alert, and navigation are instantaneous and unambiguous.
- **Distraction-Free:** Generous use of tonal separation instead of heavy lines to keep the focus on data.

## Colors

The palette is built upon a deep "Obsidian" base to ensure maximum contrast for the functional colors. 

- **Primary (Acid Green):** Reserved exclusively for positive actions, "Add" functions, and success states. It represents growth and completion.
- **Secondary (Coral Red):** Used for destructive actions, errors, and critical alerts. Its high visibility ensures users pause before making permanent changes.
- **Accessory Colors:** Blue and Yellow are utilized for informative tagging, secondary data visualizations, and pending states, providing a clear distinction from the primary action colors.
- **Neutral:** The paper-white neutral is used for primary typography and essential icons to maintain a crisp, readable interface against the dark background.

## Typography

This design system uses a dual-font strategy to balance modern aesthetics with technical precision. 

**Geist** is the primary typeface for all UI elements, headings, and body text. Its clean, geometric sans-serif structure provides excellent readability and a contemporary "developer-centric" feel that aligns with high-performance software.

**JetBrains Mono** is utilized for labels, data points, transaction IDs, and currency values. The monospaced nature of this font ensures that columns of numbers align perfectly in tables and POS receipts, aiding in rapid visual scanning of financial data.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. We utilize a strict 4px baseline shift to ensure all elements align to a consistent rhythm.

- **POS Efficiency:** On the POS interface, we use a condensed spacing model (8px gutters) to maximize the "above the fold" content, allowing more items and checkout details to be visible simultaneously.
- **Affiliate Dashboards:** Use a standard 16px gutter to provide breathing room for complex data visualizations and charts.
- **Mobile Reflow:** In mobile views, sidebar navigation collapses into a bottom bar or a simplified "hamburger" to prioritize the active transaction or data view.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layering** rather than traditional shadows. This avoids "muddy" interfaces and maintains the clean, objective aesthetic.

- **Level 0 (Background):** #0D1117 - The base canvas.
- **Level 1 (Cards/Sidebar):** #161B22 - Surfaces that sit directly on the background.
- **Level 2 (Modals/Popovers):** #21262D - Higher elevation surfaces, often accompanied by a subtle 1px border (#30363D) to define edges.
- **Interactions:** Hover states are indicated by a slight lightening of the surface color or the addition of a subtle outer glow using the primary color at 10% opacity.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness approach. This strikes a balance between the precision of sharp corners and the approachability of rounded UI.

- **Standard Elements:** Buttons, input fields, and small chips use a 4px (0.25rem) radius.
- **Containers:** Large cards and dashboard widgets use a 8px (0.5rem) radius for a slightly softer structural feel.
- **Icons:** Use a consistent 2px stroke weight with slight rounding on terminals to match the font characteristics of Geist.

## Components

### Buttons
- **Primary:** Background #D3E156, Text #0D1117. High contrast for "Complete Sale" or "Submit."
- **Secondary:** Transparent background, 1px border #FAFAF9, Text #FAFAF9.
- **Danger:** Background #FF6E61, Text #FAFAF9. Reserved for "Void" or "Delete."

### Input Fields
Inputs use a dark fill (#0D1117) with a subtle border (#30363D). Upon focus, the border transitions to the Primary Green or Blue depending on the context. Labels are always placed above the field in **JetBrains Mono** for technical clarity.

### Chips & Badges
Small, low-profile indicators for status.
- **Status Paid:** Green text on 10% Green background.
- **Status Pending:** Yellow text on 10% Yellow background.
- **Status Canceled:** Red text on 10% Red background.

### Cards
Cards are the primary container for affiliate metrics and POS items. They use the Surface color (#161B22) and should not have shadows. Instead, use a subtle 1px border on hover to indicate interactivity.

### Data Tables
Rows have a thin #21262D bottom border. Header text is uppercase **JetBrains Mono** at 12px for a professional, spreadsheet-like precision. Alternate row striping is not required; use hover highlights instead.