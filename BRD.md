# Business Requirements Document (BRD)
## Keswani System — Real Estate & Electricity Management Platform

**Version:** 2.0  
**Date:** February 2026  
**Client Location:** Lebanon  
**Prepared For:** Management Review

---

## 1. Executive Summary

Keswani System is a web platform to manage two business lines in one system:

1. **Real estate rentals** (عقارات)
2. **Private electricity generator subscriptions** (موتير كهرباء)

The platform centralizes contracts, meter readings, bills, payments, debts, expenses, and reporting, with separate experiences for internal staff and end clients.

---

## 2. Business Goals

- Unify rent and electricity operations in one source of truth.
- Reduce manual tracking errors and delayed collections.
- Improve cash visibility (income, expense, profit/loss).
- Provide transparent self-service portal for clients.
- Enable role-based security and controlled staff access.

---

## 3. Product Scope

### 3.1 Internal Platform (Admin Dashboard)
Used by: **Owner, Admin, Employee**

- Property and unit management
- Tenant/client management
- Rent contracts and payments
- Electricity subscribers, meters, readings, pricing, billing, debts
- Financial reports and operating settings
- Staff management and permissions

### 3.2 Client Platform (Client Portal)
Used by: **Tenants / Electricity Subscribers**

- View personal rent and electricity history
- View profile and account data
- Submit reports/requests
- Track invoices and payment status

---

## 4. User Roles & Access Control

### 4.1 Internal Users (employees table)

| Role | Access Level |
|------|--------------|
| **Owner** | Full access to all modules, users, and settings |
| **Admin** | Operational full access except owner-restricted actions |
| **Employee** | Controlled access via JSON `access` permissions |

### 4.2 Client Users

- Created by internal staff (no public signup)
- Can only access own records (rent/electricity/profile/history)

### 4.3 Security Rules

- No open registration
- Protected routes by authentication + role/access control
- Session token + refresh flow
- Soft delete strategy for business records

---

## 5. Full Website Sections (Information Architecture)

### 5.1 Public/Auth

- Login
- Forgot password
- Reset password

### 5.2 Admin Dashboard Sections

### A) Main
- Dashboard home
- Profile

### B) Rent Module
- Rent overview
- Properties
- Tenants
- Contracts
- Payments
- Maintenance
- Rent notifications

### C) Electricity Module
- Electricity overview
- Employees
- Buildings
- Subscribers
- Meters
- Readings
- Pricing
- Bills
- Payments
- Debts
- Alerts
- Reports
- Settings

### 5.3 Client Portal Sections

- Dashboard home
- Profile
- Rent history
- Electricity history
- Reports/requests

---

## 6. Functional Requirements Matrix

### 6.1 Authentication & Identity

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F01 | Login for employees and clients (email/password) | P0 | 🔨 In Progress |
| F02 | Forgot password flow | P0 | 🔨 In Progress |
| F03 | Reset password flow | P0 | 🔨 In Progress |
| F04 | Get current user profile/session (`me`) | P0 | ✅ Implemented |
| F05 | Logout | P0 | ✅ Implemented |
| F06 | Refresh token/session | P1 | ✅ Implemented |
| F07 | Role-based route/API protection | P0 | 🔨 In Progress |
| F08 | Fine-grained access control via JSON access map | P1 | 🔨 In Progress |

### 6.2 Rent Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F10 | Property CRUD | P1 | 🔨 In Progress |
| F11 | Unit management inside properties | P1 | 🔨 In Progress |
| F12 | Tenant/Client CRUD | P1 | 🔨 In Progress |
| F13 | Contract lifecycle (create/activate/expire/terminate) | P1 | 📋 Planned |
| F14 | Rent payment recording (cash first) | P1 | 📋 Planned |
| F15 | Rent payment history & filters | P1 | 📋 Planned |
| F16 | Maintenance request management | P2 | 📋 Planned |
| F17 | Outstanding rent/debt tracking | P1 | 📋 Planned |
| F18 | Rent reminder notifications | P2 | 📋 Planned |

### 6.3 Electricity Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F20 | Subscriber management | P1 | 📋 Planned |
| F21 | Meter registration & lifecycle | P1 | 📋 Planned |
| F22 | Reading entry (manual/automatic source tracking) | P1 | 📋 Planned |
| F23 | KWh pricing management (history-based) | P1 | 📋 Planned |
| F24 | Bill generation per billing period | P0 | 📋 Planned |
| F25 | Bill payment recording | P1 | 📋 Planned |
| F26 | Debt/outstanding balance tracking | P1 | 📋 Planned |
| F27 | Alerts/reminders for unpaid bills | P2 | 📋 Planned |
| F28 | Electricity reports | P2 | 📋 Planned |

