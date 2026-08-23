import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError } from '../modules/auth/auth.service';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation error', details: error.issues });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}