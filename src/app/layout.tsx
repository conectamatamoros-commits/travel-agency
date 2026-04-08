import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
 title: 'Conecta Matamoros',
  description: 'Agencia de viajes Conecta Matamoros',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  )
}
