import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Use Turbopack for more stable HMR with Tailwind v4
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/postcss'],
      },
    },
  },
};

export default nextConfig;
