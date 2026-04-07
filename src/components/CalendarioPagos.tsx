"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TipoAbono =
  | "reservacion"
  | "abono_1"
  | "abono_2"
  | "abono_3"
  | "abono_4"
  | "liquidacion";

type EstadoPago = "pendiente" | "pagado" | "vencido";

interface AbonoPago {
  id: string;
  viaje_id: string;
  tipo_abono: TipoAbono;
  nombre_abono: string;
  fecha_limite: string;
  monto: number;
  estado: EstadoPago;
  fecha_pago: string | null;
}

interface CalendarioPagosProps {
  viajeId: string;
  isAdmin?: boolean;
}

const ORDEN_ABONOS: TipoAbono[] = [
  "reservacion",
  "abono_1",
  "abono_2",
  "abono_3",
  "abono_4",
  "liquidacion",
];

const TIPOS_ABONO: { value: TipoAbono; label: string }[] = [
  { value: "reservacion", label: "Reservación" },
  { value: "abono_1", label: "Abono 1" },
  { value: "abono_2", label: "Abono 2" },
  { value: "abono_3", label: "Abono 3" },
  { value: "abono_4", label: "Abono 4" },
  { value: "liquidacion", label: "Liquidación" },
];

const ESTADO_CONFIG: Record<
  EstadoPago,
  { label: string; color: string; bg: string; dot: string }
