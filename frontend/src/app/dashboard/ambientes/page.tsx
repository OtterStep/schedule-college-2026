'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ambientesService } from '@/services/ambientes.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Card, CardContent } from '@/components/ui/Card';

const columnas = [
  { clave: 'codigo', titulo: 'Código de Ambiente' },
  {
    clave: 'tipo',
    titulo: 'Tipo',
    render: (item: any) => {
      const isLab = item.tipo === 'LABORATORIO';
      return (
        <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${isLab ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
          {item.tipo}
        </span>
      );
    },
  },
  { clave: 'capacidad', titulo: 'Capacidad', render: (item: any) => `${item.capacidad} carpetas` },
  { clave: 'piso', titulo: 'Piso', render: (item: any) => `${item.piso || '-'}° Piso` },
  { clave: 'equipamiento', titulo: 'Equipamiento', render: (item: any) => item.equipamiento || '-' },
  {
    clave: 'activo',
    titulo: 'Estado',
    render: (item: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.activo ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export default function AmbientesPage() {
  const [buscar, setBuscar] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['ambientes'],
    queryFn: () => ambientesService.listar().then((res) => res.data),
  });

  const ambientes = response?.data || response || [];

  const datosFiltrados = ambientes.filter((a: any) => 
    a.codigo.toLowerCase().includes(buscar.toLowerCase()) ||
    (a.equipamiento && a.equipamiento.toLowerCase().includes(buscar.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Aulas y Laboratorios</h1>
          <p className="text-sm text-gray-500">Gestione la infraestructura física, capacidades y equipamiento para las clases.</p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar ambiente..."
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
