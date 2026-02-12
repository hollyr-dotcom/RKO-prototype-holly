import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['*'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/postcss'],
      },
    },
  },
};

export default nextConfig;