> = {
  pagado: {
    label: "Pagado",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  pendiente: {
    label: "Pendiente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  vencido: {
    label: "Vencido",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}

const FORM_VACIO = {
  tipo_abono: "reservacion" as TipoAbono,
  nombre_abono: "Reservación",
  fecha_limite: "",
  monto: "",
  estado: "pendiente" as EstadoPago,
  fecha_pago: "",
};

export default function CalendarioPagos({
  viajeId,
  isAdmin = false,
}: CalendarioPagosProps) {
  const supabase = createClient();
  const [abonos, setAbonos] = useState<AbonoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AbonoPago>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoAbono, setNuevoAbono] = useState(FORM_VACIO);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    cargarAbonos();
  }, [viajeId]);

  async function cargarAbonos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendario_pagos")
      .select("*")
      .eq("viaje_id", viajeId)
      .order("fecha_limite", { ascending: true });

    if (!error && data) {
      const ordenados = [...data].sort(
        (a, b) =>
          ORDEN_ABONOS.indexOf(a.tipo_abono) -
          ORDEN_ABONOS.indexOf(b.tipo_abono)
      );
      setAbonos(ordenados);
    }
    setLoading(false);
  }

  function handleTipoChange(tipo: TipoAbono) {
    const label = TIPOS_ABONO.find((t) => t.value === tipo)?.label ?? "";
    setNuevoAbono({ ...nuevoAbono, tipo_abono: tipo, nombre_abono: label });
  }

  async function agregarAbono() {
    if (!nuevoAbono.fecha_limite || !nuevoAbono.monto) {
      setMensaje({ tipo: "error", texto: "Completa la fecha y el monto." });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setAgregando(true);
    const { error } = await supabase.from("calendario_pagos").insert({
      viaje_id: viajeId,
      tipo_abono: nuevoAbono.tipo_abono,
      nombre_abono: nuevoAbono.nombre_abono,
      fecha_limite: nuevoAbono.fecha_limite,
      monto: parseFloat(nuevoAbono.monto as string),
      estado: nuevoAbono.estado,
      fecha_pago: nuevoAbono.estado === "pagado" ? nuevoAbono.fecha_pago || null : null,
    });

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al agregar el abono." });
    } else {
      setMensaje({ tipo: "exito", texto: "Abono agregado correctamente." });
      setNuevoAbono(FORM_VACIO);
      setMostrarFormNuevo(false);
      await cargarAbonos();
    }
    setAgregando(false);
    setTimeout(() => setMensaje(null), 3000);
  }

  function iniciarEdicion(abono: AbonoPago) {
    setEditandoId(abono.id);
    setEditForm({
      nombre_abono: abono.nombre_abono,
      fecha_limite: abono.fecha_limite,
      monto: abono.monto,
      estado: abono.estado,
      fecha_pago: abono.fecha_pago,
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditForm({});
  }

  async function guardarCambios(id: string) {
    setGuardando(true);
    const { error } = await supabase
      .from("calendario_pagos")
      .update({
        nombre_abono: editForm.nombre_abono,
        fecha_limite: editForm.fecha_limite,
        monto: editForm.monto,
        estado: editForm.estado,
        fecha_pago: editForm.estado === "pagado" ? editForm.fecha_pago : null,
      })
      .eq("id", id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al guardar los cambios." });
    } else {
      setMensaje({ tipo: "exito", texto: "Abono actualizado correctamente." });
      await cargarAbonos();
      setEditandoId(null);
    }
    setGuardando(false);
    setTimeout(() => setMensaje(null), 3000);
  }

  async function eliminarAbono(id: string) {
    if (!confirm("¿Eliminar este abono?")) return;
    const { error } = await supabase.from("calendario_pagos").delete().eq("id", id);
    if (!error) {
      await cargarAbonos();
      setMensaje({ tipo: "exito", texto: "Abono eliminado." });
      setTimeout(() => setMensaje(null), 3000);
    }
  }

  const proximoAbono = abonos.find((a) => a.estado === "pendiente");
  const totalPagado = abonos.filter((a) => a.estado === "pagado").reduce((sum, a) => sum + a.monto, 0);
  const totalPendiente = abonos.filter((a) => a.estado !== "pagado").reduce((sum, a) => sum + a.monto, 0);
  const tiposUsados = new Set(abonos.map((a) => a.tipo_abono));
  const tiposDisponibles = TIPOS_ABONO.filter((t) => !tiposUsados.has(t.value));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {abonos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Pagado</p>
            <p className="text-lg font-semibold text-green-800">{formatMonto(totalPagado)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium mb-1">Pendiente</p>
            <p className="text-lg font-semibold text-amber-800">{formatMonto(totalPendiente)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Próximo abono</p>
            <p className="text-sm font-semibold text-blue-800">
              {proximoAbono ? formatFecha(proximoAbono.fecha_limite) : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${mensaje.tipo === "exito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Lista de abonos */}
      <div className="space-y-2">
        {abonos.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">
            No hay abonos registrados. Agrega el primero.
          </p>
        )}

        {abonos.map((abono, idx) => {
          const config = ESTADO_CONFIG[abono.estado];
          const esProximo = proximoAbono?.id === abono.id;
          const editando = editandoId === abono.id;

          return (
            <div
              key={abono.id}
              className={`rounded-xl border p-4 transition-all ${esProximo ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200" : "border-gray-200 bg-white"}`}
            >
              {editando ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                      <input
                        type="text"
                        value={editForm.nombre_abono || ""}
                        onChange={(e) => setEditForm({ ...editForm, nombre_abono: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fecha límite</label>
                      <input
                        type="date"
                        value={editForm.fecha_limite || ""}
                        onChange={(e) => setEditForm({ ...editForm, fecha_limite: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Monto (MXN)</label>
                      <input
                        type="number"
                        value={editForm.monto || ""}
                        onChange={(e) => setEditForm({ ...editForm, monto: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Estado</label>
                      <select
                        value={editForm.estado || "pendiente"}
                        onChange={(e) => setEditForm({ ...editForm, estado: e.target.value as EstadoPago })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                    {editForm.estado === "pagado" && (
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Fecha de pago real</label>
                        <input
                          type="date"
                          value={editForm.fecha_pago || ""}
                          onChange={(e) => setEditForm({ ...editForm, fecha_pago: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => guardarCambios(abono.id)}
                      disabled={guardando}
                      className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {guardando ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{abono.nombre_abono}</p>
                        {esProximo && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Próximo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fecha límite: {formatFecha(abono.fecha_limite)}
                        {abono.fecha_pago && ` · Pagado: ${formatFecha(abono.fecha_pago)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">{formatMonto(abono.monto)}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => iniciarEdicion(abono)}
                          className="text-gray-400 hover:text-blue-600 transition p-1 rounded-lg hover:bg-blue-50"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => eliminarAbono(abono.id)}
                          className="text-gray-400 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón / formulario nuevo abono */}
      {isAdmin && tiposDisponibles.length > 0 && (
        <div>
          {!mostrarFormNuevo ? (
            <button
              onClick={() => {
                setMostrarFormNuevo(true);
                setNuevoAbono({ ...FORM_VACIO, tipo_abono: tiposDisponibles[0].value, nombre_abono: tiposDisponibles[0].label });
              }}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition font-medium"
            >
              + Agregar abono
            </button>
          ) : (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Nuevo abono</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo de abono</label>
                  <select
                    value={nuevoAbono.tipo_abono}
                    onChange={(e) => handleTipoChange(e.target.value as TipoAbono)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {tiposDisponibles.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre personalizado</label>
                  <input
                    type="text"
                    value={nuevoAbono.nombre_abono}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, nombre_abono: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha límite</label>
                  <input
                    type="date"
                    value={nuevoAbono.fecha_limite}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, fecha_limite: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto (MXN)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={nuevoAbono.monto}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, monto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Estado</label>
                  <select
                    value={nuevoAbono.estado}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, estado: e.target.value as EstadoPago })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                {nuevoAbono.estado === "pagado" && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fecha de pago real</label>
                    <input
                      type="date"
                      value={nuevoAbono.fecha_pago}
                      onChange={(e) => setNuevoAbono({ ...nuevoAbono, fecha_pago: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={agregarAbono}
                  disabled={agregando}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {agregando ? "Agregando..." : "Agregar"}
                </button>
                <button
                  onClick={() => { setMostrarFormNuevo(false); setNuevoAbono(FORM_VACIO); }}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && tiposDisponibles.length === 0 && abonos.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-2">Todos los tipos de abono han sido agregados.</p>
      )}
    </div>
  );
}
