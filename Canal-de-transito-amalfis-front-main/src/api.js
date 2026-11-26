export function apiUrl(path) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${endpoint}`;
}
