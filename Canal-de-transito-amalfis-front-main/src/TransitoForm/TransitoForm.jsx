import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TransitoForm.css';
import maisIcon from '../../images/icons/mais.gif';
import fiorinoQoy6g79Image from '../../images/fiorino_QOY6G79.svg';
import fiorinoEwx9706Image from '../../images/fiorino_EWX9706.svg';
import mobiPtz7g52Image from '../../images/mobi_prata_PTZ7G52.svg';
import caminhaoEcu3g85Image from '../../images/caminhao_ECU3G85.svg';
import {
  ClipIcon,
  UploadCloudIcon,
  ArrowRightIcon,
  FileIcon,
  CloseIcon,
  CheckCircleIcon,
  PhoneIcon,
  SpeedometerIcon,
  AngryFaceIcon,
  ThumbsUpIcon,
  SteeringWheelIcon,
  AlertTriangleIcon,
  NoParkingIcon,
} from '../Icons/Icons';
import { getLocationErrorMessage, requestAddressSuggestion } from './reverseGeocode.js';
import { apiUrl } from '../api.js';

const MAX_CHARS = 5000;
const MAX_TOTAL_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm'];
const VEHICLES = [
  { plate: 'QOY6G79', model: 'Fiorino', image: fiorinoQoy6g79Image },
  { plate: 'EWX9706', model: 'Fiorino', image: fiorinoEwx9706Image },
  { plate: 'PTZ7G52', model: 'Mobi', image: mobiPtz7g52Image },
  { plate: 'ECU3G85', model: 'caminhão 6.160 DRC 4X2', image: caminhaoEcu3g85Image },
];

const OCORRENCIAS = [
  { id: 'velocidade', label: 'Excesso de velocidade', icon: 'speed' },
  { id: 'direcao', label: 'Direção perigosa', icon: 'steering' },
  { id: 'celular', label: 'Uso de celular', icon: 'phone' },
  { id: 'leis', label: 'Desrespeito às leis de trânsito', icon: 'warning' },
  { id: 'comportamento', label: 'Comportamento inadequado', icon: 'angry' },
  { id: 'estacionamento', label: 'Estacionamento irregular', icon: 'prohibited' },
  { id: 'alcool', label: 'Elogio ao motorista', icon: 'thumbs-up' },
  { id: 'outros', label: 'Outros', icon: 'plus' },
];

const OCCURRENCE_ICONS = {
  speed: SpeedometerIcon,
  steering: SteeringWheelIcon,
  phone: PhoneIcon,
  warning: AlertTriangleIcon,
  angry: AngryFaceIcon,
  prohibited: NoParkingIcon,
  'thumbs-up': ThumbsUpIcon,
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ACCEPTED.includes(ext)) {
    return `Formato não aceito. Envie ${ACCEPTED.join(', ')}.`;
  }
  return '';
}

