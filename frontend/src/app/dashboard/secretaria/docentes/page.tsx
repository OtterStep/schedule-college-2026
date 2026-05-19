'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function DocentesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-docentes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-docentes'],
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
    queryKey: ['carga-horaria-resumen', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const cargaRows = useMemo(() => {
    return (cargaResumen || []).map((doc: any) => {
      const horasAsignadas = (doc.asignaciones || []).reduce(
        (sum: number, a: any) => sum + (a.horas_asignadas || 0),
        0
      );
      return {
        id: doc.id,
        docente: `${doc.nombres} ${doc.apellidos}`,
        modalidad: doc.modalidad,
        categoria: doc.categoria,
        horasMaximas: doc.horas_max_semana ?? 'Sin limite',
        horasAsignadas,
      };
    });
  }, [cargaResumen]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carga horaria</h1>
          <p className="text-sm text-gray-500">Resumen de horas asignadas por docente.</p>
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
            { clave: 'modalidad', titulo: 'Modalidad' },
            { clave: 'categoria', titulo: 'Categoria' },
            { clave: 'horasMaximas', titulo: 'Horas maximas' },
            { clave: 'horasAsignadas', titulo: 'Horas asignadas' },
          ]}
          datos={cargaRows}
        />
      )}
    </div>
  );
}
