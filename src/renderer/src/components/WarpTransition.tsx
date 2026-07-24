import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { ShipArt } from './ShipArt'

// The jump animation shown between systems so travel is not instantaneous. It
// renders warp streaks and the player's ship, then hands off to the store to
// surface any en-route encounter/event when it completes. Deliberately not
// skippable: a jump takes as long as it takes.
export function WarpTransition(): React.JSX.Element | null {
  const travel = useGameStore((s) => s.travel)
  const finishTravel = useGameStore((s) => s.finishTravel)
  const interceptTravel = useGameStore((s) => s.interceptTravel)
  const encounter = useGameStore((s) => s.encounter)
  const gameOver = useGameStore((s) => s.gameOver)
  const game = useGameStore((s) => s.game)
  const { t } = useI18n()
  const [progress, setProgress] = useState(0)
  // Distance covered, tracked in a ref as well as state: the state value is a
  // render behind, and resuming after a fight needs the live figure.
  const progressRef = useRef(0)
  const doneRef = useRef(false)
  // How many of the leg's interception points have already been played out.
  const metRef = useRef(0)

  const durationMs = travel?.durationMs ?? 2000
  // Stable identity so the flight effect is not torn down every render.
  const points = useMemo(() => travel?.interceptPoints ?? [], [travel])
  // Hold station while the fight is on; the rest of the leg waits.
  const halted = !!encounter || gameOver

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

  // A fresh jump resets the run. Runs before the flight effect below, so that
  // one always picks up a zeroed distance rather than the last jump's.
  useEffect(() => {
    if (!travel) return
    doneRef.current = false
    metRef.current = 0
    progressRef.current = 0
    setProgress(0)
  }, [travel])

  // Fly the leg. While an encounter is up the loop is torn down entirely, then
  // set up again from wherever the ship was when it got jumped.
  useEffect(() => {
    if (!travel || halted || doneRef.current) return
    // Resume from the distance already covered rather than starting over.
    const startProgress = progressRef.current
    const remainingMs = Math.max(0, durationMs * (1 - startProgress))
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
      const elapsed = performance.now() - start
      const p = Math.min(1, startProgress + (remainingMs > 0 ? elapsed / durationMs : 1))
      progressRef.current = p
      setProgress(p)
      // Somebody is waiting out here: stop the clock and let the fight happen.
      // Several may be strung along one leg, so this can fire more than once.
      const next = points[metRef.current]
      if (next !== undefined && p >= next) {
        metRef.current++
        // Halt only if somebody actually turned up; otherwise keep flying, so a
        // mismatched queue can never leave the jump frozen in place.
        if (interceptTravel()) return
      }
      if (p >= 1) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Hard fallback in case rAF is throttled (e.g. window not focused).
    const timer = window.setTimeout(finish, remainingMs + 400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [travel, halted, durationMs, points, finishTravel, interceptTravel])

  if (!travel || !game) return null

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
      </div>
    </div>
  )
}
