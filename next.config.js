/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force refresh by generating new build IDs
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

module.exports = nextConfig
