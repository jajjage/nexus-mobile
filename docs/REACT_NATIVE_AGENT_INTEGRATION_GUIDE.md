# React Native Agent Integration Guide

## Audience
This guide is for the React Native app and covers only user-facing flows:

- signup with `agentCode`
- becoming an agent
- viewing agent dashboard data
- sharing agent code
- withdrawing commission balance

It does not cover admin screens.

---

## 1. Backend Routes Used by Mobile

### Public

- `GET /api/v1/agent/code/validate?code=AGENT-ABC123`
- `POST /api/v1/auth/register`

### Authenticated User

- `POST /api/v1/dashboard/agent/account/activate`
- `GET /api/v1/dashboard/agent/account`
- `POST /api/v1/dashboard/agent/account/deactivate`
- `POST /api/v1/dashboard/agent/account/regenerate-code`
- `GET /api/v1/dashboard/agent/stats`
- `GET /api/v1/dashboard/agent/customers`
- `GET /api/v1/dashboard/agent/commissions`
- `GET /api/v1/dashboard/agent/available-balance`
- `POST /api/v1/dashboard/agent/withdraw`

### Important

- mobile signup should send `agentCode`
- do not keep using referral-based signup on mobile

---

## 2. Recommended Mobile Screens

- `SignupScreen`
- `BecomeAgentScreen`
- `AgentHomeScreen`
- `AgentCustomersScreen`
- `AgentCommissionsScreen`
- `WithdrawAgentCommissionScreen`

---

## 3. API Layer

```ts
// src/services/agentApi.ts
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

export const AgentApi = {
  validateCode: (code: string) =>
    apiRequest(`/api/v1/agent/code/validate?code=${encodeURIComponent(code)}`),

  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    agentCode?: string;
  }) =>
    apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  activate: () =>
    apiRequest('/api/v1/dashboard/agent/account/activate', {
      method: 'POST',
    }),

  account: () => apiRequest('/api/v1/dashboard/agent/account'),
  stats: () => apiRequest('/api/v1/dashboard/agent/stats'),
  customers: (page = 1, limit = 20) =>
    apiRequest(`/api/v1/dashboard/agent/customers?page=${page}&limit=${limit}`),
  commissions: (page = 1, limit = 20) =>
    apiRequest(
      `/api/v1/dashboard/agent/commissions?page=${page}&limit=${limit}`
    ),
  availableBalance: () =>
    apiRequest('/api/v1/dashboard/agent/available-balance'),
  withdraw: (amount: number) =>
    apiRequest('/api/v1/dashboard/agent/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  regenerateCode: () =>
    apiRequest('/api/v1/dashboard/agent/account/regenerate-code', {
      method: 'POST',
    }),
};
```

---

## 4. Signup Flow With Agent Code

### Sources for `agentCode`

- app deep link
- QR scan result
- manual input by user
- pasted invite link

### Deep link example

```text
myapp://signup?agentCode=AGENT-ABC123
```

or web fallback:

```text
https://your-web-app.com/signup?agentCode=AGENT-ABC123
```

### Mobile flow

1. Read `agentCode` from link params.
2. Normalize to uppercase.
3. Call validate endpoint.
4. Show friendly message if valid.
5. Submit it with registration.

### Example

```ts
const code = route.params?.agentCode?.trim().toUpperCase();

if (code) {
  try {
    await AgentApi.validateCode(code);
    setAgentCode(code);
    setAgentMessage('You are signing up under an agent');
  } catch {
    setAgentMessage('This agent code is invalid or inactive');
  }
}
```

```ts
await AgentApi.register({
  email,
  password,
  fullName,
  phoneNumber,
  agentCode: agentCode || undefined,
});
```

---

## 5. Become an Agent Flow

### Entry point

Add a CTA inside the user account or rewards area:

- `Become an Agent`

### Action

```ts
const response = await AgentApi.activate();
const agentCode = response.data.agentCode;
```

### Recommended success UI

- show generated `agentCode`
- add `Copy Code`
- add `Share Invite Link`
- add `Go to Agent Dashboard`

---

## 6. Agent Dashboard Flow

### Load screen data

```ts
const [accountRes, statsRes, balanceRes] = await Promise.all([
  AgentApi.account(),
  AgentApi.stats(),
  AgentApi.availableBalance(),
]);
```

### Show

- agent code
- active status
- total customers
- total commissions earned
- available balance
- withdraw button

### Optional tabs

- `Overview`
- `Customers`
- `Commissions`

---

## 7. Sharing Flow

Use the React Native `Share` API:

```ts
import { Share } from 'react-native';

async function shareAgentInvite(agentCode: string) {
  const inviteUrl = `https://your-web-app.com/signup?agentCode=${agentCode}`;

  await Share.share({
    message: `Join with my agent code: ${agentCode}\n${inviteUrl}`,
  });
}
```

---

## 8. Withdraw Flow

### Call

```ts
await AgentApi.withdraw(500);
```

### UX recommendation

- show current available balance before submission
- disable submit while request is pending
- refresh balance and commissions after success

---

## 9. Empty and Error States

### No agent account yet

- show `Become an Agent`
- explain that users can earn commission when signups use their code

### Invalid code on signup

- show warning text
- still allow normal signup unless product wants to hard block

### No customers yet

- show empty state with `Share your code to invite users`

### No commissions yet

- show empty state with `Commissions will appear after linked users make eligible purchases`

---

## 10. Final Notes

- treat `agentCode` as the mobile integration key for signup
- keep all admin features out of the React Native app for now
- if the app already has referral UI, hide or replace it with agent wording for this rollout
