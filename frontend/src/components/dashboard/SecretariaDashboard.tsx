'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { useKPIsSecretaria } from '@/hooks/useEstadisticas';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/stores/auth.store';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Users, BookOpen, School, Clock, CheckSquare, FileDown, AlertCircle, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function SecretariaDashboard() {
  const { usuario } = useAuthStore();
  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-secretaria'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });
  const { data: periodos } = useQuery({
    queryKey: ['periodos-lista-secretaria'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const [idPeriodoSeleccionado, setIdPeriodoSeleccionado] = useState<number>(0);
  const idPeriodo = idPeriodoSeleccionado || periodoActivo?.id || 0;

  const { data: kpisData, isLoading: kpisLoading } = useKPIsSecretaria(idPeriodo);
  const [modalPublicarOpen, setModalPublicarOpen] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [descargando, setDescargando] = useState<'pdf' | 'excel' | null>(null);

  const handleDescargarGlobal = async (tipo: 'pdf' | 'excel') => {
    if (!idPeriodo) return;
    setDescargando(tipo);
    try {
      const response = tipo === 'pdf'
        ? await reportesService.pdfGlobal(idPeriodo)
        : await reportesService.excelGlobal(idPeriodo);
      descargarBlob(response.data, `horarios_global_${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      setToast({ mensaje: 'Reporte global descargado con éxito', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: 'Error al generar reporte global', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  const enviarCorreosTodosMutation = useMutation({
    mutationFn: () => reportesService.enviarCorreosTodos(idPeriodo),
    onSuccess: (res: any) => {
      const { enviados, errores } = res.data;
      setToast({
        mensaje: `Publicación exitosa. Se enviaron ${enviados} correos (${errores} errores).`,
        tipo: errores > 0 ? 'error' : 'exito',
      });
      setModalPublicarOpen(false);
    },
    onError: (err: any) => {
      setToast({
        mensaje: err.response?.data?.error || 'Error al publicar y enviar correos',
        tipo: 'error',
      });
      setModalPublicarOpen(false);
    },
  });


  const getColorSemaforo = (semaforo: string) => {
    switch (semaforo) {
      case 'ROJO': return 'bg-red-500';
      case 'AMARILLO': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getTextColorSemaforo = (semaforo: string) => {
    switch (semaforo) {
      case 'ROJO': return 'text-red-700';
      case 'AMARILLO': return 'text-yellow-700';
      default: return 'text-green-700';
    }
  };

  const getIconoSemaforo = (semaforo: string) => {
    switch (semaforo) {
      case 'ROJO': return <AlertCircle className="h-6 w-6" />;
      case 'AMARILLO': return <AlertTriangle className="h-6 w-6" />;
      default: return <CheckCircle2 className="h-6 w-6" />;
    }
  };

  if (periodoLoading || kpisLoading) return <SpinnerCarga />;

  const porcentajeDocentes = kpisData?.docentes.total > 0 
    ? Math.round((kpisData.docentes.elegidos / kpisData.docentes.total) * 100) 
    : 0;
  const porcentajeCursos = kpisData?.cursos.total > 0 
    ? Math.round((kpisData.cursos.completos / kpisData.cursos.total) * 100) 
    : 0;
  const porcentajeOcupacion = kpisData?.ocupacion.horasDisponibles > 0 
    ? Math.round((kpisData.ocupacion.horasOcupadas / kpisData.ocupacion.horasDisponibles) * 100) 
    : 0;

  const chartData = (kpisData?.avanceCursos || []).map((curso: any) => ({
    curso: curso.curso,
    porcentaje: curso.porcentaje
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 px-6 py-8 text-slate-900 sm:px-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1e3a5f 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                SECRETARIA
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">Dashboard de coordinacion</h1>
                <p className="text-sm leading-6 text-slate-600 sm:text-base">
                  Panorama rapido del avance de asignaciones, ocupacion de ambientes y acciones criticas del periodo activo.
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                {getIconoSemaforo(kpisData?.ventana?.semaforo || 'VERDE')}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">VENTANA ACTIVA</p>
                  <p className={`text-xl font-bold ${getTextColorSemaforo(kpisData?.ventana?.semaforo || 'VERDE')}`}>
                    {kpisData?.ventana?.tiempoRestante 
                      ? `${kpisData.ventana.tiempoRestante.dias}d ${kpisData.ventana.tiempoRestante.horas}h ${kpisData.ventana.tiempoRestante.minutos}m restantes`
                      : 'Sin ventana activa'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${getColorSemaforo(kpisData?.ventana?.semaforo || 'VERDE')}`} />
                <span className="text-slate-600 font-medium">Semaforo: {kpisData?.ventana?.semaforo || 'VERDE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-white rounded-xl flex-shrink-0 shadow-sm">
              <Users className="w-6 h-6 text-sky-700" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Docentes que eligieron</p>
              <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                {porcentajeDocentes}%
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {kpisData?.docentes.elegidos} / {kpisData?.docentes.total}
              </p>
              <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full transition-all duration-500" style={{ width: `${porcentajeDocentes}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-white rounded-xl flex-shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Cursos completos</p>
              <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                {porcentajeCursos}%
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {kpisData?.cursos.completos} / {kpisData?.cursos.total}
              </p>
              <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${porcentajeCursos}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-white rounded-xl flex-shrink-0 shadow-sm">
              <School className="w-6 h-6 text-violet-700" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Ocupacion de ambientes</p>
              <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                {porcentajeOcupacion}%
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {kpisData?.ocupacion.horasOcupadas}h / {kpisData?.ocupacion.horasDisponibles}h
              </p>
              <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full transition-all duration-500" style={{ width: `${porcentajeOcupacion}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl flex-shrink-0 shadow-sm">
              <Clock className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Tiempo restante</p>
              <h4 className="text-3xl font-bold text-slate-900 tracking-tight">
                {kpisData?.ventana?.tiempoRestante 
                  ? `${kpisData.ventana.tiempoRestante.dias}d ${kpisData.ventana.tiempoRestante.horas}h ${kpisData.ventana.tiempoRestante.minutos}m`
                  : '---'}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Hasta fecha limite de la ventana.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Registro Manual */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-sky-50 rounded-xl">
                    <CheckSquare className="w-7 h-7 text-sky-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Registrar horario manual</h3>
                <p className="text-sm text-slate-600 mb-4">Abre un formulario para que secretaría asigne horario a un docente de forma directa.</p>
                <p className="text-xs text-slate-500 mb-4">Campos: Docente, Curso, Horario, Ambiente.</p>
              </div>
              <Link href="/dashboard/secretaria/registro-horarios" className="mt-auto">
                <Boton className="w-full">
                  Ir a formulario
                </Boton>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Buscar ambientes */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <School className="w-7 h-7 text-indigo-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Buscar ambientes</h3>
                <p className="text-sm text-slate-600 mb-4">Revisa la disponibilidad de aulas físicas, laboratorios y capacidad ocupada.</p>
                <p className="text-xs text-slate-500 mb-4">Monitorea y previene cruces de aulas.</p>
              </div>
              <Link href="/dashboard/secretaria/ambientes" className="mt-auto">
                <Boton className="w-full" variante="secundario">
                  Ver ambientes
                </Boton>
              </Link>
            </CardContent>
          </Card>

          {/* Card 3: Descargar reportes globales */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <FileDown className="w-7 h-7 text-emerald-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reportes Consolidados</h3>
                <p className="text-sm text-slate-600 mb-4">Descarga los horarios de todos los docentes asignados en este período académico.</p>
              </div>
              <div className="space-y-2 mt-auto">
                <Boton
                  className="w-full flex items-center justify-center gap-2"
                  variante="borde"
                  disabled={descargando !== null}
                  onClick={() => handleDescargarGlobal('pdf')}
                >
                  {descargando === 'pdf' ? 'Generando...' : 'Descargar PDF Global'}
                </Boton>
                <Boton
                  className="w-full flex items-center justify-center gap-2"
                  variante="borde"
                  disabled={descargando !== null}
                  onClick={() => handleDescargarGlobal('excel')}
                >
                  {descargando === 'excel' ? 'Generando...' : 'Descargar Excel Global'}
                </Boton>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Generar horarios finales */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-rose-50/20 border-rose-100">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-rose-100 rounded-xl">
                    <Mail className="w-7 h-7 text-rose-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-rose-950 mb-2">Enviar Horarios por Correo</h3>
                <p className="text-sm text-rose-900/80 mb-4">Notifica por correo electrónico a todos los docentes activos adjuntando sus horarios en PDF y Excel.</p>
              </div>
              <Boton
                className="w-full mt-auto"
                variante="peligro"
                disabled={enviarCorreosTodosMutation.isPending}
                onClick={() => setModalPublicarOpen(true)}
              >
                {enviarCorreosTodosMutation.isPending ? 'Enviando...' : 'Publicar y Notificar'}
              </Boton>
            </CardContent>
          </Card>
        </div>

        {/* Chart Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Estado de asignación por curso</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis
                  dataKey="curso"
                  type="category"
                  width={200}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Avance']}
                />
                <Bar dataKey="porcentaje" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={24}>
                  <LabelList dataKey="porcentaje" position="right" formatter={(value: number) => `${value}%`} fill="#374151" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Modal
        abierto={modalPublicarOpen}
        cerrar={() => setModalPublicarOpen(false)}
        titulo="¿Publicar horarios y enviar correos?"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Esta acción generará los reportes PDF y Excel consolidados para cada uno de los docentes activos que tengan bloques programados en este período, y enviará un correo electrónico con sus respectivos adjuntos.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span>
              Asegúrate de que la configuración del servidor de correo saliente (SMTP) esté activa y con credenciales correctas en el archivo de entorno.
            </span>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Boton variante="secundario" onClick={() => setModalPublicarOpen(false)} disabled={enviarCorreosTodosMutation.isPending}>
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={() => enviarCorreosTodosMutation.mutate()}
              disabled={enviarCorreosTodosMutation.isPending}
            >
              {enviarCorreosTodosMutation.isPending ? 'Enviando...' : 'Confirmar Envío'}
            </Boton>
          </div>
        </div>
      </Modal>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}

