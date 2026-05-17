'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const columnas = [
  { clave: 'nombre', titulo: 'Nombre' },
  { 
    clave: 'fecha_inicio', 
    titulo: 'Fecha de Inicio',
    render: (item: any) => new Date(item.fecha_inicio).toLocaleDateString('es-PE')
  },
  { 
    clave: 'fecha_fin', 
    titulo: 'Fecha de Fin',
    render: (item: any) => new Date(item.fecha_fin).toLocaleDateString('es-PE')
  },
  {
    clave: 'estado',
    titulo: 'Estado',
    render: (item: any) => {
      let bg = 'bg-gray-100 text-gray-800';
      if (item.estado === 'ACTIVO') bg = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      if (item.estado === 'BORRADOR') bg = 'bg-amber-100 text-amber-800 border border-amber-200';
      if (item.estado === 'CERRADO') bg = 'bg-rose-100 text-rose-800 border border-rose-200';
      
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${bg}`}>
          {item.estado}
        </span>
      );
    },
  },
];

export default function PeriodosPage() {
  const [buscar, setBuscar] = useState('');

  const { data: periodos, isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const datosFiltrados = periodos?.filter((p: any) => 
    p.nombre.toLowerCase().includes(buscar.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Períodos Académicos</h1>
          <p className="text-sm text-gray-500">Gestione los períodos académicos activos y cerrados para la programación horaria.</p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar período..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-unt-accent/30 focus:border-unt-accent transition-all bg-white shadow-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12"><SpinnerCarga /></div>
          ) : (
            <TablaDatos
              columnas={columnas}
              datos={datosFiltrados}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
