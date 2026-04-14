# 📦 ARCHIVOS PARA MIGRACIÓN - CONECTA MATAMOROS

## 📋 LISTA DE ARCHIVOS

### 🔧 Archivos de Código (*.tsx)

1. **src-app-page.tsx** → Copiar a `src/app/page.tsx`
   - Página principal pública con catálogo de viajes
   
2. **src-app-viaje-[slug]-page.tsx** → Copiar a `src/app/viaje/[slug]/page.tsx`
   - Página de detalle de cada viaje público
   
3. **src-app-admin-layout.tsx** → Copiar a `src/app/admin/layout.tsx`
   - Layout del panel admin con autenticación
   
4. **src-app-login-page.tsx** → Copiar a `src/app/login/page.tsx`
   - Página de inicio de sesión
   
5. **src-app-not-found.tsx** → Copiar a `src/app/not-found.tsx`
   - Página 404 personalizada
   
6. **ViajePublicoForm.tsx** → Copiar a `src/app/admin/viajes/[id]/ViajePublicoForm.tsx`
   - Componente para configurar viajes públicos

### 🗄️ Base de Datos

7. **supabase-migration.sql**
   - Ejecutar en Supabase SQL Editor
   - Agrega los campos necesarios a la tabla viajes

### 🤖 Script de Migración

8. **migrate.sh**
   - Script bash que automatiza toda la migración
   - Ejecutar desde la raíz del proyecto: `bash migrate.sh`

### 📖 Documentación

9. **INICIO-RAPIDO.md** - Guía rápida (10-15 minutos)
10. **INSTRUCCIONES-COMPLETAS.md** - Guía detallada paso a paso
11. **ESTRUCTURA.md** - Explicación de la nueva estructura

---

## ⚡ INICIO RÁPIDO

### Opción A: Script Automático (Recomendado)

1. Copia todos estos archivos a la raíz de tu proyecto
2. Ejecuta: `bash migrate.sh`
3. Sigue las instrucciones en pantalla

### Opción B: Manual

1. Lee **INICIO-RAPIDO.md**
2. Ejecuta el SQL en Supabase
3. Copia los archivos .tsx a sus ubicaciones
4. Actualiza el Sidebar
5. Prueba localmente

---

## 📍 UBICACIONES DE LOS ARCHIVOS

```
tu-proyecto/
├── src/
│   └── app/
│       ├── page.tsx                          ← src-app-page.tsx
│       ├── not-found.tsx                     ← src-app-not-found.tsx
│       ├── login/
│       │   └── page.tsx                      ← src-app-login-page.tsx
│       ├── viaje/
│       │   └── [slug]/
│       │       └── page.tsx                  ← src-app-viaje-[slug]-page.tsx
│       └── admin/
│           ├── layout.tsx                    ← src-app-admin-layout.tsx
│           └── viajes/
│               └── [id]/
│                   └── ViajePublicoForm.tsx  ← ViajePublicoForm.tsx
```

---

## ✅ CHECKLIST

- [ ] Descargar todos los archivos
- [ ] Ejecutar supabase-migration.sql en Supabase
- [ ] Copiar archivos .tsx a sus ubicaciones
- [ ] Actualizar Sidebar con rutas /admin/*
- [ ] Instalar dependencias: `npm install date-fns`
- [ ] Probar localmente: `npm run dev`
- [ ] Configurar al menos 1 viaje público
- [ ] Deploy a Vercel

---

## 🆘 AYUDA

Si tienes problemas, lee:
1. **INICIO-RAPIDO.md** → Guía de 10 minutos
2. **INSTRUCCIONES-COMPLETAS.md** → Guía detallada
3. **ESTRUCTURA.md** → Explicación técnica

---

**¡Todo listo para transformar tu sitio! 🚀**
