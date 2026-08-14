import { request } from './client';
import { HostedZone, PaginationResponse, DashboardStats } from '../../types';

export async function getHostedZones(params: {
  page: number;
  page_size: number;
  search?: string;
  type?: string;
}): Promise<PaginationResponse<HostedZone>> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);

  return request<PaginationResponse<HostedZone>>(`/api/hosted-zones?${query.toString()}`);
}

export async function createHostedZone(zone: {
  name: string;
  description?: string;
  type: 'public' | 'private';
  private_zone: boolean;
}): Promise<HostedZone> {
  return request<HostedZone>('/api/hosted-zones', {
    method: 'POST',
    body: JSON.stringify(zone),
  });
}

export async function getHostedZone(zoneId: string): Promise<HostedZone> {
  return request<HostedZone>(`/api/hosted-zones/${zoneId}`);
}

export async function updateHostedZone(
  zoneId: string,
  update: { description?: string; private_zone?: boolean }
): Promise<HostedZone> {
  return request<HostedZone>(`/api/hosted-zones/${zoneId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

export async function deleteHostedZone(zoneId: string): Promise<void> {
  return request<void>(`/api/hosted-zones/${zoneId}`, {
    method: 'DELETE',
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/dashboard/stats');
}
