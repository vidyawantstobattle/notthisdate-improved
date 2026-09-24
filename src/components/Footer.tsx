import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

function Footer() {
  const { t } = useI18n();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/images/logo.svg" alt="NotThisDate" className="logo-icon" />
            <span>NotThisDate</span>
          </Link>
          <p className="footer-tagline">{t('footer.tagline')}</p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>{t('footer.product')}</h4>
            <ul>
              <li><Link to="/">{t('footer.home')}</Link></li>
              <li><Link to="/about">{t('footer.about')}</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>{t('footer.resources')}</h4>
            <ul>
              <li><Link to="/#how-it-works">{t('footer.howItWorks')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          <span>{t('footer.copyright')}</span> <span>{t('footer.madeWith')}</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
