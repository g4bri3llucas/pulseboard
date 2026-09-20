import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { statusService } from '../services/status.service';

export function StatusPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['status', slug],
    queryFn: () => statusService.getBySlug(slug as string),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">This status page does not exist.</p>
      </div>
    );
  }

  const isUp = data.status === 'UP';
  const isUnknown = data.status === 'UNKNOWN';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{data.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <span
              className={`w-3 h-3 rounded-full ${
                isUnknown ? 'bg-gray-400' : isUp ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span
              className={`font-medium ${
                isUnknown ? 'text-gray-500' : isUp ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isUnknown ? 'No recent data' : isUp ? 'Operational' : 'Down'}
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Uptime (last 24h): <span className="font-medium">{data.uptimePercentage}%</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent incidents</h2>

          {data.incidents.length === 0 && (
            <p className="text-sm text-gray-500">No incidents recorded.</p>
          )}

          <ul className="space-y-2">
            {data.incidents.map((incident, index) => (
              <li key={index} className="text-sm text-gray-600 border-b border-gray-100 pb-2">
                Started: {new Date(incident.startedAt).toLocaleString()}
                {incident.resolvedAt
                  ? ` — Resolved: ${new Date(incident.resolvedAt).toLocaleString()}`
                  : ' — Ongoing'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}