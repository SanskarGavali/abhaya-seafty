# Abhaya V1.0.001 — Visual redesign plan

## Goal
Restyle the existing application to match the approved anime/cherry-blossom references while keeping every route, handler, query, upload, location flow, call action, and backend integration unchanged.

## Visual system
- Use the supplied Abhaya logo unchanged wherever the current brand mark appears.
- Use the supplied female-with-shield artwork as optimized, shared background imagery with layered dimming and contrast protection.
- Apply a cohesive purple, pink, magenta, and white glassmorphism system: frosted surfaces, subtle light borders, compact rounded corners, soft shadows, glow, and premium serif/sans typography.
- Maintain touch targets, safe-area spacing, readable contrast, fixed bottom navigation, reduced-motion support, and responsive layouts.

## Implementation
1. Add the approved background artwork through the project asset flow and reuse it across screens without repeated downloads.
2. Update global presentation tokens and shared shell styles only: page backgrounds, glass surfaces, controls, cards, typography, motion, and mobile spacing.
3. Restyle shared presentation components: header, logo treatment, bottom navigation, quick-access tiles, location permission panels, and reusable informational sections.
4. Match the reference composition on Home, Safe Places, and Report & Guidance while retaining their existing elements and event handlers.
5. Extend the same visual system to authentication, onboarding, Learn, Profile, SOS, Evidence Vault, Video Evidence, safety guides, contacts, live location, settings, notifications, and all other existing content screens.
6. Add unique route metadata where any existing content screen is missing the required title/description/social tags, without changing behavior.

## Functional protection
- No changes to the backend, schema, storage, authentication, environment variables, APIs, routes, dependencies, or business logic.
- Existing links, buttons, forms, calls, SOS behavior, location refresh, safe-place creation/search/filtering, reports, uploads, and evidence workflows remain connected to their current handlers.
- The redesign will not add new features or placeholder actions.

## Verification
- Confirm the app builds cleanly and has no runtime or console errors.
- Test public startup/auth screens and authenticated navigation on mobile and desktop.
- Exercise Home/SOS, Safe Places location-refresh/add/search/filter/map actions, emergency calling links, Report expand/call actions, Evidence Vault, Video Evidence, forms, and existing route access.
- Visually inspect mobile screenshots for readable text, unobstructed controls, bottom-navigation clearance, and consistent artwork treatment.
