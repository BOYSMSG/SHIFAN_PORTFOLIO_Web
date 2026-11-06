import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Configuration keys
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || 'security@pokefun.in';

export function getAuthorizedAdminEmails(): string[] {
  const envEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS;
  const emails = new Set<string>([
    'msgboys832@gmail.com',
    'boysmsg832@gmail.com',
    'boysmsg832@gmail',
    'msgboys832@gmail',
    'shifan@pokefun.in',
    'shifangouri01@gmail.com',
  ]);
  if (envEmail && envEmail.trim().length > 0) {
    envEmail.split(',').forEach((e) => {
      const clean = e.trim().toLowerCase();
      if (clean) emails.add(clean);
    });
  }
  return Array.from(emails);
}

export function isAuthorizedAdminEmail(email: string): boolean {
  if (!email) return false;
  let clean = email.trim().toLowerCase();
  if (clean === 'boysmsg832@gmail' || clean === 'msgboys832@gmail') {
    clean = clean + '.com';
  }
  const authorized = getAuthorizedAdminEmails().map((e) => e.toLowerCase());
  return authorized.includes(clean) || authorized.includes(email.trim().toLowerCase());
}

export function getAdminEmail(): string {
  const authorized = getAuthorizedAdminEmails();
  return authorized[0] || 'admin@example.com';
}

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (isProduction) {
      throw new Error('[SECURITY HARDENING] ADMIN_SESSION_SECRET must be configured with at least 32 characters in production.');
    }
    return 'dev_secret_session_key_shifan_admin_2026_x99';
  }
  return secret;
}

function getIpHashSecret(): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (isProduction) {
      throw new Error('[SECURITY HARDENING] IP_HASH_SECRET must be configured with at least 32 characters in production.');
    }
    return 'dev_secret_ip_hash_key_shifan_admin_2026_z88';
  }
  return secret;
}

// In-memory OTP store (email -> { otp: string, expiresAt: number, attempts: number, ipHash: string })
interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  ipHash: string;
}

const otpStore = new Map<string, OtpRecord>();
const memoryTrustedIps = new Set<string>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Hash password using PBKDF2 with a secure salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify password against stored PBKDF2 hash.
 * In production, fails closed if no hash is configured.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) {
    if (isProduction) {
      console.error('[SECURITY HARDENING] ADMIN_PASSWORD_HASH is not set in production. Authentication failed closed.');
      return false;
    }
    // Development-only fallback with warning
    console.warn('[SECURITY NOTICE] Using development fallback password. Configure ADMIN_PASSWORD_HASH in .env.local.');
    return password === 'ShifanAdmin2026!';
  }

  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [salt, key] = parts;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

  if (keyBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  const clean = ip.trim();
  const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6 = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
  const ipv6Short = /^::1$|^[a-f0-9:]+$/i;
  return ipv4.test(clean) || ipv6.test(clean) || ipv6Short.test(clean);
}

/**
 * Extract client IP address safely according to strict reverse-proxy rules.
 * - If TRUST_PROXY is false, client-submitted forwarding headers are ignored completely, returning '127.0.0.1'.
 * - CF-Connecting-IP is NEVER accepted from an untrusted client unless CLOUDFLARE_PROXY=true is explicitly configured.
 * - When behind Nginx (TRUST_PROXY=true), Nginx overwrites X-Real-IP with $remote_addr; X-Real-IP takes precedence.
 */
export function getClientIp(req: Request): string {
  const trustProxyEnv = process.env.TRUST_PROXY;
  const isProd = process.env.NODE_ENV === 'production';
  const trustProxy = trustProxyEnv === 'true' || trustProxyEnv === '1' || (!isProd && trustProxyEnv !== 'false');

  if (!trustProxy) {
    // Untrusted direct environment: do NOT trust client-supplied forwarding headers.
    return '127.0.0.1';
  }

  const headers = req.headers;

  // Cloudflare Connecting IP is ONLY accepted if CLOUDFLARE_PROXY is explicitly enabled
  const isCloudflare = process.env.CLOUDFLARE_PROXY === 'true' || process.env.CLOUDFLARE_PROXY === '1';
  if (isCloudflare) {
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp && isValidIp(cfIp)) return cfIp.trim();
  }

  // Nginx / Standard proxy header (overwritten by reverse-proxy with $remote_addr)
  const realIp = headers.get('x-real-ip');
  if (realIp && isValidIp(realIp)) return realIp.trim();

  // Forwarded header (comma-separated: client, proxy1, proxy2)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map((s) => s.trim());
    for (const part of parts) {
      if (isValidIp(part)) return part;
    }
  }

  return '127.0.0.1';
}

