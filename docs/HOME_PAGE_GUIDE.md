# Nexus Data - Home Page UI Guide

This guide documents the home page UI for the **720px - 1024px tablet/desktop breakpoint** and provides all icon and color details for mobile app development.

---

## Layout Structure

### Responsive Behavior

| Breakpoint | Sidebar | Bottom Nav | Content Width |
|------------|---------|------------|---------------|
| < 768px (Mobile) | Hidden | Visible | Full width |
| 768px - 1024px (Tablet) | Visible (`md:flex`) | Hidden (`md:hidden`) | Max 672px centered |
| > 1024px (Desktop) | Visible | Hidden | Max 672px centered |

### Layout Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  Desktop Sidebar (w-64, 256px)  │     Main Content Area     │
│  - Logo + Brand                 │  ┌─────────────────────┐  │
│  - Navigation Items             │  │  Header (Avatar,    │  │
│  - Reseller Tools (if reseller) │  │  Buttons)           │  │
│  - Become Reseller (if user)    │  ├─────────────────────┤  │
│  - Logout                       │  │  Balance Card       │  │
│                                 │  │  Transaction History│  │
│                                 │  │  Action Buttons     │  │
│                                 │  │  Ads Carousel       │  │
│                                 │  │  Promo Banner       │  │
│                                 │  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Light Mode

| Token | HSL Value | Hex Approximation | Usage |
|-------|-----------|-------------------|-------|
| `--background` | `0 0% 98%` | `#FAFAFA` | Page background |
| `--foreground` | `240 10% 20%` | `#2E2E33` | Primary text |
| `--card` | `0 0% 98%` | `#FAFAFA` | Card backgrounds |
| `--primary` | `39 80% 50%` | `#E69E19` | Primary accent (amber/gold) |
| `--primary-foreground` | `39 100% 98%` | `#FFFBF5` | Text on primary |
| `--secondary` | `192 10% 85%` | `#D4D9DA` | Secondary elements |
| `--muted` | `192 5% 92%` | `#EAEBEC` | Muted backgrounds |
| `--muted-foreground` | `192 10% 35%` | `#525A5C` | Secondary text |
| `--destructive` | `0 80% 55%` | `#E63946` | Error/danger |
| `--border` | `192 10% 85%` | `#D4D9DA` | Borders |
| `--ring` | `39 80% 50%` | `#E69E19` | Focus rings |

### Dark Mode

| Token | HSL Value | Hex Approximation | Usage |
|-------|-----------|-------------------|-------|
| `--background` | `192 20% 12%` | `#182023` | Page background |
| `--foreground` | `39 90% 90%` | `#FCE8C8` | Primary text |
| `--card` | `192 20% 12%` | `#182023` | Card backgrounds |
| `--primary` | `39 80% 50%` | `#E69E19` | Primary accent |
| `--muted` | `192 5% 18%` | `#2B2E2F` | Muted backgrounds |
| `--muted-foreground` | `39 50% 60%` | `#CC9E66` | Secondary text |

### Sidebar Colors (Light Mode)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--sidebar-background` | `0 0% 95%` | Sidebar bg |
| `--sidebar-foreground` | `240 10% 38%` | Sidebar text |
| `--sidebar-primary` | `39 80% 47%` | Active item |
| `--sidebar-accent` | `192 5% 89%` | Hover state |
| `--sidebar-border` | `192 10% 82%` | Border |

---

## Icons Reference (lucide-react)

All icons use **lucide-react** library. For React Native, use **lucide-react-native**.

### Desktop Sidebar Navigation

