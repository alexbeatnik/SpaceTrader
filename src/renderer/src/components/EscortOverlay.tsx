import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'
import { fmt } from '../util/format'
import { ShipArt } from './ShipArt'

/** Real time each leg of the convoy run takes to play out. */
const LEG_MS = 2600

/**
 * Replays a convoy escort contract that the engine has already resolved. The
 * player watches: convoy command decides every engagement, so there is nothing
 * to press until the run is over.
 */
export function EscortOverlay(): React.JSX.Element | null {
  const run = useGameStore((s) => s.escort)
  const game = useGameStore((s) => s.game)
  const finishEscort = useGameStore((s) => s.finishEscort)
  const { t } = useI18n()
  const [shown, setShown] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)

  const total = run?.legs.length ?? 0
  const done = shown >= total

  // Reveal one leg at a time until the whole run has played out.
  useEffect(() => {
    if (!run || done) return
    const timer = window.setTimeout(() => setShown((n) => Math.min(total, n + 1)), LEG_MS)
    return () => window.clearTimeout(timer)
  }, [run, shown, total, done])

  // Keep the newest line in view as the run unfolds.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const visible = useMemo(() => (run ? run.legs.slice(0, shown) : []), [run, shown])

  if (!run || !game) return null

  const legsSoFar = visible.length
  const kills = visible.reduce((n, l) => n + l.kills, 0)
  const damage = visible.reduce((n, l) => n + l.damage, 0)
  const progress = total > 0 ? legsSoFar / total : 1

  const skip = (): void => setShown(total)

  return (
    <div className="warp-overlay">
      <div className="warp-core escort-warp-core">
        <div className="warp-route">
          <span className="warp-from">🛡 {t('escort.title')}</span>
        </div>

        <div className="warp-ship">
          <ShipArt type={game.ship.type} size={96} />
        </div>

        <div className="warp-sub">
          {t('escort.leg', { leg: legsSoFar, total })} · {t('common.day')} {game.day}
        </div>

        <div className="warp-progress">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="combat-log escort-log" ref={logRef}>
          {visible.flatMap((leg) =>
            leg.messages.map((m, i) => (
              <div className="line" key={`${leg.index}-${i}`}>
                {renderMessage(m.key, m.params)}
              </div>
            ))
          )}
        </div>

        <div className="kv" style={{ marginTop: 12 }}>
          <span className="k">{t('escort.kills')}</span>
          <span className="v">{kills}</span>
        </div>
        <div className="kv">
          <span className="k">{t('escort.damage')}</span>
          <span className={`v ${damage > 0 ? 'neg' : ''}`}>{damage}</span>
        </div>

        {done ? (
          <>
            {!run.destroyed && (
              <div className="kv">
                <span className="k">{t('quest.reward')}</span>
                <span className="v pos">
                  {fmt(run.reward + run.dangerPay)} {t('common.cr')}
                </span>
              </div>
            )}
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 14 }}
              onClick={finishEscort}
            >
              {t('encounter.action.continue')}
            </button>
          </>
        ) : (
          <button className="btn btn-sm warp-skip" onClick={skip}>
            {t('warp.skip')} »
          </button>
        )}
      </div>
    </div>
  )
}
