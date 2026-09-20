import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { monitorService } from '../services/monitor.service';
import { MonitorCard } from '../components/MonitorCard';
import { MonitorFormModal } from '../components/MonitorFormModal';
import type { Monitor, MonitorInput } from '../types/monitor';

export function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | undefined>();

  const { data: monitors, isLoading, isError } = useQuery({
    queryKey: ['monitors'],
    queryFn: monitorService.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: MonitorInput) => monitorService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: MonitorInput) =>
      monitorService.update(editingMonitor!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setShowForm(false);
      setEditingMonitor(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => monitorService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });

  function handleEdit(monitor: Monitor) {
    setEditingMonitor(monitor);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this monitor?')) {
      deleteMutation.mutate(id);
    }
  }

  function handleFormSubmit(data: MonitorInput) {
    if (editingMonitor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        <button onClick={logout} className="text-sm text-gray-600 underline">
          Log out
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Your monitors</h2>
        <button
          onClick={() => {
            setEditingMonitor(undefined);
            setShowForm(true);
          }}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded"
        >
          + New monitor
        </button>
      </div>

      {isLoading && <p className="text-gray-500">Loading monitors...</p>}
      {isError && <p className="text-red-600">Failed to load monitors.</p>}

      {monitors && monitors.length === 0 && (
        <p className="text-gray-500">No monitors yet. Create your first one!</p>
      )}

      <div className="space-y-3">
        {monitors?.map((monitor) => (
          <MonitorCard
            key={monitor.id}
            monitor={monitor}
            onEdit={() => handleEdit(monitor)}
            onDelete={() => handleDelete(monitor.id)}
          />
        ))}
      </div>

      {showForm && (
        <MonitorFormModal
          monitor={editingMonitor}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingMonitor(undefined);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}