# React Native Agent Withdrawal Guide

## Audience
This guide is for the mobile app team.

It covers only user-facing withdrawal flows:

- withdraw to wallet
- request withdrawal to bank
- show bank withdrawal history

It does not include admin panel flows.

---

## 1. Core Rule

There are two withdrawal methods:

1. `wallet`
   The commission withdrawal is completed immediately and the user wallet is credited.

2. `bank`
   The app creates a bank withdrawal request for admin review.
   The request can move through:
   `pending -> processing -> success`
   or `pending -> processing -> failed`

Important:

- the commission balance is deducted only when admin marks the bank request as `success`
- a pending bank request does not lock the funds on the backend

### Migration note

This is a contract change from the older agent withdrawal flow.

Older mobile implementations may still send:

```json
{
  "amount": 500
}
```

That older payload is no longer enough for the new feature.

Mobile should now explicitly send one of:

- `method: "wallet"`
- `method: "bank"`

So the frontend should move away from a single generic `withdrawCommission(amount)` API shape and replace it with two clear actions:

- `withdrawToWallet(...)`
- `requestBankWithdrawal(...)`

---

## 2. Endpoints Used By Mobile

- `GET /api/v1/dashboard/agent/available-balance`
- `POST /api/v1/dashboard/agent/withdraw`
- `GET /api/v1/dashboard/agent/bank-withdrawals?page=1&limit=20&status=pending`

All endpoints require the normal authenticated user token flow.

### Updated `POST /withdraw` contract

`POST /api/v1/dashboard/agent/withdraw` is now a polymorphic endpoint.

The request body changes based on the selected method:

- wallet withdrawal body
- bank withdrawal request body

The app should not assume a single fixed request/response shape anymore.

---

## 3. Recommended screens

- `WithdrawMethodSheet`
- `WithdrawToWalletScreen`
- `WithdrawToBankScreen`
- `BankWithdrawalHistoryScreen`

Recommended dashboard cards:

- available balance
- withdraw button
- pending bank withdrawals count

---

## 4. API Layer

```ts
// src/services/agentWithdrawalApi.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

async function apiRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

export const AgentWithdrawalApi = {
  availableBalance: () =>
    apiRequest('/api/v1/dashboard/agent/available-balance'),

  withdrawToWallet: (amount: number, specificCommissionIds?: string[]) =>
    apiRequest('/api/v1/dashboard/agent/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        method: 'wallet',
        amount,
        specificCommissionIds,
      }),
    }),

  requestBankWithdrawal: (payload: {
    amount: number;
    bankName: string;
    bankCode?: string;
    accountName: string;
    accountNumber: string;
    narration?: string;
    requestNotes?: string;
    specificCommissionIds?: string[];
    metadata?: Record<string, unknown>;
  }) =>
    apiRequest('/api/v1/dashboard/agent/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        method: 'bank',
        ...payload,
      }),
    }),

  bankWithdrawals: (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'processing' | 'success' | 'failed';
  }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.status) search.set('status', params.status);

    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiRequest(`/api/v1/dashboard/agent/bank-withdrawals${suffix}`);
  },
};
```

### Recommended request types

```ts
type AgentWithdrawalMethod = 'wallet' | 'bank';

type WalletWithdrawalRequest = {
  method: 'wallet';
  amount: number;
  specificCommissionIds?: string[];
};

type BankWithdrawalRequest = {
  method: 'bank';
  amount: number;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string;
  requestNotes?: string;
  specificCommissionIds?: string[];
  metadata?: Record<string, unknown>;
};

type AgentWithdrawalRequest =
  | WalletWithdrawalRequest
  | BankWithdrawalRequest;
```

### Recommended response handling

Because the endpoint now supports two paths, mobile should not assume both methods behave identically:

- wallet path:
  immediate success path, wallet credit expected
- bank path:
  request submission path, admin review expected

Keep the success messaging, cache invalidation, and follow-up navigation different for each method.

---

## 5. Wallet withdrawal flow

### Request body

```json
{
  "method": "wallet",
  "amount": 500
}
```

### Optional targeted request

```json
{
  "method": "wallet",
  "amount": 500,
  "specificCommissionIds": ["commission-id-1", "commission-id-2"]
}
```

### Success behavior

- show toast: `Withdrawal sent to wallet`
- refetch:
  - available balance
  - agent stats
  - commissions list
  - wallet balance / wallet transactions if shown in app

### Suggested success UI copy

`Your commission has been moved to your wallet successfully.`

---

## 6. Bank withdrawal request flow

### Request body

