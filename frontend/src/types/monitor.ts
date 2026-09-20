export interface Monitor {
    id: string;
    name: string;
    url: string;
    interval: number;
    isPublic: boolean;
    slug: string;
    createdAt: string;
}

export interface MonitorInput {
    name: string;
    url: string;
    interval?: number;
    isPublic?: boolean;
}