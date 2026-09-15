import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TestOrders } from './TestOrders';

beforeEach(() => { localStorage.clear(); vi.stubEnv('VITE_USE_MOCK_AUTH', 'false'); });
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it('saves multiple checked tests and a custom outside referral, then displays them after remount', () => {
  const props = { patientMrn: 'TEST-1', patientName: 'Demo Patient' };
  const view = render(<TestOrders {...props} />);
  fireEvent.click(screen.getByLabelText('Complete blood count (CBC)'));
  fireEvent.click(screen.getByLabelText('Chest X-ray'));
  fireEvent.click(screen.getByLabelText('Other test'));
  fireEvent.change(screen.getByLabelText('Other test name'), { target: { value: 'Ferritin' } });
  fireEvent.change(screen.getByLabelText('Test location'), { target: { value: 'Outside lab' } });
  fireEvent.change(screen.getByLabelText('Outside lab / diagnostic centre (optional)'), { target: { value: 'Demo Lab' } });
  fireEvent.change(screen.getByLabelText('Clinical details'), { target: { value: 'Follow-up investigation' } });
  fireEvent.click(screen.getByText('Save selected tests'));
  const stored = JSON.parse(localStorage.getItem('hms-doctor-diagnostic-orders')!);
  expect(stored).toHaveLength(3);
  expect(stored.every((item: { provider: string; patientMrn: string; status: string }) => item.provider === 'Demo Lab' && item.patientMrn === 'TEST-1' && item.status === 'External referral')).toBe(true);
  view.unmount(); render(<TestOrders {...props} />);
  expect(screen.getByText('Ferritin')).toBeInTheDocument();
});

it('requires a selection and clinical details before saving', () => {
  render(<TestOrders patientMrn="TEST-1" patientName="Demo Patient" />);
  fireEvent.click(screen.getByText('Save selected tests'));
  expect(screen.getByRole('status')).toHaveTextContent('Select at least one test');
  fireEvent.click(screen.getByLabelText('Complete blood count (CBC)'));
  fireEvent.click(screen.getByText('Save selected tests'));
  expect(screen.getByRole('status')).toHaveTextContent('Enter clinical details');
  expect(localStorage.getItem('hms-doctor-diagnostic-orders')).toBeNull();
});
