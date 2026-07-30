import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'
import { fmt } from '../util/format'

export function GameOverModal(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const cause = useGameStore((s) => s.gameOverCause)
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const { t } = useI18n()

  return (
    <div className="overlay">
      <div className="modal modal-narrow modal-center">
        <h2 style={{ color: 'var(--bad)' }}>
          💥 {cause ? t(cause.titleKey) : t('encounter.playerDestroyed')}
        </h2>
        <div className="ship-emoji" style={{ fontSize: 64, margin: '12px 0' }}>☠️</div>
        {cause && (
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 16px' }}>
            {renderMessage(cause.bodyKey, cause.params)}
          </p>
        )}
        <div className="kv"><span className="k">{t('common.day')}</span><span className="v">{game.day}</span></div>
        <div className="kv"><span className="k">{t('hud.credits')}</span><span className="v">{fmt(game.credits)}</span></div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          onClick={quitToMenu}
        >
          {t('menu.newGame')}
        </button>
      </div>
    </div>
  )
}
