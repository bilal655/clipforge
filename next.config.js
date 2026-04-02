/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg'],
  },
}

module.exports = nextConfig
