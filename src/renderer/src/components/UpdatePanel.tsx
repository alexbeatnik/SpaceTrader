import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import type { UpdateStatus } from '../../../main/updater'

/**
 * Update state, shown on the About screen. The download runs by itself in the
 * background and installs on quit, so this is mostly a window onto what is
 * already happening — plus a way to apply it now rather than later.
 */
export function UpdatePanel(): React.JSX.Element {
  const { t } = useI18n()
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.api) return
    void window.api.updateStatus().then(setStatus)
    return window.api.onUpdateStatus(setStatus)
  }, [])

  const check = useCallback(async () => {
    if (!window.api) return
    setBusy(true)
    try {
      setStatus(await window.api.checkForUpdate())
    } finally {
      setBusy(false)
    }
  }, [])

  const line = ((): string => {
    switch (status.state) {
      case 'checking':
        return t('update.checking')
      case 'current':
        return t('update.current')
      case 'available':
        return t('update.available', { version: status.version })
      case 'downloading':
        return t('update.downloading', { percent: status.percent })
      case 'ready':
        return t('update.ready', { version: status.version })
      case 'error':
        return t('update.error')
      case 'unsupported':
        return t('update.unsupported')
      default:
        return t('update.idle')
    }
  })()

  const tone =
    status.state === 'ready' ? 'pos' : status.state === 'error' ? 'neg' : 'muted'

  return (
    <div className="panel panel-pad about-section">
      <h3>🔄 {t('update.title')}</h3>
      <p>{t('update.blurb')}</p>
      <div className={`update-line ${tone}`}>{line}</div>
      {status.state === 'downloading' && (
        <div className="meter" style={{ marginTop: 8 }}>
          <div className="meter-fill hull" style={{ width: `${status.percent}%` }} />
        </div>
      )}
      <div className="update-actions">
        {status.state === 'ready' ? (
          <button className="btn btn-primary" onClick={() => void window.api.installUpdate()}>
            ⟳ {t('update.restart')}
          </button>
        ) : (
          <button
            className="btn"
            disabled={busy || status.state === 'unsupported' || status.state === 'downloading'}
            onClick={() => void check()}
          >
            {t('update.check')}
          </button>
        )}
      </div>
    </div>
  )
}
