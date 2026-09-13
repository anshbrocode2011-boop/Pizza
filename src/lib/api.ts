export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('pizzatown_token');
  let guestId = localStorage.getItem('pizzatown_guest_id');
  if (!guestId) {
    guestId = Math.random().toString(36).substring(2, 12);
    localStorage.setItem('pizzatown_guest_id', guestId);
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-guest-id', guestId);

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
