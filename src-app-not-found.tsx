import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <Image 
          src="/blanco con negro.png" 
          alt="Conecta Matamoros" 
          width={120} 
          height={120}
          className="mx-auto mb-8 rounded-lg"
        />
        
        <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
        <h2 className="text-2xl md:text-4xl font-bold mb-6">
          ¡Ups! Esta página no existe
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Parece que este viaje aún no está disponible
        </p>
        
        <Link 
          href="/"
          className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
        >
          ← Volver a todos los viajes
        </Link>
      </div>
    </div>
  )
}
