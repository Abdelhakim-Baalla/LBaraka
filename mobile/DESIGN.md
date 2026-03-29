# Design System Specification: Architectural Precision & Tonal Depth

## 1. Overview & Creative North Star
### The Creative North Star: "The Architectural Sanctuary"
This design system is not a mere collection of components; it is an editorial environment designed to feel like a high-end physical space—a digital sanctuary that balances the weight of tradition with the precision of future-facing technology. 

We break the "template" look by eschewing standard borders and rigid grids in favor of **Tonal Layering**. By using the Deep Baraka Green as our foundational anchor and Crisp White as our canvas, we create a UI that feels "carved" rather than "pasted." Our aesthetic relies on intentional asymmetry, generous whitespace, and a high-contrast scale that commands authority while remaining approachable.

---

## 2. Colors & Surface Philosophy
The palette is built on the interplay between the deep, verdant tones of the earth and the ethereal quality of precious metals.

### The "No-Line" Rule
**Designers are strictly prohibited from using 1px solid borders for sectioning.** 
In this system, boundaries are defined by light and shadow, not lines. To separate content:
- Use background color shifts: Place a `surface-container-low` section against a `surface` background.
- Use spacing: Let whitespace (using our `16` or `20` spacing tokens) act as the primary structural divider.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked physical materials. 
- **The Base:** Use `surface` (#f8f9fa) for the primary application background.
- **The Inset:** Use `surface-container-low` to create "wells" for secondary content.
- **The Lift:** Use `surface-container-lowest` (#ffffff) for primary cards to make them appear to float naturally above the base.

### The "Glass & Gradient" Rule
To elevate the "technologically advanced" voice, use **Glassmorphism** for floating elements (modals, dropdowns, navigation bars). 
- **Effect:** 60% opacity of `surface-container-lowest` with a `24px` backdrop blur.
- **Signature Textures:** Use a subtle linear gradient from `primary` (#012d1d) to `primary_container` (#1b4332) for Hero sections and primary CTAs to add "soul" and depth.

---

## 3. Typography: The Editorial Voice
We use **Outfit** as our primary typographic engine. Its geometric clarity reflects precision engineering, while its open apertures maintain a sense of community warmth.

- **Display (Outfit Bold):** Used for "Hero" moments. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an authoritative, editorial impact.
- **Headlines (Outfit SemiBold):** High-contrast hierarchy. Use `headline-lg` (2rem) for section titles.
- **Body (Outfit Regular):** Use `body-lg` (1rem) for readability. Ensure a line height of at least 1.6 to maintain the "premium" airy feel.
- **Labels (Outfit Medium):** Use `label-md` (0.75rem) in all-caps with increased letter-spacing (+0.05em) for small metadata or overlines.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to hide poor layout; we use them to mimic ambient light.

- **The Layering Principle:** Depth is achieved by "stacking." A `primary-container` card should sit atop a `surface-container-low` background to create a sophisticated, low-contrast lift.
- **Ambient Shadows:** When a float is required (e.g., a high-end modal), use an extra-diffused shadow: `0px 24px 48px rgba(0, 33, 20, 0.08)`. Note the tint: we use a fraction of the `on-primary-fixed` color rather than pure black to keep the shadow "organic."
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components: Precision Engineered
All components follow the `md` (0.75rem / 12px) corner radius to strike the balance between "sharp professional" and "modern friendly."

### Buttons
- **Primary:** `primary_container` background with `on_primary` text. No border. Use a subtle `secondary` (Gold) 2px bottom-glow on hover.
- **Secondary (The Metallic Accent):** `surface_container_highest` background with a `secondary` (Champagne Gold) `label-md` text.
- **Tertiary:** Pure text with an underline that appears only on hover.

### The Baraka Card
Forbid divider lines. Separate the header from the body using a `3.5rem` (spacing-10) vertical gap or a subtle shift from `surface-container-lowest` to `surface-container-low` for the card footer.

### Input Fields
- **Styling:** Use a "minimalist well" approach. Background should be `surface-container-high` with a 12px radius. 
- **Focus State:** The background shifts to `white` and a 1px "Ghost Border" of `primary` appears at 20% opacity.

### Navigation (The Glass Bar)
The top navigation must be a glassmorphic layer. Use `surface_container_lowest` at 70% opacity with a `blur-xl` effect. This allows the Deep Baraka Green of hero sections to bleed through as the user scrolls, creating a sense of continuity.

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetrical margins. Offsetting a headline to the left while keeping body text centered in a wider column creates a custom, editorial feel.
- **Do** lean into the Metallic Accents. Use the Gold (`secondary`) sparingly—only for high-value micro-interactions like a successful checkmark or a premium badge.
- **Do** prioritize "Breathing Room." If a layout feels "busy," increase the spacing token by two levels (e.g., move from `8` to `12`).

### Don’t
- **Don't** use 100% black (#000000). Use `primary` or `tertiary` for dark tones to keep the palette sophisticated.
- **Don't** use standard "Drop Shadows." If you can see the edge of the shadow, it is too heavy.
- **Don't** crowd the edges. The 12px rounded corners require at least `1.4rem` (spacing-4) of internal padding to look balanced.