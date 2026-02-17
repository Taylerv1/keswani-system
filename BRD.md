# Business Requirements Document (BRD)
## Keswani System — Real Estate & Electricity Management Platform

**Version:** 1.0  
**Date:** February 2026  
**Client Location:** Lebanon

---

## 1. Project Overview

A web-based platform for a Lebanese business managing **real estate rentals** (عقارات) and **private electricity generator subscriptions** (موتير كهرباء). The system tracks rent contracts, electricity consumption, payments, expenses, and provides profit/loss reports.

### Two Dashboards
| Dashboard | Users | Purpose |
|-----------|-------|---------|
| **Admin Dashboard** | Owner, Admins, Employees | Full management of properties, tenants, electricity, payments, expenses |
| **Client Portal** | Tenants, Electricity Subscribers | View their invoices, payment history, contracts, meter readings |

---

## 2. User Roles & Access

### 2.1 Employee Table (Unified)
All internal users share one table with role-based access:

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access. Can manage admins and employees. Can configure system settings. |
| **Admin** | Near-full access. Can manage employees, properties, clients, billing. Cannot delete Owner. |
| **Employee** | Limited access. Permissions controlled via `access` JSONB field per employee. |

### 2.2 Clients
Tenants and/or electricity subscribers. They do NOT sign up themselves — they are created by admin/employee and receive login credentials.

---

## 3. Feature List

### 3.1 Authentication & Access Control
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F01 | Employee login (email + password) | P0 | 🔨 Building |
| F02 | Client login (email + password) | P0 | 🔨 Building |
| F03 | Forgot password (email reset link) | P0 | 🔨 Building |
| F04 | Reset password | P0 | 🔨 Building |
| F05 | Role-based route protection | P0 | 🔨 Building |
| F06 | Fine-grained access control (JSONB `access` field) | P1 | 📋 Planned |
| F07 | Session management / token refresh | P1 | 📋 Planned |

> [!NOTE]
> **No public signup.** Users are created by admin only.

---

### 3.2 Rent Management Module
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F10 | Property CRUD (buildings, houses, land) | P1 | 📋 Planned |
| F11 | Unit CRUD (apartments/shops within properties) | P1 | 📋 Planned |
| F12 | Client/Tenant CRUD | P1 | 📋 Planned |
| F13 | Contract management (create, activate, expire, terminate) | P1 | 📋 Planned |
| F14 | Rent payment recording (cash) | P1 | 📋 Planned |
| F15 | Rent payment history & filtering | P1 | 📋 Planned |
| F16 | Maintenance request management | P2 | 📋 Planned |
| F17 | Rent reminder notifications (email/WhatsApp) | P2 | 📋 Planned |
| F18 | Outstanding rent / debt view | P1 | 📋 Planned |

---

### 3.3 Electricity Module
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F20 | Subscriber management | P1 | 📋 Planned |
| F21 | Meter registration & tracking | P1 | 📋 Planned |
| F22 | Meter reading entry (manual) | P1 | 📋 Planned |
| F23 | KWh pricing management (variable rates) | P1 | 📋 Planned |
| F24 | Bill generation (consumption × price) | P0 | 📋 Planned |
| F25 | Bill payment recording | P1 | 📋 Planned |
| F26 | Outstanding electricity debts view | P1 | 📋 Planned |
| F27 | Payment reminder notifications | P2 | 📋 Planned |

**Billing formula:**
```
consumption = current_reading - previous_reading
total = consumption × price_per_kwh (from pricing_history at billing time)
```

---

### 3.4 Financial Tracking
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F30 | Expense recording (maintenance, purchases, utilities, salaries) | P1 | 📋 Planned |
| F31 | Income summary (rent + electricity payments) | P1 | 📋 Planned |
| F32 | Expense summary by category | P1 | 📋 Planned |
| F33 | Profit/Loss calculation (income − expenses) | P1 | 📋 Planned |
| F34 | Monthly/Yearly financial reports | P2 | 📋 Planned |

---

### 3.5 Notifications
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F40 | In-app notifications | P2 | 📋 Planned |
| F41 | Email notifications (payment reminders) | P2 | 📋 Planned |
| F42 | WhatsApp notifications (payment reminders) | P3 | 📋 Planned |

---

### 3.6 Client Portal
| # | Feature | Priority | Status |
|---|---------|----------|--------|
| F50 | View own contracts & rent status | P1 | 📋 Planned |
| F51 | View own electricity bills & payment history | P1 | 📋 Planned |
| F52 | View own meter readings | P1 | 📋 Planned |
| F53 | Submit maintenance requests | P2 | 📋 Planned |
| F54 | View notification history | P2 | 📋 Planned |

---

## 4. Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (TypeScript) |
| **Backend** | Express.js (TypeScript) |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma |
| **Auth** | Supabase Auth (JWT) |
| **Validation** | Zod |
| **Payment** | Cash only (future: bank transfer, other) |

---

## 5. Priority Definitions

| Priority | Meaning |
|----------|---------|
| **P0** | Must have — blocking for MVP launch |
| **P1** | Should have — core functionality |
| **P2** | Nice to have — enhances UX |
| **P3** | Future — planned for later phases |

---

## 6. Implementation Phases

| Phase | Focus | Features |
|-------|-------|----------|
| **Phase 1** ✅ | Database schema | DB design, schema SQL |
| **Phase 2** 🔨 | Auth + Backend setup | F01–F05, Prisma, seed data |
| **Phase 3** | Rent module API | F10–F18 |
| **Phase 4** | Electricity module API | F20–F27 |
| **Phase 5** | Financial tracking | F30–F34 |
| **Phase 6** | Client portal API | F50–F54 |
| **Phase 7** | Notifications | F40–F42 |