| Label | Icon Name | Lucide Import | Size | Route |
|-------|-----------|---------------|------|-------|
| Home | `Home` | `import { Home } from "lucide-react"` | 20px (`size-5`) | `/dashboard` |
| Referral | `Users` | `import { Users } from "lucide-react"` | 20px | `/dashboard/referrals` |
| Rewards | `Trophy` | `import { Trophy } from "lucide-react"` | 20px | `/dashboard/rewards` |
| Profile | `User` | `import { User } from "lucide-react"` | 20px | `/dashboard/profile` |
| Logout | `LogOut` | `import { LogOut } from "lucide-react"` | 20px | N/A (action) |

### Reseller Tools (Desktop Sidebar - Only for Resellers)

| Label | Icon Name | Lucide Import | Size | Route |
|-------|-----------|---------------|------|-------|
| Reseller Hub | `Store` | `import { Store } from "lucide-react"` | 20px | `/dashboard/reseller` |
| Bulk Topup | `FileUp` | `import { FileUp } from "lucide-react"` | 20px | `/dashboard/reseller/bulk-topup` |
| API Keys | `Key` | `import { Key } from "lucide-react"` | 20px | `/dashboard/reseller/api-keys` |

### Become Reseller States (Desktop Sidebar - Only for Regular Users)

| State | Icon Name | Colors |
|-------|-----------|--------|
| Active | `Sparkles` | Icon: `amber-600` / `amber-400` (dark) |
| Pending | `Clock` | Icon: `zinc-500` |

### Bottom Navigation (Mobile Only - < 768px)

| Label | Icon Name | Size | Route | Notes |
|-------|-----------|------|-------|-------|
| Home | `Home` | 20px | `/dashboard` | |
| Referral | `Users` | 20px | `/dashboard/referrals` | |
| Reseller | `Briefcase` | 20px | `/dashboard/reseller` | Only for resellers, has amber dot indicator |
| Rewards | `Trophy` | 20px | `/dashboard/rewards` | |
| Profile | `User` | 20px | `/dashboard/profile` | |

### Header Icons

| Purpose | Icon Name | Size | Route/Action |
|---------|-----------|------|--------------|
| Rewards | `Gift` | 20px | `/dashboard/rewards` |
| Signal | `Signal` | 20px | N/A |
| Theme (Light) | `Sun` | 16px | Toggle dropdown |
| Theme (Dark) | `Moon` | 16px | Toggle dropdown |
| Notifications | `Bell` | 20px | `/dashboard/notifications` |

### Balance Card Icons

| Purpose | Icon Name | Size |
|---------|-----------|------|
| Show Balance | `Eye` | 16-20px |
| Hide Balance | `EyeOff` | 16-20px |
| Add Money | `Plus` | 14-16px |
| Copy | `Copy` | 16px |
| Share | `Share2` | 16px |
| Loading | `Loader2` | 48px (animated spin) |

### Action Buttons (Make Payment Section)

| Label | Icon Name | Size | Route |
|-------|-----------|------|-------|
| Transfer | `Send` | 24px (`size-6`) | `/dashboard/transfer` |
| Airtime | `Phone` | 24px | `/dashboard/airtime` |
| Data | `Wifi` | 24px | `/dashboard/data` |
| Pay Bills | `Receipt` | 24px | `/dashboard/bills` |

---

## Component Styles

### Desktop Sidebar

```css
/* Container */
.sidebar {
  width: 256px; /* w-64 */
  height: 100vh;
  position: sticky;
  top: 0;
  left: 0;
  padding: 24px 16px; /* py-6 px-4 */
  border-right: 1px solid var(--border);
  background: var(--card);
}

/* Logo Area */
.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 32px;
}

.logo-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
}

/* Nav Item */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px; /* gap-3 */
  padding: 12px; /* p-3 */
  border-radius: 8px; /* rounded-lg */
  font-size: 14px;
  font-weight: 500;
}

/* Active State */
.nav-item-active {
  background: rgba(230, 158, 25, 0.1); /* bg-primary/10 */
  color: #E69E19; /* text-primary */
}

/* Inactive State */
.nav-item-inactive {
  color: var(--muted-foreground);
}

/* Hover State */
.nav-item:hover {
  background: var(--muted);
  color: var(--foreground);
}
```

