/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  // Configurar headers para servir archivos HTML
  async headers() {
    return [
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html',
          },
        ],
      },
    ]
  },
  // Configurar rewrites para servir archivos HTML desde public
  async rewrites() {
    return [
      {
        source: '/informacion-tour-kenia-os.html',
        destination: '/informacion-tour-kenia-os.html',
      },
      {
        source: '/informacion-tour-morat.html',
        destination: '/informacion-tour-morat.html',
      },
      {
        source: '/informacion-tour-arjona.html',
        destination: '/informacion-tour-arjona.html',
      },
      {
        source: '/informacion-tour-young-miko.html',
        destination: '/informacion-tour-young-miko.html',
      },
      {
        source: '/informacion-pulso.html',
        destination: '/informacion-pulso.html',
      },
    ]
  },
}

module.exports = nextConfig
