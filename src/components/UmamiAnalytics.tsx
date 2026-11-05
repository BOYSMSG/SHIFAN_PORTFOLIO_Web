'use client';

import Script from 'next/script';

export default function UmamiAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js';

  if (!websiteId) {
    return null;
  }

  return (
    <Script
      async
      src={scriptUrl}
      data-website-id={websiteId}
      data-auto-track="true"
      strategy="afterInteractive"
    />
  );
}
