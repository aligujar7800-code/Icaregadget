# Antigravity Skill — icaregadget Website Animation

## Purpose
Create a polished, restrained animation system for the responsive icaregadget ecommerce website. This skill complements the homepage layout skill and applies to mobile, tablet, and desktop/PC. Preserve the site's premium black, white, light-gray, and orange visual identity.

Motion should support browsing and shopping—not distract from products or slow down actions.

## 1. Motion Style
- Premium, minimal, smooth, precise, and lightweight.
- Use short transitions and small movement distances.
- Prefer `transform` and `opacity`.
- Avoid excessive bounce, spin, parallax, animated gradients, glow, flashing, and constant motion.
- Every animation should communicate hierarchy, feedback, or a state change.
- Content and controls must remain usable if animation does not run.

## 2. Motion Tokens
Define shared timing/easing values:

```css
:root {
  --motion-fast: 140ms;
  --motion-standard: 220ms;
  --motion-slow: 420ms;
  --motion-reveal: 560ms;
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Guidelines:
- Icon/button feedback: 120–180ms
- Cards/navigation: 180–280ms
- Section reveals: 350–600ms
- Keep shopping actions immediate; never delay a cart action for decoration.

## 3. Page Entrance
Use a restrained entrance sequence:
1. Header appears quickly.
2. Hero eyebrow and heading fade/slide into place.
3. Supporting copy and CTA follow with a small stagger.
4. Hero product visual fades in with a slight upward movement or scale.
5. Lower sections reveal as they enter the viewport.

Suggested effect: opacity 0→1 and translateY 12–16px→0. Use a short stagger (about 50–90ms), not a long cinematic sequence. Avoid typing effects and large zooms.

Example:

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-copy > * {
  animation: fade-up 520ms var(--ease-enter) both;
}
```

Adapt selectors to the existing project rather than copying blindly.

## 4. Hero Motion
### Mobile
- Use a simple vertical reveal.
- Keep the heading readable and CTA immediately usable.
- Do not use parallax or scroll-linked movement that can cause jank.

### Desktop/PC
- Copy may fade upward while the product visual fades in with a slight horizontal movement.
- Keep the two sides coordinated and restrained.
- Do not continuously rotate or float the product image. Any idle motion must be almost imperceptible and disabled for reduced-motion users.

## 5. Scroll Reveals
Suitable sections:
- Trust benefits
- Category cards
- Best sellers
- Visit-the-shop card
- Optionally the footer

Use opacity and a small vertical offset, around 12px. Trigger once when the section enters view. A small stagger between cards is acceptable. Do not hide content indefinitely if JavaScript or an observer fails. Avoid animating every text node separately.

Use an existing project animation library if available; otherwise use CSS and `IntersectionObserver` where appropriate.

## 6. Category Cards
Desktop hover:
- Lift by roughly 2–4px.
- Slightly adjust background/border contrast.
- Move the arrow right by 2–3px.
- Transition in about 180–240ms.

Touch:
- Provide a brief pressed state.
- Never require hover to reveal labels or controls.
- Avoid sticky hover states after tapping.

## 7. Product Cards
Desktop hover:
- Optional image scale up to about 1.03.
- Optional card lift by 2–3px.
- Keep the product centered and unclipped.
- Do not tilt or dramatically zoom products.

Sale badge:
- Keep static. No pulsing or flashing.

Add-to-cart:
- Slight hover scale (e.g. 1→1.05).
- Brief press scale (e.g. 1→0.94→1).
- Provide visible focus styling.
- On success, show a concise state change such as a check icon or cart count update.
- Feedback must reflect actual cart state; never show success before the action succeeds.

## 8. Buttons and Links
Primary orange CTA:
- Slightly darken on hover.
- Use a restrained pressed state.
- Keep a visible keyboard focus ring.

Secondary links:
- Use a subtle underline or color transition.
- Links must remain recognizable without hover.

Directions button:
- Optional tiny location-icon movement on hover.
- No continuous icon animation.

## 9. Header and Panels
Mobile menu:
- Short slide/fade when opening and closing.
- Provide a clear close control.
- Prevent background scrolling if using a modal drawer.
- Support Escape where appropriate.
- Move focus into the menu and return focus to the trigger when closed.

