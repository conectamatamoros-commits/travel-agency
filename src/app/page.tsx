import Image from 'next/image'

export default function HomePage() {
  const eventos = [
    {
      slug: 'morat',
      nombre: 'Morat 2026',
      fecha: '02 Diciembre 2026',
      htmlFile: '/eventos/informacion-tour-morat.html',
      color: '#378ADD',
    },
    {
      slug: 'kenia-os',
      nombre: 'Kenia Os',
      fecha: 'Próximamente',
      htmlFile: '/eventos/informacion-tour-kenia-os.html',
      color: '#ff2d78',
    },
    {
      slug: 'arjona',
      nombre: 'Ricardo Arjona',
      fecha: 'Próximamente',
      htmlFile: '/eventos/informacion-tour-arjona.html',
      color: '#5DCAA5',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black border-b