### 6.4 Financial Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F30 | Expense recording by category | P1 | 📋 Planned |
| F31 | Income summary (rent + electricity) | P1 | 📋 Planned |
| F32 | Expense summary by category/date | P1 | 📋 Planned |
| F33 | Profit/Loss calculation | P1 | 📋 Planned |
| F34 | Monthly/Yearly reports export view | P2 | 📋 Planned |

### 6.5 Notifications

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F40 | In-app notifications | P2 | 📋 Planned |
| F41 | Email reminders | P2 | 📋 Planned |
| F42 | WhatsApp reminders | P3 | 📋 Planned |

### 6.6 Client Portal

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F50 | View own profile and account details | P1 | 🔨 In Progress |
| F51 | View own rent history/status | P1 | 🔨 In Progress |
| F52 | View own electricity history/bills | P1 | 🔨 In Progress |
| F53 | Submit reports/requests | P2 | 🔨 In Progress |
| F54 | View own payment and notification history | P2 | 📋 Planned |

---

## 7. Core Business Rules

### 7.1 Electricity Billing Formula

```text
consumption_kwh = current_reading - previous_reading
bill_total = consumption_kwh × price_per_kwh (active pricing at billing date)
```

### 7.2 Financial Formula

```text
net_profit = (rent_income + electricity_income) - total_expenses
```

### 7.3 Data Governance Rules

- Records are soft-deleted where applicable.
- Audit fields required (`created_at`, `updated_at`, actor references when relevant).
- Currency defaults to USD unless configured otherwise.

---

## 8. Technical Architecture (Current)

| Layer | Technology |
|------|------------|
| Frontend | Next.js + TypeScript |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth + JWT |
| Validation | Zod |
| State/Data | Context modules + API helpers + mock fallback |
| Localization | Arabic / English translations |

---

## 9. Database Domains Covered in Schema

- Employees & role/access
- Clients
- Properties & units
- Contracts & rent payments
- Maintenance requests
- Subscribers, meters, readings
- Pricing history, bills, bill payments
- Expenses
- Notifications

This domain coverage supports both current implementation and planned phases.

---

## 10. Implementation Status by Layer

### 10.1 Frontend

- Auth pages and protected dashboard structure are available.
- Admin sections for rent and electricity are structured with dedicated pages.
- Client portal sections for profile/history/reports are available.
- Shared UI components (search, pagination, status, modal, confirm dialog) are available.

### 10.2 Backend

- Implemented APIs: `health`, `auth`, `properties`, `clients`.
- Route placeholders identified for upcoming modules (`contracts`, `payments`, `electricity`, `expenses`, `employees`).

### 10.3 Data Layer

- Prisma schema covers full business model end-to-end.
- Seed and SQL schema assets exist for bootstrap.

---

## 11. Priorities Definition

| Priority | Definition |
|----------|------------|
| **P0** | Mandatory for MVP go-live |
| **P1** | Core business functionality |
| **P2** | UX/operational enhancement |
| **P3** | Future phase |

---

## 12. Delivery Phases (Recommended)

| Phase | Objective | Main Scope |
|------|-----------|------------|
| Phase 1 ✅ | Data foundation | Prisma schema, SQL schema, seeds |
| Phase 2 🔨 | Identity & base APIs | Auth, session, role protection, clients/properties APIs |
| Phase 3 | Rent operations | Contracts, rent payments, maintenance, debt tracking |
| Phase 4 | Electricity operations | Subscribers, meters, readings, pricing, bills, debts |
| Phase 5 | Financials | Expenses, P/L, periodic reporting |
| Phase 6 | Client self-service | Complete client portal APIs and data ownership rules |
| Phase 7 | Communication | In-app, email, WhatsApp notifications |

---

## 13. MVP Exit Criteria

System is considered MVP-ready when all of the following are complete:

1. P0 authentication and access flows are stable.
2. Core rent and electricity billing flows (P1) are operational.
3. Payment recording and debt tracking are available.
4. Client portal shows reliable personal history.
5. Basic financial visibility (income/expense/profit) is available.

