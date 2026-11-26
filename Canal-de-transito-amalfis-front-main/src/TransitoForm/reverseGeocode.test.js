import { describe, expect, it } from 'vitest';
import { requestAddressSuggestion } from './reverseGeocode.js';

function createGeolocation(latitude = -23.55, longitude = -46.63) {
  return {
    getCurrentPosition(success) {
      success({ coords: { latitude, longitude } });
    },
  };
}

describe('requestAddressSuggestion', () => {
it('cancelled consent never reads geolocation or sends a backend request', async () => {
  let geolocationCalls = 0;
  let backendCalls = 0;
  const geolocation = {
    getCurrentPosition() {
      geolocationCalls += 1;
    },
  };

  const result = await requestAddressSuggestion({
    consented: false,
    geolocation,
    fetchImpl: async () => {
      backendCalls += 1;
    },
  });

  expect(result).toBeNull();
  expect(geolocationCalls).toBe(0);
  expect(backendCalls).toBe(0);
});

it('consented lookup sends coordinates only to the internal reverse endpoint', async () => {
  const requests = [];
  const result = await requestAddressSuggestion({
    consented: true,
    geolocation: createGeolocation(),
    fetchImpl: async (...args) => {
      requests.push(args);
      return { ok: true, json: async () => ({ suggestion: 'Rua Exemplo, Centro, São Paulo - SP' }) };
    },
  });

  expect(result).toBe('Rua Exemplo, Centro, São Paulo - SP');
  expect(requests).toHaveLength(1);
  expect(requests[0][0]).toBe('/api/geocode/reverse');
  expect(requests[0][1].method).toBe('POST');
  expect(JSON.parse(requests[0][1].body)).toEqual({ latitude: -23.55, longitude: -46.63 });
});

it('permission denial and backend failures keep location details out of errors', async () => {
  const denied = {
    getCurrentPosition(_success, failure) {
      failure({ code: 1, message: 'private browser detail' });
    },
  };

  await expect(requestAddressSuggestion({
    consented: true,
    geolocation: denied,
    fetchImpl: async () => { throw new Error('backend must not be called'); },
  })).rejects.toMatchObject({ code: 'permission_denied' });

  await expect(requestAddressSuggestion({
      consented: true,
      geolocation: createGeolocation(),
      fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ error: 'no_match' }) }),
  })).rejects.toMatchObject({ code: 'no_match' });

  await expect(requestAddressSuggestion({
      consented: true,
      geolocation: createGeolocation(),
      fetchImpl: async () => { throw new Error('private network detail'); },
  })).rejects.toMatchObject({ code: 'network_error', message: 'network_error' });
  const error = await requestAddressSuggestion({
    consented: true,
    geolocation: denied,
    fetchImpl: async () => { throw new Error('backend must not be called'); },
  }).catch((failure) => failure);
  expect(error.message).not.toContain('private browser detail');
});
});
