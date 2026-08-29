import { Request, Response, NextFunction } from 'express';
import { statusService } from './status.service';

export const statusController = {
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.getBySlug(req.params.slug as string);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};