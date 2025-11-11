import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Temporarily skip ESLint in next build to avoid incompatible CLI options
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
