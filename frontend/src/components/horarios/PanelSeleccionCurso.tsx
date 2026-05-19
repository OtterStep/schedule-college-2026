'use client';
import { Selector } from '@/components/ui/Selector';

interface ComponenteAsignable {
  idComponente: number;
  nombreCurso: string;
  tipoComponente: string;
  horasRequeridas: number;
  horasAsignadas: number;
}

interface PanelSeleccionCursoProps {
  componentes: ComponenteAsignable[];
  componenteSeleccionado: number | null;
  alCambiarComponente: (idComponente: number) => void;
}

export function PanelSeleccionCurso({
  componentes,
  componenteSeleccionado,
  alCambiarComponente,
}: PanelSeleccionCursoProps) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded shadow">
      <Selector
        label="Componente"
        opciones={[
          { valor: '', etiqueta: 'Seleccionar componente' },
          ...componentes.map((c) => ({
            valor: String(c.idComponente),
            etiqueta: `${c.nombreCurso} - ${c.tipoComponente}`,
          })),
        ]}
        value={componenteSeleccionado?.toString() || ''}
        onChange={(e) => alCambiarComponente(e.target.value ? parseInt(e.target.value) : 0)}
      />
    </div>
  );
}
