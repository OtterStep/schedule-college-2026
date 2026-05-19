'use client';

import { useAuthStore } from '@/stores/auth.store';

interface Columna {
  clave: string;
  titulo: string;
  render?: (item: any) => React.ReactNode;
}

interface TablaDatosProps {
  columnas: Columna[];
  datos: any[];
  alHacerClick?: (item: any) => void;
  alEditar?: (item: any) => void;
  alEliminar?: (item: any) => void;
}

export function TablaDatos({ columnas, datos, alHacerClick, alEditar, alEliminar }: TablaDatosProps) {
  const usuario = useAuthStore(state => state.usuario);
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b border-slate-200">
          <tr>
            {columnas.map((col) => (
              <th
                key={col.clave}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600"
              >
                {col.titulo}
              </th>
            ))}
            {(esAdmin && (alEditar || alEliminar)) && (
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {datos.map((item, index) => (
            <tr
              key={item.id || index}
              className={`border-b border-slate-100 transition hover:-translate-y-[1px] hover:bg-slate-50/80 hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)] ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
              }`}
              onClick={() => alHacerClick?.(item)}
            >
              {columnas.map((col) => (
                <td key={col.clave} className="px-5 py-3 text-sm text-slate-700">
                  {col.render ? col.render(item) : item[col.clave]}
                </td>
              ))}
              {(esAdmin && (alEditar || alEliminar)) && (
                <td className="px-5 py-3 text-sm">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {alEditar && (
                      <button
                        onClick={() => alEditar(item)}
                        className="rounded-full border border-slate-300 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-unt-accent hover:text-unt-accent"
                      >
                        Editar
                      </button>
                    )}
                    {alEliminar && (
                      <button
                        onClick={() => alEliminar(item)}
                        className="rounded-full border border-red-200 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}