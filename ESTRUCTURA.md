# 📁 ESTRUCTURA DE CARPETAS - ANTES Y DESPUÉS

## ❌ ANTES (Sistema Actual)

```
src/app/
├── (app)/
│   └── layout.tsx          ← Layout con Sidebar
├── dashboard/
│   └── page.tsx
├── viajes/
│   ├── page.tsx
│   ├── [id]/
│   └── ...
├── viajeros/
│   ├── page.tsx
│   └── ...
├── pagos/
├── cuartos/
├── tareas/
├── mensajes/
├── reportes/
├── importar/
├── api/
├── globals.css
└── layout.tsx              ← Root layout

components/
└── layout/
    └── Sidebar.tsx

lib/
└── supabase/
    ├── client.ts
    └── server.ts

public/
└── blanco con negro.png
```

**Problema:**
- Todo es privado, se necesita login para TODO
- No hay página pública para promocionar viajes
- La URL principal muestra el dashboard

---

## ✅ DESPUÉS (Nueva Estructura)

```
src/app/
├── page.tsx                    ← 🌐 PÁGINA PÚBLICA (Nueva)
│                                  Catálogo de viajes
│
├── viaje/                      ← 🌐 RUTAS PÚBLICAS (Nuevo)
│   └── [slug]/
│       └── page.tsx               Detalle del viaje
│                                  /viaje/morat-2025
│
├── login/                      ← 🔐 LOGIN (Nuevo)
│   └── page.tsx                   Formulario de acceso
│
├── admin/                      ← 🔐 PANEL ADMIN (Todo movido aquí)
│   ├── layout.tsx                 Layout con Sidebar + Auth
│   ├── dashboard/
│   │   └── page.tsx               /admin/dashboard
│   ├── viajes/
│   │   ├── page.tsx               /admin/viajes
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── ViajePublicoForm.tsx  ← NUEVO componente
│   │   └── ...
│   ├── viajeros/                  /admin/viajeros
│   ├── pagos/                     /admin/pagos
│   ├── cuartos/                   /admin/cuartos
│   ├── tareas/                    /admin/tareas
│   ├── mensajes/                  /admin/mensajes
│   ├── reportes/                  /admin/reportes
│   └── importar/                  /admin/importar
│
├── api/                        ← APIs (sin cambios)
│   ├── import/
│   └── sync-sheets/
│
├── not-found.tsx               ← 404 personalizado (Nuevo)
├── globals.css
└── layout.tsx                  ← Root layout

components/
└── layout/
    └── Sidebar.tsx             ← Actualizar rutas a /admin/*

lib/
└── supabase/
    ├── client.ts
    └── server.ts

public/
└── blanco con negro.png
```

---

## 🔄 MAPEO DE RUTAS

### Rutas Públicas (No requieren login)

| URL | Archivo | Descripción |
|-----|---------|-------------|
| `/` | `app/page.tsx` | Home - Catálogo de viajes |
| `/viaje/morat-2025` | `app/viaje/[slug]/page.tsx` | Detalle del viaje |
| `/login` | `app/login/page.tsx` | Login al panel admin |

### Rutas Admin (Requieren login)

| URL Antigua | URL Nueva | Archivo |
|-------------|-----------|---------|
| `/dashboard` | `/admin/dashboard` | `app/admin/dashboard/page.tsx` |
| `/viajes` | `/admin/viajes` | `app/admin/viajes/page.tsx` |
| `/viajes/123` | `/admin/viajes/123` | `app/admin/viajes/[id]/page.tsx` |
| `/viajeros` | `/admin/viajeros` | `app/admin/viajeros/page.tsx` |
| `/pagos` | `/admin/pagos` | `app/admin/pagos/page.tsx` |
| `/cuartos` | `/admin/cuartos` | `app/admin/cuartos/page.tsx` |
| `/tareas` | `/admin/tareas` | `app/admin/tareas/page.tsx` |
| `/mensajes` | `/admin/mensajes` | `app/admin/mensajes/page.tsx` |
| `/reportes` | `/admin/reportes` | `app/admin/reportes/page.tsx` |
| `/importar` | `/admin/importar` | `app/admin/importar/page.tsx` |

---

## 🗂️ ARCHIVOS NUEVOS CREADOS

```
src/app/
├── page.tsx                              ← Home pública
├── viaje/[slug]/page.tsx                 ← Detalle viaje
├── login/page.tsx                        ← Login
├── admin/layout.tsx                      ← Layout admin + auth
├── admin/viajes/[id]/ViajePublicoForm.tsx ← Config pública
└── not-found.tsx                         ← 404 custom
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

```
Usuario visita: conectamatamoros.com
                     ↓
            ┌────────┴────────┐
            │                 │
         Pública           /admin
            │                 │
    ┌───────┴────────┐        │
    │                │   ¿Autenticado?
  Home         Viaje/[slug]   │
    │                │    ┌───┴───┐
    │                │   Sí       No
    │                │    │        │
    │                │  Dashboard  │
    └────────────────┘    │     Redirect
                          │     a /login
                    Panel Admin
