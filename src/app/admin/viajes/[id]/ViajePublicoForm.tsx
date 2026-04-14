'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ViajePublicoFormProps {
  viaje: any
}

export default function ViajePublicoForm({ viaje }: ViajePublicoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  
  const [formData, setFormData] = useState({
    publico: viaje.publico || false,
    slug: viaje.slug || '',
    imagen_portada: viaje.imagen_portada || '',
    descripcion: viaje.descripcion || '',
    whatsapp_inscripcion: viaje.whatsapp_inscripcion || '',
    incluye: viaje.incluye || [],
    no_incluye: viaje.no_incluye || [],
    itinerario: viaje.itinerario || []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    try {
      const { error } = await supabase
        .from('viajes')
        .update(formData)
        .eq('id', viaje.id)

      if (error) throw error

      setMensaje('✅ Configuración guardada correctamente')
      router.refresh()
      
      setTimeout(() => setMensaje(''), 3000)
    } catch (error: any) {
      setMensaje('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para agregar items a arrays
  const agregarItem = (campo: 'incluye' | 'no_incluye', valor: string) => {
    if (valor.trim()) {
      setFormData({
        ...formData,
        [campo]: [...formData[campo], valor.trim()]
      })
    }
  }

  // Función para eliminar items de arrays
  const eliminarItem = (campo: 'incluye' | 'no_incluye', index: number) => {
    setFormData({
      ...formData,
      [campo]: formData[campo].filter((_item: string, i: number) => i !== index)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>🌐</span>
        Configuración Página Pública
      </h2>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 ${
          mensaje.startsWith('✅') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Toggle Público */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-bold text-lg">Mostrar en página pública</h3>
            <p className="text-sm text-gray-600">
              Los usuarios podrán ver este viaje en conectamatamoros.com
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.publico}
              onChange={(e) => setFormData({ ...formData, publico: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Slug (URL) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL del viaje (slug)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">conectamatamoros.com/viaje/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ 
                ...formData, 
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="morat-2025"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Solo letras minúsculas, números y guiones
          </p>
        </div>

        {/* Imagen de Portada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL de imagen de portada
          </label>
          <input
            type="url"
            value={formData.imagen_portada}
            onChange={(e) => setFormData({ ...formData, imagen_portada: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/imagen.jpg"
          />
          {formData.imagen_portada && (
            <img 
              src={formData.imagen_portada} 
              alt="Preview" 
              className="mt-2 w-full h-48 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del viaje
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe la experiencia del viaje..."
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link de WhatsApp para inscripciones
          </label>
          <input
            type="url"
            value={formData.whatsapp_inscripcion}
            onChange={(e) => setFormData({ ...formData, whatsapp_inscripcion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://wa.me/528681234567?text=Hola..."
          />
        </div>

        {/* Lo que incluye */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué incluye?
          </label>
          <div className="space-y-2">
            {formData.incluye.map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                  ✓ {item}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarItem('incluye', index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                id="nuevo-incluye"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Transporte en autobús de lujo"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('nuevo-incluye') as HTMLInputElement
                  agregarItem('incluye', input.value)
                  input.value = ''
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Lo que NO incluye */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            No incluye
          </label>
          <div className="space-y-2">
            {formData.no_incluye.map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                  ✗ {item}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarItem('no_incluye', index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                id="nuevo-no-incluye"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Alimentos no especificados"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('nuevo-no-incluye') as HTMLInputElement
                  agregarItem('no_incluye', input.value)
                  input.value = ''
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          
          {formData.publico && formData.slug && (
            <a
              href={`/viaje/${formData.slug}`}
              target="_blank"
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all"
            >
              Ver Página Pública
            </a>
          )}
        </div>
      </form>
    </div>
  )
}
