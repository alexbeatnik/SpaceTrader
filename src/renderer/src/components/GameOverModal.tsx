import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'
import { AUTO_SLOT } from '@shared/saves'
import { fmt } from '../util/format'

export function GameOverModal(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const cause = useGameStore((s) => s.gameOverCause)
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const loadGame = useGameStore((s) => s.loadGame)
  const listSaves = useGameStore((s) => s.listSaves)
  const { t } = useI18n()
  // The autosave is deliberately left at the last checkpoint before the ship
  // was lost, so the way back into the run is one press from here rather than
  // a trip through the menu to find it.
  const [hasCheckpoint, setHasCheckpoint] = useState(false)

  useEffect(() => {
    let alive = true
    void listSaves().then((slots) => {
      if (alive) setHasCheckpoint(slots.some((s) => s.slot === AUTO_SLOT && s.meta))
    })
    return () => {
      alive = false
    }
  }, [listSaves])

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
        <div className="modal-stack">
          {hasCheckpoint && (
            <button className="btn btn-primary btn-block" onClick={() => void loadGame()}>
              ↩ {t('gameOver.loadLast')}
            </button>
          )}
          <button
            className={`btn btn-block${hasCheckpoint ? '' : ' btn-primary'}`}
            onClick={quitToMenu}
          >
            {t('gameOver.toMenu')}
          </button>
        </div>
        {hasCheckpoint && <div className="modal-hint">{t('gameOver.loadLastHint')}</div>}
      </div>
    </div>
  )
}
