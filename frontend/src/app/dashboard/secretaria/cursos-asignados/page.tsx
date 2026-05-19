'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function CursosAsignadosSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-cursos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-cursos'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) {
      setIdPeriodo(periodoActivo.id);
    }
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [idPeriodo, periodoActivo, periodos]);

  const { data: cargaResumen, isLoading: cargaLoading } = useQuery({
    queryKey: ['carga-horaria-cursos', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const cursosAsignadosRows = useMemo(() => {
    const rows: any[] = [];
    (cargaResumen || []).forEach((doc: any) => {
      (doc.asignaciones || []).forEach((asig: any) => {
        rows.push({
          id: `${doc.id}-${asig.id}`,
          docente: `${doc.nombres} ${doc.apellidos}`,
          curso: asig.componente?.oferta?.curso?.nombre || 'Sin curso',
          componente: asig.componente?.tipo || 'N/A',
          horas: asig.horas_asignadas,
        });
      });
    });
    return rows;
  }, [cargaResumen]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos asignados</h1>
          <p className="text-sm text-gray-500">Relación de cursos asignados a docentes por periodo.</p>
        </div>
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
      </div>

      {cargaLoading ? (
        <SpinnerCarga />
      ) : (
        <TablaDatos
          columnas={[
            { clave: 'docente', titulo: 'Docente' },
            { clave: 'curso', titulo: 'Curso' },
            { clave: 'componente', titulo: 'Componente' },
            { clave: 'horas', titulo: 'Horas asignadas' },
          ]}
          datos={cursosAsignadosRows}
        />
      )}
    </div>
  );
}
