# 🎨 Wordspy — Design System

## Philosophy

**Simple. Warm. Native.**

Wordspy uses Claude's native color palette — a warm coral on clean off-white — with minimal decoration. Every screen has one clear action. No noise, no distractions. Feels like a premium mobile app, not a party game website.

---

## Color Palette

```
Primary (Coral)
  coral:        #CC785C   — primary actions, active states, highlights
  coralLight:   #E8956D   — gradient end, hover states
  coralBg:      #FFF8F5   — light coral background for cards/banners
  coralBorder:  #CC785C30 — subtle coral borders

Neutrals
  black:   #1A1A1A   — headings, primary text
  grey1:   #555555   — body text
  grey2:   #888888   — secondary text, descriptions
  grey3:   #AAAAAA   — labels, placeholders, timestamps
  grey4:   #CCCCCC   — disabled states, dividers
  border:  #F0F0F0   — card borders, dividers
  bg:      #FAFAF8   — page background (warm white)
  white:   #FFFFFF   — card backgrounds

Semantic
  green:   #16A34A / bg: #F0FDF4  — Civilian role, success, survived
  red:     #DC2626 / bg: #FEF2F2  — eliminated, danger, error
  yellow:  #CA8A04 / bg: #FEF9C3  — Ghost role, warnings, tie-breaker
```

---

## Typography

**Font:** DM Sans (Google Fonts)
- Weights: 300, 400, 500, 600, 700, 800
- Why: Geometric, modern, excellent legibility at small sizes, pairs warmth with precision

```
Display headings:   800 weight, -1.5px letter-spacing
Section headings:   700 weight, -0.5px letter-spacing  
Body text:          400-500 weight, 1.5-1.6 line-height
Labels/caps:        700 weight, +1.2px letter-spacing, uppercase, 11-12px
```

---

## Spacing

8px base unit. Most values are multiples of 4 or 8.

```
4px   — tight gaps (icon + text)
8px   — small gaps (list items, tag spacing)
12px  — standard inner padding
14px  — card content
16px  — section gaps
20px  — page padding (horizontal)
24px  — generous card padding
32px  — section separation
48px  — hero areas
```

---

## Components

### Logo
```tsx
<Logo size="sm" | "md" | "lg" />
```
W mark in coral gradient + "Wordspy" wordmark. Always appears in top bar.

### Button
```tsx
<Btn variant="primary">Create Room</Btn>
<Btn variant="ghost">Cancel</Btn>
<Btn variant="danger">Eliminate</Btn>
<Btn variant="warning">Ghost Guess</Btn>
<Btn variant="secondary">Back</Btn>
```
- Primary: coral gradient with shadow
- All variants have `whileTap={{ scale: 0.97 }}` via Framer Motion
- Use `fullWidth` prop to stretch to container

### Card
```tsx
<Card style={{}}>content</Card>
```
White background, 20px border-radius, 1.5px border, soft shadow.

### Badge
```tsx
<Badge color={tokens.green}>🎭 Civilian</Badge>
```
Inline pill. Color tints the background and text.

### RoleBadge
```tsx
<RoleBadge role="civilian" | "undercover" | "ghost" />
```
Pre-configured badge for each role with correct color and emoji.

### Toggle
```tsx
<Toggle value={bool} onChange={(v) => set(v)} />
```
iOS-style toggle in coral when active.

### Avatar
```tsx
<Avatar name="Rahul" size={40} active={true} eliminated={false} />
```
Letter avatar. Coral when active, muted when eliminated.

### InfoBox
```tsx
<InfoBox icon="💡" title="Tip title" body="Body text here" color={tokens.coral} />
```
Tinted info banner. Used for rules hints, status messages.

### TopBar
```tsx
<TopBar title="Clue Phase" sub="Round 1" showLogo right={<button>💬</button>} />
```
Sticky top navigation bar with logo and optional title/subtitle.

---

## Screen Layout

Every screen follows this pattern:

```
┌──────────────────────┐
│  TopBar (sticky)     │
├──────────────────────┤
│                      │
│  Page content        │
│  (16px horizontal    │
│   padding)           │
│                      │
│  Cards stacked       │
│  vertically with     │
│  16px gap            │
│                      │
│  Primary CTA button  │
│  always at bottom    │
│                      │
└──────────────────────┘
```

Max width: 480px, centered. Designed for mobile-first but works on desktop.

---

## Animations

All animations via **Framer Motion**:

```tsx
// Fade up on mount (staggered)
{ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay } }

// Card spring reveal
{ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: "spring" } }

// Button tap feedback
whileTap={{ scale: 0.97 }}

// List item stagger
transition: { delay: index * 0.04 }
```

---

## Role Color Mapping

| Role | Color | Emoji | Usage |
|---|---|---|---|
| Civilian | `#16A34A` (green) | 🎭 | Survived, won, good state |
| Undercover | `#CC785C` (coral) | 🕵️ | Infiltrator, caught |
| Ghost | `#CA8A04` (yellow) | 👻 | Wild card, last chance |

---

## Responsive Behavior

- Base: mobile (375px+)
- Max container: 480px centered
- All inputs/buttons full-width on mobile
- Touch targets minimum 44px height
- No hover-only interactions — all interactive via tap
