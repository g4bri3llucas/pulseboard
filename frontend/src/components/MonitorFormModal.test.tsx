import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonitorFormModal } from './MonitorFormModal';

describe('MonitorFormModal', () => {
  it('shows a validation error for an invalid URL', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <MonitorFormModal onSubmit={onSubmit} onClose={vi.fn()} isSubmitting={false} />,
    );

    await user.type(screen.getByLabelText(/name/i), 'My API');
    await user.type(screen.getByLabelText(/url/i), 'not-a-url');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('Must be a valid URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the form data when valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <MonitorFormModal onSubmit={onSubmit} onClose={vi.fn()} isSubmitting={false} />,
    );

    await user.type(screen.getByLabelText(/name/i), 'My API');
    await user.type(screen.getByLabelText(/url/i), 'https://api.example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedData = onSubmit.mock.calls[0][0];
    expect(submittedData).toEqual(
      expect.objectContaining({
        name: 'My API',
        url: 'https://api.example.com',
      }),
    );
  });
});