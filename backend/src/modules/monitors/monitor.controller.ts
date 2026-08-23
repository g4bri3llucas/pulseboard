import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { monitorService } from './monitor.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const createSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  interval: z.number().int().min(30).optional(),
  isPublic: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export const monitorController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const monitor = await monitorService.create(req.userId as string, data);
      res.status(201).json(monitor);
    } catch (error) {
      next(error);
    }
  },

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const monitors = await monitorService.listByUser(req.userId as string);
      res.status(200).json(monitors);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const monitor = await monitorService.getById(req.params.id as string, req.userId as string);
      res.status(200).json(monitor);
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const monitor = await monitorService.update(req.params.id as string, req.userId as string, data);
      res.status(200).json(monitor);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await monitorService.delete(req.params.id as string, req.userId as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};