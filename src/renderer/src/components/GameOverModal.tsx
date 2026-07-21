import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { fmt } from '../util/format'

export function GameOverModal(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const { t } = useI18n()

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 420, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--bad)' }}>💥 {t('encounter.playerDestroyed')}</h2>
        <div className="ship-emoji" style={{ fontSize: 64, margin: '12px 0' }}>☠️</div>
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
