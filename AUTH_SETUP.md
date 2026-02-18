# 🔐 Authentication System — Setup Guide

## Overview

Your Keswani System now has a complete, secure authentication flow:

- **httpOnly cookies** storing JWT tokens (can't be accessed by JavaScript)
- **Secure cookies** in production (HTTPS only)
- **Role-based access control** (owner, admin, employee, client)
- **Refresh token** mechanism for extended sessions
- **Next.js API routes** as secure middleware between frontend and backend

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js API     │────▶│  Express API    │
│  (Login UI) │     │  Route (sets     │     │  (Supabase      │
│             │◀────│  httpOnly        │◀────│   Auth)         │
└─────────────┘     │  cookies)        │     └─────────────────┘
                    └──────────────────┘
```

**Security Benefits:**
- Tokens stored in httpOnly cookies → immune to XSS attacks
- No token exposure in client-side JavaScript
- SameSite protection → CSRF prevention
- Automatic refresh token handling

---

## 📦 What's Included

### Backend (Express API)
- ✅ Supabase Auth integration
- ✅ JWT token validation
- ✅ Role & access-based middleware
- ✅ Password reset flow

**Routes:**
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset

### Frontend (Next.js)
- ✅ Secure Next.js API routes (middleware)
- ✅ httpOnly cookie management
- ✅ Client-side auth utilities
- ✅ Login page integrated with backend

**API Routes:**
- `POST /api/auth/login` - Sets httpOnly cookies
- `POST /api/auth/logout` - Clears cookies
- `GET /api/auth/me` - Validates session
- `POST /api/auth/refresh` - Refreshes tokens

**Client Utilities:** (`lib/auth-client.ts`)
```typescript
import { getUserData, isAuthenticated, hasAccess, logout } from '@/lib/auth-client';

// Check if user is logged in
if (isAuthenticated()) { ... }

// Get user details
const user = getUserData(); // { id, email, user_type, role, access }

// Check access
if (hasAccess('electricity')) { ... }

// Logout
await logout();
```

---

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Configure environment (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
PORT=5000
FRONTEND_URL=http://localhost:3000

# Seed database with test data
npm run seed

# Create Supabase auth users & link to seeded profiles
npm run create-test-users

# Start server
npm run dev
```

### 2. Setup Frontend

```bash
cd client

# Install dependencies
npm install

# Configure environment (.env)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
```

### 3. Test Login

**Via Browser:**
1. Go to `http://localhost:3000/login`
2. Login with:
   - Email: `yousef@kiswani.lb`
   - Password: `Test123!`
3. You'll be redirected to the admin dashboard

**Via Postman:**
See [Testing with Postman](#-testing-with-postman) below.

---

## 🧪 Test Users

After running `npm run create-test-users`, you'll have these accounts:

### Employees
| Name            | Email                  | Role      | Password  |
|-----------------|------------------------|-----------|-----------|
| Yousef Kiswani  | yousef@kiswani.lb      | owner     | Test123!  |
| Rami Haddad     | rami@kiswani.lb        | admin     | Test123!  |
| Hassan Nassar   | hassan@kiswani.lb      | employee  | Test123!  |
| Khalil Mansour  | khalil@kiswani.lb      | employee  | Test123!  |

### Clients
| Name            | Email                  | Type      | Password  |
|-----------------|------------------------|-----------|-----------|
| Ali Mrad        | ali.mrad@mail.com      | client    | Test123!  |
| Fatima Khalil   | fatima.k@mail.com      | client    | Test123!  |
| Omar Suleiman   | omar.s@mail.com        | client    | Test123!  |
| Layla Bakri     | layla.b@mail.com       | client    | Test123!  |
| Youssef Darwish | youssef.d@mail.com     | client    | Test123!  |

---

## 📮 Testing with Postman

### Setup
1. Base URL: `http://localhost:5000/api/auth`
2. Create requests for each endpoint

### 1. Login (Direct to Backend)
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "yousef@kiswani.lb",
  "password": "Test123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "user": {
      "id": "...",
      "email": "yousef@kiswani.lb",
      "user_type": "employee",
      "role": "owner",
      "access": {
        "rent": true,
        "electricity": true,
        ...
      }
    }
  }
}
```

Copy the `token` value.

### 2. Get Current User
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <paste-token-here>
```