```

---

## 📊 BASE DE DATOS - NUEVOS CAMPOS

### Tabla: viajes

| Campo (Nuevo) | Tipo | Descripción |
|--------------|------|-------------|
| `slug` | TEXT | URL amigable (morat-2025) |
| `imagen_portada` | TEXT | URL de imagen principal |
| `descripcion` | TEXT | Descripción promocional |
| `itinerario` | JSONB | Array de días con actividades |
| `precios` | JSONB | `{doble, triple, cuadruple}` |
| `incluye` | TEXT[] | Array de lo que incluye |
| `no_incluye` | TEXT[] | Array de lo que NO incluye |
| `whatsapp_inscripcion` | TEXT | Link de WhatsApp |
| `publico` | BOOLEAN | Mostrar en página pública |
| `orden_display` | INTEGER | Orden de aparición |

---

## 🎨 PÁGINAS VISUALES

### 1. Home Pública (/)
```
┌─────────────────────────────────────┐
│   🏠 CONECTA MATAMOROS              │  ← Header
├─────────────────────────────────────┤
│                                     │
│  🎉 ¡Vive la experiencia!          │  ← Hero
│     Viajes a conciertos            │
│     [Ver Viajes] [WhatsApp]        │
│                                     │
├─────────────────────────────────────┤
│  📅 PRÓXIMOS VIAJES                │  ← Grid
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Morat│ │ Bad  │ │ Kenia│       │
│  │ 2025 │ │ Bunny│ │ Os   │       │
│  └──────┘ └──────┘ └──────┘       │
│                                     │
├─────────────────────────────────────┤
│   Footer - Links - Social          │
└─────────────────────────────────────┘
```

### 2. Detalle Viaje (/viaje/[slug])
```
┌─────────────────────────────────────┐
│  ← Volver    [📱 WhatsApp]         │  ← Header fijo
├─────────────────────────────────────┤
│                                     │
│    [Imagen grande del evento]      │  ← Hero image
│    MORAT - MONTERREY 2025          │
│    📅 15-17 Marzo  📍 Monterrey   │
│                                     │
├─────────────────────────────────────┤
│  Descripción del viaje...          │
│                                     │
│  💰 PRECIOS                        │
│  🛏️ Doble: $5,500                 │
│  🛏️🛏️ Triple: $4,800              │
│                                     │
│  🗓️ ITINERARIO                     │
│  Día 1: Salida...                  │
│  Día 2: Concierto...               │
│                                     │
│  ✅ QUÉ INCLUYE                    │
│  ✓ Transporte                      │
│  ✓ Hotel                           │
│                                     │
│  ❌ NO INCLUYE                     │
│  ✗ Alimentos                       │
│                                     │
│  [📱 INSCRÍBETE AHORA]            │  ← CTA
│                                     │
└─────────────────────────────────────┘
```

### 3. Login (/login)
```
┌─────────────────────────────────────┐
│                                     │
│         🖼️ [Logo]                  │
│       Panel Admin                   │
│    Conecta Matamoros               │
│                                     │
│  ┌───────────────────────────┐     │
│  │ 📧 Email                  │     │
│  ├───────────────────────────┤     │
│  │ 🔒 Password              │     │
│  ├───────────────────────────┤     │
│  │   [Iniciar Sesión]       │     │
│  └───────────────────────────┘     │
│                                     │
│  ← Volver a página pública         │
│                                     │
└─────────────────────────────────────┘
```

### 4. Admin Dashboard (/admin/dashboard)
```
┌──────┬──────────────────────────────┐
│      │  📊 Dashboard                │
│  S   │                              │
│  i   │  ┌──────┐ ┌──────┐ ┌──────┐│
│  d   │  │ KPI  │ │ KPI  │ │ KPI  ││
│  e   │  └──────┘ └──────┘ └──────┘│
│  b   │                              │
│  a   │  Resumen de viajes...        │
│  r   │  [Gráficas]                 │
│      │                              │
└──────┴──────────────────────────────┘
```

---

## 🔄 COMPONENTES MODIFICADOS

### Sidebar.tsx
```tsx
// ANTES
<Link href="/viajes">Viajes</Link>

// DESPUÉS
<Link href="/admin/viajes">Viajes</Link>
```

Todos los links deben tener el prefijo `/admin/`

---

## 📱 RESPONSIVE

### Desktop
- Home: Grid 3 columnas
- Sidebar: Fijo a la izquierda en admin
- Detalle viaje: Container max-width

### Mobile
- Home: Grid 1 columna
- Sidebar: Barra inferior en admin
- Detalle viaje: Stack vertical

---

## ✅ CHECKLIST DE MIGRACIÓN

- [ ] SQL ejecutado en Supabase
- [ ] Carpetas movidas a /admin
- [ ] Archivos nuevos creados
- [ ] Sidebar actualizado con rutas /admin/*
- [ ] date-fns instalado
- [ ] Probado localmente
- [ ] Al menos 1 viaje configurado como público
- [ ] Commit y push
- [ ] Deploy verificado en producción

---

**¿Listo para empezar?**

Sigue la guía: `INICIO-RAPIDO.md` ⚡
