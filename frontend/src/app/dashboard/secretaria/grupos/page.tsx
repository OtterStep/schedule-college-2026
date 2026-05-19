'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { gruposService } from '@/services/grupos.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function GruposSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-grupos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-grupos'],
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

  const { data: grupos, isLoading: gruposLoading } = useQuery({
    queryKey: ['grupos-secretaria'],
    queryFn: () => gruposService.listar().then((res) => res.data),
  });

  const gruposRows = useMemo(() => {
    const lista = (grupos || []).filter((g: any) => g.componente?.oferta?.id_periodo === idPeriodo);
    return lista.map((g: any) => ({
      id: g.id,
      curso: g.componente?.oferta?.curso?.nombre || 'Sin curso',
      componente: g.componente?.tipo || 'N/A',
      grupo: g.codigo,
      capacidad: g.capacidad_maxima,
      ciclo: g.componente?.oferta?.ciclo?.nombre || g.componente?.oferta?.ciclo?.numero || 'N/A',
    }));
  }, [grupos, idPeriodo]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos generados</h1>
          <p className="text-sm text-gray-500">Listado de grupos por componente y ciclo.</p>
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

      {gruposLoading ? (
        <SpinnerCarga />
      ) : (
        <TablaDatos
          columnas={[
            { clave: 'curso', titulo: 'Curso' },
            { clave: 'componente', titulo: 'Componente' },
            { clave: 'grupo', titulo: 'Grupo' },
            { clave: 'capacidad', titulo: 'Capacidad' },
            { clave: 'ciclo', titulo: 'Ciclo' },
          ]}
          datos={gruposRows}
        />
      )}
    </div>
  );
}
