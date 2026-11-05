# Mohd Shifan Gouri (BOYS MSG) — Official Portfolio & Community Platform

**Live Production Domain:** `https://shifan.pokefun.in`  
**Brand Identity:** Mohd Shifan Gouri / BOYS MSG · Systems Developer · Founder @ Pokefun  
**Design Theme:** Futuristic Electric White, Blue (`#1677FF`), and Cyan (`#00C9D8`)  
**Technology Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Three.js, Supabase PostgreSQL with RLS, Umami Telemetry.

---

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js 18.x or 20.x LTS
- npm 9+

### Installation & Server Launch
```bash
# Install dependencies
npm install

# Start isolated development server
npm run dev
```

*The application will be live at `http://localhost:3000`.*

---

## 2. Automated Testing Suite

The repository includes a complete automated testing suite covering visual regression, cross-viewport layout stability, security, authentication, and data integrity:

```bash
# 1. Run Security, Auth, Rate-Limit & API Test Suite:
npm run test:security

# 2. Run Chromium DevTools Protocol (CDP) 5-Viewport Visual QA Suite:
npm run test:visual

# 3. Run Production Build & Type Verification:
npm run build
npx tsc --noEmit
```

---

## 3. Environment Configuration

Copy the template file to configure your local or production environment:
```bash
cp .env.example .env.local
```

### Environment Variables
| Variable | Description | Default / Example |
|---|---|---|
| `ADMIN_EMAIL` | Authorized owner email for `/admin` console | `shifangouri01@gmail.com` |
| `ADMIN_PASSWORD_HASH` | PBKDF2 hash of owner admin password | *(Generate via script in docs)* |
| `ADMIN_SESSION_SECRET` | HMAC-SHA256 cookie signing secret (32+ chars) | `super_secret_session_key...` |
| `IP_HASH_SECRET` | HMAC-SHA256 secret for IP privacy hashing | `super_secret_ip_hash_key...` |
| `RESEND_API_KEY` | Resend API key for OTP email dispatch | `re_...` |
| `OTP_FROM_EMAIL` | Verified sender address for security OTPs | `security@pokefun.in` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client anonymous API key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server administrative key | `eyJhbGci...` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami privacy-friendly website identifier | `xxxx-xxxx-xxxx` |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami script endpoint | `https://cloud.umami.is/script.js` |

---

## 4. Database Setup (Supabase PostgreSQL)

Execute the complete initialization migration in your Supabase SQL Editor:
`supabase/migrations/20261105000000_shifan_portfolio_init.sql`

This creates:
- `profiles` — Google-authenticated user profiles.
- `feedback` — Top-level community feedback posts with ratings.
- `feedback_replies` — Threaded discussion replies with verified Owner badges.
- `feedback_revisions` — Permanent audit log preserving previous content, new content, editor, and timestamps.
- `feedback_reports` — Spam and moderation reporting table.
- `persistent_rate_limits` — Atomic, distributed rate limiting.
- `admin_otps` — Persistent 10-minute security OTP codes.
- `admin_trusted_ips` — Permanent recognized network records.
- Row Level Security (RLS) policies and performance indexes.

---

## 5. Security Architecture

1. **Dual-Layer Admin Access:** Owner login requires password validation (PBKDF2) + HMAC network signature verification. Unknown IP addresses require email OTP verification.
2. **Strict Identity Checks:** All role resolutions happen server-side (`resolveCallerIdentity`). Client-submitted flags (`is_guest`, `is_owner`, `user_id`) are never trusted.
3. **Spam & Abuse Protection:** 
   - Guest: Max 2 submissions per 24 hours (cookie + IP hash).
   - Google: Max 3 submissions per 24 hours.
   - Replies: Max 10 per hour.
   - Duplicate message detection within 1 hour.
4. **24-Hour Edit Restriction:** Visitors may only edit their own posts within 24 hours of creation. All revisions are permanently saved.
5. **Zero IP or Hash Leakage:** Public APIs strictly strip all internal hashes and identifiers before returning data.
