'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function AmbientesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-ambientes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-ambientes'],
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

  const { data: ambientes, isLoading: ambientesLoading } = useQuery({
    queryKey: ['ambientes-disponibilidad', idPeriodo],
    queryFn: () => ambientesService.disponibilidadGeneral(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const ambientesRows = useMemo(() => {
    return (ambientes || []).map((amb: any) => ({
      id: amb.id,
      codigo: amb.codigo,
      tipo: amb.tipo,
      capacidad: amb.capacidad,
      bloques: amb.bloques?.length ?? 0,
    }));
  }, [ambientes]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ambientes disponibles</h1>
          <p className="text-sm text-gray-500">Listado de aulas y laboratorios con su disponibilidad general.</p>
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

      {ambientesLoading ? (
        <SpinnerCarga />
      ) : (
        <TablaDatos
          columnas={[
            { clave: 'codigo', titulo: 'Codigo' },
            { clave: 'tipo', titulo: 'Tipo' },
            { clave: 'capacidad', titulo: 'Capacidad' },
            { clave: 'bloques', titulo: 'Bloques asignados' },
          ]}
          datos={ambientesRows}
        />
      )}
    </div>
  );
}
