'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Card, CardContent } from '@/components/ui/Card';

const columnas = [
  { clave: 'codigo', titulo: 'Código' },
  { clave: 'nombre', titulo: 'Asignatura' },
  { clave: 'creditos', titulo: 'Créditos', render: (item: any) => `${item.creditos} CR` },
  { 
    clave: 'horas_teoria', 
    titulo: 'Horas Teoría',
    render: (item: any) => `${item.horas_teoria} hrs`
  },
  { 
    clave: 'horas_laboratorio', 
    titulo: 'Horas Laboratorio',
    render: (item: any) => `${item.horas_laboratorio} hrs`
  },
];

export default function CursosPage() {
  const [buscar, setBuscar] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['cursos', buscar],
    queryFn: () => cursosService.listar({ buscar }).then((res) => res.data),
  });

  const cursos = response?.data || response || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Cursos y Asignaturas</h1>
          <p className="text-sm text-gray-500">Gestione el catálogo de cursos, horas lectivas y ambientes asociados de la escuela.</p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar asignatura..."
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
              datos={cursos}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
