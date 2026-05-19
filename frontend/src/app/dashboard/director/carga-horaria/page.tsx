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
import { Users, BookOpen, AlertCircle, Save, Plus } from 'lucide-react';

export default function CargaHorariaPage() {
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<any>(null);
  const [idDocente, setIdDocente] = useState<number>(0);
  const [horasAsignadas, setHorasAsignadas] = useState<number>(0);

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then(res => res.data)
  });

  const { data: docentes } = useQuery({
    queryKey: ['docentes'],
    queryFn: () => docentesService.listar({}).then(res => res.data)
  });

  const { data: resumenCarga } = useQuery({
    queryKey: ['resumen-carga', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });

  // También necesitamos ver los cursos y sus componentes para asignarles docentes
  const { data: cursosConOferta } = useQuery({
    queryKey: ['cursos-con-oferta', idPeriodo],
    queryFn: async () => {
      // Esta es una simplificación, idealmente habría un endpoint que devuelva 
      // todos los componentes de un periodo.
      const cursos = await cursosService.listar().then(res => res.data);
      const detalles = await Promise.all(
        cursos.map(async (c: any) => {
          const det = await cursosService.obtener(c.id).then(res => res.data);
          return {
            ...c,
            oferta: det.ofertas.find((o: any) => o.id_periodo === idPeriodo)
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
      setMensaje({ texto: 'Carga horaria asignada correctamente', tipo: 'success' });
      setModalAsignacion(false);
      queryClient.invalidateQueries({ queryKey: ['resumen-carga', idPeriodo] });
      queryClient.invalidateQueries({ queryKey: ['cursos-con-oferta', idPeriodo] });
    },
    onError: (error: any) => {
      setMensaje({ texto: error.response?.data?.error || 'Error al asignar carga', tipo: 'error' });
    }
  });

  const abrirModalAsignacion = (comp: any) => {
    setComponenteSeleccionado(comp);
    setHorasAsignadas(comp.horas_requeridas);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carga Horaria</h1>
          <p className="text-gray-500 text-sm">Asigna docentes a los componentes de cada curso.</p>
        </div>
        <div className="w-64">
          <Selector
            label="Período"
            value={idPeriodo}
            onChange={(e: any) => setIdPeriodo(Number(e.target.value))}
          >
            <option value={0}>Seleccione periodo</option>
            {periodos?.map((p: any) => (
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-unt-primary" /> Estado de Docentes
          </h2>
          {!idPeriodo && <p className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">Resumen de carga docente</p>}
          {resumenCarga?.map((docente: any) => {
            const horasAsignadasTotal = docente.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0);
            const limite = docente.horas_max_semana || 40;
            const porcentaje = Math.min(100, (horasAsignadasTotal / limite) * 100);
            const colorBarra = porcentaje > 90 ? 'bg-red-500' : porcentaje > 70 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <Card key={docente.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{docente.apellidos}, {docente.nombres}</p>
                      <p className="text-xs text-gray-500">{docente.modalidad} - {docente.categoria}</p>
                    </div>
                    <p className="text-xs font-bold">{horasAsignadasTotal} / {limite}h</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`${colorBarra} h-1.5 rounded-full transition-all`} style={{ width: `${porcentaje}%` }}></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

      {mensaje && (
        <NotificacionToast
          mensaje={mensaje.texto}
          tipo={mensaje.tipo === 'success' ? 'exito' : mensaje.tipo}
          onClose={() => setMensaje(null)}
        />
      )}
    </div>
  );
}
