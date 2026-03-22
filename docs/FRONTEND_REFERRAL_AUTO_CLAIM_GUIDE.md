# Frontend Referral Auto-Claim Guide

This guide explains the current referral experience after the referral bonus flow changed from manual claiming to automatic accrual.

## What Changed

Old flow:

1. User signs up with a referral code.
2. Referred user verifies or manually claims.
3. Backend creates the referral reward split.

New flow:

1. User signs up with a referral code.
2. Backend creates the referral in `pending`.
3. Referred user completes their first successful product purchase.
4. Backend automatically creates the reward split for both users.
5. Both users can later withdraw through the existing referral withdrawal flow.

Frontend impact:

- Remove the "Claim Bonus" action from the UI.
- Do not block referral link, referral stats, or referral code validation behind account verification.
- Keep withdrawal blocked for unverified users.
- Treat `pending` as "signed up but has not completed first successful purchase yet".
- Treat `claimed` as "bonus already accrued automatically".

## Response Envelope

Most endpoints use the standard API response shape:

```ts
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  statusCode: number;
};
```

## Frontend Integration Summary

### 1. Registration and referral code capture

Support both:

- referral links like `?ref=ABC123`
- direct referral code entry in the signup form

Recommended frontend behavior:

1. Read the referral code from URL or form input.
2. Validate it before signup.
3. If valid, include `referralCode` in the signup request.
4. Show a lightweight success state like "Referral applied".

### 2. Public referral code validation

- Method: `GET`
- URL: `/api/v1/referral/code/validate?code=ABC123`
- Auth: none

Success example:

```json
{
  "success": true,
  "message": "Referral code is valid",
  "data": {
    "referrerId": "uuid",
    "message": "Code is valid and can be used for signup"
  },
  "statusCode": 200
}
```

Failure example:

```json
{
  "success": false,
  "message": "Referral code not found or inactive",
  "error": "Referral code not found or inactive",
  "statusCode": 400
}
```

Frontend notes:

- Validation is live again and no longer blocked by feature flags.
- The current response gives `referrerId`, not `referrerName`, so the UI should avoid depending on inviter-name display unless backend adds it later.
- If validation fails, let signup continue without the referral code or prompt the user to correct it.

### 3. Signup submission

When the code is valid, submit it as `referralCode` during registration.

Backend behavior:

- A referral record is created immediately at signup.
- The new referral stays in `pending`.
- No reward is created at signup.

Frontend notes:

- Do not show "bonus claimed" after signup.
- Do show copy like "Your referral bonus will unlock automatically after your first successful purchase."

## Referral Dashboard UX

Base authenticated routes:

- `/api/v1/dashboard/referrals`
- `/api/v1/dashboard/referrals/stats-v2`
- `/api/v1/dashboard/referrals/list`
- `/api/v1/dashboard/referrals/list-with-details`
- `/api/v1/dashboard/referrals/link`
- `/api/v1/dashboard/referrals/link/stats`
- `/api/v1/dashboard/referrals/available-balance-v2`
- `/api/v1/dashboard/referrals/withdraw-v2`

These routes are live again.

### 1. Get or create personal referral link

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/link`
- Auth: bearer token
- Verification required: no

Success payload:

```json
{
  "success": true,
  "message": "Referral link retrieved successfully",
  "data": {
    "referralCode": "ABC123",
    "shortCode": "ABC123",
    "referralLink": "https://your-frontend-domain/register?ref=ABC123",
    "sharingMessage": "Join me on Nexus! Use my referral code: ABC123",
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=..."
  },
  "statusCode": 200
}
```

UI recommendations:

- Show share, copy, and QR actions.
- Do not hide this page for unverified users.

### 2. Get referral link stats

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/link/stats`
- Auth: bearer token
- Verification required: no

Success payload:

```json
{
  "success": true,
  "message": "Referral link statistics retrieved successfully",
  "data": {
    "totalSignupsWithLink": 12,
    "pendingReferrals": 7,
    "claimedReferrals": 5,
    "activeReferrals": 7,
    "completedReferrals": 5
  },
  "statusCode": 200
}
```

Frontend notes:

- Prefer `pendingReferrals` and `claimedReferrals`.
- `activeReferrals` and `completedReferrals` are legacy compatibility aliases.
- Suggested labels:
  - `pendingReferrals`: "Signed up, waiting for first purchase"
  - `claimedReferrals`: "Bonus unlocked"

### 3. Get referral stats

Preferred endpoint:

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/stats-v2`
- Auth: bearer token
- Verification required: no

Suggested TypeScript contract:

```ts
type ReferralStatsV2 = {
  referrerStats: {
    totalReferralsInvited: number;
    claimedReferrals: number;
    pendingClaimReferrals: number;
    totalReferrerEarnings: number;
    pendingReferrerAmount: number;
    withdrawnReferrerAmount: number;
  };
  referredStats: {
    referrerUserId: string;
    referrerName: string;
    referralStatus: "pending" | "claimed" | "cancelled";
    totalReferredEarnings: number;
    pendingReferredAmount: number;
    withdrawnReferredAmount: number;
    claimedAt: string | null;
  } | null;
};
```

How to render the referred-user state:

- `referredStats === null`
  - User was not referred.
- `referredStats.referralStatus === 'pending'`
  - Show waiting state.
  - Example copy: "Your referral bonus will be added automatically after your first successful purchase."
- `referredStats.referralStatus === 'claimed'`
  - Show bonus unlocked state.
  - Show available or withdrawn amounts as applicable.

### 4. Remove manual claim UI

Do not render:

- "Claim Bonus" button
- claim modal
- claim-confirmation flow

Do not call:

- `POST /api/v1/dashboard/referrals/claim-v2`

Current backend behavior for that route:

- Returns `410 Gone`
- Returns message:
  - `Referral bonus is now automatic after the referred user completes their first successful purchase.`

Frontend fallback handling:

- If an older client still calls `claim-v2`, catch `410` and show a passive message telling the user the bonus is now automatic.

### 5. Referral list and history

#### Simple list

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/list?status=pending&page=1&limit=20`

