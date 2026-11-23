export type MonitorHealth = 'UP' | 'DOWN' | 'UNKNOWN';

export interface LastCheck {
    status: 'UP' | 'DOWN';
    responseTime: number | null;
    checkedAt: string;
}

export interface Monitor {
    id: string;
    name: string;
    url: string;
    interval: number;
    isPublic: boolean;
    slug: string;
    createdAt: string;
    status: MonitorHealth;
    lastCheck: LastCheck | null;
    uptime24h: number | null;
}

export interface MonitorInput {
    name: string;
    url: string;
    interval?: number;
    isPublic?: boolean;
}