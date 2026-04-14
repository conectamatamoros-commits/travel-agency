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
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Conecta Matamoros</h1>
        </div>
      </header>

      <section className="py-20 text-center">
        <h2 className="text-5xl font-bold mb-8">¡Vive la experiencia! 🎉</h2>
        <p className="text-xl text-gray-300">Viajes a los mejores eventos</p>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Próximos Eventos</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {eventos.map((evento) => (
              
                key={evento.slug}
                href={evento.htmlFile}
                className="block bg-gray-900 rounded-xl p-6 hover:bg-gray-800"
              >
                <h3 className="text-2xl font-bold mb-2" style={{ color: evento.color }}>
                  {evento.nombre}
                </h3>
                <p className="text-gray-400">{evento.fecha}</p>
                <div className="mt-4 text-sm" style={{ color: evento.color }}>
                  Ver detalles →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