#### Detailed list

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/list-with-details?status=claimed&page=1&limit=20`

Frontend notes:

- Use `pending` and `claimed` as the live status filters.
- Avoid using `active` and `completed` in new frontend code.
- Good tab labels:
  - `pending`: "Awaiting first purchase"
  - `claimed`: "Rewarded"

## Withdrawal Integration

Withdrawal flow is still valid and still separate from reward accrual.

### 1. Get available balance

- Method: `GET`
- URL: `/api/v1/dashboard/referrals/available-balance-v2?type=referrer`
- Auth: bearer token
- Verification required: no

Allowed types:

- `referrer`
- `referred`

Use cases:

- Fetch both balances and show them separately.
- Or combine them visually in UI while still withdrawing by type.

### 2. Execute withdrawal

- Method: `POST`
- URL: `/api/v1/dashboard/referrals/withdraw-v2`
- Auth: bearer token
- Verification required: yes

Request body:

```json
{
  "amount": 1000,
  "userType": "referrer"
}
```

Optional body shape:

```json
{
  "amount": 1000,
  "userType": "referred",
  "claimIds": ["claim-id-1", "claim-id-2"]
}
```

Frontend notes:

- Keep the withdraw CTA visible if you want, but disable it for unverified users.
- If backend returns `403` with `Please verify your account before withdrawing`, route the user to the verification flow.
- After successful withdrawal, refetch:
  - `stats-v2`
  - `available-balance-v2`

## Recommended Frontend State Machine

### Referred user

```ts
type ReferredReferralUiState =
  | "not_referred"
  | "waiting_for_first_purchase"
  | "bonus_accrued"
  | "withdrawal_locked_unverified";
```

Suggested mapping:

```ts
function getReferralUiState(
  referredStats: ReferralStatsV2["referredStats"],
  isVerified: boolean
): ReferredReferralUiState {
  if (!referredStats) return "not_referred";
  if (referredStats.referralStatus === "pending") {
    return "waiting_for_first_purchase";
  }
  if (!isVerified) {
    return "withdrawal_locked_unverified";
  }
  return "bonus_accrued";
}
```

### Referrer dashboard cards

Suggested cards:

- Total invites: `referrerStats.totalReferralsInvited`
- Waiting for purchase: `referrerStats.pendingClaimReferrals`
- Rewarded referrals: `referrerStats.claimedReferrals`
- Available balance: `referrerStats.pendingReferrerAmount`
- Withdrawn total: `referrerStats.withdrawnReferrerAmount`

## Suggested Copy Updates

Replace old copy:

- "Claim your referral bonus"
- "Verify to claim"
- "Referral completed after claim"

With new copy:

- "Bonus unlocks automatically after first successful purchase"
- "Your invite is pending their first purchase"
- "Referral reward added automatically"
- "Verification is only required when withdrawing referral earnings"

## Recommended Frontend Migration Checklist

1. Remove all `claim-v2` calls.
2. Remove the "Claim Bonus" button and related UI states.
3. Update referral status labels to `pending` and `claimed`.
4. Update invite stats cards to use `pendingReferrals` and `claimedReferrals`.
5. Allow authenticated but unverified users to access referral link and stats pages.
6. Keep withdrawal action gated behind verification handling.
7. Update onboarding copy and referral empty states to describe automatic reward accrual after first purchase.
8. Add `410` handling for `claim-v2` in case an old client still reaches it.

## Quick Example Integration

```ts
async function loadReferralDashboard(token: string) {
  const [
    statsRes,
    linkRes,
    linkStatsRes,
    referrerBalanceRes,
    referredBalanceRes,
  ] = await Promise.all([
    api.get("/api/v1/dashboard/referrals/stats-v2", token),
    api.get("/api/v1/dashboard/referrals/link", token),
    api.get("/api/v1/dashboard/referrals/link/stats", token),
    api.get(
      "/api/v1/dashboard/referrals/available-balance-v2?type=referrer",
      token
    ),
    api.get(
      "/api/v1/dashboard/referrals/available-balance-v2?type=referred",
      token
    ),
  ]);

  return {
    stats: statsRes.data.data,
    link: linkRes.data.data,
    linkStats: linkStatsRes.data.data,
    referrerBalance: referrerBalanceRes.data.data,
    referredBalance: referredBalanceRes.data.data,
  };
}
```

## Backend Truths the Frontend Should Assume

- A referral bonus is one-time per referred user.
- The trigger is the referred user's first successful topup purchase.
- The split is handled fully by backend.
- The frontend should never calculate or simulate the split itself.
- The frontend should treat referral accrual as event-driven backend state, then refetch and render.