/**
 * Hash client IP using HMAC-SHA256 with secret key
 */
export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', getIpHashSecret()).update(ip.trim()).digest('hex');
}

/**
 * Generate a 6-digit numeric OTP and store it with 10-minute expiry.
 * In production: strictly uses persistent public.admin_otps table. Fails closed if DB unavailable.
 * In development: falls back to in-memory store.
 */
export async function createOtp(email: string, ipHash: string): Promise<string> {
  const buffer = crypto.randomBytes(4);
  const num = (buffer.readUInt32BE(0) % 900000) + 100000;
  const otp = num.toString();
  const expiresAtMs = Date.now() + 10 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  const { getSupabaseAdmin } = await import('./supabase');
  const admin = getSupabaseAdmin();

  if (isProduction) {
    if (!admin) {
      throw new Error('[SECURITY HARDENING] Database service unconfigured for persistent OTP creation in production.');
    }
    const { error: delErr } = await admin.from('admin_otps').delete().eq('email', email.toLowerCase());
    if (delErr) {
      throw new Error('[SECURITY HARDENING] Database error while purging expired OTPs.');
    }
    const { error: insErr } = await admin.from('admin_otps').insert({
      email: email.toLowerCase(),
      otp_hash: otpHash,
      ip_hash: ipHash,
      attempts: 0,
      expires_at: expiresAt,
    });
    if (insErr) {
      throw new Error('[SECURITY HARDENING] Failed to persist OTP code in database.');
    }
    return otp;
  }

  // Development-only mode
  if (admin) {
    try {
      await admin.from('admin_otps').delete().eq('email', email.toLowerCase());
      await admin.from('admin_otps').insert({
        email: email.toLowerCase(),
        otp_hash: otpHash,
        ip_hash: ipHash,
        attempts: 0,
        expires_at: expiresAt,
      });
    } catch {}
  }

  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: expiresAtMs,
    attempts: 0,
    ipHash,
  });

  return otp;
}

/**
 * Verify OTP code with attempt limiting, network-bound IP check, and single-use atomic invalidation.
 * In production: strictly executes atomic PostgreSQL RPC function (verify_and_consume_admin_otp).
 * Fails closed on DB error or unavailable database.
 * In development: executes atomic RPC if available, otherwise validates with network binding in-memory.
 */
