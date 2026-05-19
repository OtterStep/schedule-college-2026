'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cursosService } from '@/services/cursos.service';
import { useAuthStore } from '@/stores/auth.store';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { Boton } from '@/components/ui/Boton';
import { NotificacionToast } from '@/components/ui/NotificacionToast';

const cursoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  codigo: z.string().min(1, 'El código es obligatorio'),
  creditos: z.coerce.number().int().min(1, 'Debe ser al menos 1'),
});

type CursoFormData = z.infer<typeof cursoSchema>;

export default function CursosPage() {
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [buscar, setBuscar] = useState('');
  const [mostrarModalCurso, setMostrarModalCurso] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<any | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['cursos', buscar],
    queryFn: () => cursosService.listar({ buscar }).then((res) => res.data),
  });

  const cursos = Array.isArray(response) ? response : response?.data || [];

  const {
    register: registerCurso,
    handleSubmit: handleSubmitCurso,
    reset: resetCurso,
    formState: { errors: erroresCurso },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      creditos: 1,
    },
  });

  const guardarCursoMutation = useMutation({
    mutationFn: (datos: CursoFormData) => {
      if (cursoEditando) {
        return cursosService.actualizar(cursoEditando.id, datos);
      }

      return cursosService.crear(datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      setToast({ mensaje: cursoEditando ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente', tipo: 'exito' });
      setMostrarModalCurso(false);
      setCursoEditando(null);
      resetCurso();
    },
    onError: () => {
      setToast({ mensaje: 'Error al guardar el curso', tipo: 'error' });
    },
  });

  const eliminarCursoMutation = useMutation({
    mutationFn: (id: number) => cursosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      setToast({ mensaje: 'Curso desactivado exitosamente', tipo: 'exito' });
    },
    onError: () => {
      setToast({ mensaje: 'Error al desactivar curso', tipo: 'error' });
    },
  });

  const abrirCrearCurso = () => {
    setCursoEditando(null);
    resetCurso({
      nombre: '',
      codigo: '',
      creditos: 1,
    });
    setMostrarModalCurso(true);
  };

  const abrirEditarCurso = (curso: any) => {
    setCursoEditando(curso);
    resetCurso({
      nombre: curso.nombre ?? '',
      codigo: curso.codigo ?? '',
      creditos: curso.creditos ?? 1,
    });
    setMostrarModalCurso(true);
  };

  const cerrarModalCurso = () => {
    setMostrarModalCurso(false);
    setCursoEditando(null);
    resetCurso();
  };

  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Asignatura' },
    { clave: 'creditos', titulo: 'Créditos', render: (item: any) => `${item.creditos} CR` },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (item: any) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (item: any) => (
        <div className="flex flex-wrap gap-2">
          {esAdmin && (
            <>
              <Boton
                type="button"
                variante="secundario"
                onClick={(event) => {
                  event.stopPropagation();
                  abrirEditarCurso(item);
                }}
              >
                Editar
              </Boton>
              <Boton
                type="button"
                variante="peligro"
                onClick={(event) => {
                  event.stopPropagation();
                  if (window.confirm('¿Desactivar este curso?')) {
                    eliminarCursoMutation.mutate(item.id);
                  }
                }}
              >
                Desactivar
              </Boton>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Cursos y Asignaturas</h1>
          <p className="text-sm text-gray-500">Gestiona el catálogo de cursos activos de la escuela.</p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <input
            type="text"
            placeholder="Buscar asignatura..."
            value={buscar}
            onChange={(event) => setBuscar(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-unt-accent focus:outline-none focus:ring-2 focus:ring-unt-accent/30 sm:w-72"
          />
          {esAdmin && (
            <Boton type="button" onClick={abrirCrearCurso}>
              Nuevo curso
            </Boton>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12">
              <SpinnerCarga />
            </div>
          ) : (
            <TablaDatos columnas={columnas} datos={cursos} />
          )}
        </CardContent>
      </Card>

      {mostrarModalCurso && (
        <Modal cerrar={cerrarModalCurso}>
          <form onSubmit={handleSubmitCurso((datos) => guardarCursoMutation.mutate(datos))} className="space-y-4 p-1">
            <h2 className="text-xl font-bold text-gray-900">{cursoEditando ? 'Editar curso' : 'Nuevo curso'}</h2>
            <CampoTexto label="Código" {...registerCurso('codigo')} error={erroresCurso.codigo?.message} />
            <CampoTexto label="Nombre" {...registerCurso('nombre')} error={erroresCurso.nombre?.message} />
            <CampoTexto label="Créditos" type="number" min="1" {...registerCurso('creditos')} error={erroresCurso.creditos?.message} />

            <div className="flex gap-2 pt-2">
              <Boton type="submit" cargando={guardarCursoMutation.isPending}>
                Guardar
              </Boton>
              <Boton type="button" variante="secundario" onClick={cerrarModalCurso}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Modal>
      )}

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
