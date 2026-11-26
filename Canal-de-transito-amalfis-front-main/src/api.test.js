import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from './api.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiUrl', () => {
  it('uses the same-origin path when no API base URL is configured', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    expect(apiUrl('/api/denuncia')).toBe('/api/denuncia');
  });

  it('joins endpoints to the configured backend URL without duplicate slashes', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.com///');

    expect(apiUrl('/api/geocode/reverse')).toBe(
      'https://backend.example.com/api/geocode/reverse',
    );
  });
});
