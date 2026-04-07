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
        fecha_pago:
          editForm.estado === "pagado" ? editForm.fecha_pago : null,
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

  const proximoAbono = abonos.find((a) => a.estado === "pendiente");
  const totalPagado = abonos
    .filter((a) => a.estado === "pagado")
    .reduce((sum, a) => sum + a.monto, 0);
  const totalPendiente = abonos
    .filter((a) => a.estado !== "pagado")
    .reduce((sum, a) => sum + a.monto, 0);

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
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Pagado</p>
          <p className="text-lg font-semibold text-green-800">
            {formatMonto(totalPagado)}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Pendiente</p>
          <p className="text-lg font-semibold text-amber-800">
            {formatMonto(totalPendiente)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">
            Próximo abono
          </p>
          <p className="text-sm font-semibold text-blue-800">
            {proximoAbono ? formatFecha(proximoAbono.fecha_limite) : "—"}
          </p>
        </div>
      </div>

      {/* Mensaje de éxito o error */}
      {mensaje && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            mensaje.tipo === "exito"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Lista de abonos */}
      <div className="space-y-2">
        {abonos.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            No hay abonos registrados para este viaje.
          </p>
        )}

        {abonos.map((abono, idx) => {
          const config = ESTADO_CONFIG[abono.estado];
          const esProximo =
            proximoAbono?.id === abono.id && abono.estado === "pendiente";
          const editando = editandoId === abono.id;

          return (
            <div
              key={abono.id}
              className={`rounded-xl border p-4 transition-all ${
                esProximo
                  ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                  : "border-gray-200 bg-white"
              }`}
            >
              {editando ? (
                /* Formulario de edición */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Nombre del abono
                      </label>
                      <input
                        type="text"
                        value={editForm.nombre_abono || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nombre_abono: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Fecha límite
                      </label>
                      <input
                        type="date"
                        value={editForm.fecha_limite || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fecha_limite: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Monto (MXN)
                      </label>
                      <input
                        type="number"
                        value={editForm.monto || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            monto: parseFloat(e.target.value),
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Estado
                      </label>
                      <select
                        value={editForm.estado || "pendiente"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            estado: e.target.value as EstadoPago,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                    {editForm.estado === "pagado" && (
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">
                          Fecha de pago real
                        </label>
                        <input
                          type="date"
                          value={editForm.fecha_pago || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, fecha_pago: e.target.value })
                          }
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
                /* Vista normal */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {abono.nombre_abono}
                        </p>
                        {esProximo && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Próximo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fecha límite: {formatFecha(abono.fecha_limite)}
                        {abono.fecha_pago &&
                          ` · Pagado: ${formatFecha(abono.fecha_pago)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {formatMonto(abono.monto)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                      />
                      {config.label}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => iniciarEdicion(abono)}
                        className="text-gray-400 hover:text-blue-600 transition p-1 rounded-lg hover:bg-blue-50"
                        title="Editar abono"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
