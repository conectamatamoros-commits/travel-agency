-- ============================================
-- AGENCIA DE VIAJES - SCHEMA COMPLETO
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VIAJES (Trips)
-- ============================================
CREATE TABLE viajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,                    -- "Kenia Os 2026", "J Balvin 2026"
  nombre_archivo TEXT,                     -- Nombre original del Excel
  fecha_evento DATE,
  ciudad TEXT,
  venue TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECCION DE BOLETOS por viaje
-- ============================================
CREATE TABLE secciones_boletos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,                    -- "GNP A", "CANCHA VIP", "BACHATA", "DIAMANTE"
  precio_cuadruple NUMERIC(10,2),
  precio_triple NUMERIC(10,2),
  precio_doble NUMERIC(10,2),
  precio_individual NUMERIC(10,2),
  costo_transporte NUMERIC(10,2) DEFAULT 780,
  costo_kit NUMERIC(10,2) DEFAULT 170,
  costo_gastos NUMERIC(10,2) DEFAULT 900,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIAJEROS
-- ============================================
CREATE TABLE viajeros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fecha_inscripcion DATE,
  talla TEXT,                              -- XS, S, M, L, XL, 2XL
  celular TEXT,
  correo TEXT,
  descuento TEXT,
  tipo_habitacion TEXT,                    -- DOBLE, TRIPLE, CUADRUPLE, INDIVIDUAL
  seccion_boleto TEXT,                     -- GNP A, CANCHA B, VIP, etc.
  ciudadania TEXT,
  fecha_nacimiento TEXT,
  estado TEXT DEFAULT 'activo',            -- activo, baja, espera
  notas TEXT,
  -- Campos de pago (calculados del Excel)
  total_pagado NUMERIC(10,2) DEFAULT 0,
  total_costo NUMERIC(10,2) DEFAULT 0,
  saldo_pendiente NUMERIC(10,2) DEFAULT 0,
  -- Operativo
  es_coordinador BOOLEAN DEFAULT false,
  es_operador BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ABONOS / PAGOS
-- ============================================
CREATE TABLE abonos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viajero_id UUID REFERENCES viajeros(id) ON DELETE CASCADE,
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL,
  numero_abono INTEGER,                    -- 1, 2, 3... (posicion en Excel)
  fecha_pago DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACTOS DE EMERGENCIA
-- ============================================
CREATE TABLE contactos_emergencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viajero_id UUID REFERENCES viajeros(id) ON DELETE CASCADE,
  nombre TEXT,
  parentesco TEXT,
  numero TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABITACIONES
-- ============================================
CREATE TABLE habitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE,
  numero_cuarto TEXT NOT NULL,             -- "Cuarto 1", "Cuarto 2"
  tipo TEXT,                               -- DOBLE, TRIPLE, CUADRUPLE
  hotel TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASIGNACION CUARTOS ↔ VIAJEROS
-- ============================================
CREATE TABLE asignaciones_cuarto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE CASCADE,
  viajero_id UUID REFERENCES viajeros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habitacion_id, viajero_id)
);

-- ============================================
-- LISTA DE ESPERA
-- ============================================
CREATE TABLE lista_espera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  celular TEXT,
  personas INTEGER DEFAULT 1,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAREAS
-- ============================================
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id),    -- NULL = tarea general
  titulo TEXT NOT NULL,
  descripcion TEXT,
  asignado_a UUID REFERENCES auth.users(id),
  estado TEXT DEFAULT 'pendiente',         -- pendiente, en_progreso, completada
  prioridad TEXT DEFAULT 'normal',         -- baja, normal, alta, urgente
  fecha_vencimiento DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MENSAJES ENVIADOS (log)
-- ============================================
CREATE TABLE mensajes_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viajero_id UUID REFERENCES viajeros(id),
  viaje_id UUID REFERENCES viajes(id),
  tipo TEXT NOT NULL,                      -- whatsapp, email
  plantilla TEXT,
  mensaje TEXT,
  destinatario TEXT,                       -- numero o email
  enviado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERFILES DE USUARIO (extender auth.users)
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'staff',       -- admin, staff
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX idx_viajeros_viaje ON viajeros(viaje_id);
CREATE INDEX idx_viajeros_nombre ON viajeros(nombre);
CREATE INDEX idx_abonos_viajero ON abonos(viajero_id);
CREATE INDEX idx_abonos_viaje ON abonos(viaje_id);
CREATE INDEX idx_habitaciones_viaje ON habitaciones(viaje_id);
CREATE INDEX idx_tareas_viaje ON tareas(viaje_id);
CREATE INDEX idx_tareas_asignado ON tareas(asignado_a);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_cuarto ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos_emergencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden leer todo
CREATE POLICY "authenticated_read_all" ON viajes FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON viajeros FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON abonos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON habitaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON asignaciones_cuarto FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON secciones_boletos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON contactos_emergencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON lista_espera FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON tareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON mensajes_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_read_own_profile" ON user_profiles FOR SELECT TO authenticated USING (true);

-- Política: usuarios autenticados pueden escribir
CREATE POLICY "authenticated_insert" ON viajes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON viajes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON viajes FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON viajeros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON viajeros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON viajeros FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON abonos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON abonos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON abonos FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON habitaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON habitaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON habitaciones FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON asignaciones_cuarto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_delete" ON asignaciones_cuarto FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON secciones_boletos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON secciones_boletos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON contactos_emergencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON contactos_emergencia FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON lista_espera FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON lista_espera FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON lista_espera FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON tareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON tareas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON mensajes_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- FUNCIÓN: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_viajes_updated_at BEFORE UPDATE ON viajes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_viajeros_updated_at BEFORE UPDATE ON viajeros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCIÓN: auto-crear perfil al registrar usuario
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, nombre, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), 
          COALESCE(NEW.raw_user_meta_data->>'rol', 'staff'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
