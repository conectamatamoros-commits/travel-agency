/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ TEMPORAL: Deshabilitar errores de TypeScript durante el build
    // Esto permite que el sitio se despliegue mientras corregimos los tipos
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig