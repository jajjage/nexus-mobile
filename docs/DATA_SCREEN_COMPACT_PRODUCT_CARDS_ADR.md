# Architecture Decision Record (ADR): Ultra-Compact Data Cards & Instant 1-Tap Checkout

## Context
In `nexus-mobile` (`app/data.tsx`), data plan product cards were oversized (110px+ height), requiring excessive scrolling. Selecting a plan required a 2-step process (tap card -> tap bottom "Select a Plan" button), introducing perceived latency and wasting vertical screen space.

## Decisions

1. **Ultra-Compact Product Cards (`ProductCard.tsx`)**:
   - Compact card height (~75px) with 8px-10px padding.
   - Streamlined layout: Plan title at top, prominent bold price (`#0284C7`), validity subtext at bottom, and top-right checkmark `✓` badge when selected.
   - Active press scale feedback (`scale(0.97)`) for 0ms perceived touch response.

2. **Removal of Redundant Bottom Bar (`app/data.tsx`)**:
   - Removed the fixed bottom `Balance` + `Select a Plan` bar completely, reclaiming vertical real estate.

3. **Instant 1-Tap Checkout**:
   - Tapping a product card immediately launches the Checkout Modal sheet if a valid phone number is entered.
   - If phone number is empty, auto-focuses the phone number input field.

## Status
Approved via `/grill-with-docs` and `/emil-design-eng` session. Ready for execution.
