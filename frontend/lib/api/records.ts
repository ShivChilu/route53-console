import { request } from './client';
import { DNSRecord, PaginationResponse } from '../../types';

export async function getRecords(
  zoneId: string,
  params: {
    page: number;
    page_size: number;
    search?: string;
    type?: string;
  }
): Promise<PaginationResponse<DNSRecord>> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);

  return request<PaginationResponse<DNSRecord>>(
    `/api/hosted-zones/${zoneId}/records?${query.toString()}`
  );
}

export async function createRecord(
  zoneId: string,
  record: {
    name: string;
    type: string;
    ttl: number;
    value: string;
    routing_policy: string;
    alias: boolean;
    health_check_id?: string | null;
  }
): Promise<DNSRecord> {
  return request<DNSRecord>(`/api/hosted-zones/${zoneId}/records`, {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function updateRecord(
  zoneId: string,
  recordId: number,
  update: {
    ttl?: number;
    value?: string;
    routing_policy?: string;
    alias?: boolean;
    health_check_id?: string | null;
  }
): Promise<DNSRecord> {
  return request<DNSRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

export async function deleteRecord(
  zoneId: string,
  recordId: number
): Promise<void> {
  return request<void>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'DELETE',
  });
}
