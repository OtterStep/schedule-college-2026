'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { estadisticasService } from '@/services/estadisticas.service';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { cn } from '@/lib/utilidades';

export default function ReportesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [modalEnviarTodos, setModalEnviarTodos] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-reportes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: cargaDocentes, isLoading: cargaLoading } = useQuery({
    queryKey: ['carga-docente-reportes', idPeriodo],
    queryFn: () => estadisticasService.cargaDocente(idPeriodo!).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const handleDescargar = async (tipo: 'pdf' | 'excel', idDocente?: number) => {
    if (!idPeriodo) return;
    const key = idDocente ? `${tipo}-${idDocente}` : `global-${tipo}`;
    setDescargando(key);
    try {
      let response: any;
      if (idDocente) {
        response = tipo === 'pdf'
          ? await reportesService.pdfDocente(idDocente, idPeriodo)
          : await reportesService.excelDocente(idDocente, idPeriodo);
        const docente = (cargaDocentes || []).find((d: any) => d.id === idDocente);
        const nombre = docente ? `${docente.apellidos}_${docente.nombres}` : `docente_${idDocente}`;
        descargarBlob(response.data, `horario_${nombre}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      } else {
        response = tipo === 'pdf'
          ? await reportesService.pdfGlobal(idPeriodo)
          : await reportesService.excelGlobal(idPeriodo);
        descargarBlob(response.data, `horarios_global.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      }
      setToast({ mensaje: 'Reporte descargado correctamente', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: err.response?.data?.error || 'Error al generar reporte', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  const handleEnviarCorreo = async (idDocente: number) => {
    if (!idPeriodo) return;
    setEnviandoId(idDocente);
    try {
      await reportesService.enviarCorreoDocente(idDocente, idPeriodo);
      setToast({ mensaje: 'Reporte enviado al correo del docente', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: err.response?.data?.error || 'Error al enviar correo', tipo: 'error' });
    } finally {
      setEnviandoId(null);
    }
  };

  const handleEnviarWhatsApp = (docente: any) => {
    if (!docente.telefono) {
      setToast({ mensaje: `El docente ${docente.apellidos} no tiene un teléfono registrado`, tipo: 'error' });
      return;
    }
    // Formatear el número (eliminar caracteres no numericos y asegurar prefijo de pais de Peru 51)
    let numero = docente.telefono.replace(/\D/g, '');
    if (numero.length === 9) {
      numero = `51${numero}`;
    }

    const urlReporte = `${window.location.origin}/api/reportes/docente/${docente.id}/pdf`;
    const mensaje = `Estimado/a Prof. *${docente.nombres} ${docente.apellidos}*,\n\nLe saluda la Secretaría de la Escuela de Ingeniería de Sistemas de la UNT.\n\nLe notificamos que su horario oficial para el periodo académico actual ha sido programado. Puede descargarlo directamente en formato PDF ingresando al siguiente enlace:\n👉 ${urlReporte}\n\nQuedamos a su disposición para cualquier consulta.\nAtentamente,\n*Escuela de Ingeniería de Sistemas - UNT*`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(link, '_blank');
    setToast({ mensaje: 'Redirigiendo a WhatsApp Web...', tipo: 'exito' });
  };

  const enviarTodosMutation = useMutation({
    mutationFn: () => reportesService.enviarCorreosTodos(idPeriodo!),
    onSuccess: (res: any) => {
      const { enviados, errores } = res.data;
      setToast({ mensaje: `Enviados: ${enviados} correos. Errores: ${errores}`, tipo: errores > 0 ? 'error' : 'exito' });
      setModalEnviarTodos(false);
    },
    onError: (err: any) => {
      setToast({ mensaje: err.response?.data?.error || 'Error al enviar correos', tipo: 'error' });
      setModalEnviarTodos(false);
    },
  });

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f3a] via-[#123b6d] to-[#0f4c81] px-8 py-8 text-white shadow-xl relative">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/80 mb-3">
              Gestión de Reportes
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Reportes de Horarios</h1>
            <p className="text-sm text-white/70 mt-1">
              Descarga o envía por correo los reportes PDF y Excel por docente o de forma global.
            </p>
          </div>
          <div className="w-64">
            <Selector
              label=""
              opciones={[
                { valor: '', etiqueta: 'Seleccionar periodo' },
                ...(periodos || []).map((p: any) => ({ valor: String(p.id), etiqueta: p.nombre })),
              ]}
              value={idPeriodo?.toString() || ''}
              onChange={(e) => setIdPeriodo(e.target.value ? parseInt(e.target.value) : null)}
              className="border-white/20 bg-white/90 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Global Actions */}
      {idPeriodo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '📄',
              title: 'PDF Global',
              desc: 'Un PDF con los horarios de todos los docentes del periodo.',
              action: () => handleDescargar('pdf'),
              key: 'global-pdf',
              label: 'Descargar PDF Global',
              color: 'from-red-50 to-rose-50 border-red-200',
            },
            {
              icon: '📊',
              title: 'Excel Global',
              desc: 'Un Excel con una hoja por docente y todos sus bloques.',
              action: () => handleDescargar('excel'),
              key: 'global-excel',
              label: 'Descargar Excel Global',
              color: 'from-emerald-50 to-green-50 border-emerald-200',
            },
            {
              icon: '✉️',
              title: 'Enviar a todos',
              desc: 'Envía PDF + Excel a todos los docentes por correo electrónico.',
              action: () => setModalEnviarTodos(true),
              key: 'enviar-todos',
              label: 'Enviar correos a todos',
              color: 'from-blue-50 to-indigo-50 border-blue-200',
            },
          ].map((card) => (
            <div key={card.key} className={cn('rounded-2xl border bg-gradient-to-br p-6 space-y-3', card.color)}>
              <div className="text-3xl">{card.icon}</div>
              <div>
                <h3 className="font-bold text-slate-800">{card.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{card.desc}</p>
              </div>
              <Boton
                onClick={card.action}
                disabled={descargando === card.key || (enviarTodosMutation.isPending && card.key === 'enviar-todos')}
                className="w-full"
              >
                {descargando === card.key ? 'Generando...' : (enviarTodosMutation.isPending && card.key === 'enviar-todos') ? 'Enviando...' : card.label}
              </Boton>
            </div>
          ))}
        </div>
      )}

      {/* Per-docente table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
            Reportes por Docente
          </h2>
          {cargaLoading && <SpinnerCarga />}
        </div>

        {!idPeriodo ? (
          <div className="px-6 py-14 text-center text-slate-500">
            Selecciona un periodo para ver los docentes disponibles.
          </div>
        ) : cargaLoading ? (
          <div className="p-8 flex justify-center"><SpinnerCarga /></div>
        ) : (cargaDocentes || []).length === 0 ? (
          <div className="px-6 py-14 text-center text-slate-500">
            No hay docentes con carga asignada en este periodo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Docente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Modalidad / Categoría</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">H. Asignadas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">H. Requeridas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Avance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">PDF · Excel · Correo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(cargaDocentes || []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.apellidos}, {d.nombres}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">{d.modalidad}</span>
                        <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full w-fit border border-indigo-100">{d.categoria}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{d.horasAsignadas}h</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{d.horasRequeridas}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all',
                              d.porcentajeCumplimiento >= 100 ? 'bg-emerald-500' :
                              d.porcentajeCumplimiento >= 50 ? 'bg-amber-500' : 'bg-rose-400'
                            )}
                            style={{ width: `${Math.min(d.porcentajeCumplimiento, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10">{d.porcentajeCumplimiento}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDescargar('pdf', d.id)}
                          disabled={descargando === `pdf-${d.id}`}
                          title="Descargar PDF"
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-50 text-base"
                        >
                          {descargando === `pdf-${d.id}` ? '⏳' : '📄'}
                        </button>
                        <button
                          onClick={() => handleDescargar('excel', d.id)}
                          disabled={descargando === `excel-${d.id}`}
                          title="Descargar Excel"
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all disabled:opacity-50 text-base"
                        >
                          {descargando === `excel-${d.id}` ? '⏳' : '📊'}
                        </button>
                        <button
                          onClick={() => handleEnviarCorreo(d.id)}
                          disabled={enviandoId === d.id}
                          title="Enviar por correo"
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all disabled:opacity-50 text-base"
                        >
                          {enviandoId === d.id ? '⏳' : '✉️'}
                        </button>
                        <button
                          onClick={() => handleEnviarWhatsApp(d)}
                          title="Notificar por WhatsApp"
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-base animate-pulse-subtle"
                        >
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal enviar a todos */}
      {modalEnviarTodos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✉️</div>
              <h2 className="text-xl font-bold text-slate-800">Enviar reportes a todos</h2>
              <p className="text-slate-600 text-sm mt-2">
                Se generará y enviará un PDF + Excel a cada docente con bloques asignados en este periodo. Esta acción puede tardar varios minutos.
              </p>
            </div>
            <div className="flex gap-3">
              <Boton variante="secundario" onClick={() => setModalEnviarTodos(false)} className="flex-1">
                Cancelar
              </Boton>
              <Boton
                onClick={() => enviarTodosMutation.mutate()}
                disabled={enviarTodosMutation.isPending}
                className="flex-1"
              >
                {enviarTodosMutation.isPending ? 'Enviando...' : 'Confirmar envío'}
              </Boton>
            </div>
          </div>
        </div>
      )}

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
