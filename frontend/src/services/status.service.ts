import { api } from './api';
import type { MonitorStatus } from '../types/status';

export const statusService = {
  async getBySlug(slug: string): Promise<MonitorStatus> {
    const { data } = await api.get<MonitorStatus>(`/status/${slug}`);
    return data;
  },
};