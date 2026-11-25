import './InfoSection.css';
import InfoCard from '../InfoCard/InfoCard';
import { AlertTriangleIcon, HandshakeIcon, ShieldIcon } from '../Icons/Icons';

const InfoSection = () => {
  return (
    <div className="info reveal">
    
      <p className="info__lead">
        Registre uma ocorrência de trânsito de forma rápida e segura.
        Em poucos passos, você informa o que aconteceu e ajuda a manter o trânsito mais seguro.
      </p>

      <div className="info__cards">
        <InfoCard icon={ShieldIcon} title="Sua colaboração faz a diferença">
          Seu registro ajuda a identificar situações de risco e a promover um trânsito mais seguro.
        </InfoCard>
        <InfoCard icon={AlertTriangleIcon} title="Registre mesmo situações de risco">
          Nem toda situação precisa resultar em um acidente. Registrar condições de risco também ajuda a prevenir futuras ocorrências.
        </InfoCard>
        <InfoCard icon={HandshakeIcon} title="Participe dessa iniciativa">
          O Canal de Trânsito é uma iniciativa que valoriza a participação de todos. Sua contribuição fortalece a conscientização e a segurança
        </InfoCard>
      </div>
    </div>
  );
};

export default InfoSection;
