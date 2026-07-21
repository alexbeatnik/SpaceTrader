import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'

export function LogScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const { t } = useI18n()

  return (
    <div>
      <div className="screen-title">📜 {t('log.title')}</div>
      <div className="screen-sub">{game.commanderName}</div>

      <div className="panel panel-pad">
        {game.log.length === 0 ? (
          <div className="muted">{t('log.empty')}</div>
        ) : (
          <div className="log-list">
            {game.log.map((entry, i) => (
              <div className="log-entry" key={i}>
                <span className="day">
                  {t('common.day')} {entry.day}
                </span>
                <span className="text">{renderMessage(entry.key, entry.params)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
