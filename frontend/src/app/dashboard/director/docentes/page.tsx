'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docentesService } from '@/services/docentes.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { Selector } from '@/components/ui/Selector';
import { Modal } from '@/components/ui/Modal';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { UserPlus, Edit2, Trash2, Search } from 'lucide-react';

export default function GestionDocentesPage() {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<any>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

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

  const { data: docentes, isLoading } = useQuery({
    queryKey: ['docentes', buscar],
    queryFn: () => docentesService.listar({ buscar }).then(res => res.data)
  });

  const mutationCrear = useMutation({
    mutationFn: (datos: any) => docentesService.crear(datos),
    onSuccess: () => {
      setMensaje({ texto: 'Docente creado correctamente', tipo: 'success' });
      setModalAbierto(false);
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setMensaje({ texto: error.response?.data?.error || 'Error al crear docente', tipo: 'error' });
    }
  });

  const manejarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCrear.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Docentes</h1>
          <p className="text-gray-500 text-sm">Registro de docentes, categorías y límites de carga horaria.</p>
        </div>
        <Boton onClick={() => { setDocenteSeleccionado(null); setModalAbierto(true); }}>
          <UserPlus className="h-4 w-4 mr-2" /> Nuevo Docente
        </Boton>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-unt-primary focus:border-transparent"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>
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

      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} titulo="Registrar Nuevo Docente">
        <form onSubmit={manejarSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto label="Nombres" required value={formData.nombres} onChange={(e) => setFormData({...formData, nombres: e.target.value})} />
            <CampoTexto label="Apellidos" required value={formData.apellidos} onChange={(e) => setFormData({...formData, apellidos: e.target.value})} />
          </div>
          <CampoTexto label="Email Institucional" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <Selector label="Modalidad" value={formData.modalidad} onChange={(e: any) => setFormData({...formData, modalidad: e.target.value})}>
              <option value="NOMBRADO">Nombrado</option>
              <option value="CONTRATADO">Contratado</option>
            </Selector>
            <Selector label="Categoría" value={formData.categoria} onChange={(e: any) => setFormData({...formData, categoria: e.target.value})}>
              <option value="PRINCIPAL">Principal</option>
              <option value="ASOCIADO">Asociado</option>
              <option value="AUXILIAR">Auxiliar</option>
              <option value="JEFE_PRACTICA">Jefe de Práctica</option>
            </Selector>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CampoTexto label="Límite Horas/Semana" type="number" value={formData.horas_max_semana} onChange={(e) => setFormData({...formData, horas_max_semana: Number(e.target.value)})} />
            <CampoTexto label="Antigüedad (Años)" type="number" value={formData.antiguedad} onChange={(e) => setFormData({...formData, antiguedad: Number(e.target.value)})} />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" checked={formData.crear_usuario} onChange={(e) => setFormData({...formData, crear_usuario: e.target.checked})} />
            <span className="text-sm text-gray-600">Crear cuenta de acceso automáticamente</span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Boton variant="outline" type="button" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" disabled={mutationCrear.isPending}>
              {mutationCrear.isPending ? 'Guardando...' : 'Registrar Docente'}
            </Boton>
          </div>
        </form>
      </Modal>

      {mensaje && (
        <NotificacionToast mensaje={mensaje.texto} tipo={mensaje.tipo} onClose={() => setMensaje(null)} />
      )}
    </div>
  );
}
