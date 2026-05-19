export interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  creditos: number;
  activo: boolean;
}

export interface CursoConRelaciones extends Curso {
  ofertas?: any[];
}