const TransitoForm = () => {
  const [step, setStep] = useState(1);
  const [ocorrencia, setOcorrencia] = useState('velocidade');
  const [text, setText] = useState('');
  const [local, setLocal] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationError, setLocationError] = useState(false);
  const [locationConsentOpen, setLocationConsentOpen] = useState(false);
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyTermOpen, setPrivacyTermOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState('');
  const [registeredAt, setRegisteredAt] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);
  const formCardRef = useRef(null);
  const privacyTermDialogRef = useRef(null);
  const privacyTermCloseRef = useRef(null);
  const privacyTermTriggerRef = useRef(null);
  const locationRequestInFlight = useRef(false);
  const locationRequestId = useRef(0);
  const locationAddressVersion = useRef(0);
  const locationAbortController = useRef(null);
  const submitInFlight = useRef(false);
  const componentMounted = useRef(false);
  const scrollAfterStepChange = useRef(false);

  const charCount = text.length;

  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
      locationRequestId.current += 1;
      locationRequestInFlight.current = false;
      locationAbortController.current?.abort();
      locationAbortController.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!scrollAfterStepChange.current) return;
    scrollAfterStepChange.current = false;
    if (typeof formCardRef.current?.scrollIntoView === 'function') {
      formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  useEffect(() => {
    if (!privacyTermOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const dialog = privacyTermDialogRef.current;
    const trigger = privacyTermTriggerRef.current;
    privacyTermCloseRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPrivacyTermOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusable = dialog.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [privacyTermOpen]);

  function invalidateLocationRequest() {
    locationRequestId.current += 1;
    locationRequestInFlight.current = false;
    locationAddressVersion.current += 1;
    locationAbortController.current?.abort();
    locationAbortController.current = null;
    setLocationLoading(false);
  }

  function askForLocationConsent() {
    setLocationConsentOpen(true);
  }

  async function getCurrentLocationSuggestion() {
    if (locationRequestInFlight.current) return;
    locationRequestInFlight.current = true;
    const requestId = locationRequestId.current + 1;
    locationRequestId.current = requestId;
    const addressVersion = locationAddressVersion.current;
    const abortController = new AbortController();
    locationAbortController.current = abortController;
    setLocationConsentOpen(false);
    setLocationLoading(true);
    setLocationMessage('Buscando um logradouro próximo...');
    setLocationError(false);
    try {
      const suggestion = await requestAddressSuggestion({
        consented: true,
        geolocation: navigator.geolocation,
        fetchImpl: globalThis.fetch.bind(globalThis),
        signal: abortController.signal,
      });
      if (requestId !== locationRequestId.current || !componentMounted.current) return;
      if (suggestion && addressVersion === locationAddressVersion.current) {
        setLocal(suggestion);
        setLocationMessage('');
      } else if (suggestion) {
        setLocationMessage('O endereço foi editado durante a busca e foi mantido. A sugestão não foi aplicada.');
      }
    } catch (error) {
      if (requestId !== locationRequestId.current || !componentMounted.current) return;
      setLocationError(true);
      setLocationMessage(getLocationErrorMessage(error.code));
    } finally {
      if (requestId === locationRequestId.current && componentMounted.current) {
        locationRequestInFlight.current = false;
        locationAbortController.current = null;
        setLocationLoading(false);
      }
    }
  }

  function handleFiles(selectedFiles) {
    const incomingFiles = Array.from(selectedFiles || []);
    if (!incomingFiles.length) return;

    const acceptedFiles = [];
    const errors = [];
    let totalFileBytes = files.reduce((total, file) => total + file.size, 0);
    const knownFiles = new Set(
      files.map((selectedFile) => `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`)
    );

    incomingFiles.forEach((selectedFile) => {
      const fileKey = `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`;
      if (knownFiles.has(fileKey)) return;

      const error = validateFile(selectedFile);
      if (error) {
        errors.push(`${selectedFile.name}: ${error}`);
        return;
      }

      if (totalFileBytes + selectedFile.size > MAX_TOTAL_FILE_BYTES) {
        errors.push(`${selectedFile.name}: O limite total de anexos é 4 MB por envio.`);
        return;
      }

      acceptedFiles.push(selectedFile);
      totalFileBytes += selectedFile.size;
      knownFiles.add(fileKey);
    });

    if (acceptedFiles.length) {
      setFiles((currentFiles) => [...currentFiles, ...acceptedFiles]);
    }
    setFileError(errors.join(' '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onFileInputChange(e) {
    handleFiles(e.target.files);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeFile(index) {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetForm() {
    invalidateLocationRequest();
    setStep(1);
    setOcorrencia('velocidade');
    setText('');
    setLocal('');
    setLocationLoading(false);
    setLocationMessage('');
    setLocationError(false);
    setLocationConsentOpen(false);
    setData('');
    setHorario('');
    setSelectedVehicle('');
    setFiles([]);
    setSubmitted(false);
    setProtocol('');
    setRegisteredAt(null);
    setFileError('');
    setPrivacyConsent(false);
    setPrivacyTermOpen(false);
    setSubmitError('');
    setSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleNextStep() {
    scrollAfterStepChange.current = true;
    setStep((current) => current + 1);
  }

  async function handleFinalize() {
    if (fileError || !privacyConsent || submitInFlight.current) return;

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError('');

    const sentAt = new Date();
    const datePart = sentAt.toISOString().slice(0, 10).replace(/-/g, '');
    const referencePart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const occurrenceProtocol = `CT-${datePart}-${referencePart}`;
    const selectedVehicleDetails = VEHICLES.find((vehicle) => vehicle.plate === selectedVehicle);
    const payload = new FormData();
    payload.append('denuncia', JSON.stringify({
      protocolo: occurrenceProtocol,
      categoria: OCORRENCIAS.find((item) => item.id === ocorrencia)?.label || ocorrencia,
      veiculo: selectedVehicleDetails?.model || '',
      placa: selectedVehicle,
      local,
      data,
      horario,
      descricao: text,
    }));
    payload.append('consentimento', 'true');
    files.forEach((file) => payload.append('anexo', file));

    try {
      const response = await fetch(apiUrl('/api/denuncia'), {
        method: 'POST',
        body: payload,
      });
      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.error) {
        if (response.status === 413) throw new Error('attachments_too_large');
        throw new Error('submission_failed');
      }

      setProtocol(occurrenceProtocol);
      setRegisteredAt(new Date());
      setSubmitted(true);
      setStep(4);
    } catch (error) {
      setSubmitError(error.message === 'attachments_too_large'
        ? 'O limite total de anexos é 4 MB por envio.'
        : 'Não foi possível enviar a ocorrência. Verifique sua conexão e tente novamente; os dados preenchidos foram mantidos.');
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="form-card reveal-2" ref={formCardRef}>
        {!submitted && (
          <div className="wizard-steps" aria-label="Etapas do registro">
          {[1, 2, 3].map((item) => (
            <div className={`wizard-step ${step === item ? 'is-active' : ''} ${step > item ? 'is-complete' : ''}`} key={item}>
              <span className="wizard-step__number">{step > item ? '✓' : item}</span>
              <span className="wizard-step__label">{['Ocorrência', 'Identificação', 'Detalhes'][item - 1]}</span>
              {item < 3 && <span className="wizard-step__line" />}
            </div>
          ))}
          </div>
        )}

        {step === 1 && (
          <section className="wizard-panel">
            <h2 className="wizard-title">Que situação de trânsito você quer registrar?</h2>
            <p className="wizard-hint">Escolha a categoria que melhor descreve o ocorrido.</p>
            <div className="occurrence-grid">
              {OCORRENCIAS.map((item) => {
                const Icon = OCCURRENCE_ICONS[item.icon];

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`occurrence-card ${ocorrencia === item.id ? 'is-selected' : ''}`}
                    onClick={() => setOcorrencia(item.id)}
                    aria-pressed={ocorrencia === item.id}
                  >
                    <span className={`occurrence-card__icon occurrence-card__icon--${item.icon}`} aria-hidden="true">
                      {item.icon === 'plus'
                        ? <img src={maisIcon} alt="" />
                        : <Icon width={20} height={20} />}
                    </span>
                    <span>{item.label}</span>
                    {ocorrencia === item.id && <span className="occurrence-card__check">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="wizard-panel">
            <h2 className="wizard-title">Identificação do veículo</h2>
            <p className="wizard-hint">Selecione o veículo relacionado à ocorrência.</p>
            <div className="vehicle-grid">
              {VEHICLES.map((vehicle) => (
                <article
                  className={`vehicle-card ${selectedVehicle === vehicle.plate ? 'is-selected' : ''}`}
                  key={vehicle.plate}
                >
                  <div className="vehicle-card__visual">
                    <img className="vehicle-card__image" src={vehicle.image} alt={`${vehicle.model} ${vehicle.plate}`} />
                  </div>
                  <div className="vehicle-card__details">
                    <span className="vehicle-card__model">{vehicle.model}</span>
                    <span className="vehicle-card__plate">{vehicle.plate}</span>
                  </div>
                  <button
                    type="button"
                    className="vehicle-card__select"
                    onClick={() => setSelectedVehicle(vehicle.plate)}
                    aria-pressed={selectedVehicle === vehicle.plate}
                    aria-label={`Selecionar ${vehicle.model}, placa ${vehicle.plate}`}
                  >
                    Selecionar
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="wizard-panel">
            <h2 className="wizard-title">Detalhes da ocorrência</h2>
            <p className="wizard-hint">Informe onde e quando aconteceu e compartilhe os detalhes que podem ajudar a entender a situação.</p>
            <div className="detail-grid">
              <div className="field detail-grid__wide">
                <label htmlFor="local" className="field__label">Endereço</label>
                <p id="local-hint" className="location-hint">
                  Digite o endereço manualmente ou peça uma sugestão de logradouro próximo.
                </p>
                <input
                  id="local"
                  className="field__input"
                  placeholder="Rua, número, bairro ou ponto de referência"
                  value={local}
                  aria-describedby="local-hint"
                  onChange={(e) => {
                    locationAddressVersion.current += 1;
                    setLocal(e.target.value);
                    if (locationError) {
                      setLocationMessage('');
                      setLocationError(false);
                    }
                  }}
                />
                <button
                  type="button"
                  className="location-button"
                  onClick={askForLocationConsent}
                  disabled={locationLoading}
                >
                  {locationLoading ? 'Buscando logradouro...' : 'Sugerir logradouro pela minha localização'}
                </button>
                {locationConsentOpen && (
                  <div className="location-consent" role="group" aria-labelledby="location-consent-title">
                    <p id="location-consent-title" className="location-consent__title">Autorizar uso da localização?</p>
                    <p className="location-consent__text">
                      Se continuar, este navegador obterá suas coordenadas e as enviará ao backend deste aplicativo, que as compartilhará com a Geoapify para buscar rua, número (se disponível), bairro, cidade e CEP. A sugestão pode indicar um local próximo, não necessariamente o ponto exato da ocorrência.
                    </p>
                    <div className="location-consent__actions">
                      <button type="button" className="location-button" onClick={getCurrentLocationSuggestion}>
                        Concordo e continuar
                      </button>
                      <button type="button" className="location-cancel" onClick={() => setLocationConsentOpen(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {locationMessage && (
                  <p className={`location-message ${locationError ? 'location-message--error' : ''}`} role={locationError ? 'alert' : 'status'}>
                    {locationMessage}
                  </p>
                )}
                <p className="location-attribution">
                  Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a>
                  {' · '}
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
                </p>
              </div>
              <div className="field">
                <label htmlFor="data" className="field__label">Data aproximada</label>
                <input
                  id="data"
                  type="date"
                  className="field__input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="horario" className="field__label">Horário aproximado</label>
                <input
                  id="horario"
                  type="time"
                  className="field__input"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <span className="field__label">
                <ClipIcon width={18} height={18} />
                Foto ou vídeo <em>(opcional)</em>
              </span>
              <button
                type="button"
                className={`dropzone ${dragging ? 'is-dragging' : ''} ${fileError ? 'is-invalid' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <UploadCloudIcon className="dropzone__icon" width={30} height={30} />
                <span className="dropzone__title">{files.length ? 'Adicionar mais arquivos' : 'Selecionar fotos ou vídeos'}</span>
                <span className="dropzone__hint">Formatos aceitos: JPG, PNG, WEBP, MP4, MOV ou WEBM. Limite total de anexos: 4 MB por envio.</span>
              </button>
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((selectedFile, index) => (
                    <div className="file-chip" key={`${selectedFile.name}-${selectedFile.lastModified}`}>
                      <span className="file-chip__icon" aria-hidden="true"><FileIcon width={20} height={20} /></span>
                      <span className="file-chip__meta">
                        <span className="file-chip__name" title={selectedFile.name}>{selectedFile.name}</span>
                        <span className="file-chip__size">{formatSize(selectedFile.size)}</span>
                      </span>
                      <button type="button" className="file-chip__remove" onClick={() => removeFile(index)} aria-label={`Remover ${selectedFile.name}`}>
                        <CloseIcon width={18} height={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                name="anexo"
                className="sr-only"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
                multiple
                onChange={onFileInputChange}
                tabIndex={-1}
              />
              {fileError && <span className="field__error field__error--file" role="alert">{fileError}</span>}
            </div>

            <div className="field">
              <label htmlFor="denuncia" className="field__label">Descreva a situação observada</label>
              <textarea
                id="denuncia"
              className="field__textarea"
                placeholder="Conte o que aconteceu. Se possível, informe o sentido da via, os veículos envolvidos e outros detalhes relevantes."
                maxLength={MAX_CHARS}
                rows={7}
                value={text}
              aria-describedby="denuncia-counter"
                onChange={(e) => {
                  setText(e.target.value);
                }}
              />
              <div className="field__meta">
                <span id="denuncia-counter" className="field__counter" aria-live="polite">
                {charCount} / {MAX_CHARS}
                </span>
              </div>
            </div>

            <div className="privacy-consent">
              <div className="privacy-consent__label">
                <input
                  id="privacy-consent"
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(event) => setPrivacyConsent(event.target.checked)}
                  aria-labelledby="privacy-consent-copy privacy-term-trigger"
                />
                <div>
                  <label id="privacy-consent-copy" htmlFor="privacy-consent">
                    Concordo com o tratamento dos meus dados conforme o{' '}
                  </label>
                  <button
                    ref={privacyTermTriggerRef}
                    id="privacy-term-trigger"
                    type="button"
                    className="privacy-term-link"
                    aria-haspopup="dialog"
                    aria-expanded={privacyTermOpen}
                    aria-controls="privacy-term-dialog"
                    onClick={() => setPrivacyTermOpen(true)}
                  >
                    Termo de Uso de Dados e Aviso de Privacidade
                  </button>
                  .
                </div>
              </div>
            </div>
          </section>
        )}

        {privacyTermOpen && createPortal(
          <div
            className="privacy-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPrivacyTermOpen(false);
            }}
          >
            <section
              ref={privacyTermDialogRef}
              id="privacy-term-dialog"
              className="privacy-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-term-title"
            >
              <header className="privacy-modal__header">
                <div>
                  <h2 id="privacy-term-title">Termo de Uso de Dados e Aviso de Privacidade</h2>
                </div>
                <button
                  ref={privacyTermCloseRef}
                  type="button"
                  className="privacy-modal__close"
                  aria-label="Fechar Termo de Uso de Dados e Aviso de Privacidade"
                  onClick={() => setPrivacyTermOpen(false)}
                >
                  ×
                </button>
              </header>
              <div className="privacy-modal__content">
                <section>
                  <h3>1. Quem trata os dados</h3>
                  <p>
                    O controlador dos dados é a <strong>Amalfis Uniformes Confecção de Roupas LTDA</strong>, CNPJ <strong>11.744.716/0001-10</strong>, Av. Valentina Mello Freire Borenstein, 450, Vila São Francisco, Mogi das Cruzes/SP, CEP 08735-270, por meio do Canal de Trânsito Seguro.
                  </p>
                  <p>
                    Contato para assuntos de privacidade:{' '}
                    <a href="mailto:contato@amalfis.com.br">contato@amalfis.com.br</a>
                    {' | '}
                    <a href="tel:+551147955219">(11) 4795-5219</a>
                  </p>
                </section>
                <section>
                  <h3>2. Quais dados são tratados</h3>
                  <p>
                    O formulário pode receber a categoria da ocorrência, modelo e placa do veículo, endereço, data e horário aproximados, descrição e fotos ou vídeos opcionais. A descrição e os anexos podem conter dados que identifiquem pessoas. O formulário não solicita nome nem e-mail do denunciante.
                  </p>
                </section>
                <section>
                  <h3>3. Para que os dados são usados</h3>
                  <p>
                    Os dados são usados para registrar, analisar e encaminhar a ocorrência à equipe responsável da Amalfis. Não serão usados para finalidades incompatíveis com esse atendimento sem informação prévia ao titular.
                  </p>
                </section>
                <section>
                  <h3>4. Sugestão de endereço pela localização</h3>
                  <p>
                    Se você solicitar a sugestão e autorizar o uso da localização, o navegador obtém suas coordenadas e o sistema as envia à Geoapify para buscar um endereço aproximado. Você pode revisar e editar o endereço. O envio final da ocorrência contém apenas o endereço preenchido, não as coordenadas.
                  </p>
                </section>
                <section>
                  <h3>5. Compartilhamento e armazenamento</h3>
                  <p>
                    A ocorrência e seus anexos são encaminhados ao e-mail corporativo da Amalfis por meio do MailerSend. Os anexos são processados temporariamente pelo backend para o envio e não ficam armazenados de forma persistente pelo aplicativo. As coordenadas só são compartilhadas com a Geoapify quando você solicita a sugestão de endereço.
                  </p>
                </section>
                <section>
                  <h3>6. Retenção e seus direitos</h3>
                  <p>
                    A ocorrência e os anexos recebidos pela equipe no e-mail corporativo são mantidos por até <strong>12 meses</strong> após o encerramento da ocorrência e, depois, excluídos ou anonimizados. Você pode solicitar acesso, correção ou exclusão pelo e-mail{' '}
                    <a href="mailto:contato@amalfis.com.br">contato@amalfis.com.br</a>.
                  </p>
                </section>
              </div>
              <footer className="privacy-modal__footer">
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => setPrivacyTermOpen(false)}
                >
                  Fechar termo
                </button>
              </footer>
            </section>
          </div>,
          document.body
        )}

        {step === 4 && (
          submitted ? (
            <section className="confirmation" role="status">
              <span className="confirmation__icon" aria-hidden="true"><CheckCircleIcon width={44} height={44} /></span>
              <h2 className="confirmation__title">Ocorrência registrada!</h2>
              <p className="confirmation__message">Sua colaboração ajuda a construir um trânsito mais seguro para todos!</p>

              <div className="confirmation__details">
                <h3>Informações registradas</h3>
                <dl>
                  <div><dt>Protocolo</dt><dd>{protocol}</dd></div>
                  {registeredAt && <div><dt>Registro</dt><dd>{registeredAt.toLocaleDateString('pt-BR')} • {registeredAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</dd></div>}
                  <div><dt>Tipo</dt><dd>{OCORRENCIAS.find((item) => item.id === ocorrencia)?.label}</dd></div>
                  {local && <div><dt>Local</dt><dd>{local}</dd></div>}
                  {data && <div><dt>Data</dt><dd>{data.split('-').reverse().join('/')}</dd></div>}
                  {horario && <div><dt>Horário</dt><dd>{horario}</dd></div>}
                  <div><dt>Descrição</dt><dd>{text}</dd></div>
                  {files.length > 0 && <div><dt>Anexos</dt><dd>{files.map((file) => file.name).join(', ')}</dd></div>}
                </dl>
              </div>

              <div className="confirmation__actions">
                <button type="button" className="back-btn" onClick={resetForm}>Voltar ao início</button>
                <button type="button" className="submit-btn" onClick={() => window.print()}>
                  Imprimir comprovante
                </button>
              </div>
              <p className="print-help">
                Para remover o endereço do site do comprovante, desmarque “Cabeçalhos e rodapés” nas opções de impressão.
              </p>
            </section>
          ) : null
        )}

        {!submitted && (
          <div className="wizard-actions">
            {step > 1 && (
              <button type="button" className="back-btn" onClick={() => setStep((current) => current - 1)}>
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                className="submit-btn"
                onClick={handleNextStep}
                disabled={step === 2 && !selectedVehicle}
              >
                Próximo
                <ArrowRightIcon width={20} height={20} />
              </button>
            ) : (
              <>
                {submitError && <p className="submit-error" role="alert">{submitError}</p>}
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleFinalize}
                  disabled={!privacyConsent || submitting || Boolean(fileError)}
                >
                  {submitting ? 'Enviando...' : 'Finalizar'}
                  {!submitting && <ArrowRightIcon width={20} height={20} />}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TransitoForm;