### Bottom Navigation

```css
/* Container */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px; /* h-16 */
  background: var(--card);
  border-top: 1px solid var(--border);
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 5 cols for resellers */
  align-items: center;
}

/* Nav Item */
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Active */
.bottom-nav-item-active {
  color: var(--primary); /* #E69E19 */
}

/* Inactive */
.bottom-nav-item-inactive {
  color: var(--muted-foreground);
}
```

### Action Buttons

```css
/* Container */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
  background: var(--card);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* Button */
.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  text-align: center;
}

/* Icon Container */
.action-icon-container {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(230, 158, 25, 0.1); /* bg-primary/10 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Icon */
.action-icon {
  width: 24px;
  height: 24px;
  color: var(--primary); /* #E69E19 */
}

/* Label */
.action-label {
  font-size: 12px;
  font-weight: 500;
}
```

### Balance Card

```css
/* Card */
.balance-card {
  background: var(--primary); /* #E69E19 */
  color: var(--primary-foreground);
  padding: 16px; /* md: 24px */
  border-radius: 16px 16px 0 0;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

/* Balance Label */
.balance-label {
  font-size: 12px; /* md: 14px */
  opacity: 0.9;
}

/* Balance Amount */
.balance-amount {
  font-size: 24px; /* md: 30px */
  font-weight: 700;
  margin-top: 2px;
}

/* Add Money Button */
.add-money-btn {
  height: 36px; /* md: 40px */
  padding: 0 12px; /* md: 16px */
  border-radius: 9999px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  font-size: 12px; /* md: 14px */
}
```

---

## Summary Icon Table for Mobile Development

| Category | Icon | Lucide Name | React Native Import |
|----------|------|-------------|---------------------|
| Navigation | 🏠 | `Home` | `lucide-react-native` |
| Navigation | 👥 | `Users` | `lucide-react-native` |
| Navigation | 🏆 | `Trophy` | `lucide-react-native` |
| Navigation | 👤 | `User` | `lucide-react-native` |
| Navigation | 💼 | `Briefcase` | `lucide-react-native` |
| Action | 📤 | `Send` | `lucide-react-native` |
| Action | 📞 | `Phone` | `lucide-react-native` |
| Action | 📶 | `Wifi` | `lucide-react-native` |
| Action | 🧾 | `Receipt` | `lucide-react-native` |
| Header | 🎁 | `Gift` | `lucide-react-native` |
| Header | 📡 | `Signal` | `lucide-react-native` |
| Header | ☀️ | `Sun` | `lucide-react-native` |
| Header | 🌙 | `Moon` | `lucide-react-native` |
| Header | 🔔 | `Bell` | `lucide-react-native` |
| Balance | 👁️ | `Eye` | `lucide-react-native` |
| Balance | 👁️‍🗨️ | `EyeOff` | `lucide-react-native` |
| Balance | ➕ | `Plus` | `lucide-react-native` |
| Balance | 📋 | `Copy` | `lucide-react-native` |
| Balance | 📤 | `Share2` | `lucide-react-native` |
| Loading | ⏳ | `Loader2` | `lucide-react-native` |
| Reseller | 🏪 | `Store` | `lucide-react-native` |
| Reseller | 📁 | `FileUp` | `lucide-react-native` |
| Reseller | 🔑 | `Key` | `lucide-react-native` |
| Reseller | ✨ | `Sparkles` | `lucide-react-native` |
| Reseller | ⏰ | `Clock` | `lucide-react-native` |
| Auth | 🚪 | `LogOut` | `lucide-react-native` |

---

## Primary Color Reference

**Primary Brand Color: `#E69E19`** (HSL: 39 80% 50%)

This amber/gold color is used for:
- Active navigation items
- Action button icon containers
- Balance card background
- Focus rings
- Primary buttons
