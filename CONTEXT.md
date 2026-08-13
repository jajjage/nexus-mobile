# Nexus Mobile

Nexus Mobile is the customer-facing mobile app for wallet funding, purchases, and account self-service.

## Language

**Virtual Account Number**:
A bank account number assigned to a user for funding their Nexus wallet.
_Avoid_: Account number, bank account, wallet account

**Dashboard Announcement Modal**:
A time-bound in-app announcement shown once per day when an eligible user enters the mobile dashboard.
_Avoid_: Alert notification, banner popup

**Network Auto-Detection**:
A purchase-screen aid that suggests a mobile network from the typed phone number prefix.
_Avoid_: Provider validation, SIM validation

**Manual Network Selection**:
The user's explicit choice of mobile network for a purchase, especially when a phone number has been ported to another network.
_Avoid_: Override, forced provider
