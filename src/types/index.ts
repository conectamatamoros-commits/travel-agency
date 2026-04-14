export interface Viaje {
  id: string
  nombre: string
  nombre_archivo?: string
  fecha_evento?: string
  ciudad?: string
  venue?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface SeccionBoleto {
  id: string
  viaje_id: string
  nombre: string
  precio_cuadruple?: number
  precio_triple?: number
  precio_doble?: number
  precio_individual?: number
  costo_transporte?: number
  costo_kit?: number
  costo_gastos?: number
}

export interface Viajero {
  id: string
  viaje_id: string
  nombre: string
  fecha_inscripcion?: string
  talla?: string
  celular?: string
  correo?: string
  descuento?: string
  tipo_habitacion?: string
  seccion_boleto?: string
  ciudadania?: string
  fecha_nacimiento?: string
  estado: 'activo' | 'baja' | 'espera'
  notas?: string
  total_pagado: number
  total_costo: number
  saldo_pendiente: number
  es_coordinador: boolean
  es_operador: boolean
  created_at: string
  updated_at: string
  // joins
  viaje?: Viaje
  abonos?: Abono[]
  contacto_emergencia?: ContactoEmergencia
  habitacion?: AsignacionCuarto & { habitacion: Habitacion }
}

export interface Abono {
  id: string
  viajero_id: string
  viaje_id: string
  monto: number
  numero_abono?: number
  fecha_pago?: string
  notas?: string
  created_at: string
}

export interface ContactoEmergencia {
  id: string
  viajero_id: string
  nombre?: string
  parentesco?: string
  numero?: string
}

export interface Habitacion {
  id: string
  viaje_id: string
  numero_cuarto: string
  tipo?: string
  hotel?: string
  notas?: string
  // joins
  asignaciones?: (AsignacionCuarto & { viajero: Viajero })[]
}

export interface AsignacionCuarto {
  id: string
  habitacion_id: string
  viajero_id: string
}

export interface ListaEspera {
  id: string
  viaje_id: string
  nombre: string
  celular?: string
  personas: number
  notas?: string
  created_at: string
}

export interface Tarea {
  id: string
  viaje_id?: string
  titulo: string
  descripcion?: string
  asignado_a?: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente'
  fecha_vencimiento?: string
  created_by?: string
  created_at: string
  updated_at: string
  // joins
  viaje?: Viaje
  asignado?: UserProfile
}

export interface MensajeLog {
  id: string
  viajero_id?: string
  viaje_id?: string
  tipo: 'whatsapp' | 'email'
  plantilla?: string
  mensaje: string
  destinatario: string
  enviado_por?: string
  created_at: string
}

export interface UserProfile {
  id: string
  nombre: string
  rol: 'admin' | 'staff'
  activo: boolean
  created_at: string
}

// Stats para el dashboard
export interface DashboardStats {
  total_viajes: number
  total_viajeros: number
  total_recaudado: number
  total_pendiente: number
  viajes_activos: number
  viajeros_por_viaje: { viaje: string; count: number }[]
  ingresos_por_viaje: { viaje: string; recaudado: number; pendiente: number }[]
}
