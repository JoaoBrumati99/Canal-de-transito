import './InfoCard.css';

/**
 * InfoCard — reusable assurance card.
 * @param {React.ComponentType} icon  Outline icon component.
 * @param {string} title
 * @param {string} children  Supporting copy.
 */
const InfoCard = ({ icon: Icon, title, children }) => {
  return (
    <article className="info-card">
      <span className="info-card__icon" aria-hidden="true">
        <Icon width={24} height={24} />
      </span>
      <div className="info-card__body">
        <h3 className="info-card__title">{title}</h3>
        <p className="info-card__text">{children}</p>
      </div>
    </article>
  );
};

export default InfoCard;
