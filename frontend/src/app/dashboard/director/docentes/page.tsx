'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docentesService } from '@/services/docentes.service';
import { Card, CardContent } from '@/components/ui/Card';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { Selector } from '@/components/ui/Selector';
import { Modal } from '@/components/ui/Modal';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { UserPlus, Search, Mail, Phone, Briefcase, GraduationCap, Calendar, Edit2 } from 'lucide-react';

export default function GestionDocentesPage() {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<any>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    modalidad: 'NOMBRADO',
    categoria: 'PRINCIPAL',
    antiguedad: 0,
    horas_max_semana: 40,
    crear_usuario: true
  });

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      modalidad: 'NOMBRADO',
      categoria: 'PRINCIPAL',
      antiguedad: 0,
      horas_max_semana: 40,
      crear_usuario: true
    });
    setDocenteSeleccionado(null);
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['docentes', buscar],
    queryFn: () => docentesService.listar({ buscar }).then(res => res.data)
  });

  const docentes = Array.isArray(response) ? response : response?.data || [];

  const mutationCrear = useMutation({
    mutationFn: (datos: any) => docentesService.crear(datos),
    onSuccess: () => {
      setToast({ mensaje: 'Docente creado correctamente', tipo: 'exito' });
      setModalAbierto(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al crear docente', tipo: 'error' });
    }
  });

  const mutationEditar = useMutation({
    mutationFn: (datos: any) => docentesService.actualizar(docenteSeleccionado.id, datos),
    onSuccess: () => {
      setToast({ mensaje: 'Docente actualizado correctamente', tipo: 'exito' });
      setModalAbierto(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al actualizar docente', tipo: 'error' });
    }
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: number) => docentesService.eliminar(id),
    onSuccess: () => {
      setToast({ mensaje: 'Docente desactivado correctamente', tipo: 'exito' });
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al desactivar docente', tipo: 'error' });
    }
  });

  const abrirEditar = (docente: any) => {
    setDocenteSeleccionado(docente);
    setFormData({
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      email: docente.email,
      telefono: docente.telefono || '',
      modalidad: docente.modalidad,
      categoria: docente.categoria,
      antiguedad: docente.antiguedad,
      horas_max_semana: docente.horas_max_semana || 40,
      crear_usuario: false
    });
    setModalAbierto(true);
  };

  const manejarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docenteSeleccionado) {
      mutationEditar.mutate(formData);
    } else {
      mutationCrear.mutate(formData);
    }
  };

  const columnas = [
    { 
      clave: 'nombre_completo', 
      titulo: 'Docente',
      render: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{item.apellidos}, {item.nombres}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Mail className="w-3 h-3" /> {item.email}
          </span>
        </div>
      )
    },
    { 
      clave: 'modalidad', 
      titulo: 'Modalidad',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{item.modalidad}</span>
        </div>
      )
    },
    { 
      clave: 'categoria', 
      titulo: 'Categoría',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-tight">
            {item.categoria}
          </span>
        </div>
      )
    },
    { 
      clave: 'horas_max_semana', 
      titulo: 'Carga Máx.',
      render: (item: any) => (
        <span className="font-mono font-bold text-unt-primary bg-unt-primary/5 px-2 py-1 rounded text-xs">
          {item.horas_max_semana}H / SEM
        </span>
      )
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (item: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
          item.activo ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.activo ? 'bg-green-500' : 'bg-red-500'}`} />
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Docentes</h1>
          <p className="text-slate-500 mt-1">Registro de plana docente y configuración de carga lectiva.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar docente..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-unt-primary/5 focus:border-unt-primary transition-all bg-white shadow-sm"
            />
          </div>
          <Boton onClick={() => { resetForm(); setModalAbierto(true); }} className="rounded-2xl px-6 shadow-lg shadow-unt-primary/20">
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Docente
          </Boton>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          <TablaDatos
            columnas={columnas}
            datos={docentes}
            loading={isLoading}
            alEditar={abrirEditar}
            alEliminar={(docente) => {
              if (confirm(`¿Está seguro de desactivar al docente "${docente.nombres} ${docente.apellidos}"?`)) {
                mutationEliminar.mutate(docente.id);
              }
            }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docentes?.map((docente: any) => (
          <Card key={docente.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{docente.apellidos}, {docente.nombres}</h3>
                  <p className="text-sm text-slate-500">{docente.email}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-4 w-4" /></button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-gray-500 uppercase font-bold">Modalidad</p>
                  <p className="font-medium">{docente.modalidad}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-gray-500 uppercase font-bold">Categoría</p>
                  <p className="font-medium">{docente.categoria}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-gray-500 uppercase font-bold">Máx. Horas</p>
                  <p className="font-medium">{docente.horas_max_semana}h / semana</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-gray-500 uppercase font-bold">Antigüedad</p>
                  <p className="font-medium">{docente.antiguedad} años</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modalAbierto && (
        <Modal cerrar={() => setModalAbierto(false)}>
          
          <h2 className="text-xl font-semibold mb-4">
            Registrar Nuevo Docente
          </h2>

          <form onSubmit={manejarSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Nombres"
                required
                value={formData.nombres}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nombres: e.target.value
                  })
                }
              />

              <CampoTexto
                label="Apellidos"
                required
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    apellidos: e.target.value
                  })
                }
              />
            </div>

            <CampoTexto
              label="Email Institucional"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value
                })
              }
            />

            <div className="grid grid-cols-2 gap-4">

              <Selector
                label="Modalidad"
                value={formData.modalidad}
                onChange={(e: any) =>
                  setFormData({
                    ...formData,
                    modalidad: e.target.value
                  })
                }
              >
                <option value="NOMBRADO">Nombrado</option>
                <option value="CONTRATADO">Contratado</option>
              </Selector>

              <Selector
                label="Categoría"
                value={formData.categoria}
                onChange={(e: any) =>
                  setFormData({
                    ...formData,
                    categoria: e.target.value
                  })
                }
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="ASOCIADO">Asociado</option>
                <option value="AUXILIAR">Auxiliar</option>
                <option value="JEFE_PRACTICA">Jefe de Práctica</option>
              </Selector>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <CampoTexto
                label="Límite Horas/Semana"
                type="number"
                value={formData.horas_max_semana}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    horas_max_semana: Number(e.target.value)
                  })
                }
              />

              <CampoTexto
                label="Antigüedad (Años)"
                type="number"
                value={formData.antiguedad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    antiguedad: Number(e.target.value)
                  })
                }
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={formData.crear_usuario}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crear_usuario: e.target.checked
                  })
                }
              />

              <span className="text-sm text-gray-600">
                Crear cuenta de acceso automáticamente
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Boton
                variante="borde"
                type="button"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Boton>

              <Boton
                onClick={() => setModalAbierto(true)}
                variante="borde"
                className="px-3 py-1.5 text-sm"
              >
                Agregar Componente
              </Boton>

            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <NotificacionToast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
