import type { Metadata, Viewport } from 'next';
import './globals.css';
import UmamiAnalytics from '@/components/UmamiAnalytics';

export const metadata: Metadata = {
  title: 'Mohd Shifan Gouri (BOYS MSG) | Developer · Founder · AI Practitioner',
  description: 'Official portfolio for Mohd Shifan Gouri (BOYS MSG). Founder of Pokefun ecosystem, Gouri Fashions operational partner, software developer, and creator.',
  keywords: [
    'Mohd Shifan Gouri',
    'BOYS MSG',
    'Pokefun',
    'Pokefun SMP',
    'CobbleDrock',
    'Pokedrock',
    'Gouri Fashions',
    'Minecraft server architect',
    'Developer Portfolio',
    'AI practitioner'
  ],
  authors: [{ name: 'Mohd Shifan Gouri', url: 'https://github.com/BOYSMSG' }],
  metadataBase: new URL('https://shifan.pokefun.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mohd Shifan Gouri (BOYS MSG) | Developer · Founder · AI Practitioner',
    description: 'Engineering systems, scaling communities, and applying pragmatic AI development.',
    url: 'https://shifan.pokefun.in',
    siteName: 'Mohd Shifan Gouri Portfolio',
    images: [
      {
        url: '/assets/Golden Hour Rooftop Portrait(1).png',
        width: 1200,
        height: 1500,
        alt: 'Mohd Shifan Gouri (BOYS MSG)',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mohd Shifan Gouri (BOYS MSG)',
    description: 'Developer · Founder · AI Practitioner · Creator',
    images: ['/assets/Golden Hour Rooftop Portrait(1).png'],
  },
  icons: {
    icon: [
      { url: '/assets/icon32x32.png?v=pokefun', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico?v=pokefun' },
    ],
    shortcut: '/assets/icon32x32.png?v=pokefun',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#1677FF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('shifan_intro_dismissed')==='true'){document.documentElement.classList.add('intro-dismissed');}}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-ice-50 text-midnight-900 antialiased selection:bg-electric-cyan/30 selection:text-midnight-900 min-h-screen">
        {children}
        <UmamiAnalytics />
      </body>
    </html>
  );
}
