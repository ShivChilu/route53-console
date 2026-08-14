export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface HostedZone {
  id: number;
  zone_id: string;
  name: string;
  type: 'public' | 'private';
  description: string | null;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'PTR' | 'SRV' | 'CAA' | 'SOA';
  ttl: number;
  value: string;
  routing_policy: string;
  alias: boolean;
  health_check_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface APIError {
  detail: string;
}

export interface DashboardStats {
  hosted_zones_count: number;
  dns_records_count: number;
  recent_activities: {
    type: string;
    message: string;
    timestamp: string;
    metadata: {
      zone_id?: string;
      name?: string;
    };
  }[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

