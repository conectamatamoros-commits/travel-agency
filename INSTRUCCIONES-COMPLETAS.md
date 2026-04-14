# 🚀 INSTRUCCIONES COMPLETAS - TRANSFORMACIÓN CONECTA MATAMOROS

## 📋 RESUMEN DE CAMBIOS

Tu sitio tendrá dos partes:
1. **Página Pública** → conectamatamoros.com (catálogo de viajes)
2. **Panel Admin** → conectamatamoros.com/admin (gestión interna)

---

## ⚙️ PASO 1: ACTUALIZAR BASE DE DATOS SUPABASE

### 1.1 Ejecutar SQL en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/yxumgherpukuxadavhfp
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New Query**
4. Pega este código:

```sql
-- Agregar nuevos campos a la tabla viajes
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

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_viajes_slug ON viajes(slug);
CREATE INDEX IF NOT EXISTS idx_viajes_publico ON viajes(publico) WHERE publico = true;
CREATE INDEX IF NOT EXISTS idx_viajes_fecha_evento ON viajes(fecha_evento);

-- Generar slugs automáticos para viajes existentes
UPDATE viajes 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(nombre, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Asegurar que todos los slugs sean únicos
UPDATE viajes v1
SET slug = slug || '-' || id
WHERE EXISTS (
  SELECT 1 FROM viajes v2 
  WHERE v2.slug = v1.slug AND v2.id < v1.id
);
```

5. Click en **RUN** (o presiona Ctrl+Enter)
6. Deberías ver: "Success. No rows returned"

---

## 📁 PASO 2: REORGANIZAR ESTRUCTURA DE CARPETAS

### 2.1 Crear carpetas nuevas

En tu proyecto local, crea estas carpetas:

```
src/app/
├── admin/              ← NUEVA (todo el sistema actual va aquí)
├── viaje/              ← NUEVA (página de detalle)
│   └── [slug]/
└── login/              ← NUEVA (página de login)
```

### 2.2 Mover archivos existentes a /admin

Mueve TODAS estas carpetas dentro de `src/app/` a `src/app/admin/`:

```
Mover de src/app/ a src/app/admin/:
- (app)/            → admin/
- dashboard/        → admin/dashboard/
- viajes/          → admin/viajes/
- viajeros/        → admin/viajeros/
- pagos/           → admin/pagos/
- cuartos/         → admin/cuartos/
- tareas/          → admin/tareas/
- mensajes/        → admin/mensajes/
- reportes/        → admin/reportes/
- importar/        → admin/importar/
```

**Comandos en terminal:**

```bash
cd src/app
mkdir -p admin viaje/[slug] login

# Mover carpetas al admin
mv dashboard admin/
mv viajes admin/
mv viajeros admin/
mv pagos admin/
mv cuartos admin/
mv tareas admin/
mv mensajes admin/
mv reportes admin/
mv importar admin/

# Si existe la carpeta (app), también moverla
mv "(app)" admin/ 2>/dev/null || true
```

---

## 📄 PASO 3: CREAR NUEVOS ARCHIVOS

### 3.1 Página Principal (Home Pública)

**Archivo:** `src/app/page.tsx`

```bash
# Copiar el archivo que generé
cp /home/claude/src-app-page.tsx src/app/page.tsx
```

### 3.2 Página de Detalle de Viaje

**Archivo:** `src/app/viaje/[slug]/page.tsx`

```bash
# Crear carpeta y archivo
mkdir -p src/app/viaje/[slug]
cp /home/claude/src-app-viaje-[slug]-page.tsx src/app/viaje/[slug]/page.tsx
```

### 3.3 Layout del Admin

**Archivo:** `src/app/admin/layout.tsx`

```bash
cp /home/claude/src-app-admin-layout.tsx src/app/admin/layout.tsx
```

### 3.4 Página de Login

**Archivo:** `src/app/login/page.tsx`

```bash
mkdir -p src/app/login
cp /home/claude/src-app-login-page.tsx src/app/login/page.tsx
```

