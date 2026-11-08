/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: async () => 'build-' + Date.now(),
  // Isolate dev cache from production build so `next build` never wipes out running dev CSS
  distDir: isDev ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
