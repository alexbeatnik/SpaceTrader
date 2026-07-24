import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { goodName } from '@i18n/index'

const KIND_EMOJI: Record<string, string> = {
  asteroidField: '☄️',
  gasGiant: '🪐',
  iceField: '🧊'
}

// A timed, skippable mining operation: one unit is extracted per cycle
// (~30s), with a chance raiders interrupt it (handled by the store's mineTick).
export function MiningOverlay(): React.JSX.Element | null {
  const mining = useGameStore((s) => s.mining)
  const mineTick = useGameStore((s) => s.mineTick)
  const stopMining = useGameStore((s) => s.stopMining)
  const { t } = useI18n()
  const [progress, setProgress] = useState(0)
  const [count, setCount] = useState(0)
  const countRef = useRef(0)

  const unitMs = mining?.unitMs ?? 30000

  useEffect(() => {
    if (!mining) return
    setProgress(0)
    // A new operation starts from nothing: without this the tally carried over
    // and the second site opened claiming the first one's haul.
    countRef.current = 0
    setCount(0)
    let raf = 0
    let start = performance.now()
    let cancelled = false
    const tick = (): void => {
      if (cancelled) return
      const p = Math.min(1, (performance.now() - start) / unitMs)
      setProgress(p)
      if (p >= 1) {
        mineTick()
        // The store may have ended the session (raiders / full hold).
        if (!useGameStore.getState().mining) {
          cancelled = true
          return
        }
        countRef.current += 1
        setCount(countRef.current)
        start = performance.now()
        setProgress(0)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [mining, unitMs, mineTick])

  if (!mining) return null

  const label = mining.resource === 'fuel' ? t('hud.fuel') : goodName(mining.resource)
  const secsLeft = Math.max(0, Math.ceil((unitMs * (1 - progress)) / 1000))

  return (
    <div className="warp-overlay">
      <div className="warp-core">
        <div className="warp-route">
          <span className="warp-arrow">{KIND_EMOJI[mining.kind] ?? '⛏️'}</span>
          <span className="warp-to">{t(`mining.kind.${mining.kind}`)}</span>
        </div>

        <div className="mining-rock">{KIND_EMOJI[mining.kind] ?? '⛏️'}</div>

        <div className="warp-sub">
          {t('mining.extracting', { resource: label })} · {secsLeft}s
        </div>

        <div className="warp-progress">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="warp-caption">
          {t('mining.session')}: {count} × {label}
        </div>

        <button className="btn btn-sm warp-skip" onClick={stopMining}>
          ⏹ {t('mining.stop')}
        </button>
      </div>
    </div>
  )
}
