import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude problematic directories from webpack scanning
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/C:/Users/user/Cookies/**',
        '**/C:/Users/user/Application Data/**',
        '**/C:/Users/*/Cookies/**',
        '**/C:/Users/*/Application Data/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
