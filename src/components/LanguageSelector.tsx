import { useI18n, LANGUAGES, type LanguageCode } from '../context/I18nContext';

function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <div className="language-toggle">
      <select
        className="lang-select"
        aria-label="Select language"
        value={lang}
        onChange={(e) => setLang(e.target.value as LanguageCode)}
      >
        {LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
