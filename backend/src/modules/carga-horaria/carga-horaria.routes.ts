import { Router } from 'express';
import { CargaHorariaController } from './carga-horaria.controller';
import { middlewareAutenticacion } from '@/middleware/autenticacion';

const router = Router();

// Todas las rutas de carga horaria requieren autenticación y idealmente rol DIRECTOR
router.use(middlewareAutenticacion);

router.post('/asignar', CargaHorariaController.asignarCarga);
router.get('/resumen/:id_periodo', CargaHorariaController.obtenerResumenCarga);
router.post('/configurar-oferta', CargaHorariaController.configurarOferta);

export default router;
