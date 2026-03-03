import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  devIndicators: false,
  allowedDevOrigins: ['*.replit.dev', '*.replit.app', '*.worf.replit.dev'],
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

export default nextConfig;
