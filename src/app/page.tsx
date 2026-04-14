export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Conecta Matamoros</h1>
      
      <h2 className="text-2xl mb-8">Proximos Eventos</h2>
      
      <div className="space-y-4">
        <a href="/eventos/informacion-tour-morat.html" className="block bg-gray-900 p-6 rounded">
          <h3 className="text-xl font-bold text-blue-400">Morat 2026</h3>
          <p className="text-gray-400">02 Diciembre 2026</p>
        </a>
        
        <a href="/eventos/informacion-tour-kenia-os.html" className="block bg-gray-900 p-6 rounded">
          <h3 className="text-xl font-bold text-pink-400">Kenia Os</h3>
          <p className="text-gray-400">Proximamente</p>
        </a>
        
        <a href="/eventos/informacion-tour-arjona.html" className="block bg-gray-900 p-6 rounded">
          <h3 className="text-xl font-bold text-green-400">Ricardo Arjona</h3>
          <p className="text-gray-400">Proximamente</p>
        </a>
      </div>
    </div>
  )
}
