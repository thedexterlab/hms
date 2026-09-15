import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReceptionDashboardPage } from '../ReceptionDashboardPage';

describe('Reception dashboard', () => {
  it('shows the dashboard summary cards', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ReceptionDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/today’s registrations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/today’s appointments/i).length).toBeGreaterThan(0);
  });
});
