'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { ventanasService } from '@/services/ventanas.service';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const formatearFecha = (fecha?: string | Date) => {
  if (!fecha) return '';
  const f = new Date(fecha);
  const y = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function VentanasSecretariaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('13:00');
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [mostrarEdicion, setMostrarEdicion] = useState(false);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-ventanas'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-ventanas'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) {
      setIdPeriodo(periodoActivo.id);
    }
    if (periodoActivo && !fechaInicio) {
      setFechaInicio(formatearFecha(periodoActivo.fecha_inicio));
    }
    if (periodoActivo && !fechaFin) {
      setFechaFin(formatearFecha(periodoActivo.fecha_fin));
    }
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [idPeriodo, periodoActivo, fechaInicio, fechaFin, periodos]);

  const { data: ventanas, isLoading: ventanasLoading } = useQuery({
    queryKey: ['ventanas-secretaria', idPeriodo],
    queryFn: () => ventanasService.listar(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const actualizarMutation = useMutation({
    mutationFn: () =>
      ventanasService.actualizarHorario({
        idPeriodo: idPeriodo as number,
        fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Horario de atencion actualizado', tipo: 'exito' });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al actualizar horario', tipo: 'error' });
    },
  });

  const desactivarMutation = useMutation({
    mutationFn: () => ventanasService.desactivar(idPeriodo as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Ventanas desactivadas', tipo: 'exito' });
      setMostrarEdicion(false);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al desactivar ventanas', tipo: 'error' });
    },
  });

  const filas = useMemo(() => {
    const lista: any[] = [];
    (ventanas || [])
      .filter((ventana: any) => ventana.estado === 'PENDIENTE' || ventana.estado === 'EN_PROCESO')
      .forEach((ventana: any) => {
      const fechaAtencion = new Date(ventana.fecha).toLocaleDateString('es-PE');
      (ventana.atenciones || []).forEach((atencion: any) => {
        const completado = atencion.estado === 'COMPLETADO' ? 100 : atencion.estado === 'EN_PROCESO' ? 50 : 0;
        lista.push({
          id: `${ventana.id}-${atencion.id_docente}`,
          docente: `${atencion.docente.nombres} ${atencion.docente.apellidos}`,
          tipo: ventana.modalidad,
          categoria: ventana.categoria,
          fecha_atencion: fechaAtencion,
          hora_atencion: `${ventana.hora_inicio} - ${ventana.hora_fin}`,
          completado: `${completado}%`,
        });
      });
    });
    return lista;
  }, [ventanas]);

  const ventanaActiva = useMemo(() => {
    return (ventanas || []).find((v: any) => v.estado === 'PENDIENTE' || v.estado === 'EN_PROCESO') || null;
  }, [ventanas]);

  const rangoVentana = useMemo(() => {
    if (!ventanas || ventanas.length === 0) return null;

    const fechas = ventanas.map((v: any) => new Date(v.fecha));

    const fechaMin = new Date(
        Math.min(...fechas.map((f: Date) => f.getTime()))
    );

    const fechaMax = new Date(
        Math.max(...fechas.map((f: Date) => f.getTime()))
    );

    const horaMin = ventanas.reduce(
        (acc: string, v: any) =>
        v.hora_inicio < acc ? v.hora_inicio : acc,
        '23:59'
    );

    const horaMax = ventanas.reduce(
        (acc: string, v: any) =>
        v.hora_fin > acc ? v.hora_fin : acc,
        '00:00'
    );

    return {
        fechaInicio: formatearFecha(fechaMin),
        fechaFin: formatearFecha(fechaMax),
        horaInicio: horaMin,
        horaFin: horaMax,
    };
    }, [ventanas]);

  useEffect(() => {
    if (rangoVentana && !mostrarEdicion) {
      setFechaInicio(rangoVentana.fechaInicio);
      setFechaFin(rangoVentana.fechaFin);
      setHoraInicio(rangoVentana.horaInicio);
      setHoraFin(rangoVentana.horaFin);
    }
  }, [rangoVentana, mostrarEdicion]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horario de ventanas</h1>
          <p className="text-sm text-gray-500">Generacion automatica de atenciones por prioridad docente.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          <div className="w-full sm:w-72">
            <Selector
              label="Periodo"
              opciones={[
                { valor: '', etiqueta: 'Seleccionar periodo' },
                ...(periodos || []).map((p: any) => ({ valor: String(p.id), etiqueta: p.nombre })),
              ]}
              value={idPeriodo?.toString() || ''}
              onChange={(e) => setIdPeriodo(e.target.value ? parseInt(e.target.value, 10) : null)}
            />
          </div>
          <Boton onClick={() => router.push('/dashboard/secretaria/ventanas/crear')}>
            Crear ventana de atencion
          </Boton>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventana actual</CardTitle>
        </CardHeader>
        <CardContent>
          {ventanasLoading ? (
            <SpinnerCarga />
          ) : ventanaActiva ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Fecha</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {rangoVentana?.fechaInicio} - {rangoVentana?.fechaFin}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Horario diario</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {rangoVentana?.horaInicio} - {rangoVentana?.horaFin}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
                  <p className="mt-2 font-semibold text-slate-900">{ventanaActiva.estado}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Boton variante="secundario" onClick={() => setMostrarEdicion((prev) => !prev)}>
                  {mostrarEdicion ? 'Cancelar edicion' : 'Editar ventana'}
                </Boton>
                <Boton
                  variante="peligro"
                  onClick={() => {
                    if (!idPeriodo) return;
                    if (confirm('¿Deseas desactivar todas las ventanas de este periodo?')) {
                      desactivarMutation.mutate();
                    }
                  }}
                  disabled={!idPeriodo || desactivarMutation.isPending}
                >
                  {desactivarMutation.isPending ? 'Desactivando...' : 'Desactivar ventana'}
                </Boton>
              </div>

              {mostrarEdicion && (
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="flex flex-col gap-2 text-sm">
                    Fecha inicio de ventanas
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Fecha max de atencion
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Hora inicio por dia
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Hora fin por dia
                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex items-end">
                    <Boton
                      onClick={() => actualizarMutation.mutate()}
                      disabled={
                        !idPeriodo ||
                        !fechaInicio ||
                        !fechaFin ||
                        !horaInicio ||
                        !horaFin ||
                        actualizarMutation.isPending
                      }
                    >
                      {actualizarMutation.isPending ? 'Actualizando...' : 'Guardar cambios'}
                    </Boton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aun no hay ventanas activas o pendientes para este periodo.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atenciones programadas</CardTitle>
        </CardHeader>
        <CardContent>
          {ventanasLoading ? (
            <SpinnerCarga />
          ) : filas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No hay atenciones activas o pendientes para mostrar.
            </div>
          ) : (
            <TablaDatos
              columnas={[
                { clave: 'docente', titulo: 'Docente' },
                { clave: 'tipo', titulo: 'Tipo' },
                { clave: 'categoria', titulo: 'Categoria' },
                { clave: 'fecha_atencion', titulo: 'Fecha atencion' },
                { clave: 'hora_atencion', titulo: 'Hora atencion' },
                { clave: 'completado', titulo: '% Completado' },
              ]}
              datos={filas}
            />
          )}
        </CardContent>
      </Card>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
