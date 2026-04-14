#!/bin/bash

# Script de migración automática - Conecta Matamoros
# Este script reorganiza la estructura del proyecto

echo "🚀 Iniciando migración de Conecta Matamoros..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "src/app" ]; then
    print_error "No se encuentra la carpeta src/app"
    print_error "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

print_success "Directorio correcto detectado"
echo ""

# Crear backup
print_step "Creando backup del proyecto..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/app "$BACKUP_DIR/"
print_success "Backup creado en: $BACKUP_DIR"
echo ""

# Crear nuevas carpetas
print_step "Creando estructura de carpetas..."
mkdir -p src/app/admin
mkdir -p src/app/viaje/[slug]
mkdir -p src/app/login
print_success "Carpetas creadas"
echo ""

# Mover carpetas existentes a /admin
print_step "Moviendo carpetas al panel admin..."

FOLDERS_TO_MOVE=(
    "dashboard"
    "viajes"
    "viajeros"
    "pagos"
    "cuartos"
    "tareas"
    "mensajes"
    "reportes"
    "importar"
)

for folder in "${FOLDERS_TO_MOVE[@]}"; do
    if [ -d "src/app/$folder" ]; then
        mv "src/app/$folder" "src/app/admin/"
        print_success "Movido: $folder → admin/$folder"
    else
        print_warning "No encontrado: $folder (puede ser normal)"
    fi
done

# Mover la carpeta (app) si existe
if [ -d "src/app/(app)" ]; then
    mv "src/app/(app)" "src/app/admin/"
    print_success "Movido: (app) → admin/(app)"
fi

echo ""

# Copiar archivos generados
print_step "Copiando nuevos archivos..."

# Verificar que los archivos existen
FILES_TO_COPY=(
    "/home/claude/src-app-page.tsx:src/app/page.tsx"
    "/home/claude/src-app-viaje-[slug]-page.tsx:src/app/viaje/[slug]/page.tsx"
    "/home/claude/src-app-admin-layout.tsx:src/app/admin/layout.tsx"
    "/home/claude/src-app-login-page.tsx:src/app/login/page.tsx"
    "/home/claude/src-app-not-found.tsx:src/app/not-found.tsx"
)

for file_pair in "${FILES_TO_COPY[@]}"; do
    SOURCE="${file_pair%%:*}"
    DEST="${file_pair##*:}"
    
    if [ -f "$SOURCE" ]; then
        cp "$SOURCE" "$DEST"
        print_success "Copiado: $(basename $DEST)"
    else
        print_error "No encontrado: $SOURCE"
    fi
done

echo ""

# Instalar dependencias
print_step "Verificando dependencias..."
if ! npm list date-fns >/dev/null 2>&1; then
    print_warning "Instalando date-fns..."
    npm install date-fns
    print_success "date-fns instalado"
else
    print_success "date-fns ya está instalado"
fi

echo ""

# Resumen
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✓ MIGRACIÓN COMPLETADA${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. ACTUALIZAR SUPABASE:"
echo "   - Ve a SQL Editor en Supabase"
echo "   - Ejecuta el SQL de INSTRUCCIONES-COMPLETAS.md"
echo ""
echo "2. ACTUALIZAR SIDEBAR:"
echo "   - Edita src/components/layout/Sidebar.tsx"
echo "   - Cambia todas las rutas de /viajes a /admin/viajes"
echo "   - Ejemplo: href=\"/viajes\" → href=\"/admin/viajes\""
echo ""
echo "3. PROBAR LOCALMENTE:"
echo "   npm run dev"
echo ""
echo "4. VERIFICAR:"
echo "   - http://localhost:3000 → Página pública"
echo "   - http://localhost:3000/admin → Login"
echo "   - http://localhost:3000/login → Formulario"
echo ""
echo "5. DESPLEGAR:"
echo "   git add ."
echo "   git commit -m \"feat: página pública y admin separado\""
echo "   git push origin main"
echo ""
echo "📂 Backup guardado en: $BACKUP_DIR"
echo "📖 Instrucciones completas: INSTRUCCIONES-COMPLETAS.md"
echo ""

# Crear archivo de recordatorio para el sidebar
cat > UPDATE-SIDEBAR.md << 'EOF'
# 🔧 ACTUALIZAR SIDEBAR

Edita el archivo: `src/components/layout/Sidebar.tsx`

Buscar y reemplazar las siguientes líneas:

```tsx
// ANTES → DESPUÉS

href="/dashboard"     → href="/admin/dashboard"
href="/viajes"        → href="/admin/viajes"
href="/viajeros"      → href="/admin/viajeros"
href="/pagos"         → href="/admin/pagos"
href="/cuartos"       → href="/admin/cuartos"
href="/tareas"        → href="/admin/tareas"
href="/mensajes"      → href="/admin/mensajes"
href="/reportes"      → href="/admin/reportes"
href="/importar"      → href="/admin/importar"
```

Puedes hacer esto con buscar/reemplazar en VS Code:
1. Ctrl+H (Buscar y reemplazar)
2. Buscar: `href="/`
3. Reemplazar: `href="/admin/`
4. Click en "Reemplazar todo" (pero verifica antes)

O usar sed en terminal:
```bash
sed -i 's|href="/\([^"]*\)"|href="/admin/\1"|g' src/components/layout/Sidebar.tsx
```

¡No olvides este paso! Sin esto, los links del menú no funcionarán.
EOF

print_success "Archivo de ayuda creado: UPDATE-SIDEBAR.md"
echo ""
