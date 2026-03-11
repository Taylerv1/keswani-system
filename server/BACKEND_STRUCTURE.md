# Backend Folder Structure

```
server/
│
├── db/                                 # Database files
│   ├── 001_schema.sql                  # PostgreSQL schema (run in Supabase SQL Editor)
│   └── seeds/                          # Seed data scripts
│       ├── index.ts                    # Entry point — npm run seed
│       └── seed-data.ts               # Realistic test data arrays
│
├── prisma/                             # Prisma ORM
│   └── schema.prisma                   # Auto-introspected from Supabase DB
│
├── src/                                # Application source code
│   ├── app.ts                          # Express app setup (cors, routes, error handler)
│   ├── server.ts                       # Server entry point (listen on PORT)
│   │
│   ├── config/                         # Configuration & client initialization
│   │   ├── supabase.ts                 # Supabase clients (anon + admin)
│   │   └── prisma.ts                   # Prisma client singleton
│   │
│   ├── controllers/                    # Request handlers (business logic)
│   │   ├── auth.controller.ts          # Login, forgot/reset password, me, logout
│   │   ├── employee.controller.ts      # Employee CRUD (future)
│   │   ├── client.controller.ts        # Client CRUD (future)
│   │   ├── property.controller.ts      # Property CRUD (future)
│   │   ├── contract.controller.ts      # Contract CRUD (future)
│   │   ├── payment.controller.ts       # Payment CRUD (future)
│   │   ├── electricity.controller.ts   # Meters, readings, bills (future)
│   │   └── expense.controller.ts       # Expenses CRUD (future)
│   │
│   ├── middlewares/                     # Express middleware
│   │   ├── error.middleware.ts         # Global error handler
│   │   ├── auth.middleware.ts          # JWT verification (Supabase token)
│   │   └── role.middleware.ts          # Role & access-based authorization
│   │
│   ├── routes/                         # Route definitions
│   │   ├── index.ts                    # Route aggregator
│   │   ├── auth.routes.ts              # /api/auth/*
│   │   ├── employee.routes.ts          # /api/employees/* (future)
│   │   ├── client.routes.ts            # /api/clients/* (future)
│   │   ├── property.routes.ts          # /api/properties/* (future)
│   │   ├── contract.routes.ts          # /api/contracts/* (future)
│   │   ├── payment.routes.ts           # /api/payments/* (future)
│   │   ├── electricity.routes.ts       # /api/electricity/* (future)
│   │   └── expense.routes.ts           # /api/expenses/* (future)
│   │
│   ├── validators/                     # Zod request validation schemas
│   │   └── auth.validator.ts           # Login, forgot, reset validators
│   │
│   └── types/                          # TypeScript type definitions
│       └── index.ts                    # Shared types & request extensions
│
├── .env.example                        # Environment variable template
├── .gitignore                          # Git ignored files
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript configuration
└── README.md                           # Project documentation
```

## Key Patterns

| Pattern | Description |
|---------|-------------|
| **Supabase for Auth** | Use `@supabase/supabase-js` for login, password reset, JWT verification |
| **Prisma for Data** | Use `@prisma/client` for all database CRUD operations |
| **Zod Validation** | Validate all request bodies before processing |
| **Role Middleware** | `requireRole('owner', 'admin')` guards sensitive endpoints |
| **Error Middleware** | All errors flow through global handler, standardized format |

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon --exec ts-node src/server.ts` | Development server with hot reload |
| `build` | `tsc` | Compile TypeScript |
| `start` | `node dist/server.js` | Run production build |
| `seed` | `tsx db/seeds/index.ts` | Seed database with test data |
| `prisma:pull` | `prisma db pull` | Introspect Supabase DB → update schema.prisma |
| `prisma:generate` | `prisma generate` | Generate Prisma client from schema |
