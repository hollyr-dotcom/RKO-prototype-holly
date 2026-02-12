import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Firebase App Hosting
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
