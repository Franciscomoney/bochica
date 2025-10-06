import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['155.138.165.47', 'localhost']
    }
  }
};

export default nextConfig;
