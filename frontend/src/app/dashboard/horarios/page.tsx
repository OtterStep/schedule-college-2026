'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { CalendarioGeneral } from '@/components/horarios/CalendarioGeneral';
import { useAuthStore } from '@/stores/auth.store';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { apiClient } from '@/lib/api-client';

export default function HorariosDashboardPage() {
  const { usuario } = useAuthStore();
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'AULA' | 'DOCENTE'>('AULA');
  const [filtroId, setFiltroId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState<{mensaje: string, tipo: 'exito' | 'error'} | null>(null);

  // Cargar periodos
  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  // Cargar ambientes
  const { data: ambientes } = useQuery({
    queryKey: ['ambientes'],
    queryFn: () => ambientesService.listar().then((res) => res.data),
  });

  // Seleccionar automáticamente el primer periodo activo si no hay uno seleccionado
  if (!idPeriodo && periodos?.length > 0) {
    const activo = periodos.find((p: any) => p.estado === 'ACTIVO');
    if (activo) setIdPeriodo(activo.id);
    else setIdPeriodo(periodos[0].id);
  }

  const publicarHorario = async () => {
    if (!idPeriodo) return;
    setCargando(true);
    try {
      const res = await apiClient.post('/horarios/publicar', { idPeriodo });
      setNotificacion({ mensaje: res.data.mensaje || 'Horario publicado exitosamente', tipo: 'exito' });
    } catch (error: any) {
      setNotificacion({ mensaje: error.response?.data?.error || 'Error al publicar', tipo: 'error' });
    } finally {
      setCargando(false);
      setTimeout(() => setNotificacion(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Horarios</h1>
          <p className="text-gray-500 mt-1">Coordina clases, asigna aulas y resuelve cruces en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <Boton 
            onClick={publicarHorario} 
            disabled={cargando || !idPeriodo} 
            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
          >
            {cargando ? 'Publicando...' : 'Publicar Horario Oficial'}
          </Boton>
        </div>
      </div>

      {notificacion && <NotificacionToast mensaje={notificacion.mensaje} tipo={notificacion.tipo} />}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-end">
        <div className="flex-1">
          <Selector
            label="Periodo Académico"
            opciones={[
              { valor: '', etiqueta: 'Seleccione un periodo' },
              ...(periodos?.map((p: any) => ({ valor: String(p.id), etiqueta: `${p.nombre} (${p.estado})` })) || []),
            ]}
            value={idPeriodo?.toString() || ''}
            onChange={(e) => setIdPeriodo(parseInt(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <Selector
            label="Tipo de Vista"
            opciones={[
              { valor: 'AULA', etiqueta: 'Vista por Aula / Laboratorio' },
              { valor: 'DOCENTE', etiqueta: 'Vista por Docente' },
            ]}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as 'AULA' | 'DOCENTE')}
          />
        </div>
        <div className="flex-1">
          {filtroTipo === 'AULA' ? (
            <Selector
              label="Seleccionar Ambiente"
              opciones={[
                { valor: '', etiqueta: 'Todos los ambientes' },
                ...(ambientes?.map((a: any) => ({ valor: String(a.id), etiqueta: `${a.codigo} - ${a.tipo}` })) || []),
              ]}
              value={filtroId?.toString() || ''}
              onChange={(e) => setFiltroId(e.target.value ? parseInt(e.target.value) : null)}
            />
          ) : (
            <Selector
              label="Seleccionar Docente"
              opciones={[
                { valor: '', etiqueta: 'Buscar docente...' },
                // Aquí irían los docentes mapeados
              ]}
              value={filtroId?.toString() || ''}
              onChange={(e) => setFiltroId(e.target.value ? parseInt(e.target.value) : null)}
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {idPeriodo ? (
          <CalendarioGeneral idPeriodo={idPeriodo} filtroTipo={filtroTipo} filtroId={filtroId} />
        ) : (
          <div className="p-12 text-center text-gray-500">
            Selecciona un periodo académico para comenzar a gestionar el horario.
          </div>
        )}
      </div>
    </div>
  );
}
