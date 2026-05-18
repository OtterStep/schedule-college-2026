import { z } from 'zod';

const baseDocenteSchema = z.object({
  nombres: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  email: z.string().email(),
  telefono: z.string().max(20).optional(),
  modalidad: z.enum(['NOMBRADO', 'CONTRATADO']),
  categoria: z.enum(['PRINCIPAL', 'ASOCIADO', 'AUXILIAR', 'JEFE_PRACTICA']),
  antiguedad: z.number().int().min(0).default(0),
  crear_usuario: z.boolean().default(false),
  password: z.string().optional(),
});

export const crearDocenteSchema = baseDocenteSchema.superRefine((data, ctx) => {
  if (data.crear_usuario && data.password && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 6,
      type: 'string',
      inclusive: true,
      message: 'String must contain at least 6 character(s)',
      path: ['password']
    });
  }
});

export const actualizarDocenteSchema = baseDocenteSchema.partial();