import { apiClient } from '@/lib/api-client';

export const cargaHorariaService = {
  asignarCarga: (datos: {
    id_componente: number;
    id_docente: number;
    horas_asignadas: number;
  }) => apiClient.post('/carga-horaria/asignar', datos),

  obtenerResumen: (idPeriodo: number) => 
    apiClient.get(`/carga-horaria/resumen/${idPeriodo}`),

  configurarOferta: (datos: any) => 
    apiClient.post('/carga-horaria/configurar-oferta', datos),
};
