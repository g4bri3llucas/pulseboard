import { api } from './api';
import type { Monitor, MonitorInput } from '../types/monitor';

export const monitorService = {
  async list(): Promise<Monitor[]> {
    const { data } = await api.get<Monitor[]>('/monitors');
    return data;
  },

  async create(input: MonitorInput): Promise<Monitor> {
    const { data } = await api.post<Monitor>('/monitors', input);
    return data;
  },

  async update(id: string, input: Partial<MonitorInput>): Promise<Monitor> {
    const { data } = await api.patch<Monitor>(`/monitors/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/monitors/${id}`);
  },
};