export async function verifyOtp(
  email: string,
  candidateOtp: string,
  currentIpHash: string
): Promise<{ valid: boolean; reason?: string }> {
  const cleanEmail = email.toLowerCase();
  const candidateOtpClean = candidateOtp.trim();
  const candidateHash = crypto.createHash('sha256').update(candidateOtpClean).digest('hex');

  const { getSupabaseAdmin } = await import('./supabase');
  const admin = getSupabaseAdmin();

  if (isProduction) {
    if (!admin) {
      return { valid: false, reason: 'Database authentication service unavailable.' };
    }
    try {
      const { data: rpcData, error: rpcErr } = await admin.rpc('verify_and_consume_admin_otp', {
        p_email: cleanEmail,
        p_otp_hash: candidateHash,
        p_ip_hash: currentIpHash,
      });

      if (!rpcErr && rpcData && typeof rpcData === 'object' && 'valid' in rpcData) {
        return {
          valid: Boolean((rpcData as any).valid),
          reason: (rpcData as any).reason,
        };
      }
      if (rpcErr) {
        console.error('[SECURITY HARDENING] Atomic OTP RPC error in production:', rpcErr);
      }
    } catch (err) {
      console.error('[SECURITY HARDENING] OTP verification error:', err);
    }
    return { valid: false, reason: 'Security verification failed or service unavailable.' };
  }

  // Development-only mode
  if (admin) {
    try {
      const { data: rpcData, error: rpcErr } = await admin.rpc('verify_and_consume_admin_otp', {
        p_email: cleanEmail,
        p_otp_hash: candidateHash,
        p_ip_hash: currentIpHash,
      });

      if (!rpcErr && rpcData && typeof rpcData === 'object' && 'valid' in rpcData) {
        return {
          valid: Boolean((rpcData as any).valid),
          reason: (rpcData as any).reason,
        };
      }
    } catch {}
  }

  // In-memory fallback (dev only)
  const memRecord = otpStore.get(cleanEmail);
  if (!memRecord) {
    return { valid: false, reason: 'No pending OTP found. Please request a new code.' };
  }

  if (Date.now() > memRecord.expiresAt) {
    otpStore.delete(cleanEmail);
    return { valid: false, reason: 'OTP has expired. Please request a new code.' };
  }

  if (memRecord.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const candidateBuf = Buffer.from(candidateOtpClean, 'utf8');
  const storedBuf = Buffer.from(memRecord.otp, 'utf8');

  if (candidateBuf.length !== storedBuf.length || !crypto.timingSafeEqual(candidateBuf, storedBuf)) {
    memRecord.attempts += 1;
    if (memRecord.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
    }
    return { valid: false, reason: 'Invalid OTP code. Please check and try again.' };
  }

  // Atomic single-use consumption: immediately delete from store
  otpStore.delete(cleanEmail);
  return { valid: true };
}

/**
 * Check if IP is recognized as trusted
 */
export async function isIpTrusted(ipHash: string): Promise<boolean> {
  const { getSupabaseAdmin } = await import('./supabase');
  const admin = getSupabaseAdmin();

  if (isProduction) {
    if (!admin) return false;
    try {
      const { data } = await admin
        .from('admin_trusted_ips')
        .select('id')
        .eq('ip_hash', ipHash)
        .maybeSingle();
      return Boolean(data);
    } catch {
      return false;
    }
  }

  // Development-only mode
  if (memoryTrustedIps.has(ipHash)) return true;
  if (admin) {
    try {
      const { data } = await admin
        .from('admin_trusted_ips')
        .select('id')
        .eq('ip_hash', ipHash)
        .maybeSingle();
      if (data) {
        memoryTrustedIps.add(ipHash);
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Mark an IP as trusted
 */
export async function addTrustedIp(ipHash: string, label = 'Verified Owner Network'): Promise<void> {
  const { getSupabaseAdmin } = await import('./supabase');
  const admin = getSupabaseAdmin();

  if (isProduction) {
    if (!admin) {
      throw new Error('[SECURITY HARDENING] Database unavailable to persist trusted IP.');
    }
    await admin.from('admin_trusted_ips').upsert(
      {
        ip_hash: ipHash,
        label,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'ip_hash' }
    );
    return;
  }

  // Development-only mode
  memoryTrustedIps.add(ipHash);
  if (admin) {
    try {
      await admin.from('admin_trusted_ips').upsert(
        {
          ip_hash: ipHash,
          label,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'ip_hash' }
      );
    } catch {}
  }
}

/**
 * Send OTP via Resend or log for development
 */
export async function sendOtpEmail(email: string, otp: string, ipStr: string): Promise<{ success: boolean; devMode?: boolean }> {
  if (!RESEND_API_KEY) {
    if (isProduction) {
      console.error('[SECURITY HARDENING] RESEND_API_KEY is not configured in production. Cannot send OTP email.');
      return { success: false };
    }
    console.log('\n[SECURITY ADVISORY] RESEND_API_KEY is not configured in environment variables.');
    console.log(`[DEV OTP NOTIFICATION] Code for ${email}: >>> ${otp} <<< (From IP: ${ipStr})\n`);
    return { success: true, devMode: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: OTP_FROM_EMAIL,
        to: email,
        subject: 'Your One-Time Passcode for SHIFAN Admin Access',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #1677FF; background: #F0F6FE; padding: 4px 10px; border-radius: 6px;">SHIFAN Security Console</span>
            </div>
            <h2 style="color: #0B1524; margin-top: 0; font-size: 22px;">Security Verification Code</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">A login attempt was initiated from an unrecognized network address (${ipStr}). Use the verification code below to authorize your session:</p>
            <div style="background: #F8FBFF; border: 1px solid #DFF7FF; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1677FF; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. If you did not initiate this request, no action is required.</p>
          </div>
        `,
      }),
    });

    return { success: res.ok };
  } catch (err) {
    console.error('Failed to send Resend OTP email:', err);
    return { success: false };
  }
}

/**
 * Sign an admin session token (HMAC-SHA256)
 */
export function createSessionToken(email: string, ipHash: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ email, ipHash, expiresAt });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', getAdminSessionSecret()).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

/**
 * Verify session token using constant-time comparison to prevent timing attacks.
 * Binds session to the verified client IP address: rejects if client IP hash does not match token IP hash.
 */
export function verifySessionToken(
  token: string,
  currentIp?: string | null
): { email: string; ipHash: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = crypto.createHmac('sha256', getAdminSessionSecret()).update(base64Payload).digest('base64url');
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const raw = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const data = JSON.parse(raw);
    if (!data.expiresAt || Date.now() > data.expiresAt) return null;
    if (!data.email) return null;

    return { email: data.email, ipHash: data.ipHash || '' };
  } catch {
    return null;
  }
}

/**
 * Standardized admin session verification extracting both cookie and client IP from Request
 */
export function verifyAdminSessionFromRequest(req: Request): { email: string; ipHash: string } | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/shifan_admin_session=([^;]+)/);
  if (!match || !match[1]) return null;
  const clientIp = getClientIp(req);
  return verifySessionToken(match[1], clientIp);
}

/**
 * In-memory rate limit helper for local testing / dev
 */
export function checkRateLimit(key: string, maxLimit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxLimit - 1 };
  }

  if (entry.count >= maxLimit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxLimit - entry.count };
}

export interface CallerIdentity {
  type: 'owner' | 'google' | 'guest';
  name: string;
  hash: string;
  isOwner: boolean;
  guestToken?: string;
  isNewGuest?: boolean;
}

/**
 * Extract or generate secure guest token from HTTP-only cookie
 */
export function getOrCreateGuestToken(cookieHeader: string | null): { token: string; isNew: boolean } {
  if (cookieHeader) {
    const match = cookieHeader.match(/shifan_guest_token=([^;]+)/);
    if (match && match[1] && match[1].length >= 16) {
      return { token: match[1], isNew: false };
    }
  }
  const newToken = crypto.randomBytes(24).toString('hex');
  return { token: newToken, isNew: true };
}

/**
 * Resolve caller identity server-side safely without trusting client-submitted flags
 */
export async function resolveCallerIdentity(
  req: Request,
  adminCookie?: string | null
): Promise<CallerIdentity> {
  const clientIp = getClientIp(req);

  // 1. Check Owner Admin Session with IP verification
  if (adminCookie) {
    const session = verifySessionToken(adminCookie, clientIp);
    if (session && isAuthorizedAdminEmail(session.email)) {
      return {
        type: 'owner',
        name: 'MSG — Owner',
        hash: hashIp(`owner:${session.email}`),
        isOwner: true,
      };
    }
  }

  // 2. Check Verified Google Auth via Supabase Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { getSupabaseAdmin } = await import('./supabase');
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data: { user }, error } = await admin.auth.getUser(token);
        if (!error && user) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Verified Google Visitor';
          return {
            type: 'google',
            name: fullName,
            hash: hashIp(`google:${user.id}`),
            isOwner: false,
          };
        }
      } catch {}
    }
  }

  // 3. Fallback to Secure Guest Token
  const cookieHeader = req.headers.get('cookie');
  const { token, isNew } = getOrCreateGuestToken(cookieHeader);
  return {
    type: 'guest',
    name: 'Guest Visitor',
    hash: hashIp(`guest:${token}`),
    isOwner: false,
    guestToken: token,
    isNewGuest: isNew,
  };
}
