import { useRef, useState } from 'react';
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

const MAX_CHARS = 5000;
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
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [placa, setPlaca] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState('');
  const [registeredAt, setRegisteredAt] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  const charCount = text.length;

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Este navegador não disponibiliza a localização.');
      setLocationError(true);
      return;
    }

    setLocationLoading(true);
    setLocationMessage('Obtendo localização...');
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocal(`Localização atual: latitude ${coords.latitude.toFixed(6)}, longitude ${coords.longitude.toFixed(6)}`);
        setLocationLoading(false);
        setLocationMessage('Localização preenchida com coordenadas. Não há conversão automática para nome da rua.');
      },
      (error) => {
        const messages = {
          1: 'Permissão de localização negada. Autorize o acesso no navegador ou informe o endereço manualmente.',
          2: 'Não foi possível determinar sua localização. Informe o endereço manualmente.',
          3: 'A busca pela localização expirou. Tente novamente ou informe o endereço manualmente.',
        };
        setLocationLoading(false);
        setLocationError(true);
        setLocationMessage(messages[error.code] || 'Não foi possível obter sua localização. Informe o endereço manualmente.');
      },
      { timeout: 10000 }
    );
  }

  function handleFiles(selectedFiles) {
    const incomingFiles = Array.from(selectedFiles || []);
    if (!incomingFiles.length) return;

    const acceptedFiles = [];
    const errors = [];
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

      acceptedFiles.push(selectedFile);
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
    setStep(1);
    setOcorrencia('velocidade');
    setText('');
    setLocal('');
    setLocationLoading(false);
    setLocationMessage('');
    setLocationError(false);
    setData('');
    setHorario('');
    setPlaca('');
    setSelectedVehicle('');
    setFiles([]);
    setSubmitted(false);
    setProtocol('');
    setRegisteredAt(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFinalize() {
    if (fileError) return;

    const submittedAt = new Date();
    const datePart = submittedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const referencePart = Math.random().toString(36).slice(2, 8).toUpperCase();
    setProtocol(`CT-${datePart}-${referencePart}`);
    setRegisteredAt(submittedAt);
    setSubmitted(true);
    setStep(4);
  }

  return (
    <>
      <div className="form-card reveal-2">
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
                  A localização será registrada como coordenadas, sem conversão automática para nome da rua.
                </p>
                <input
                  id="local"
                  className="field__input"
                  placeholder="Rua, número, bairro ou ponto de referência"
                  value={local}
                  aria-describedby="local-hint"
                  onChange={(e) => {
                    setLocal(e.target.value);
                    setLocationMessage('');
                    setLocationError(false);
                  }}
                />
                <button
                  type="button"
                  className="location-button"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? 'Obtendo localização...' : 'Usar minha localização'}
                </button>
                {locationMessage && (
                  <p className={`location-message ${locationError ? 'location-message--error' : ''}`} role={locationError ? 'alert' : 'status'}>
                    {locationMessage}
                  </p>
                )}
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
              <div className="field detail-grid__wide">
                <label htmlFor="placa" className="field__label">Placa do veículo <em>(opcional, se souber)</em></label>
                <input
                  id="placa"
                  className="field__input"
                  placeholder="ABC1D23"
                  value={placa}
                  maxLength={8}
                  onChange={(e) => setPlaca(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase())}
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
                <span className="dropzone__hint">Formatos aceitos: JPG, PNG, WEBP, MP4, MOV ou WEBM. Sem limite de quantidade ou tamanho definido pelo formulário.</span>
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
          </section>
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
                  {placa && <div><dt>Placa</dt><dd>{placa}</dd></div>}
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
                onClick={() => setStep((current) => current + 1)}
                disabled={step === 2 && !selectedVehicle}
              >
                Próximo
                <ArrowRightIcon width={20} height={20} />
              </button>
            ) : (
              <button type="button" className="submit-btn" onClick={handleFinalize}>
                Finalizar
                <ArrowRightIcon width={20} height={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TransitoForm;
