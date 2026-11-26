const GEOCODE_ENDPOINT = '/api/geocode/reverse';
const LOCATION_TIMEOUT_MS = 10000;
const REQUEST_TIMEOUT_MS = 10000;
const BACKEND_ERRORS = new Set([
  'invalid_coordinates',
  'no_match',
  'rate_limited',
  'unavailable',
  'timeout',
]);

export class LocationLookupError extends Error {
  constructor(code) {
    super(code);
    this.name = 'LocationLookupError';
    this.code = code;
  }
}

export async function requestAddressSuggestion({
  consented,
  geolocation,
  fetchImpl = globalThis.fetch,
  signal,
}) {
  if (!consented) return null;
  if (signal?.aborted) throw new LocationLookupError('cancelled');
  if (!geolocation || typeof geolocation.getCurrentPosition !== 'function') {
    throw new LocationLookupError('unavailable');
  }

  const coords = await new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      signal?.removeEventListener('abort', onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, new LocationLookupError('cancelled'));
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }

    try {
      geolocation.getCurrentPosition(
        ({ coords: position }) => finish(resolve, position),
        (error) => {
        const code = error?.code === 1
          ? 'permission_denied'
          : error?.code === 3
            ? 'timeout'
            : 'unavailable';
          finish(reject, new LocationLookupError(code));
        },
        { timeout: LOCATION_TIMEOUT_MS }
      );
    } catch (_error) {
      finish(reject, new LocationLookupError('unavailable'));
    }
  });

  if (signal?.aborted) throw new LocationLookupError('cancelled');
  if (
    !Number.isFinite(coords?.latitude)
    || !Number.isFinite(coords?.longitude)
  ) {
    throw new LocationLookupError('invalid_coordinates');
  }
  if (typeof fetchImpl !== 'function') {
    throw new LocationLookupError('unavailable');
  }

  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let payload;
  try {
    try {
      response = await fetchImpl(GEOCODE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
        signal: controller.signal,
      });
    } catch (_error) {
      const code = signal?.aborted
        ? 'cancelled'
        : controller.signal.aborted
          ? 'timeout'
          : 'network_error';
      throw new LocationLookupError(code);
    }

    try {
      payload = await response.json();
    } catch (_error) {
      const code = signal?.aborted
        ? 'cancelled'
        : controller.signal.aborted
          ? 'timeout'
          : 'unavailable';
      throw new LocationLookupError(code);
    }
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }

  if (signal?.aborted) throw new LocationLookupError('cancelled');
  if (
    response.ok
    && typeof payload?.suggestion === 'string'
    && payload.suggestion.trim()
  ) {
    return payload.suggestion.trim();
  }

  const errorCode = typeof payload?.error === 'string' && BACKEND_ERRORS.has(payload.error)
    ? payload.error
    : 'unavailable';
  throw new LocationLookupError(errorCode);
}

export function getLocationErrorMessage(code) {
  const messages = {
    permission_denied: 'Permissão de localização negada. Você ainda pode informar o endereço manualmente.',
    timeout: 'A busca de localização excedeu o tempo limite. Você ainda pode informar o endereço manualmente.',
    no_match: 'Nenhum logradouro próximo foi encontrado. Informe o endereço manualmente.',
    rate_limited: 'O serviço de localização está ocupado. Informe o endereço manualmente ou tente novamente mais tarde.',
    network_error: 'Não foi possível conectar ao serviço de localização. Você ainda pode informar o endereço manualmente.',
    invalid_coordinates: 'Não foi possível validar a localização. Você ainda pode informar o endereço manualmente.',
    unavailable: 'O serviço de localização está indisponível. Você ainda pode informar o endereço manualmente.',
  };
  return messages[code] || messages.unavailable;
}
