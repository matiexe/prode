---
name: Unity 26
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c5c6d0'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#8e9099'
  outline-variant: '#44474f'
  surface-tint: '#b1c6f9'
  primary: '#b1c6f9'
  on-primary: '#192f59'
  primary-container: '#001b44'
  on-primary-container: '#7084b3'
  inverse-primary: '#495e8a'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#00e476'
  on-tertiary: '#003919'
  tertiary-container: '#00230d'
  on-tertiary-container: '#00994d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b1c6f9'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#314671'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#61ff97'
  tertiary-fixed-dim: '#00e476'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  title-lg:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Anybody
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: clamp(16px, 5vw, 64px)
---

## Brand & Style

This design system captures the prestige and high-octane energy of the world's premier sporting event. The aesthetic is rooted in a **Premium Sports Broadcast** style, blending a deep, authoritative foundation with hyper-vibrant motion. It leverages a mix of **Glassmorphism** and **High-Contrast Bold** movements to create depth and urgency.

The visual narrative focuses on "The Three Nations," using geometric patterns that intersect to represent the unity of the USA, Canada, and Mexico. UI elements should feel like they are part of an augmented reality broadcast overlay—sharp, luminous, and dynamic. Key visual motifs include abstract trophy silhouettes used as structural watermarks and "dynamic light streaks" that act as directional cues for the user's eye.

## Colors

The palette is anchored by **Deep Stadium Navy** (#001B44), providing a sophisticated, nocturnal backdrop that allows accent colors to "pop" with neon-like intensity. 

- **Primary:** Deep Navy for backgrounds and structural surfaces.
- **Secondary (USA/Canada):** Bright Cyan (#00F0FF) for primary actions and "Electric" highlights.
- **Tertiary (Mexico):** Spring Green (#00FF85) for success states and secondary vibrant accents.
- **Accent Yellow:** A gold-toned yellow (#FFD700) reserved for trophy motifs, champion-tier information, and critical highlights.

Gradients are essential; use linear transitions from Cyan to Green to represent the continental flow of the host nations.

## Typography

The typographic system uses **Anybody** for all display and impactful data points. Its variable-width nature allows for a "flexing" athletic feel. Headlines should be set with tight letter-spacing to mimic sports jerseys and stadium signage.

**Lexend** is utilized for body copy to ensure maximum readability during fast-paced browsing. It maintains a geometric clarity that aligns with the brand's sharp edges. Always use uppercase for labels and navigation items to maintain a persistent "broadcast" tone.

## Layout & Spacing

The design system employs a **Fixed Grid** for desktop (12 columns) and a **Fluid Grid** for mobile (4 columns). Layouts should feel intentional and widescreen, utilizing a "letterbox" feel with generous top and bottom margins.

Spacing follows an 8px base unit, but emphasizes verticality. Use large `xl` "breathable" sections between major content blocks to emulate the scale of a football pitch. Elements should often "break" the grid slightly using absolute-positioned light streaks or geometric shards to imply movement and energy.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Luminous Layering**. Surfaces do not use traditional drop shadows; instead, they use:

1.  **Backdrop Blurs:** (20px-40px) to create a frosted glass effect over the navy background.
2.  **Inner Glows:** 1px borders with 30-50% opacity of the secondary Cyan or Tertiary Green to simulate "screen edges."
3.  **Tonal Stacking:** Higher elevation elements use a slightly lighter shade of Navy with increased transparency.
4.  **Light Streaks:** Diagonal gradients (45 degrees) that sit behind primary cards to give them a "hovering" appearance.

## Shapes

The shape language is **Soft (0.25rem)**, focusing on technical precision over friendliness. Large containers (cards, hero areas) use a signature "clipped corner" or 45-degree chamfer on one side to reinforce the geometric, architectural nature of the host stadiums. 

Buttons should be strictly rectangular or have very minimal 4px rounding to maintain a professional, high-performance aesthetic.

## Components

- **Buttons:** High-gloss finishes. Primary buttons use a vibrant Cyan-to-Green gradient with black text. Secondary buttons are "Ghost" style with a 1px luminous border.
- **Chips/Badges:** Used for match status (e.g., "LIVE", "FINAL"). Use a "Neon Pulse" animation for live events.
- **Score Cards:** Utilize a dark translucent background with a high-contrast white "Anybody" font for scores. Incorporate the trophy silhouette as a subtle 5% opacity watermark.
- **Input Fields:** Bottom-border only or fully enclosed with a dark semi-transparent fill. Focus states should trigger a "light streak" glow across the border.
- **Dynamic Scoreboard:** A specialized component for real-time data, featuring condensed typography and high-visibility color-coding for yellow/red cards.
- **Host Nation Indicators:** Small, stylized geometric flag icons that use the brand's specific shades of blue, green, and yellow rather than standard flag colors.