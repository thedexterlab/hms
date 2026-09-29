import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DoctorsPage } from '../DoctorsPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DoctorsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Available doctors page', () => {
  it('lists doctors with their availability status', async () => {
    renderPage();

    expect(await screen.findByText('Dr. Sarah Ahmed')).toBeInTheDocument();
    expect(screen.getByText('Dr. OPD Doctor')).toBeInTheDocument();
    expect(screen.getAllByText(/available/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Dr. Nadeem Qureshi')).toBeInTheDocument();
  });

  it('filters doctors by department', async () => {
    renderPage();
    await screen.findByText('Dr. Sarah Ahmed');

    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Pediatrics' } });

    expect(screen.getByText('Dr. Ali Raza')).toBeInTheDocument();
    expect(screen.queryByText('Dr. Sarah Ahmed')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches the search', async () => {
    renderPage();
    await screen.findByText('Dr. Sarah Ahmed');

    fireEvent.change(screen.getByPlaceholderText(/search by doctor/i), { target: { value: 'Nobody Match' } });

    expect(await screen.findByText(/no doctors match/i)).toBeInTheDocument();
  });
});
