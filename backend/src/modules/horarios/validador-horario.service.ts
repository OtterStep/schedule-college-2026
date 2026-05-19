import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ValidacionResultado } from './horarios.types';

export class ValidadorHorario {
  static async validarSeleccionCompleta(
    idDocente: number,
    idPeriodo: number
  ): Promise<ValidacionResultado> {
    const conflictos: string[] = [];
    const advertencias: string[] = [];

    // Obtener restricciones institucionales
    const configs = await prisma.configuracion.findMany({
      where: { id_periodo: idPeriodo },
    });
    const mapaConfig: Record<string, string> = {};
    configs.forEach((c) => (mapaConfig[c.clave] = c.valor));

    const horasMaxDiarias = parseInt(mapaConfig['HORAS_MAX_DIARIAS'] || '8');
    const franjaInicio = mapaConfig['FRANJA_INICIO'] || '07:00';
    const franjaFin = mapaConfig['FRANJA_FIN'] || '22:00';
    const almuerzoInicio = mapaConfig['BLOQUEO_ALMUERZO_INICIO'] || '12:00';
    const almuerzoFin = mapaConfig['BLOQUEO_ALMUERZO_FIN'] || '13:00';

    // Obtener selecciones temporales del docente desde Redis
    const claves = await redis.keys('seleccion_temporal:*');
    const seleccionesDocente = [];
    for (const clave of claves) {
      const valor = await redis.get(clave);
      if (valor) {
        const sel = JSON.parse(valor);
        if (sel.idDocente === idDocente) seleccionesDocente.push(sel);
      }
    }

    // 1. Validar horas máximas diarias
    const horasPorDia: Record<string, number> = {};
    for (const sel of seleccionesDocente) {
      horasPorDia[sel.diaSemana] = (horasPorDia[sel.diaSemana] || 0) + 1;
    }
    for (const [dia, horas] of Object.entries(horasPorDia)) {
      if (horas > horasMaxDiarias) {
        conflictos.push(`Excede horas máximas diarias (${horas}/${horasMaxDiarias}) el ${dia}`);
      }
    }

    // 2. Validar cruces con horarios confirmados del docente
    for (const sel of seleccionesDocente) {
      const componente = await prisma.curso_componente.findUnique({
        where: { id: sel.idComponente },
        include: { oferta: true },
      });
      if (!componente) {
        conflictos.push(`Conflicto: Componente inválido (ID ${sel.idComponente})`);
        continue;
      }
      const conflicto = await prisma.bloque_horario.findFirst({
        where: {
          id_docente: idDocente,
          id_periodo: idPeriodo,
          dia_semana: sel.diaSemana,
          hora_inicio: sel.horaInicio,
          estado: { in: ['CONFIRMADO', 'PUBLICADO'] },
        },
      });
      if (conflicto) {
        conflictos.push(
          `Conflicto: Ya tiene clase el ${sel.diaSemana} a las ${sel.horaInicio} (bloque ID ${conflicto.id})`
        );
      }
    }

    // 3. Validar bloqueo de almuerzo
    for (const sel of seleccionesDocente) {
      if (sel.horaInicio >= almuerzoInicio && sel.horaInicio < almuerzoFin) {
        conflictos.push(
          `Conflicto: Bloqueo de almuerzo el ${sel.diaSemana} a las ${sel.horaInicio}`
        );
      }
    }

    // 4. Validar franja institucional
    for (const sel of seleccionesDocente) {
      if (sel.horaInicio < franjaInicio || sel.horaFin > franjaFin) {
        conflictos.push(
          `Conflicto: Fuera de franja horaria el ${sel.diaSemana} a las ${sel.horaInicio}`
        );
      }
    }

    // 5. Validar disponibilidad del ambiente (cruces con otros docentes)
    for (const sel of seleccionesDocente) {
      const conflictoAmbiente = await prisma.bloque_horario.findFirst({
        where: {
          id_periodo: idPeriodo,
          id_ambiente: sel.idAmbiente,
          dia_semana: sel.diaSemana,
          hora_inicio: sel.horaInicio,
          estado: { in: ['CONFIRMADO', 'PUBLICADO'] },
          NOT: { id_docente: idDocente },
        },
      });
      if (conflictoAmbiente) {
        conflictos.push(
          `Conflicto de ambiente ${sel.idAmbiente} el ${sel.diaSemana} a las ${sel.horaInicio}`
        );
      }
    }

    // 6. Validar horas requeridas del curso vs horas seleccionadas
    const asignaciones = await prisma.asignacion_docente_componente.findMany({
      where: { id_docente: idDocente },
      include: { componente: { include: { oferta: { include: { curso: true } } } } },
    });
    for (const a of asignaciones) {
      const selecciones = seleccionesDocente.filter((s) => s.idComponente === a.id_componente).length;
      if (a.horas_asignadas > 0 && selecciones < a.horas_asignadas) {
        advertencias.push(
          `Faltan ${a.horas_asignadas - selecciones}h de ${a.componente.tipo} para ${a.componente.oferta.curso.nombre}`
        );
      }
    }

    return {
      valido: conflictos.length === 0,
      conflictos,
      advertencias,
    };
  }
}
