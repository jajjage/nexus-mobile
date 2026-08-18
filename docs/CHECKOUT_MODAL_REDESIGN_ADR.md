# Architecture Decision Record (ADR): Checkout Modal Redesign & Scroll Fix

## Context
In `nexus-mobile`, the `CheckoutModal` confirmation bottom sheet suffered from a layout overflow issue where the primary **Pay** button was partially cut off at the bottom of the screen on smaller devices. Furthermore, the transaction details lacked grouped container cards, and the error/warning states (e.g. insufficient wallet balance) did not provide a secondary `Cancel` action.

## Decisions

1. **Card-Grouped UI Architecture**:
   - Replaced flat row layouts with rounded container cards for purchase details, cashback, and total amount.

2. **Scroll & Overflow Resolution**:
   - Switched modal content container to `<BottomSheetScrollView>` with explicit safe-area bottom padding (`insets.bottom + 24`) to eliminate button truncation.

3. **Enhanced Balance & Action States**:
   - Added soft red banner notice when wallet balance is insufficient (`totalToPay > walletBalance`).
   - Added dual action buttons: primary `Pay ₦[Amount]` / `🚫 Insufficient Balance` and secondary `Cancel` outline button.

4. **Contextual Header Icons**:
   - Contextual header icon badge and title corresponding to `productType` (Airtime, Data, Subscription/Bill).

## Status
Approved via `/grill-with-docs` session. Ready for execution.
