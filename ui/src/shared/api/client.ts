import axios from 'axios';

function getBase() {
  const e = import.meta.env.VITE_API_BASE_URL;
  if (e != null && e !== '') {
    return e.replace(/\/$/, '') + '/api';
  }
  return '/api';
}

export const http = axios.create({
  baseURL: getBase(),
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (r) => r,
  (err: unknown) => {
    const a = err as { response?: { data?: { message?: unknown; error?: string } } };
    const m = a.response?.data?.message;
    const msg = Array.isArray(m) ? m.join(', ') : m ?? a.response?.data?.error;
    if (msg && typeof msg === 'string') {
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(
      err instanceof Error ? err : new Error('Lỗi mạng hoặc server'),
    );
  },
);
