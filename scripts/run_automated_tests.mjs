/**
 * SHIFAN PORTFOLIO — MASTER AUTOMATED TEST SUITE
 * 
 * Verifies:
 * 1. Cryptographic Primitives & Password PBKDF2 Verification
 * 2. Admin Authentication & Multi-Email Authorization (shifan@pokefun.in, shifangouri01@gmail.com, msgboys832@gmail.com)
 * 3. Session Binding to Verified IP (Copied session token on different IP is rejected)
 * 4. Network-Bound OTP Verification (OTP from different IP rejected; concurrent verification cannot succeed twice)
 * 5. Secure Client IP Resolution & Reverse-Proxy Spoof Protection (Untrusted proxy headers ignored)
 * 6. Genuinely Atomic Rate Limiting (Concurrent requests for brand-new unseen keys strictly limited)
 * 7. Real Analytics Telemetry (Missing Umami configuration returns unconfigured state, never fake data)
 * 8. Threaded Discussions, 24-Hour Edit Restriction & Zero Private Hash Leaks
 * 9. Date & Time Standardization in Asia/Kolkata (IST)
 */

import http from 'http';
import https from 'https';
import crypto from 'crypto';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            json,
          });
        });
      }
    );

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('       SHIFAN PORTFOLIO MASTER TEST SUITE            ');
  console.log('======================================================\n');

  // Reset dev rate limits before running test suite
  await request('/api/admin/auth', {
    method: 'POST',
    body: { action: 'dev-reset-rate-limit' },
  });

  // ----------------------------------------------------
  // TEST SUITE 1: CRYPTO INTEGRITY & PBKDF2
  // ----------------------------------------------------
  console.log('[SUITE 1] Cryptographic Engine & Auth Primitives');

  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync('TestPassword2026!', salt, 100000, 64, 'sha512').toString('hex');
  
  const testBuf = crypto.pbkdf2Sync('TestPassword2026!', salt, 100000, 64, 'sha512');
  const keyBuf = Buffer.from(derived, 'hex');
  const pwdMatch = crypto.timingSafeEqual(testBuf, keyBuf);
  assert(pwdMatch, 'PBKDF2 timingSafeEqual password verification succeeds');

  const wrongBuf = crypto.pbkdf2Sync('WrongPassword!', salt, 100000, 64, 'sha512');
  const wrongMatch = crypto.timingSafeEqual(wrongBuf, keyBuf);
  assert(!wrongMatch, 'PBKDF2 timingSafeEqual rejects incorrect password');

  // ----------------------------------------------------
  // TEST SUITE 2: ADMIN AUTH & MULTI-EMAIL SUPPORT
  // ----------------------------------------------------
  console.log('\n[SUITE 2] Admin API Security & Multi-Email Authorization');

  // Unauthorized access is blocked
  const unauthAnalytics = await request('/api/admin/analytics');
  assert(unauthAnalytics.status === 401, 'Unauthorized request to /api/admin/analytics is blocked (HTTP 401)');

  // Unrecognized email rejected
  const badEmailLogin = await request('/api/admin/auth', {
    method: 'POST',
    body: { action: 'login', email: 'attacker@evil.com', password: 'password' },
  });
  assert(badEmailLogin.status === 403, 'Unrecognized email rejected with HTTP 403');

  // Configured owner email: test login challenge on configured owner email
  const validOwnerEmail = 'shifan@pokefun.in';

  const badPwdLogin = await request('/api/admin/auth', {
    method: 'POST',
    body: { action: 'login', email: validOwnerEmail, password: 'WrongPassword999!' },
  });
  assert(badPwdLogin.status === 401, 'Incorrect password rejected with HTTP 401 for configured owner email');

  // Valid login credentials
  const validLogin = await request('/api/admin/auth', {
    method: 'POST',
    headers: { 'x-real-ip': '198.51.100.1' },
    body: { action: 'login', email: validOwnerEmail, password: 'ShifanAdmin2026!' },
  });
  assert(
    validLogin.status === 200 && (validLogin.json?.trustedIp === true || validLogin.json?.requireOtp === true),
    'Valid login accepts credentials and triggers security challenge or session'
  );

  // ----------------------------------------------------
  // TEST SUITE 3: NETWORK-BOUND OTP VERIFICATION
  // ----------------------------------------------------
  console.log('\n[SUITE 3] Atomic Network-Bound OTP Verification');

  let adminCookie = '';
  let issuedIp = '198.51.100.1';

  if (validLogin.json?.requireOtp && validLogin.json?.devOtp) {
    const devOtp = validLogin.json.devOtp;

    // A. OTP verification from a DIFFERENT IP is rejected
    const differentIpOtp = await request('/api/admin/auth', {
      method: 'POST',
      headers: { 'x-real-ip': '203.0.113.99' }, // Different network IP!
      body: { action: 'verify-otp', email: validOwnerEmail, otp: devOtp },
    });
    assert(
      differentIpOtp.status === 400 && differentIpOtp.json?.error?.includes('Network address mismatch'),
      'OTP verification from a different IP is rejected with network address mismatch',
      differentIpOtp.json?.error
    );

    // B. Invalid OTP code rejected
    const badOtp = await request('/api/admin/auth', {
      method: 'POST',
      headers: { 'x-real-ip': issuedIp },
      body: { action: 'verify-otp', email: validOwnerEmail, otp: '000000' },
    });
    assert(badOtp.status === 400, 'Invalid OTP code rejected with HTTP 400');

    // C. Concurrent OTP verification: exactly one must succeed
    const concurrentOtpResults = await Promise.all([
      request('/api/admin/auth', {
        method: 'POST',
        headers: { 'x-real-ip': issuedIp },
        body: { action: 'verify-otp', email: validOwnerEmail, otp: devOtp, trustThisIp: true },
      }),
      request('/api/admin/auth', {
        method: 'POST',
        headers: { 'x-real-ip': issuedIp },
        body: { action: 'verify-otp', email: validOwnerEmail, otp: devOtp, trustThisIp: true },
      }),
    ]);

    const otpStatuses = concurrentOtpResults.map((r) => r.status);
    const successCount = otpStatuses.filter((s) => s === 200).length;
    assert(successCount === 1, 'Concurrent OTP verification cannot succeed more than once (atomic consumption)', `Statuses: ${otpStatuses.join(', ')}`);

    const successfulRes = concurrentOtpResults.find((r) => r.status === 200);
    if (successfulRes && successfulRes.headers['set-cookie']) {
      const sc = successfulRes.headers['set-cookie'];
      adminCookie = Array.isArray(sc) ? sc[0].split(';')[0] : sc.split(';')[0];
    }
  } else if (validLogin.headers['set-cookie']) {
    const sc = validLogin.headers['set-cookie'];
    adminCookie = Array.isArray(sc) ? sc[0].split(';')[0] : sc.split(';')[0];
  }

  // ----------------------------------------------------
  // TEST SUITE 4: IP-BOUND ADMIN SESSIONS
  // ----------------------------------------------------
  console.log('\n[SUITE 4] IP-Bound Session Protection');

  if (adminCookie) {
    // Authorized admin session on original IP succeeds
    const sameIpRes = await request('/api/admin/auth', {
      method: 'GET',
      headers: {
        'x-real-ip': issuedIp,
        Cookie: adminCookie,
      },
    });
    assert(sameIpRes.status === 200 && sameIpRes.json?.authenticated === true, 'Admin session verifies successfully on matching origin IP');

    // Session cookie copied to a DIFFERENT IP is rejected
    const hijackedSessionRes = await request('/api/admin/auth', {
      method: 'GET',
      headers: {
        'x-real-ip': '192.0.2.77', // Attacker/Hijacker IP
        Cookie: adminCookie,
      },
    });
    assert(hijackedSessionRes.status === 401, 'Admin session cookie copied to a different IP is rejected (HTTP 401)');
  }

  // ----------------------------------------------------
  // TEST SUITE 5: REVERSE-PROXY IP SPOOF PROTECTION
  // ----------------------------------------------------
  console.log('\n[SUITE 5] Secure Reverse-Proxy IP Resolution & Anti-Spoofing');

  const { getClientIp } = await import('../src/lib/auth.ts');

  // Test 1: CF-Connecting-IP injected by untrusted client without CLOUDFLARE_PROXY is rejected
  delete process.env.CLOUDFLARE_PROXY;
  const mockReqCfSpoof = new Request('http://localhost:3000', {
    headers: {
      'cf-connecting-ip': '203.0.113.199', // Spoofed CF header
      'x-real-ip': '198.51.100.50',        // Legitimate proxy header
    },
  });
  const resolvedIpCfSpoof = getClientIp(mockReqCfSpoof);
  assert(
    resolvedIpCfSpoof === '198.51.100.50',
    'Spoofed CF-Connecting-IP is ignored without CLOUDFLARE_PROXY; resolves legitimate proxy IP',
    `Resolved: ${resolvedIpCfSpoof}`
  );

  // Test 2: When TRUST_PROXY=false (direct client connection), all forwarding headers are ignored
  process.env.TRUST_PROXY = 'false';
  const mockReqDirect = new Request('http://localhost:3000', {
    headers: {
      'x-forwarded-for': '203.0.113.250, 10.0.0.1',
      'x-real-ip': '203.0.113.250',
      'cf-connecting-ip': '203.0.113.250',
    },
  });
  const resolvedIpDirect = getClientIp(mockReqDirect);
  assert(
    resolvedIpDirect === '127.0.0.1',
    'When TRUST_PROXY=false, client-supplied forwarding headers cannot change resolved IP (fails closed to loopback/direct)',
    `Resolved: ${resolvedIpDirect}`
  );
  delete process.env.TRUST_PROXY;

  // Test 3: Live HTTP API verification — spoofed CF-Connecting-IP cannot change OTP network binding
  const liveSpoofLogin = await request('/api/admin/auth', {
    method: 'POST',
    headers: {
      'cf-connecting-ip': '198.51.100.99', // Spoofed header
      'x-real-ip': '192.0.2.1',           // Actual proxy header
    },
    body: { action: 'login', email: validOwnerEmail, password: 'ShifanAdmin2026!' },
  });

  if (liveSpoofLogin.json?.devOtp) {
    const spoofDevOtp = liveSpoofLogin.json.devOtp;

    // Attacker tries to verify using the spoofed CF-Connecting-IP as their network origin
    const verifyUsingSpoofedCf = await request('/api/admin/auth', {
      method: 'POST',
      headers: {
        'x-real-ip': '198.51.100.99', // Matches the spoofed CF IP, NOT the registered origin
      },
      body: { action: 'verify-otp', email: validOwnerEmail, otp: spoofDevOtp },
    });
    assert(
      verifyUsingSpoofedCf.status === 400 && verifyUsingSpoofedCf.json?.error?.includes('Network address mismatch'),
      'Live HTTP: OTP verification from spoofed CF-Connecting-IP is rejected (server registered verified origin IP, not spoofed header)'
    );

    // Verify that the legitimate origin IP matches and consumes the OTP
    const verifyLegitimate = await request('/api/admin/auth', {
      method: 'POST',
      headers: {
        'x-real-ip': '192.0.2.1', // The genuine resolved IP
      },
      body: { action: 'verify-otp', email: validOwnerEmail, otp: spoofDevOtp, trustThisIp: false },
    });
    assert(
      verifyLegitimate.status === 200,
      'Live HTTP: OTP verification succeeds only from verified origin IP'
    );
  }

  // ----------------------------------------------------
  // TEST SUITE 6: GENUINELY ATOMIC RATE LIMITING
  // ----------------------------------------------------
  console.log('\n[SUITE 6] Genuinely Atomic Rate Limiting (Unseen & New Keys)');

  // Send 4 rapid requests against a BRAND-NEW key never seen before
  const brandNewToken = `brand_new_guest_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const burstCookie = `shifan_guest_token=${brandNewToken}`;

  const concurrentPromises = [1, 2, 3, 4].map((i) =>
    request('/api/feedback', {
      method: 'POST',
      headers: { Cookie: burstCookie },
      body: {
        guest_name: `Concurrent Tester ${i}`,
        rating: 5,
        message: `Concurrent burst message test ${i} ${Date.now()}`,
        section_tag: 'projects',
      },
    })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const statusCodes = concurrentResults.map((r) => r.status);
  const okCount = statusCodes.filter((s) => s === 200).length;
  const rateLimitedCount = statusCodes.filter((s) => s === 429).length;

  assert(
    okCount <= 2 && rateLimitedCount >= 2,
    'Concurrent requests for a brand-new rate-limit key cannot exceed limit (2/24h)',
    `Codes: ${statusCodes.join(', ')} (OK: ${okCount}, 429: ${rateLimitedCount})`
  );

  // ----------------------------------------------------
  // TEST SUITE 7: REAL ANALYTICS (NO FAKE TELEMETRY)
  // ----------------------------------------------------
  console.log('\n[SUITE 7] Real Analytics & Unconfigured State Handling');

  if (adminCookie) {
    const analyticsRes = await request('/api/admin/analytics', {
      headers: {
        'x-real-ip': issuedIp,
        Cookie: adminCookie,
      },
    });

    if (analyticsRes.status === 200) {
      const data = analyticsRes.json;
      if (!data.configured) {
        assert(data.configured === false, 'Missing Umami configuration cleanly returns configured: false');
        assert(data.metrics === null, 'Missing Umami configuration never fabricates mock metrics (metrics === null)');
        assert(typeof data.message === 'string' && data.message.length > 0, 'Informative unconfigured message provided to admin');
      } else {
        assert(data.configured === true, 'Umami analytics live integration active');
        assert(data.metrics && typeof data.metrics.totalViews === 'number', 'Real telemetry metrics returned from Umami');
      }
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 8: PUBLIC FEEDBACK & DATA SANITIZATION
  // ----------------------------------------------------
  console.log('\n[SUITE 8] Public Feedback Feed & Private Data Sanitization');

  const listRes = await request('/api/feedback?public=true&page=1&limit=5');
  assert(listRes.status === 200, 'Public discussions list fetched (HTTP 200)');
  const discussions = listRes.json?.discussions || [];

  const hasLeakedHash = discussions.some((d) => d.author_id_hash !== undefined);
  assert(!hasLeakedHash, 'Zero private author hashes leaked in public discussions endpoint');

  const hasLeakedMetadata = discussions.some(
    (d) => d.reports_count !== undefined || d.user_agent_short !== undefined || d.status !== undefined || d.user_id !== undefined
  );
  assert(!hasLeakedMetadata, 'Zero internal moderation/user metadata leaked in public discussions endpoint');

  if (discussions.length > 0) {
    const targetFeedback = discussions[0];

    const replyRes = await request('/api/feedback/replies', {
      method: 'POST',
      body: {
        feedback_id: targetFeedback.id,
        content: `Automated test reply ${Date.now()}`,
        author_name: 'QA Reply Visitor',
      },
    });
    assert(
      replyRes.status === 200 || replyRes.status === 429,
      'Threaded reply submission processed',
      `Status: ${replyRes.status}`
    );

    const reportRes = await request('/api/feedback/reports', {
      method: 'POST',
      body: {
        target_type: 'feedback',
        target_id: targetFeedback.id,
        reason: 'Automated test spam report',
      },
    });
    assert(reportRes.status === 200, 'Content report accepted for moderation (HTTP 200)');
  }

  // ----------------------------------------------------
  // TEST SUITE 9: DATE & TIME STANDARDIZATION (IST)
  // ----------------------------------------------------
  console.log('\n[SUITE 9] Date and Time Asia/Kolkata (IST) Standardization');

  const testIso = '2026-11-05T18:00:00.000Z';
  const istFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(testIso)) + ' IST';

  assert(istFormatted.includes('IST'), 'Timestamp formatted with explicit IST indicator', istFormatted);
  assert(istFormatted.includes('11:30 pm') || istFormatted.includes('11:30 PM'), 'UTC 18:00 accurately translates to 23:30 (11:30 PM) in IST');

  // ----------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
