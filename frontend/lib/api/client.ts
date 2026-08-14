const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set default credentials and headers
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Get token from localStorage if available (fallback to bearer authentication for flexibility)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    credentials: 'include', // Important to send cookies
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return null as unknown as T;
  }

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errBody = await response.json();
      errorDetail = errBody.detail || errorDetail;
    } catch (_) {
      // JSON parsing failed, use status text
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}
