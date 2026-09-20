export interface StatusIncident {
  startedAt: string;
  resolvedAt: string | null;
}

export interface MonitorStatus {
  name: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  uptimePercentage: number;
  incidents: StatusIncident[];
}