```json
{
  "method": "bank",
  "amount": 500,
  "bankName": "Access Bank",
  "bankCode": "044",
  "accountName": "John Agent",
  "accountNumber": "0123456789",
  "narration": "Weekly commission payout",
  "requestNotes": "Please process before Friday"
}
```

### Required fields

- `amount`
- `bankName`
- `accountName`
- `accountNumber`

### Success behavior

- show toast: `Bank withdrawal request submitted`
- navigate to history screen or open success sheet
- refetch bank withdrawal history
- optionally refetch available balance, but remember it may stay unchanged until admin marks success

### Suggested helper text

`This request will be reviewed by admin. Your commission balance is deducted only after the transfer is completed successfully.`

---

## 7. Bank withdrawal history flow

### Request

```http
GET /api/v1/dashboard/agent/bank-withdrawals?page=1&limit=20
```

### Response shape

```json
{
  "success": true,
  "message": "Agent bank withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "uuid",
        "amount": 500,
        "status": "pending",
        "bankName": "Access Bank",
        "bankCode": "044",
        "accountName": "John Agent",
        "accountNumber": "0123456789",
        "narration": "Weekly commission payout",
        "requestNotes": "Please process before Friday",
        "adminNotes": null,
        "failureReason": null,
        "requestedAt": "2026-04-19T12:00:00.000Z",
        "processedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "statusCode": 200
}
```

### Recommended list item design

- amount
- bank name
- masked account number
- request date
- status badge
- admin notes if present
- failure reason if present

### Recommended status presentation

- `pending`: Waiting for review
- `processing`: Being processed
- `success`: Paid successfully
- `failed`: Not completed

---

## 8. Example screen logic

```ts
async function submitWalletWithdrawal(amount: number) {
  await AgentWithdrawalApi.withdrawToWallet(amount);
  await Promise.all([
    AgentWithdrawalApi.availableBalance(),
    refreshAgentStats(),
    refreshCommissions(),
  ]);
}

async function submitBankWithdrawal(form: {
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  narration?: string;
  requestNotes?: string;
}) {
  await AgentWithdrawalApi.requestBankWithdrawal(form);
  await Promise.all([
    AgentWithdrawalApi.bankWithdrawals({ page: 1, limit: 20 }),
    AgentWithdrawalApi.availableBalance(),
  ]);
}
```

---

## 9. Recommended UX

### Withdraw method selector

Show two actions:

- `Withdraw to Wallet`
- `Request Bank Transfer`

### Wallet method UX

- fastest path
- minimal form
- amount input only

### Bank method UX

- amount input
- bank name
- account name
- account number
- optional narration
- optional request note

### History screen UX

- newest first
- filter chips for:
  - all
  - pending
  - processing
  - success
  - failed

---

## 10. Validation

Validate before request:

- `amount > 0`
- `amount <= current displayed available balance`
- `bankName` required for bank method
- `accountName` required for bank method
- `accountNumber` required for bank method

Recommended product rules on mobile:

- trim all string fields
- prevent spaces in account number
- keep account number keyboard numeric

---

## 11. Error handling

Possible messages to surface:

- `Amount must be greater than 0`
- `Method must be wallet or bank`
- `Bank name is required`
- `Account name is required`
- `Account number is required`
- `Insufficient available commission balance`
- `No available commissions found for withdrawal`

Recommended behavior:

- show inline validation for form issues
- show toast for server-side rejection
- leave the form populated after failure so the user can retry
- if the bank request succeeds, do not show wallet-style success copy

---

## 12. Frontend migration checklist

When implementing this feature in the React Native app, update all of the following:

1. service layer
   Replace the old single withdrawal helper with:
   - `withdrawToWallet`
   - `requestBankWithdrawal`
   - `bankWithdrawals`

2. request types
   Replace the old `{ amount }` request type with method-aware request types.

3. UI flow
   Replace the old one-step modal with:
   - withdraw method selector
   - wallet withdrawal form
   - bank withdrawal form

4. cache refresh
   Wallet method should refresh wallet data immediately.
   Bank method should refresh request history and agent data, but may not reduce displayed balance until backend marks success.

5. status UX
   Bank requests need list/history UI with status badges and failure/admin notes.

---

## 13. Recommended mobile copy

Wallet CTA:

`Move to Wallet`

Bank CTA:

`Request Bank Transfer`

Wallet helper text:

`Receive this withdrawal instantly in your app wallet.`

Bank helper text:

`Submit this payout for admin processing.`

Pending helper text:

`Your payout request has been submitted and is waiting for review.`

Processing helper text:

`Your payout request is currently being processed.`

Failed helper text:

`This payout was not completed. Review the reason and submit a new request if needed.`
