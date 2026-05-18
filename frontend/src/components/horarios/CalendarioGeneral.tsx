'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horariosService } from '@/services/horarios.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';

interface Props {
  idPeriodo: number;
  filtroTipo: 'AULA' | 'DOCENTE';
  filtroId: number | null;
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const HORAS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, '0')}:00`;
});

export function CalendarioGeneral({ idPeriodo, filtroTipo, filtroId }: Props) {
  const queryClient = useQueryClient();
  const [errorToast, setErrorToast] = useState('');

  // En la implementación real, deberíamos filtrar los horarios por el periodo y el filtro seleccionado.
  // Por ahora, simularemos la obtención general.
  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios-general', idPeriodo, filtroTipo, filtroId],
    queryFn: async () => {
      const params: any = { idPeriodo };
      if (filtroId) {
        if (filtroTipo === 'AULA') params.idAmbiente = filtroId;
        if (filtroTipo === 'DOCENTE') params.idDocente = filtroId;
      }
      return horariosService.listarHorarios(params).then(res => res.data);
    },
    enabled: !!idPeriodo,
  });

  const getCelda = (dia: string, hora: string) => {
    if (!horarios) return [];
    return horarios.filter((h: any) => h.dia_semana === dia && h.hora_inicio === hora);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><SpinnerCarga /></div>;

  return (
    <div className="relative">
      {errorToast && <NotificacionToast mensaje={errorToast} tipo="error" />}
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              <th className="w-20 p-3 text-xs font-semibold text-gray-500 text-center border-r border-gray-200">
                Hora
              </th>
              {DIAS.map((dia) => (
                <th key={dia} className="p-3 text-xs font-semibold text-gray-700 text-center border-r border-gray-200 w-1/6">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS.map((hora) => (
              <tr key={hora} className="group hover:bg-slate-50 transition-colors">
                <td className="p-2 text-xs font-medium text-gray-500 text-center border-r border-b border-gray-100 align-top">
                  {hora}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {(parseInt(hora) + 1).toString().padStart(2, '0')}:00
                  </div>
                </td>
                {DIAS.map((dia) => {
                  const clasesEnCelda = getCelda(dia, hora);
                  const isAlmuerzo = hora === '13:00' || hora === '14:00';

                  return (
                    <td 
                      key={`${dia}-${hora}`} 
                      className={`p-1 border-r border-b border-gray-100 relative min-h-[80px] align-top transition-all
                        ${isAlmuerzo ? 'bg-slate-50/50 crosshatch-pattern' : 'bg-white hover:bg-unt-primary/5'}
                      `}
                    >
                      <div className="flex flex-col gap-1 min-h-[60px] p-1">
                        {clasesEnCelda.map((clase: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-2 rounded-lg text-xs border shadow-sm cursor-grab active:cursor-grabbing
                              ${clase.estado === 'PUBLICADO' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                                clase.estado === 'CONFIRMADO' ? 'bg-blue-50 border-blue-200 text-blue-800' : 
                                'bg-amber-50 border-amber-200 text-amber-800 border-dashed'}
                            `}
                          >
                            <div className="font-bold truncate">{clase.curso?.nombre}</div>
                            <div className="flex justify-between items-center mt-1 text-[10px] opacity-80">
                              <span>{clase.docente?.apellidos}</span>
                              <span className="font-mono bg-white/50 px-1 rounded">{clase.ambiente?.codigo}</span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Empty state visual affordance for drag and drop */}
                        {clasesEnCelda.length === 0 && !isAlmuerzo && (
                          <div className="w-full h-full min-h-[40px] border-2 border-transparent border-dashed rounded-lg group-hover:border-unt-primary/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-[10px] text-unt-primary/50 font-medium">+ Asignar</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .crosshatch-pattern {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px);
        }
      `}} />
    </div>
  );
}
