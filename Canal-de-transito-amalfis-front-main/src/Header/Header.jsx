import './Header.css';
import logoNavy from '../../images/logoHeader-navy.svg';
import { ShieldCheckMini } from '../Icons/Icons';

const Header = () => {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="site-header__brand" href="#inicio" aria-label="Amalfis — página inicial">
          <img src={logoNavy} alt="Amalfis" />
        </a>

        <nav className="site-nav" aria-label="Navegação principal">
          <a className="site-nav__cta" href="#canal" aria-current="page">
            <ShieldCheckMini width={18} height={18} />
            Canal de Trânsito Seguro
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
