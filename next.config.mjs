/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Isolate dev cache from production build so `next build` never wipes out running dev CSS
  distDir: isDev ? '.next-dev' : '.next',
};

export default nextConfig;
