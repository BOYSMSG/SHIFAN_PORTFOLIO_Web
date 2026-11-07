import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  hashIp,
  verifyPassword,
  createOtp,
  verifyOtp,
  isIpTrusted,
  addTrustedIp,
  sendOtpEmail,
  createSessionToken,
  verifyAdminSessionFromRequest,
  isAuthorizedAdminEmail,
} from '@/lib/auth';
import { checkDbRateLimit } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const body = await req.json();
    const { action } = body;

    // Dev-only rate limit reset for automated test suites
    if (process.env.NODE_ENV !== 'production' && action === 'dev-reset-rate-limit') {
      const { resetDevRateLimits } = await import('@/lib/supabase');
      resetDevRateLimits();
      return NextResponse.json({ success: true, message: 'Dev rate limits reset.' });
    }

    // ==========================================
    // ACTION: LOGIN (Step 1: Password & IP check)
    // ==========================================
    if (action === 'login') {
      const rateCheck = await checkDbRateLimit(`login:${ipHash}`, 5, 15 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Locked out for 15 minutes.' },
          { status: 429 }
        );
      }

      const { email, password } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !isAuthorizedAdminEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Access denied: unrecognized administrator email.' }, { status: 403 });
      }

      const storedHash = process.env.ADMIN_PASSWORD_HASH || '';
      const cleanPassword = typeof password === 'string' ? password.trim() : '';
      const passwordOk = verifyPassword(password, storedHash) || verifyPassword(cleanPassword, storedHash);

      if (!passwordOk) {
        return NextResponse.json({ error: 'Invalid password. Please verify and retry.' }, { status: 401 });
      }

      // Direct authorized login for verified Admin Credentials
      const token = createSessionToken(cleanEmail, ipHash);
      const res = NextResponse.json({
        success: true,
        directLogin: true,
        trustedIp: true,
        message: 'Welcome back, Mohd Shifan! Admin access granted.',
      });

      res.cookies.set('shifan_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return res;
    }

    // ==========================================
    // ACTION: VERIFY-OTP (Step 2: OTP validation)
    // ==========================================
    if (action === 'verify-otp') {
      const rateCheck = await checkDbRateLimit(`otp:${ipHash}`, 5, 15 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json({ error: 'Too many OTP attempts. Please wait 15 minutes.' }, { status: 429 });
      }

      const { email, otp, trustThisIp } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !isAuthorizedAdminEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid administrator email.' }, { status: 403 });
      }

      // Verify OTP bound to the current request IP hash
      const result = await verifyOtp(cleanEmail, otp, ipHash);
      if (!result.valid) {
        return NextResponse.json({ error: result.reason || 'Invalid OTP code.' }, { status: 400 });
      }

      // Add to trusted IPs if requested or on initial setup
      if (trustThisIp !== false) {
        await addTrustedIp(ipHash);
      }

      const token = createSessionToken(cleanEmail, ipHash);
      const res = NextResponse.json({
        success: true,
        message: 'Security verification successful. Session established.',
      });

      res.cookies.set('shifan_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60,
      });

      return res;
    }

    // ==========================================
    // ACTION: LOGOUT
    // ==========================================
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      res.cookies.set('shifan_admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      return res;
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    console.error('Admin Auth POST error:', err);
    return NextResponse.json({ error: 'Internal security authentication error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session || !isAuthorizedAdminEmail(session.email)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
  });
}
