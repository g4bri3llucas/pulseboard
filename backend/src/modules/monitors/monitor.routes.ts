import { Router } from 'express';
import { monitorController } from './monitor.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const monitorRoutes = Router();

monitorRoutes.use(authMiddleware);

monitorRoutes.post('/', monitorController.create);
monitorRoutes.get('/', monitorController.list);
monitorRoutes.get('/:id', monitorController.getById);
monitorRoutes.patch('/:id', monitorController.update);
monitorRoutes.delete('/:id', monitorController.remove);