### 3.5 Página 404 Personalizada

**Archivo:** `src/app/not-found.tsx`

```bash
cp /home/claude/src-app-not-found.tsx src/app/not-found.tsx
```

### 3.6 Componente de Configuración Pública

**Archivo:** `src/app/admin/viajes/[id]/ViajePublicoForm.tsx`

```bash
# Agregar al detalle del viaje en admin
cp /home/claude/ViajePublicoForm.tsx src/app/admin/viajes/[id]/ViajePublicoForm.tsx
```

---

## 🔧 PASO 4: ACTUALIZAR ARCHIVOS EXISTENTES

### 4.1 Actualizar src/app/admin/viajes/[id]/page.tsx

Agregar el componente de configuración pública. Edita el archivo y agrega:

```tsx
import ViajePublicoForm from './ViajePublicoForm'

// ... dentro del return, después del contenido existente:

<div className="mt-8">
  <ViajePublicoForm viaje={viaje} />
</div>
```

### 4.2 Actualizar Sidebar

Edita `src/components/layout/Sidebar.tsx` y cambia todas las rutas:

```tsx
// Cambiar de:
href="/dashboard"

// A:
href="/admin/dashboard"
```

**Buscar y reemplazar en todo el archivo:**
- `href="/dashboard"` → `href="/admin/dashboard"`
- `href="/viajes"` → `href="/admin/viajes"`
- `href="/viajeros"` → `href="/admin/viajeros"`
- `href="/pagos"` → `href="/admin/pagos"`
- `href="/cuartos"` → `href="/admin/cuartos"`
- `href="/tareas"` → `href="/admin/tareas"`
- `href="/mensajes"` → `href="/admin/mensajes"`
- `href="/reportes"` → `href="/admin/reportes"`
- `href="/importar"` → `href="/admin/importar"`

---

## 🔐 PASO 5: CONFIGURAR AUTENTICACIÓN

### 5.1 Habilitar Email Auth en Supabase

1. Ve a Supabase → **Authentication** → **Providers**
2. Asegúrate que **Email** esté habilitado
3. **Desactiva** "Confirm email" si quieres login sin confirmación

### 5.2 Crear usuarios admin (si no existen)

En Supabase → **Authentication** → **Users** → **Add user**:

- Email: `admin@tuagencia.com`
- Password: `Admin123`
- Auto Confirm User: ✅

---

## 📦 PASO 6: INSTALAR DEPENDENCIAS

```bash
# Asegúrate de tener date-fns
npm install date-fns
```

---

## 🚀 PASO 7: PROBAR LOCALMENTE

```bash
npm run dev
```

Abre: http://localhost:3000

**Deberías ver:**
- `/` → Página pública (catálogo de viajes vacío por ahora)
- `/admin` → Te redirige a `/login`
- `/login` → Formulario de login
- Después de login → `/admin/dashboard`

---

## 🎨 PASO 8: CONFIGURAR TU PRIMER VIAJE PÚBLICO

### 8.1 Opción A: Desde el Admin (Recomendado)

1. Login en `/login`
2. Ve a `/admin/viajes`
3. Click en un viaje existente
4. Scroll hasta **"Configuración Página Pública"**
5. Activa el toggle "Mostrar en página pública"
6. Completa:
   - **Slug:** `morat-2025` (URL amigable)
   - **Imagen:** URL de la imagen del evento
   - **Descripción:** Texto promocional
   - **WhatsApp:** `https://wa.me/5218681234567?text=Hola,%20quiero%20info%20del%20viaje%20a%20Morat`
   - **Incluye:** Agrega items uno por uno
   - **No incluye:** Agrega items
7. Click en **"Guardar Configuración"**
8. Click en **"Ver Página Pública"** para verificar

### 8.2 Opción B: Directamente en Supabase

1. Ve a Supabase → **Table Editor** → **viajes**
2. Selecciona un viaje
3. Edita los campos:

