// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../api.js';
import TransitoForm from './TransitoForm.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('opens the full privacy term without checking consent and closes with Escape', () => {
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } });
  openAddressStep();

  const consentCheckbox = screen.getByRole('checkbox', {
    name: /Concordo com o tratamento.*Termo de Uso de Dados e Aviso de Privacidade/,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Termo de Uso de Dados e Aviso de Privacidade' }));

  const dialog = screen.getByRole('dialog', { name: 'Termo de Uso de Dados e Aviso de Privacidade' });
  expect(dialog.textContent).toContain('Amalfis Uniformes Confecção de Roupas LTDA');
  expect(dialog.textContent).toContain('contato@amalfis.com.br');
  expect(dialog.textContent).toContain('não ficam armazenados de forma persistente');
  expect(dialog.textContent).toContain('12 meses');
  expect(consentCheckbox.checked).toBe(false);
  expect(screen.getByRole('button', { name: 'Finalizar' }).disabled).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar Termo de Uso de Dados e Aviso de Privacidade' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Termo de Uso de Dados e Aviso de Privacidade' }));
  expect(dialog.isConnected).toBe(false);
});

function openAddressStep() {
  render(<TransitoForm />);
  advanceToAddressStep();
}

function advanceToAddressStep() {
  fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
  fireEvent.click(screen.getAllByRole('button', { name: /Selecionar/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function consentToLocation() {
  fireEvent.click(screen.getByRole('button', { name: /Sugerir logradouro/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Concordo e continuar' }));
}

function stubApiFetch(locationFetch, submissionResponse = {
  ok: true,
  json: async () => ({ message: 'Ocorrência encaminhada com sucesso.', error: false }),
}) {
  const apiFetch = vi.fn((url, options) => {
    if (url === apiUrl('/api/denuncia')) return Promise.resolve(submissionResponse);
    return locationFetch(url, options);
  });
  vi.stubGlobal('fetch', apiFetch);
  return apiFetch;
}

async function submitAddress() {
  const consentCheckbox = screen.getByRole('checkbox', { name: /Concordo com o tratamento.*Termo de Uso de Dados e Aviso de Privacidade/ });
  if (!consentCheckbox.checked) fireEvent.click(consentCheckbox);
  fireEvent.click(screen.getByRole('button', { name: /Finalizar/ }));
  await waitFor(() => expect(screen.getByText('Ocorrência registrada!')).toBeTruthy());
}

describe('address location suggestion form flow', () => {
  it('rejects attachments whose combined size exceeds 4 MB', () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } });
    const apiFetch = stubApiFetch(vi.fn());
    openAddressStep();
    const fileInput = document.querySelector('input[type="file"]');
    const firstFile = new File([new Uint8Array(3 * 1024 * 1024)], 'first.mp4', { type: 'video/mp4' });
    const secondFile = new File([new Uint8Array(2 * 1024 * 1024)], 'second.mp4', { type: 'video/mp4' });

    fireEvent.change(fileInput, { target: { files: [firstFile] } });
    fireEvent.change(fileInput, { target: { files: [secondFile] } });

    expect(screen.getByRole('alert').textContent).toContain('O limite total de anexos é 4 MB');
    expect(screen.getByText('first.mp4')).toBeTruthy();
    expect(screen.queryByText('second.mp4')).toBeNull();
    expect(screen.getByRole('button', { name: 'Finalizar' }).disabled).toBe(true);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('cancellation sends no location and manual address remains editable and is submitted', async () => {
    const getCurrentPosition = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    openAddressStep();

    fireEvent.click(screen.getByRole('button', { name: /Sugerir logradouro/ }));
    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(getCurrentPosition).not.toHaveBeenCalled();

    const address = screen.getByLabelText('Endereço');
    fireEvent.change(address, { target: { value: 'Rua Manual, 123, complemento fundos' } });
    expect(address.disabled).toBe(false);
    await submitAddress();
    expect(screen.getByText('Rua Manual, 123, complemento fundos')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires privacy consent and sends the complete occurrence and attachments', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } });
    const apiFetch = stubApiFetch(vi.fn());
    openAddressStep();

    fireEvent.change(screen.getByLabelText('Endereço'), {
      target: { value: 'Rua Exemplo, 12' },
    });
    fireEvent.change(screen.getByLabelText('Data aproximada'), {
      target: { value: '2026-11-25' },
    });
    fireEvent.change(screen.getByLabelText('Horário aproximado'), {
      target: { value: '14:30' },
    });
    fireEvent.change(screen.getByLabelText('Descreva a situação observada'), {
      target: { value: 'Descrição da ocorrência' },
    });
    const evidence = new File(['image'], 'evidence.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [evidence] },
    });

    const finalizeButton = screen.getByRole('button', { name: 'Finalizar' });
    expect(finalizeButton.disabled).toBe(true);
    fireEvent.click(finalizeButton);
    expect(apiFetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox', { name: /Concordo com o tratamento.*Termo de Uso de Dados e Aviso de Privacidade/ }));
    fireEvent.click(finalizeButton);
    await waitFor(() => expect(screen.getByText('Ocorrência registrada!')).toBeTruthy());

    const [url, options] = apiFetch.mock.calls.find(([requestUrl]) => requestUrl === apiUrl('/api/denuncia'));
    const formData = options.body;
    const occurrence = JSON.parse(formData.get('denuncia'));
    expect(url).toBe(apiUrl('/api/denuncia'));
    expect(formData.get('consentimento')).toBe('true');
    expect(formData.getAll('anexo').map((file) => file.name)).toEqual(['evidence.jpg']);
    expect(occurrence).toMatchObject({
      categoria: 'Excesso de velocidade',
      veiculo: 'Fiorino',
      placa: 'QOY6G79',
      local: 'Rua Exemplo, 12',
      data: '2026-11-25',
      horario: '14:30',
      descricao: 'Descrição da ocorrência',
    });
  });

  it('keeps the form open and shows an error when the email endpoint fails', async () => {
    stubApiFetch(vi.fn(), {
      ok: false,
      json: async () => ({ message: 'private server detail', error: true }),
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } });
    openAddressStep();
    fireEvent.change(screen.getByLabelText('Descreva a situação observada'), {
      target: { value: 'Descrição que deve permanecer' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /Concordo com o tratamento.*Termo de Uso de Dados e Aviso de Privacidade/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Não foi possível enviar');
    });
    expect(screen.queryByText('Ocorrência registrada!')).toBeNull();
    expect(screen.getByLabelText('Descreva a situação observada').value).toBe('Descrição que deve permanecer');
    expect(screen.getByRole('alert').textContent).not.toContain('private server detail');
  });

  it('shows the attachment limit when the API rejects an oversized submission', async () => {
    stubApiFetch(vi.fn(), {
      ok: false,
      status: 413,
      json: async () => ({ message: 'O limite total de anexos é 4 MB por envio.', error: true }),
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } });
    openAddressStep();
    fireEvent.click(screen.getByRole('checkbox', { name: /Concordo com o tratamento.*Termo de Uso de Dados e Aviso de Privacidade/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('O limite total de anexos é 4 MB');
    });
    expect(screen.queryByText('Ocorrência registrada!')).toBeNull();
  });

  it('shows an editable suggestion and submits the user-edited value', async () => {
    const getCurrentPosition = vi.fn((success) => success({
      coords: { latitude: -23.55, longitude: -46.63 },
    }));
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ suggestion: 'Rua Exemplo, Centro, São Paulo - SP' }),
    }));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    openAddressStep();

    fireEvent.click(screen.getByRole('button', { name: /Sugerir logradouro/ }));
    expect(getCurrentPosition).not.toHaveBeenCalled();
    consentToLocation();

    const address = screen.getByLabelText('Endereço');
    await waitFor(() => expect(address.value).toBe('Rua Exemplo, Centro, São Paulo - SP'));
    expect(screen.queryByText(/Sugestão de endereço próximo/)).toBeNull();
    expect(screen.getByText(/Powered by/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/geocode/reverse');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      latitude: -23.55,
      longitude: -46.63,
    });

    fireEvent.change(address, { target: { value: 'Avenida Editada, 45, apto 2' } });
    await     await submitAddress();
    expect(screen.getByText('Avenida Editada, 45, apto 2')).toBeTruthy();
  });

  it.each([
    ['browser permission denial', 'browser', 1, null, 'Permissão de localização negada'],
    ['browser timeout', 'browser', 3, null, 'excedeu o tempo limite'],
    ['no nearby street', 'backend', null, { ok: false, status: 404, json: async () => ({ error: 'no_match' }) }, 'Nenhum logradouro próximo'],
    ['rate limited backend', 'backend', null, { ok: false, status: 429, json: async () => ({ error: 'rate_limited' }) }, 'está ocupado'],
    ['backend timeout', 'backend', null, { ok: false, status: 504, json: async () => ({ error: 'timeout' }) }, 'excedeu o tempo limite'],
    ['unavailable backend', 'backend', null, { ok: false, status: 503, json: async () => ({ error: 'unavailable' }) }, 'indisponível'],
    ['invalid service data', 'backend', null, { ok: true, json: async () => ({ suggestion: '' }) }, 'indisponível'],
    ['network failure', 'network', null, null, 'Não foi possível conectar'],
  ])('%s keeps manual address available and submit-ready', async (_name, failureType, code, response, message) => {
    const getCurrentPosition = vi.fn((_success, failure) => {
      if (failureType === 'browser') failure({ code, message: 'private location detail' });
      else _success({ coords: { latitude: -23.55, longitude: -46.63 } });
    });
    const fetchMock = failureType === 'network'
      ? vi.fn(async () => { throw new Error('private network detail'); })
      : vi.fn(async () => response);
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    openAddressStep();

    const address = screen.getByLabelText('Endereço');
    fireEvent.change(address, { target: { value: 'Endereço manual original, 9' } });
    consentToLocation();

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(message));
    expect(address.value).toBe('Endereço manual original, 9');
    expect(address.disabled).toBe(false);
    expect(screen.getByRole('alert').textContent).not.toContain('private');
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    if (failureType !== 'browser') expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(address, { target: { value: 'Endereço editado após erro, 10' } });
    await submitAddress();
    expect(screen.getByText('Endereço editado após erro, 10')).toBeTruthy();
  });

  it('does not make duplicate browser location requests while a lookup is in flight', () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    vi.stubGlobal('fetch', vi.fn());
    openAddressStep();
    fireEvent.click(screen.getByRole('button', { name: /Sugerir logradouro/ }));

    const continueButton = screen.getByRole('button', { name: 'Concordo e continuar' });
    fireEvent.click(continueButton);
    fireEvent.click(continueButton);
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('does not replace an address edited while the lookup is in flight', async () => {
    const response = deferred();
    const getCurrentPosition = vi.fn((success) => success({
      coords: { latitude: -23.55, longitude: -46.63 },
    }));
    const fetchMock = vi.fn(() => response.promise);
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    openAddressStep();

    const address = screen.getByLabelText('Endereço');
    fireEvent.change(address, { target: { value: 'Endereço manual inicial, 1' } });
    consentToLocation();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(address, { target: { value: 'Endereço editado durante a busca, 2' } });

    response.resolve({
      ok: true,
      json: async () => ({ suggestion: 'Rua sugerida pelo serviço' }),
    });

    await waitFor(() => expect(address.value).toBe('Endereço editado durante a busca, 2'));
    expect(screen.getByRole('status').textContent).toContain('endereço foi editado');
  });

  it('invalidates a pending response on reset so the next form stays empty', async () => {
    const response = deferred();
    const getCurrentPosition = vi.fn((success) => success({
      coords: { latitude: -23.55, longitude: -46.63 },
    }));
    const fetchMock = vi.fn(() => response.promise);
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    openAddressStep();

    consentToLocation();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await submitAddress();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' }));
    advanceToAddressStep();
    const address = screen.getByLabelText('Endereço');

    response.resolve({
      ok: true,
      json: async () => ({ suggestion: 'Rua antiga não deve aparecer' }),
    });

    await waitFor(() => expect(address.value).toBe(''));
    expect(screen.queryByText(/Sugestão de logradouro próximo/)).toBeNull();
  });

  it('aborts and ignores a pending response on unmount', async () => {
    const response = deferred();
    const getCurrentPosition = vi.fn((success) => success({
      coords: { latitude: -23.55, longitude: -46.63 },
    }));
    const fetchMock = vi.fn(() => response.promise);
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    stubApiFetch(fetchMock);
    openAddressStep();
    consentToLocation();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestSignal = fetchMock.mock.calls[0][1].signal;

    cleanup();
    response.resolve({
      ok: true,
      json: async () => ({ suggestion: 'Rua antiga não deve aparecer' }),
    });

    await waitFor(() => expect(requestSignal.aborted).toBe(true));
  });
});
