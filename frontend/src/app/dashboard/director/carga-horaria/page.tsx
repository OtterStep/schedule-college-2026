'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { docentesService } from '@/services/docentes.service';
import { cursosService } from '@/services/cursos.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Selector } from '@/components/ui/Selector';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Modal } from '@/components/ui/Modal';
import { Users, BookOpen, AlertCircle, Save, Plus, Clock, GraduationCap, ArrowRight } from 'lucide-react';

export default function CargaHorariaPage() {
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<any>(null);
  const [idDocente, setIdDocente] = useState<number>(0);
  const [horasAsignadas, setHorasAsignadas] = useState<number>(0);

  const { data: responsePeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then(res => res.data)
  });
  const periodos = Array.isArray(responsePeriodos) ? responsePeriodos : responsePeriodos?.data || [];

  const { data: responseDocentes } = useQuery({
    queryKey: ['docentes'],
    queryFn: () => docentesService.listar({}).then(res => res.data)
  });
  const docentes = Array.isArray(responseDocentes) ? responseDocentes : responseDocentes?.data || [];

  const { data: responseResumen } = useQuery({
    queryKey: ['resumen-carga', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });
  const resumenCarga = Array.isArray(responseResumen) ? responseResumen : responseResumen?.data || [];

  const { data: cursosConOferta, isLoading: loadingOferta } = useQuery({
    queryKey: ['cursos-con-oferta', idPeriodo],
    queryFn: async () => {
      const res = await cursosService.listar().then(res => res.data);
      const cursos = Array.isArray(res) ? res : res?.data || [];
      const detalles = await Promise.all(
        cursos.map(async (c: any) => {
          const detRes = await cursosService.obtener(c.id).then(res => res.data);
          return {
            ...c,
            oferta: detRes.ofertas?.find((o: any) => o.id_periodo === idPeriodo)
          };
        })
      );
      return detalles.filter(d => d.oferta);
    },
    enabled: idPeriodo > 0
  });

  const mutationAsignar = useMutation({
    mutationFn: (datos: any) => cargaHorariaService.asignarCarga(datos),
    onSuccess: () => {
      setToast({ mensaje: 'Carga horaria asignada correctamente', tipo: 'exito' });
      setModalAsignacion(false);
      queryClient.invalidateQueries({ queryKey: ['resumen-carga', idPeriodo] });
      queryClient.invalidateQueries({ queryKey: ['cursos-con-oferta', idPeriodo] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al asignar carga', tipo: 'error' });
    }
  });

  const abrirModalAsignacion = (comp: any) => {
    setComponenteSeleccionado(comp);
    setHorasAsignadas(comp.horas_requeridas);
    setIdDocente(0);
    setModalAsignacion(true);
  };

  const manejarAsignar = () => {
    if (!idDocente || !horasAsignadas) return;
    mutationAsignar.mutate({
      id_componente: componenteSeleccionado.id,
      id_docente: idDocente,
      horas_asignadas: horasAsignadas
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Carga Horaria</h1>
          <p className="text-slate-500 mt-1">Asigna docentes a los componentes de cada curso para el período lectivo.</p>
        </div>
        <div className="w-full sm:w-72">
          <Selector
            label="Seleccionar Período Lectivo"
            value={idPeriodo}
            onChange={(e: any) => setIdPeriodo(Number(e.target.value))}
          >
            <option value={0}>-- Elegir período --</option>
            {periodos.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Selector>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Cursos y sus Componentes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-unt-primary" /> Cursos Ofertados
          </h2>
          {!idPeriodo && <p className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">Seleccione un periodo para ver la oferta</p>}
          {cursosConOferta?.map((curso: any) => (
            <Card key={curso.id}>
              <CardHeader className="py-3 bg-gray-50/50">
                <CardTitle className="text-md flex justify-between">
                  <span>{curso.codigo} - {curso.nombre}</span>
                  <span className="text-xs font-normal text-gray-500 uppercase">Ciclo {curso.oferta.id_ciclo}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-3">
                  {curso.oferta.componentes.map((comp: any) => (
                    <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{comp.tipo}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{comp.horas_requeridas} horas requeridas</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                            Faltan: {comp.horas_requeridas - comp.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0)}h
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comp.asignaciones.map((asig: any) => (
                            <span key={asig.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                              {asig.docente.apellidos} ({asig.horas_asignadas}h)
                            </span>
                          ))}
                          {comp.asignaciones.length === 0 && (
                            <span className="text-[10px] text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Sin docente asignado
                            </span>
                          )}
                        </div>
                      </div>
                      <Boton onClick={() => abrirModalAsignacion(comp)}>
                        <Plus className="h-4 w-4 mr-1" /> Asignar
                      </Boton>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Resumen de Carga Docente */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-unt-primary" /> Carga Docente
            </h2>
            
            <div className="grid gap-4">
              {resumenCarga?.map((docente: any) => {
                const horasAsignadasTotal = docente.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0);
                const limite = docente.horas_max_semana || 40;
                const porcentaje = Math.min(100, (horasAsignadasTotal / limite) * 100);
                const colorBarra = porcentaje > 95 ? 'bg-red-500' : porcentaje > 80 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <Card key={docente.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <p className="font-bold text-sm text-slate-900 leading-tight">{docente.apellidos}, {docente.nombres}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{docente.categoria}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-extrabold ${porcentaje > 95 ? 'text-red-600' : 'text-slate-700'}`}>
                            {horasAsignadasTotal} / {limite}h
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`${colorBarra} h-full rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${porcentaje}%` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

      {modalAsignacion && (
        <Modal cerrar={() => setModalAsignacion(false)}>
          <div className="space-y-4">
            
            <h2 className="text-lg font-semibold">
              Asignar Docente
            </h2>

            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
              Asignando docente para:
              <strong> {componenteSeleccionado?.tipo}</strong>
            </div>

            <Selector
              label="Docente"
              value={idDocente}
              onChange={(e: any) => setIdDocente(Number(e.target.value))}
            >
              <option value={0}>Seleccione un docente</option>

              {docentes?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.apellidos}, {d.nombres} ({d.categoria})
                </option>
              ))}
            </Selector>

            <CampoTexto
              label="Horas a Asignar"
              type="number"
              value={horasAsignadas}
              onChange={(e: any) =>
                setHorasAsignadas(Number(e.target.value))
              }
            />

            <div className="flex justify-end gap-3 pt-4">
              <Boton
                variante="borde"
                onClick={() => setModalAsignacion(false)}
              >
                Cancelar
              </Boton>

              <Boton
                onClick={manejarAsignar}
                disabled={mutationAsignar.isPending}
              >
                <Save className="h-4 w-4 mr-2" />

                {mutationAsignar.isPending
                  ? 'Guardando...'
                  : 'Guardar Asignación'}
              </Boton>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <NotificacionToast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