```json
slug: "morat-2025"
publico: true
imagen_portada: "https://example.com/morat.jpg"
descripcion: "¡No te pierdas el concierto de Morat en Monterrey!"
whatsapp_inscripcion: "https://wa.me/5218681234567?text=Hola"
incluye: {"Transporte", "Boleto", "Hotel 2 noches"}
no_incluye: {"Alimentos", "Bebidas alcohólicas"}
itinerario: [
  {
    "dia": "Día 1 - Viernes",
    "actividades": [
      "Salida desde Matamoros 8:00 AM",
      "Llegada a Monterrey 2:00 PM",
      "Check-in hotel",
      "Tiempo libre"
    ]
  },
  {
    "dia": "Día 2 - Sábado",
    "actividades": [
      "Desayuno",
      "Concierto 8:00 PM"
    ]
  }
]
precios: {"doble": 5500, "triple": 4800, "cuadruple": 4200}
```

---

## 🌐 PASO 9: SUBIR A VERCEL

```bash
# Commit y push
git add .
git commit -m "feat: página pública y panel admin separado"
git push origin main
```

Vercel desplegará automáticamente.

---

## ✅ VERIFICACIÓN FINAL

Después del deploy, verifica:

1. ✅ `conectamatamoros.com` → Muestra catálogo de viajes públicos
2. ✅ `conectamatamoros.com/viaje/morat-2025` → Muestra detalle del viaje
3. ✅ `conectamatamoros.com/admin` → Redirige a login
4. ✅ `conectamatamoros.com/login` → Formulario de login
5. ✅ Login exitoso → Te lleva a `/admin/dashboard`
6. ✅ Todo el sistema funciona en `/admin/*`

---

## 🎯 PRÓXIMOS PASOS (OPCIONAL)

### 1. Agregar más viajes públicos
- Desde `/admin/viajes/[id]` activa más viajes como públicos

### 2. Subir imágenes a Supabase Storage
```sql
-- Crear bucket público para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('viajes-portadas', 'viajes-portadas', true);

-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'viajes-portadas');
```

Luego sube imágenes y usa URLs tipo:
`https://yxumgherpukuxadavhfp.supabase.co/storage/v1/object/public/viajes-portadas/morat.jpg`

### 3. SEO y Metadata
Agrega en `src/app/page.tsx`:

```tsx
export const metadata = {
  title: 'Conecta Matamoros - Viajes a Conciertos',
  description: 'Los mejores viajes organizados a conciertos y eventos',
  keywords: 'viajes, conciertos, tours, matamoros'
}
```

### 4. PWA (Progressive Web App)
Crear `public/manifest.json`:

```json
{
  "name": "Conecta Matamoros",
  "short_name": "Conecta",
  "description": "Viajes a conciertos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#0000cd",
  "icons": [
    {
      "src": "/blanco con negro.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🆘 TROUBLESHOOTING

### Error: "Module not found: Can't resolve '@/lib/supabase/server'"

Verifica que tengas:
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`

### Error: "redirect is not a function"

Asegúrate de importar desde next/navigation:
```tsx
import { redirect } from 'next/navigation'
```

### Error: Las rutas /admin no funcionan

Verifica que moviste TODO de `src/app/` a `src/app/admin/`

### Los viajes no aparecen en la home

1. Verifica en Supabase que al menos un viaje tenga:
   - `publico = true`
   - `activo = true`
   - `slug` no nulo

---

## 📞 CONTACTO

Si tienes dudas, revisa:
1. Los archivos generados en `/home/claude/`
2. La documentación de Next.js: https://nextjs.org/docs
3. La documentación de Supabase: https://supabase.com/docs

---

**¡LISTO! 🎉**

Tu sitio ahora tiene:
- ✅ Página pública hermosa para promocionar viajes
- ✅ Panel admin protegido con login
- ✅ Sistema de gestión completo separado
- ✅ URLs amigables para SEO
- ✅ Diseño responsive y moderno
