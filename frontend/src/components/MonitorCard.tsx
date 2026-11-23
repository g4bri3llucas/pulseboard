import { Link } from 'react-router-dom';
import type { Monitor, MonitorHealth } from '../types/monitor';
import { timeAgo } from '../utils/time-ago';

interface Props {
  monitor: Monitor;
  onEdit: () => void;
  onDelete: () => void;
}

const healthStyles: Record<MonitorHealth, { label: string; dot: string; text: string }> = {
  UP: { label: 'Up', dot: 'bg-green-500', text: 'text-green-700' },
  DOWN: { label: 'Down', dot: 'bg-red-500', text: 'text-red-700' },
  UNKNOWN: { label: 'No data', dot: 'bg-gray-400', text: 'text-gray-500' },
};

export function MonitorCard({ monitor, onEdit, onDelete }: Props) {
  const health = healthStyles[monitor.status];
  const { lastCheck } = monitor;

  return (
    <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${health.dot}`} />
          <h3 className="font-semibold text-gray-800">{monitor.name}</h3>
          <span className={`text-sm font-medium ${health.text}`}>{health.label}</span>
          {monitor.isPublic && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              Public
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
        <p className="text-xs text-gray-400">
          {lastCheck?.responseTime != null && `${lastCheck.responseTime} ms · `}
          {monitor.uptime24h != null ? `${monitor.uptime24h}% uptime (24h)` : 'No uptime data yet'}
          {lastCheck && ` · checked ${timeAgo(lastCheck.checkedAt)}`}
          {` · every ${monitor.interval}s`}
        </p>
      </div>

      <div className="flex gap-3 shrink-0">
        {monitor.isPublic && (
          <Link
            to={`/status/${monitor.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-700 underline"
          >
            Status page
          </Link>
        )}
        <button onClick={onEdit} className="text-sm text-gray-600 underline">
          Edit
        </button>
        <button onClick={onDelete} className="text-sm text-red-600 underline">
          Delete
        </button>
      </div>
    </div>
  );
}
