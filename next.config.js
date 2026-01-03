/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
  },
  trailingSlash: true,
  // Disable server-side features for static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

