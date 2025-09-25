const withNextIntl = require('next-intl/plugin')('./src/i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/register', destination: '/register', permanent: true },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
