import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Monitor } from '../types/monitor';

const schema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  url: z.string().url('Must be a valid URL'),
  interval: z.number().int().min(30, 'Minimum interval is 30 seconds'),
  isPublic: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  monitor?: Monitor;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export function MonitorFormModal({ monitor, onSubmit, onClose, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: monitor?.name ?? '',
      url: monitor?.url ?? '',
      interval: monitor?.interval ?? 60,
      isPublic: monitor?.isPublic ?? false,
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {monitor ? 'Edit monitor' : 'New monitor'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-1"
          />
          {errors.name && <p className="text-red-600 text-xs mb-2">{errors.name.message}</p>}

          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1 mt-3">
            URL
          </label>
          <input
            id="url"
            {...register('url')}
            placeholder="https://example.com/health"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-1"
          />
          {errors.url && <p className="text-red-600 text-xs mb-2">{errors.url.message}</p>}

          <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1 mt-3">
            Check interval (seconds)
          </label>
          <input
            id="interval"
            type="number"
            {...register('interval', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-1"
          />
          {errors.interval && (
            <p className="text-red-600 text-xs mb-2">{errors.interval.message}</p>
          )}

          <label htmlFor="isPublic" className="flex items-center gap-2 mt-3 mb-4">
            <input id="isPublic" type="checkbox" {...register('isPublic')} />
            <span className="text-sm text-gray-700">Show on public status page</span>
          </label>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}