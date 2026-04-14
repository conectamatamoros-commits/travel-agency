-- ════════════════════════════════════════════════════════════════
-- CONECTA MATAMOROS - ACTUALIZACIÓN BASE DE DATOS
-- Ejecuta este archivo completo en Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. AGREGAR NUEVOS CAMPOS A LA TABLA VIAJES
-- ════════════════════════════════════════════════════════════════

ALTER TABLE viajes 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS imagen_portada TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS itinerario JSONB,
ADD COLUMN IF NOT EXISTS precios JSONB DEFAULT '{"doble": 0, "triple": 0, "cuadruple": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS incluye TEXT[],
ADD COLUMN IF NOT EXISTS no_incluye TEXT[],
ADD COLUMN IF NOT EXISTS whatsapp_inscripcion TEXT,
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orden_display INTEGER DEFAULT 0;

-- 2. CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_viajes_slug ON viajes(slug);
CREATE INDEX IF NOT EXISTS idx_viajes_publico ON viajes(publico) WHERE publico = true;
CREATE INDEX IF NOT EXISTS idx_viajes_fecha_evento ON viajes(fecha_evento);

-- 3. GENERAR SLUGS AUTOMÁTICOS PARA VIAJES EXISTENTES
-- ════════════════════════════════════════════════════════════════

-- Crear slugs básicos a partir del nombre
UPDATE viajes 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REPLACE(REPLACE(REPLACE(nombre, 'á', 'a'), 'é', 'e'), 'í', 'i'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Hacer slugs únicos agregando el ID si hay duplicados
UPDATE viajes v1
SET slug = slug || '-' || id
WHERE EXISTS (
  SELECT 1 FROM viajes v2 
  WHERE v2.slug = v1.slug AND v2.id < v1.id
);

-- 4. CONFIGURAR POLÍTICAS RLS (Row Level Security)
-- ════════════════════════════════════════════════════════════════

-- Permitir lectura pública de viajes marcados como públicos
DROP POLICY IF EXISTS "Viajes públicos son visibles para todos" ON viajes;
CREATE POLICY "Viajes públicos son visibles para todos"
ON viajes FOR SELECT
USING (publico = true AND activo = true);

-- Los usuarios autenticados pueden ver todos los viajes
DROP POLICY IF EXISTS "Usuarios autenticados ven todos los viajes" ON viajes;
CREATE POLICY "Usuarios autenticados ven todos los viajes"
ON viajes FOR SELECT
TO authenticated
USING (true);

-- Solo usuarios autenticados pueden modificar viajes
DROP POLICY IF EXISTS "Solo autenticados modifican viajes" ON viajes;
CREATE POLICY "Solo autenticados modifican viajes"
ON viajes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- ════════════════════════════════════════════════════════════════

/*
-- Ejemplo de cómo configurar un viaje público
UPDATE viajes
SET 
  publico = true,
  slug = 'morat-monterrey-2025',
  imagen_portada = 'https://ejemplo.com/morat.jpg',
  descripcion = '¡Vive la experiencia Morat en Monterrey! Un viaje inolvidable lleno de música y diversión.',
  whatsapp_inscripcion = 'https://wa.me/5218681234567?text=Hola,%20quiero%20información%20del%20viaje%20a%20Morat',
  incluye = ARRAY[
    'Transporte redondo en autobús de lujo',
    'Hotel 2 noches (habitación compartida)',
    'Boleto al concierto (zona asignada)',
    'Coordinador de viaje',
    'Seguro de viajero'
  ],
  no_incluye = ARRAY[
    'Alimentos no especificados',
    'Bebidas alcohólicas',
    'Gastos personales',
    'Propinas'
  ],
  itinerario = '[
    {
      "dia": "Día 1 - Viernes 15 de marzo",
      "actividades": [
        "Salida desde Matamoros 8:00 AM",
        "Llegada a Monterrey aprox. 2:00 PM",
        "Check-in en hotel",
        "Tarde libre para recorrer la ciudad",
        "Cena por cuenta propia"
      ]
    },
    {
      "dia": "Día 2 - Sábado 16 de marzo",
      "actividades": [
        "Desayuno incluido en hotel",
        "Mañana libre",
        "Traslado al venue 6:00 PM",
        "Concierto de Morat 8:00 PM",
        "Regreso al hotel"
      ]
    },
    {
      "dia": "Día 3 - Domingo 17 de marzo",
      "actividades": [
        "Desayuno incluido",
        "Check-out del hotel 11:00 AM",
        "Regreso a Matamoros",
        "Llegada estimada 5:00 PM"
      ]
    }
  ]'::jsonb,
  precios = '{"doble": 5500, "triple": 4800, "cuadruple": 4200}'::jsonb
WHERE nombre ILIKE '%morat%'
LIMIT 1;
*/

-- 6. VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════

-- Ver todos los viajes con sus nuevos campos
SELECT 
  id,
  nombre,
  slug,
  publico,
  fecha_evento,
  CASE 
    WHEN imagen_portada IS NOT NULL THEN '✓ Tiene imagen'
    ELSE '✗ Sin imagen'
  END as imagen,
  CASE 
    WHEN descripcion IS NOT NULL THEN '✓ Tiene descripción'
    ELSE '✗ Sin descripción'
  END as descripcion_estado
FROM viajes
ORDER BY fecha_evento DESC;

-- ════════════════════════════════════════════════════════════════
-- COMPLETADO
-- ════════════════════════════════════════════════════════════════

-- Si todo salió bien, deberías ver:
-- ✓ Todos los viajes con slugs únicos
-- ✓ Nuevos campos agregados
-- ✓ Políticas RLS configuradas

-- Próximo paso: Configurar tus viajes como públicos desde el panel admin