### 3. Refresh Token
```
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token_from_login>"
}
```

### 4. Logout
```
POST http://localhost:5000/api/auth/logout
Authorization: Bearer <token>
```

### 5. Forgot Password
```
POST http://localhost:5000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "yousef@kiswani.lb"
}
```

---

## 🍪 How Cookies Work

### Login Flow
1. User submits email/password on frontend
2. Frontend calls `/api/auth/login` (Next.js route)
3. Next.js route calls backend Express API
4. Backend validates with Supabase, returns tokens
5. Next.js route sets **3 cookies**:
   - `auth_token` (httpOnly, 7 days) - Access token
   - `refresh_token` (httpOnly, 30 days) - Refresh token
   - `user_data` (readable, 7 days) - User metadata for UI

### Cookie Security

| Cookie         | httpOnly | Secure (prod) | SameSite | Purpose |
|----------------|----------|---------------|----------|---------|
| auth_token     | ✅       | ✅            | lax      | API authentication |
| refresh_token  | ✅       | ✅            | lax      | Token refresh |
| user_data      | ❌       | ✅            | lax      | UI metadata |

**Why is `user_data` not httpOnly?**
- Frontend needs to read role/access for UI decisions
- Contains only non-sensitive data (no tokens)
- Still protected by Secure + SameSite

---

## 🔒 Protecting Routes

### Client-Side (React Component)
```tsx
'use client';
import { useEffect } from 'react';
import { isAuthenticated, hasAccess } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, []);

  return <div>Admin Dashboard</div>;
}
```

### Server-Side (Next.js Middleware)
Create `middleware.ts` in your root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  // Redirect to login if not authenticated
  if (!token && request.nextUrl.pathname.startsWith('/admin-dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-dashboard/:path*', '/dashboard/:path*'],
};
```

---

## 🛠️ Development Tips

### Check Cookies in Browser
1. Open DevTools → Application (Chrome) / Storage (Firefox)
2. Look under Cookies → `http://localhost:3000`
3. You should see `auth_token`, `refresh_token`, `user_data`

### Debug Auth Issues
```typescript
// In any client component
import { getUserData } from '@/lib/auth-client';

console.log('Current user:', getUserData());
```

### Token Refresh Strategy
Tokens auto-expire after 7 days. Implement refresh before expiry:

```typescript
// Call periodically or on 401 errors
import { refreshToken } from '@/lib/auth-client';

const success = await refreshToken();
if (!success) {
  // Token expired, redirect to login
  window.location.href = '/login';
}
```

---

## 🔐 Security Best Practices

### ✅ Implemented
- httpOnly cookies (XSS protection)
- Secure cookies in production (HTTPS only)
- SameSite=lax (CSRF protection)
- Token expiration (7 days access, 30 days refresh)
- No tokens in localStorage/sessionStorage
- Password reset via Supabase (secure email flow)

### 📋 Recommended
- [ ] Implement HTTPS in production
- [ ] Add rate limiting on login endpoint
- [ ] Add 2FA for sensitive accounts
- [ ] Monitor failed login attempts
- [ ] Implement session revocation (blacklist)
- [ ] Add IP-based fraud detection

---

## 🐛 Troubleshooting

### "Not authenticated" error
- Check if cookies are set (DevTools)
- Verify backend is running on correct port
- Ensure `NEXT_PUBLIC_API_URL` matches backend address
- Check browser isn't blocking cookies (incognito/privacy mode)

### Login works but immediate redirect to login
- Check token expiration
- Verify cookie path is `/`
- Ensure SameSite setting allows cookies

### CORS errors
- Backend must have CORS enabled for `http://localhost:3000`
- Check `Access-Control-Allow-Credentials: true` header

---

## 📚 Further Reading

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [OWASP Auth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🎯 What's Next?

- [ ] Add remember me functionality (longer expiry)
- [ ] Implement logout from all devices
- [ ] Add login history tracking
- [ ] Create admin panel for user management
- [ ] Add email verification step
- [ ] Implement social login (Google, etc.)

---

**Need Help?** Check the error logs or reach out to the development team.
