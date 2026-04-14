# ⚡ GUÍA RÁPIDA - INICIO RÁPIDO

## 🎯 LO MÁS IMPORTANTE

Tu sitio web ahora tendrá DOS partes:

1. **🌐 Página Pública** (conectamatamoros.com)
   - Catálogo de viajes para tus clientes
   - Información detallada de cada viaje
   - Botón de WhatsApp para inscripciones

2. **🔐 Panel Admin** (conectamatamoros.com/admin)
   - Todo tu sistema actual
   - Requiere login
   - Gestión de viajes, viajeros, pagos, etc.

---

## 🚀 PASOS ULTRA RÁPIDOS

### 1️⃣ Actualizar Base de Datos (2 minutos)

1. Abre: https://supabase.com/dashboard/project/yxumgherpukuxadavhfp/sql/new
2. Copia TODO el contenido de: `supabase-migration.sql`
3. Pega en Supabase
4. Click en **RUN** ▶️
5. Espera el mensaje de éxito ✅

---

### 2️⃣ Reorganizar Archivos (OPCIÓN AUTOMÁTICA)

**En tu terminal del proyecto:**

```bash
# Descargar archivos generados
# (Asumiendo que los tienes en /home/claude/)

# Ejecutar script automático
bash migrate.sh
```

El script hace TODO automáticamente:
- ✅ Crea backup
- ✅ Mueve carpetas a /admin
- ✅ Crea nuevos archivos
- ✅ Instala dependencias

---

### 2️⃣ Reorganizar Archivos (OPCIÓN MANUAL)

Si prefieres hacerlo tú mismo:

```bash
cd src/app

# Crear carpetas
mkdir -p admin viaje/[slug] login

# Mover todo a admin
mv dashboard viajes viajeros pagos cuartos tareas mensajes reportes importar admin/

# Copiar archivos nuevos
cp /ruta/a/archivos/generados/* ./
```

Ver detalles en: `INSTRUCCIONES-COMPLETAS.md`

---

### 3️⃣ Actualizar Sidebar (1 minuto)

Edita: `src/components/layout/Sidebar.tsx`

**Buscar y reemplazar:**
```
href="/       →   href="/admin/
```

Ejemplo:
- `href="/viajes"` → `href="/admin/viajes"`
- `href="/dashboard"` → `href="/admin/dashboard"`

Ver lista completa en: `UPDATE-SIDEBAR.md`

---

### 4️⃣ Probar Localmente

```bash
npm run dev
```

Abre en tu navegador:
- `http://localhost:3000` → Página pública ✨
- `http://localhost:3000/login` → Login 🔐
- Usa: `admin@tuagencia.com` / `Admin123`

---

### 5️⃣ Configurar tu Primer Viaje Público (2 minutos)

1. Entra a: `http://localhost:3000/login`
2. Login con admin
3. Ve a: **Viajes**
4. Click en cualquier viaje
5. Scroll hasta **"Configuración Página Pública"**
6. Llena los campos:
   - ✅ Activa el toggle "Mostrar en página pública"
   - 📝 Slug: `morat-2025`
   - 🖼️ Imagen: URL de la imagen
   - 💬 Descripción: Tu texto promocional
   - 📱 WhatsApp: `https://wa.me/5218681234567`
   - ✅ Incluye: Agrega items (transporte, hotel, etc.)
7. Click **Guardar**
8. Click **Ver Página Pública** 🎉

---

### 6️⃣ Desplegar a Producción

```bash
git add .
git commit -m "feat: página pública y panel admin separado"
git push origin main
```

Vercel desplegará automáticamente (2-3 minutos).

---

## ✅ VERIFICACIÓN FINAL

Después del deploy, revisa:

- [ ] `conectamatamoros.com` muestra catálogo de viajes
- [ ] `conectamatamoros.com/viaje/morat-2025` muestra detalle
- [ ] `conectamatamoros.com/admin` pide login
- [ ] `conectamatamoros.com/login` muestra formulario
- [ ] Después de login → panel admin funciona
- [ ] Sidebar funciona correctamente

---

## 📁 ARCHIVOS IMPORTANTES

- `INSTRUCCIONES-COMPLETAS.md` → Guía detallada paso a paso
- `supabase-migration.sql` → SQL para Supabase
- `migrate.sh` → Script automático
- `UPDATE-SIDEBAR.md` → Guía para actualizar Sidebar

---

## 🆘 PROBLEMAS COMUNES

### "No aparecen los viajes en la home"
→ Verifica que al menos un viaje tenga:
  - `publico = true`
  - `activo = true`
  - `slug` no vacío

### "Error en /admin"
→ Asegúrate de haber movido todas las carpetas a `/admin`

### "No puedo hacer login"
→ Verifica en Supabase → Authentication → Users

### "Links del menú no funcionan"
→ Actualiza el Sidebar (paso 3)

---

## 🎨 PERSONALIZAR

### Cambiar colores
Edita: `src/app/page.tsx` y busca las clases de Tailwind

### Cambiar número de WhatsApp
Busca: `528681234567` y reemplaza por tu número

### Agregar más secciones
Edita: `src/app/viaje/[slug]/page.tsx`

---

## 📞 ¿DUDAS?

1. Lee `INSTRUCCIONES-COMPLETAS.md` → Guía detallada
2. Revisa los archivos generados
3. Verifica la consola del navegador (F12)

---

**¡TODO LISTO! 🎉**

Ahora tienes una página web profesional para promocionar tus viajes.

**Tiempo estimado total: 10-15 minutos**
