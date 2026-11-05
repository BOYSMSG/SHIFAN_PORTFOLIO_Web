# Private Admin Console & Community Discussion Platform Setup Guide

**Target Website:** `shifan.pokefun.in`  
**Security Standard:** Strict Dual-Layer Owner Authorization (Password PBKDF2 + HMAC-IP + Email OTP) & Fail-Closed RLS Threaded Community Architecture

---

## 1. Environment Variables Inventory

Copy `.env.example` to `.env.local` in your project root or hosting configuration:

```env
# ==========================================
# 1. OWNER CONSOLE CREDENTIALS (Server-Only)
# ==========================================
# Explicitly configured owner email (replace placeholder with confirmed owner email)
ADMIN_EMAIL=your-owner-email@domain.com

# PBKDF2 Password Hash (100,000 iterations, SHA-512; see Section 4 to generate)
ADMIN_PASSWORD_HASH=

# Cryptographic secret for signing HTTP-only session cookies (Min 32 random characters)
ADMIN_SESSION_SECRET=

# Cryptographic secret for HMAC-hashing client IP addresses (Min 32 random characters)
IP_HASH_SECRET=

# ==========================================
# 2. REVERSE PROXY & NETWORK SECURITY
# ==========================================
# Set to 'true' when deployed behind trusted reverse-proxy (e.g., Nginx)
TRUST_PROXY=true

# Set to 'true' ONLY if traffic routes through Cloudflare and origin firewall enforces Cloudflare ingress
CLOUDFLARE_PROXY=false

# ==========================================
# 3. EMAIL OTP DISPATCH (RESEND) (Server-Only)
# ==========================================
# Obtain free from https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
OTP_FROM_EMAIL=security@pokefun.in

# ==========================================
# 4. SUPABASE DATABASE & AUTHENTICATION
# ==========================================
# Obtain from your Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# 5. PRIVACY-FIRST TELEMETRY (UMAMI)
# ==========================================
# Client tracking script
NEXT_PUBLIC_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js

# Server-side API credentials (for /admin/analytics)
UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
UMAMI_API_KEY=your-umami-api-key
UMAMI_HOST_URL=https://cloud.umami.is
```

---

## 2. Reverse-Proxy Security & Origin Hardening

### A. Origin Server Binding & Firewall Protection
The Next.js Node process must **never be reachable directly from the public internet**. It must only bind to the local loopback interface:

1. **Local Loopback Process Bind:**
   ```bash
   # Bind strictly to 127.0.0.1 (not 0.0.0.0)
   pm2 start npm --name "shifan-portfolio" -- start -- -H 127.0.0.1 -p 3000
   ```

2. **Server Firewall Configuration (UFW):**
   ```bash
   # Allow standard web traffic and SSH only
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp

   # Explicitly block direct public access to Node port 3000
   sudo ufw deny 3000/tcp
   sudo ufw enable
   ```

### B. Nginx Reverse-Proxy Configuration
Nginx must overwrite or strip all client-supplied forwarding headers before forwarding requests to Next.js. Add the following directives to your `/etc/nginx/sites-available/shifan.pokefun.in` configuration:

```nginx
server {
    server_name shifan.pokefun.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Overwrite forwarding headers with verified remote socket address
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Explicitly strip spoofable client-supplied headers
        proxy_set_header CF-Connecting-IP "";
        proxy_set_header True-Client-IP "";
    }
}
```

### C. Cloudflare-to-Origin Configuration (Optional)
If you proxy traffic through Cloudflare (Orange Cloud enabled):
1. In your `.env.local`, set `CLOUDFLARE_PROXY=true`.
2. In Nginx, use Cloudflare's official IP ranges with the `http_realip_module` so Nginx itself authenticates that the incoming connection genuinely originates from Cloudflare:
   ```nginx
   # Cloudflare IP Ranges
   set_real_ip_from 173.245.48.0/20;
   set_real_ip_from 103.21.244.0/22;
   set_real_ip_from 103.22.200.0/22;
   set_real_ip_from 103.31.4.0/22;
   set_real_ip_from 141.101.64.0/18;
   set_real_ip_from 108.162.192.0/18;
   set_real_ip_from 190.93.240.0/20;
   set_real_ip_from 188.114.96.0/20;
   set_real_ip_from 197.234.240.0/22;
   set_real_ip_from 198.41.128.0/17;
   set_real_ip_from 162.158.0.0/15;
   set_real_ip_from 104.16.0.0/13;
   set_real_ip_from 104.24.0.0/14;
   set_real_ip_from 172.64.0.0/13;
   set_real_ip_from 131.0.72.0/22;

   real_ip_header CF-Connecting-IP;
   ```
3. In UFW, restrict ingress on ports 80/443 to Cloudflare IPs if strict origin isolation is desired.

---

## 3. Supabase PostgreSQL Schema & RLS Setup

In your [Supabase Dashboard](https://supabase.com/dashboard) -> **SQL Editor**, execute the migration file located at:  
👉 `supabase/migrations/20261105000000_shifan_portfolio_init.sql`

### What this migration configures:
1. **8 Data Tables:** `profiles`, `feedback`, `feedback_replies`, `feedback_revisions`, `feedback_reports`, `persistent_rate_limits`, `admin_otps`, `admin_trusted_ips`.
2. **Secure Public Views:** `public_feedback_view` and `public_replies_view` granted to `anon` and `authenticated`. Raw tables are strictly restricted to `service_role`.
3. **Atomic Concurrency-Safe Rate Limiting Function:** `check_and_increment_rate_limit(p_key, p_max_limit, p_window_ms)`: A single atomic SQL upsert with row-level locks preventing race conditions during concurrent burst traffic on both brand-new and existing keys.
4. **Atomic Network-Bound OTP Verification Function:** `verify_and_consume_admin_otp(p_email, p_otp_hash, p_ip_hash)`: Locks pending OTP records with `FOR UPDATE`, verifies network IP binding, enforces 5-attempt limit and 10-minute expiry, and atomically consumes the OTP in a single transaction.

---

## 4. Key Generation Commands

### Option A: Using Node.js
```bash
# 1. Generate ADMIN_PASSWORD_HASH:
node -e "
const crypto = require('crypto');
const pwd = 'YourChosenStrongPasswordHere';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(pwd, salt, 100000, 64, 'sha512').toString('hex');
console.log('ADMIN_PASSWORD_HASH=' + salt + ':' + hash);
"

# 2. Generate 32-byte Random Secrets for ADMIN_SESSION_SECRET & IP_HASH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option B: Using Windows PowerShell
```powershell
# 1. Generate 32-byte Random Secrets:
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.BitConverter]::ToString($bytes).Replace("-","").ToLower()

# 2. Generate PBKDF2 Password Hash:
$password = "YourChosenStrongPasswordHere"
$saltBytes = New-Object byte[] 16
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($saltBytes)
$saltHex = [System.BitConverter]::ToString($saltBytes).Replace("-","").ToLower()
$pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($password, $saltBytes, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA512)
$hashHex = [System.BitConverter]::ToString($pbkdf2.GetBytes(64)).Replace("-","").ToLower()
Write-Host "ADMIN_PASSWORD_HASH=$($saltHex):$($hashHex)"
```
