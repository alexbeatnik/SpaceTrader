import { useI18n } from '../hooks/useI18n'
import { UpdatePanel } from '../components/UpdatePanel'

// The window-open handler in the main process routes any target="_blank" link
// to the OS browser and refuses to open a window for it, so an ordinary anchor
// is all this needs — no IPC of its own.
const REPO_URL = 'https://github.com/alexbeatnik/SpaceTrader'
const AUTHOR = 'alexbeatnik'
const LICENSE = 'Apache-2.0'

export function AboutScreen(): React.JSX.Element {
  const { t } = useI18n()

  return (
    <div>
      <div className="screen-title">📘 {t('about.title')}</div>
      <div className="screen-sub">{t('about.lead')}</div>

      <div className="grid grid-tight">
        <UpdatePanel />

        <div className="panel panel-pad about-section">
          <h3>🕹️ {t('about.inspirationTitle')}</h3>
          <p>{t('about.inspiration')}</p>
        </div>

        <div className="panel panel-pad about-section">
          <h3>🛠️ {t('about.ownTitle')}</h3>
          <p>{t('about.own')}</p>
        </div>

        <div className="panel panel-pad about-section">
          <h3>🎁 {t('about.freeTitle')}</h3>
          <p>{t('about.free')}</p>
        </div>

        <div className="panel panel-pad about-section">
          <h3>📦 {t('about.repoTitle')}</h3>
          <p>{t('about.repo')}</p>
          <a
            className="btn btn-primary about-link"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            ↗ {t('about.openRepo')}
          </a>
          <div className="kv">
            <span className="k">{t('about.authorLabel')}</span>
            <span className="v">{AUTHOR}</span>
          </div>
          <div className="kv">
            <span className="k">{t('about.licenseLabel')}</span>
            <span className="v">{LICENSE}</span>
          </div>
        </div>

        <div className="muted about-disclaimer">{t('about.disclaimer')}</div>
      </div>
    </div>
  )
}
