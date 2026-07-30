import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'

const ICON: Record<string, string> = {
  pilot: '🧭',
  gunner: '💥',
  mechanic: '🔧',
  electrician: '⚡'
}

/**
 * Reports a mishap caused by a station nobody was properly minding — the price
 * of flying short-handed or with the wrong people in the wrong posts.
 */
export function CrewIncidentModal(): React.JSX.Element | null {
  const incident = useGameStore((s) => s.incident)
  const dismiss = useGameStore((s) => s.dismissIncident)
  const { t } = useI18n()

  if (!incident) return null

  return (
    <div className="overlay">
      <div className="modal modal-narrow">
        <h2>
          {ICON[incident.role] ?? '⚠'} {t(incident.titleKey)}
        </h2>
        <p style={{ marginTop: 10 }}>{renderMessage(incident.bodyKey, incident.params)}</p>
        <div className="screen-sub" style={{ marginTop: 12 }}>
          {t('crew.incident.blame', { role: t(`role.${incident.role}`) })}
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={dismiss}>
          {t('encounter.action.continue')}
        </button>
      </div>
    </div>
  )
}
