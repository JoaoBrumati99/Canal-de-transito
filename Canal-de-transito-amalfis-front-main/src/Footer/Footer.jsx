import './Footer.css';
import logoWhite from '../../images/logoHeader-white.svg';

const Footer = () => {
  return (
    <footer className="site-footer" id="contato">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <img src={logoWhite} alt="Amalfis" />
          <span className="site-footer__tag">Uniformes &amp; Vestimentos de Proteção</span>
        </div>

        <p className="site-footer__msg">Juntos por um trânsito mais seguro.</p>

        <p className="site-footer__legal">
          Canal dedicado ao registro responsável de ocorrências de trânsito.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