Desktop navigation:
- Subtle underline/color transitions.
- Dropdowns should open predictably without large, distracting motion.

Search/cart panels:
- Use a short fade/slide.
- Keep controls responsive and avoid animating the whole page.

## 10. Cart Feedback
- Cart count may use a tiny fade/scale when its value changes.
- A toast may enter with a short fade-up.
- A cart drawer may slide in from the side on desktop and use a suitable full-height panel on mobile.
- Do not block continued shopping for decorative animation.
- Do not imply success if the cart operation fails.

## 11. Responsive Behavior
### Mobile
Prioritize fast tap feedback, simple reveals, and low-motion scrolling. No hover dependency, scroll hijacking, auto-moving carousels, or heavy parallax.

### Tablet
Use touch-friendly behavior. If the device has no hover capability, behave like mobile.

### Desktop/PC
Use subtle hover lifts, arrow shifts, image scale, and section reveals. Hover effects must not be essential to understanding or using the interface.

## 12. Accessibility and Reduced Motion
Respect the user's motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Also:
- Never make essential information animation-only.
- Avoid flashing and rapid pulsing.
- Keep focus indicators visible.
- Prevent layout shifts.
- Use the animation library's reduced-motion support if applicable.

## 13. Performance
- Prefer `transform` and `opacity`.
- Avoid animating width, height, top, left, margins, or large shadows.
- Do not apply `will-change` globally.
- Avoid heavy blur/backdrop-filter animation.
- Avoid expensive scroll listeners.
- Do not add a large animation dependency for a handful of simple transitions.
- Test smoothness on mid-range mobile devices.

## 14. Animation Map

| Element | Motion | Trigger | Intensity |
|---|---|---|---|
| Header | Short fade/slide | Initial load | Low |
| Hero text | Fade-up / subtle line reveal | Initial load | Low–medium |
| Hero visual | Fade + slight scale/translate | Initial load | Low |
| Trust row | Section reveal | Scroll into view | Low |
| Category cards | Small staggered reveal | Scroll into view | Low |
| Category arrow | Tiny horizontal shift | Desktop hover | Low |
| Product image | Tiny scale | Desktop hover | Very low |
| Add button | Scale feedback | Hover/press | Low |
| Store CTA | Fade-up | Scroll into view | Low |
| Mobile menu | Slide/fade | Open/close | Medium |
| Cart panel | Slide/fade | Open/close | Medium |
| Cart count | Tiny fade/scale | State update | Low |

## 15. Antigravity Implementation Steps
1. Inspect the codebase, framework, and existing animation dependencies.
2. Reuse existing motion utilities when possible.
3. Do not rewrite the homepage or duplicate components.
4. Add shared motion tokens/utilities.
5. Apply motion to the existing responsive components.
6. Ensure content is visible if entrance scripts fail.
7. Verify mobile, tablet, and desktop behavior separately.
8. Test reduced-motion settings and keyboard navigation.
9. Check for layout shifts, overflow, clipping, and interaction delays.
10. Keep animation code maintainable and easy to tune.

Suggested reusable pieces, only where useful:
- `Reveal`
- `AnimatedCategoryCard`
- `AnimatedProductCard`
- `MobileMenu`
- `CartDrawer`

Use CSS transitions for simple interactions rather than creating unnecessary wrappers.

## 16. QA Checklist
- [ ] Motion feels premium and restrained.
- [ ] Main navigation and shopping actions are immediately usable.
- [ ] Hero text and product visual feel coordinated.
- [ ] Category and product hover states are subtle.
- [ ] Touch works without hover.
- [ ] Product imagery is not clipped.
- [ ] Cart feedback reflects real application state.
- [ ] Menus/panels open and close smoothly.
- [ ] Focus handling and keyboard access work.
- [ ] Reduced-motion preference is respected.
- [ ] No horizontal overflow or layout shift.
- [ ] Performance remains smooth on mobile.

## Non-Goals
Do not add constant floating products, dramatic parallax, auto-scrolling, typing effects, glowing gradients, pulsing sale badges, excessive page transitions, or animations that delay shopping.

## Final Instruction
Implement a cohesive responsive animation system for icaregadget. The site should feel alive when users interact with it, but calm while they browse. Keep the products, content, and shopping actions as the primary focus on mobile, tablet, and PC.
