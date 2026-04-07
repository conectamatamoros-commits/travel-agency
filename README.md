# 🚌 TravelDesk — Guía de Instalación Completa

Panel de gestión para agencia de viajes con Next.js + Supabase + Vercel.

---

## 📋 Requisitos previos

- Node.js 18 o superior → https://nodejs.org
- Cuenta en Supabase (ya tienes) → https://supabase.com
- Cuenta en Vercel (ya tienes) → https://vercel.com
- Git instalado → https://git-scm.com

---

## PASO 1 — Configurar Supabase

### 1.1 Crear la base de datos

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New query**
5. Copia y pega todo el contenido del archivo `supabase/migrations/001_initial_schema.sql`
6. Haz clic en **Run** (o Ctrl+Enter)
7. Deberías ver: "Success. No rows returned"

### 1.2 Obtener las credenciales

1. En el menú lateral, ve a **Settings → API**
2. Copia los siguientes valores (los necesitarás en el Paso 3):
   - **Project URL** → será tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → será tu `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (nunca la expongas públicamente)

### 1.3 Crear usuarios

1. En el menú lateral, ve a **Authentication → Users**
2. Haz clic en **Add user → Create new user**
3. Crea los 3 usuarios:

   | Email                      | Contraseña | Rol   |
   |----------------------------|------------|-------|
   | admin@tuagencia.com        | Admin2026! | admin |
   | staff1@tuagencia.com       | Staff2026! | staff |
   | staff2@tuagencia.com       | Staff2026! | staff |

4. Después de crear cada usuario, en el SQL Editor ejecuta:

```sql
-- Reemplaza el email y el rol según corresponda
UPDATE user_profiles 
SET rol = 'admin', nombre = 'Administrador'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@tuagencia.com');

UPDATE user_profiles 
SET nombre = 'Staff 1'
WHERE id = (SELECT id FROM auth.users WHERE email = 'staff1@tuagencia.com');

UPDATE user_profiles 
SET nombre = 'Staff 2'
WHERE id = (SELECT id FROM auth.users WHERE email = 'staff2@tuagencia.com');
```

---

## PASO 2 — Configurar el proyecto localmente

### 2.1 Descomprimir y preparar

```bash
# Descomprime travel-agency.zip en una carpeta
cd travel-agency

# Instalar dependencias
npm install
```

### 2.2 Crear el archivo de variables de entorno

Crea un archivo llamado `.env.local` en la raíz del proyecto con este contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Reemplaza los valores con los que copiaste en el Paso 1.2

### 2.3 Probar localmente (opcional)

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.
Inicia sesión con admin@tuagencia.com / Admin2026!

---

## PASO 3 — Desplegar en Vercel

### Opción A — Con GitHub (recomendado)

```bash
# Inicializar git
git init
git add .
git commit -m "Initial commit - TravelDesk"

# Crear repositorio en GitHub y conectar
# (ve a github.com → New repository → sigue las instrucciones)
git remote add origin https://github.com/TU_USUARIO/travel-agency.git
git push -u origin main
```

Luego en Vercel:
1. Ve a https://vercel.com/new
2. Importa el repositorio de GitHub
3. En la sección **Environment Variables**, agrega las 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Haz clic en **Deploy**
5. ✅ Tu app estará en `https://travel-agency-xxx.vercel.app`

### Opción B — Con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel

# Sigue las instrucciones en pantalla
# Cuando te pida las variables de entorno, ingresa las 3
```

---

## PASO 4 — Importar tus archivos Excel

1. Abre tu app en Vercel
2. Inicia sesión con tu cuenta admin
3. En el menú lateral, haz clic en **Importar Excel**
4. Arrastra todos tus archivos Excel (puedes arrastrar varios a la vez)
5. Haz clic en **Importar X archivos**
6. Espera a que cada archivo muestre ✅

Los 19 viajes quedarán disponibles inmediatamente en todos los módulos.

---

## 🗺️ Módulos disponibles

| Módulo         | URL             | Descripción                                    |
|----------------|-----------------|------------------------------------------------|
| Dashboard      | /dashboard      | Resumen general con KPIs                       |
| Viajes         | /viajes         | Lista de todos los viajes                      |
| Viajero        | /viajes/:id     | Detalle de cada viaje                          |
| Viajeros       | /viajeros       | Todos los viajeros con búsqueda y filtros      |
| Viajero        | /viajeros/:id   | Perfil completo de cada viajero                |
| Pagos          | /pagos          | Control de abonos y saldos                     |
| Cuartos        | /cuartos        | Asignación de habitaciones                     |
| Tareas         | /tareas         | Gestión de pendientes (estilo Kanban)          |
| Mensajes       | /mensajes       | Centro de WhatsApp y correo con plantillas     |
| Importar       | /importar       | Carga de archivos Excel                        |

---

## 👥 Usuarios y permisos

| Usuario | Rol   | Acceso                              |
|---------|-------|-------------------------------------|
| Admin   | admin | Acceso completo a todo              |
| Staff 1 | staff | Puede ver y editar, no puede borrar |
| Staff 2 | staff | Puede ver y editar, no puede borrar |

Para cambiar permisos, modifica la tabla `user_profiles` en Supabase.

---

## 🆘 Solución de problemas frecuentes

### "Error: supabase not configured"
→ Verifica que `.env.local` tenga los 3 valores correctos y sin espacios extra.

### "Invalid login credentials"  
→ Asegúrate de crear los usuarios en Supabase Authentication (no solo en la tabla).

### La importación falla con archivos grandes
→ El límite de Vercel free es 4.5MB por request. Para archivos más grandes, considera el plan Pro o procésalos en partes.

### Los cuartos no aparecen después de importar
→ Verifica que tu Excel tenga una hoja llamada exactamente HABITACIONES o ROOMLIST.

---

## 📞 Estructura de archivos Excel soportada

El importador detecta automáticamente estas hojas:

| Hoja             | Datos que extrae                            |
|------------------|---------------------------------------------|
| TABLAS / Hoja1   | Precios por tipo (Cuádruple/Triple/Doble)  |
| ABONOS / GNP A / CANCHA B | Viajeros y sus abonos              |
| INFORMACION / INFO | Fecha inscripción, talla, celular, correo |
| CONTACTO         | Contacto de emergencia                      |
| HABITACIONES / ROOMLIST | Asignación de cuartos              |
| LISTA DE ESPERA  | Personas en espera                          |

---

Desarrollado para agencia de viajes de conciertos y tours 🎶🚌
