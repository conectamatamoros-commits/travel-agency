import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TravelDesk - Agencia de Viajes',
  description: 'Panel de gestión para agencia de viajes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  )
}
