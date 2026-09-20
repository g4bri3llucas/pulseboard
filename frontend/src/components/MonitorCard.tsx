import type { Monitor } from '../types/monitor';

interface Props {
  monitor: Monitor;
  onEdit: () => void;
  onDelete: () => void;
}

export function MonitorCard({ monitor, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{monitor.name}</h3>
          {monitor.isPublic && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              Public
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{monitor.url}</p>
        <p className="text-xs text-gray-400">Every {monitor.interval}s</p>
      </div>

      <div className="flex gap-3">
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