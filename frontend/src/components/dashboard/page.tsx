'use client';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { useResumen, useAvanceCategoria, useOcupacionAmbientes, useMapaCalor, useCargaDocente } from '@/hooks/useEstadisticas';
import { useActividadTiempoReal } from '@/hooks/useActividadTiempoReal';
import { PanelKPIs } from '@/components/dashboard/PanelKPIs';
import { GraficoAvanceCategoria } from '@/components/dashboard/GraficoAvanceCategoria';
import { GraficoOcupacionAmbientes } from '@/components/dashboard/GraficoOcupacionAmbientes';
import { MapaCalorOcupacion } from '@/components/dashboard/MapaCalorOcupacion';
import { ActividadTiempoReal } from '@/components/dashboard/ActividadTiempoReal';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function DashboardPage() {
  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });
  const idPeriodo = periodoActivo?.id || 0;

  const { data: resumen, isLoading: resumenLoading } = useResumen(idPeriodo);
  const { data: avanceCategoria } = useAvanceCategoria(idPeriodo);
  const { data: ocupacion } = useOcupacionAmbientes(idPeriodo);
  const { data: mapaCalor } = useMapaCalor(idPeriodo);
  const { data: cargaDocente } = useCargaDocente(idPeriodo);
  const eventos = useActividadTiempoReal();

  if (periodoLoading || resumenLoading) return <SpinnerCarga />;

  const kpis = resumen
    ? [
        { etiqueta: 'Docentes', valor: resumen.totalDocentes },
        { etiqueta: 'Cursos', valor: resumen.totalCursos },
        { etiqueta: 'Ambientes', valor: resumen.totalAmbientes },
        { etiqueta: 'Horarios Asignados', valor: `${resumen.horariosAsignados} (${resumen.porcentajeAsignado}%)` },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-unt-primary to-[#002244] rounded-2xl p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Background Accent Graphics */}
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 bg-unt-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">¡Bienvenido al Panel de Control!</h1>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed">
            Gestiona los horarios, docentes, asignaturas e infraestructura de la Escuela de Ingeniería de Sistemas de manera eficiente.
          </p>
        </div>
        
        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-unt-accent/20 flex items-center justify-center">
            <span className="text-unt-accent text-lg">📅</span>
          </div>
          <div>
            <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Período Académico</p>
            <p className="text-sm font-bold text-white">
              {periodoActivo ? (
                <span className="flex items-center gap-2">
                  {periodoActivo.nombre}
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </span>
              ) : (
                'Ninguno Activo'
              )}
            </p>
          </div>
        </div>
      </div>

      <PanelKPIs kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {avanceCategoria && <GraficoAvanceCategoria datos={avanceCategoria} />}
        {ocupacion && <GraficoOcupacionAmbientes datos={ocupacion} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {mapaCalor && (
            <MapaCalorOcupacion
              dias={mapaCalor.dias}
              horas={mapaCalor.horas}
              conteo={mapaCalor.conteo}
            />
          )}
        </div>
        <div>
          <ActividadTiempoReal eventos={eventos} />
        </div>
      </div>
    </div>
  );
}