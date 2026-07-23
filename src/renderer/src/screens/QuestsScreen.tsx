import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { questDescription, questTypeLabel } from '../util/questText'
import { fmt } from '../util/format'

const ICON: Record<string, string> = {
  delivery: '📦',
  relief: '⛑️',
  bounty: '🎯',
  passenger: '🧳',
  smuggle: '🕶️',
  fetch: '📥'
}

export function QuestsScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const { t } = useI18n()
  const active = game.quests.filter((q) => q.status === 'active')
  const completed = game.quests.filter((q) => q.status === 'completed')

  return (
    <div>
      <div className="screen-title">📋 {t('quest.title')}</div>
      <div className="screen-sub">
        {t('quest.active')}: {active.length} · {t('quest.done')}: {completed.length}
      </div>

      {active.length === 0 && completed.length === 0 ? (
        <div className="panel panel-pad muted">{t('quest.none')}</div>
      ) : (
        <div className="grid" style={{ gap: 12 }}>
          {active.map((q) => (
            <div className="panel panel-pad" key={q.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{ICON[q.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{questTypeLabel(q)}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{questDescription(q, game)}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    📍 {t('quest.takenAt', { system: game.systems[q.giverSystem]?.nameId ?? '—' })}
                    {' · '}🎯 {t('quest.destination')}:{' '}
                    {game.systems[q.targetSystem]?.nameId ?? '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge">{t('quest.reward')}</div>
                  <div className="pos" style={{ fontWeight: 600, marginTop: 4 }}>
                    {fmt(q.reward)} {t('common.cr')}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {completed.map((q) => (
            <div className="panel panel-pad" key={q.id} style={{ opacity: 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{questTypeLabel(q)}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{questDescription(q, game)}</div>
                </div>
                <div className="pos" style={{ fontWeight: 600 }}>+{fmt(q.reward)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
