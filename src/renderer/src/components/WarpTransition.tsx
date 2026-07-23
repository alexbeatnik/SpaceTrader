import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { ShipArt } from './ShipArt'

// A cosmetic, skippable jump animation shown between systems so travel is not
// instantaneous. It renders warp streaks and the player's ship, then hands off
// to the store to surface any en-route encounter/event when it completes.
export function WarpTransition(): React.JSX.Element | null {
  const travel = useGameStore((s) => s.travel)
  const finishTravel = useGameStore((s) => s.finishTravel)
  const game = useGameStore((s) => s.game)
  const { t } = useI18n()
  const [progress, setProgress] = useState(0)
  const doneRef = useRef(false)

  const durationMs = travel?.durationMs ?? 2000

  // Pre-computed streak descriptors so they stay stable for the animation.
  const streaks = useMemo(
    () =>
      Array.from({ length: 46 }).map(() => ({
        top: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 0.5 + Math.random() * 0.9,
        width: 40 + Math.random() * 220,
        opacity: 0.25 + Math.random() * 0.6
      })),
    [travel?.toId]
  )

  useEffect(() => {
    if (!travel) return
    doneRef.current = false
    setProgress(0)
    const start = performance.now()
    let raf = 0
    const finish = (): void => {
      if (doneRef.current) return
      doneRef.current = true
      finishTravel()
    }
    const tick = (): void => {
      // Read the clock here so a single source drives progress (robust to any
      // rAF-timestamp origin differences across environments).
      const p = Math.min(1, (performance.now() - start) / durationMs)
      setProgress(p)
      if (p >= 1) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Hard fallback in case rAF is throttled (e.g. window not focused).
    const timer = window.setTimeout(finish, durationMs + 400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [travel, durationMs, finishTravel])

  if (!travel || !game) return null

  const skip = (): void => {
    if (doneRef.current) return
    doneRef.current = true
    finishTravel()
  }

  return (
    <div className="warp-overlay">
      <div className="warp-streaks">
        {streaks.map((s, i) => (
          <span
            key={i}
            className="warp-streak"
            style={{
              top: `${s.top}%`,
              width: `${s.width}px`,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`
            }}
          />
        ))}
      </div>

      <div className="warp-core">
        <div className="warp-route">
          <span className="warp-from">{travel.fromName}</span>
          <span className="warp-arrow">➜</span>
          <span className="warp-to">{travel.toName}</span>
        </div>

        <div className="warp-ship">
          <ShipArt type={travel.shipType} size={120} />
        </div>

        <div className="warp-sub">
          {travel.viaWormhole
            ? t('chart.viaWormhole')
            : `${travel.distance} ${t('common.pc')}`}{' '}
          · {t('common.day')} {game.day}
        </div>

        <div className="warp-progress">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="warp-caption">{t('warp.jumping')}</div>

        <button className="btn btn-sm warp-skip" onClick={skip}>
          {t('warp.skip')} »
        </button>
      </div>
    </div>
  )
}
