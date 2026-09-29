import { isMockAuthEnabled } from '../../../auth.service';
import { apiClient } from '../../../lib/apiClient';

export async function sendDoctorHeartbeat(): Promise<void> {
  if (isMockAuthEnabled()) return;
  await apiClient.post('/doctors/me/heartbeat');
}

export async function clockOutDoctor(): Promise<void> {
  if (isMockAuthEnabled()) return;
  await apiClient.post('/doctors/me/clock-out');
}
