import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  devIndicators: false,
  allowedDevOrigins: ['*'],
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile photos
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/postcss'],
      },
    },
  },
};

export default nextConfig;
