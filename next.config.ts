import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Increase timeout for chunk loading
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Improve chunking strategy
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
  },
  // Add transpilation settings to fix syntax errors
  transpilePackages: [],
  // Configure webpack to handle special assets properly
  webpack: (config) => {
    // Improve error handling
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

export default nextConfig;
