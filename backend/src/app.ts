import express from 'express';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.routes';
import { monitorRoutes } from './modules/monitors/monitor.routes';
import { statusRoutes } from './modules/status/status.routes';
import { errorHandler } from './middlewares/error-handler.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/monitors', monitorRoutes);
app.use('/status', statusRoutes);

app.use(errorHandler);