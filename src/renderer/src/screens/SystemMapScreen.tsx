import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  currentBodyIndex,
  bodyMineSite,
  systemBodies,
  transitDaysTo,
  STATIONS,
  type SolarSystem,
  type StarClass,
  type SystemBody
} from '@game/index'
import { goodName, stationName, terrainName, starClassName, gadgetName, weaponName, shieldName } from '@i18n/index'
import { bodyDisplayName } from '../util/bodyText'

const VIEW_W = 720
const VIEW_H = 380
/** Innermost orbit ring radius, and the gap between successive rings. */
const ORBIT_BASE = 46
const ORBIT_STEP = 33

/** Star colours, warmest to coolest. */
const STAR_COLOR: Record<StarClass, string> = {
  blue: '#8fd3ff',
  white: '#eaf2ff',
  yellow: '#ffd76a',
  orange: '#ffab5c',
  red: '#ff7a6a'
}

/** Stations are the grey dots: no atmosphere, no colour, just metal. */
const STATION_COLOR = '#9aa3b8'

function bodyColor(body: SystemBody): string {
  if (body.kind === 'station') return STATION_COLOR
  if (body.kind === 'planet') return '#4fd1ff'
  switch (body.terrain) {
    case 'gasGiant':
      return '#c9a26d'
    case 'iceMoon':
      return '#a9e4f2'
    case 'lavaWorld':
      return '#e2714f'
    case 'asteroidBelt':
      return '#8b7f6b'
    default:
      return '#6f7590'
  }
}

function bodyRadius(body: SystemBody): number {
  if (body.kind === 'planet') return 11
  if (body.kind === 'station') return 6
  return body.terrain === 'gasGiant' ? 10 : 7
}

export function SystemMapScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const setScreen = useGameStore((s) => s.setScreen)
  const flyToBody = useGameStore((s) => s.flyToBody)
  const enterWormhole = useGameStore((s) => s.enterWormhole)
  const { t } = useI18n()

  const sys = currentSystem(game)
  const bodies = systemBodies(sys)
  const hereIndex = currentBodyIndex(game)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = selectedId !== null ? bodies[selectedId] : null

  const cx = VIEW_W / 2
  const cy = VIEW_H / 2
  const starColor = STAR_COLOR[sys.starClass ?? 'yellow']

  const position = (body: SystemBody): { x: number; y: number } => {
    const r = ORBIT_BASE + (body.orbit - 1) * ORBIT_STEP
    const a = body.angle * Math.PI * 2
    // Squashed vertically so the system reads as a plane seen at an angle.
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.52 }
  }

  const transitDays = selected ? transitDaysTo(game, selected.id) : 0

  return (
    <div>
      <div className="screen-title">🛰️ {sys.nameId} · {t('systemMap.title')}</div>
      <div className="screen-sub">
        {t('systemMap.star', { class: starClassName(sys.starClass ?? 'yellow') })} ·{' '}
        {t('systemMap.bodies', { count: bodies.length })} · {t('common.day')} {game.day}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="chart-canvas-wrap">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ display: 'block' }}>
            {/* orbit rings */}
            {bodies.map((body) => (
              <ellipse
                key={`o-${body.id}`}
                cx={cx}
                cy={cy}
                rx={ORBIT_BASE + (body.orbit - 1) * ORBIT_STEP}
                ry={(ORBIT_BASE + (body.orbit - 1) * ORBIT_STEP) * 0.52}
                fill="none"
                stroke="rgba(139,149,196,0.18)"
                strokeWidth={1}
              />
            ))}

            {/* the star */}
            <circle cx={cx} cy={cy} r={30} fill={starColor} opacity={0.18} />
            <circle cx={cx} cy={cy} r={18} fill={starColor} opacity={0.35} />
            <circle cx={cx} cy={cy} r={11} fill={starColor} />

            {bodies.map((body) => {
              const p = position(body)
              const isHere = body.id === hereIndex
              const isSel = body.id === selectedId
              const r = bodyRadius(body)
              return (
                <g
                  key={body.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(body.id)}
                >
                  {isSel && (
                    <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke="#fff" strokeWidth={1.5} />
                  )}
                  {isHere && (
                    <circle
                      className="quest-ring"
                      cx={p.x}
                      cy={p.y}
                      r={r + 9}
                      fill="none"
                      stroke="#38e08a"
                      strokeWidth={1.6}
                      strokeDasharray="3 3"
                    />
                  )}
                  {body.kind === 'station' ? (
                    <rect
                      x={p.x - r}
                      y={p.y - r}
                      width={r * 2}
                      height={r * 2}
                      fill={STATION_COLOR}
                      transform={`rotate(45 ${p.x} ${p.y})`}
                    />
                  ) : (
                    <circle cx={p.x} cy={p.y} r={r} fill={bodyColor(body)} />
                  )}
                  {bodyMineSite(sys, body) && (
                    <text x={p.x + r + 2} y={p.y - r} fontSize={10}>
                      ⛏
                    </text>
                  )}
                  <text
                    x={p.x}
                    y={p.y + r + 13}
                    fontSize={10}
                    textAnchor="middle"
                    fill={isHere ? '#38e08a' : body.kind === 'station' ? STATION_COLOR : '#8b95c4'}
                  >
                    {bodyDisplayName(sys.nameId, body)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="panel panel-pad">
          {!selected ? (
            <>
              <div className="muted">{t('systemMap.select')}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                {t('systemMap.noWarp')}
              </div>
            </>
          ) : (
            <div>
              <div className="screen-title" style={{ fontSize: 18 }}>
                {bodyDisplayName(sys.nameId, selected)}
              </div>
              <div className="badge" style={{ marginBottom: 10 }}>
                {selected.kind === 'station'
                  ? stationName(selected.station ?? 'science')
                  : selected.kind === 'planet'
                    ? t('body.capital')
                    : terrainName(selected.terrain ?? 'rockyMoon')}
              </div>

              <div className="kv">
                <span className="k">{t('systemMap.orbit', { n: selected.orbit })}</span>
                <span className="v">
                  {selected.id === hereIndex ? (
                    <span className="badge ok">{t('systemMap.dockedHere')}</span>
                  ) : (
                    t('systemMap.transit', { days: transitDays })
                  )}
                </span>
              </div>

              <div className="screen-sub" style={{ margin: '14px 0 6px' }}>
                {t('systemMap.services')}
              </div>
              <BodyServices sys={sys} body={selected} />

              {selected.id !== hereIndex && (
                <button
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    flyToBody(selected.id)
                    setSelectedId(null)
                  }}
                >
                  🚀 {t('systemMap.setCourse')} · {t('systemMap.transit', { days: transitDays })}
                </button>
              )}

              {selected.kind === 'station' && (
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  {t(`station.blurb.${selected.station ?? 'science'}`)}
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-block"
            style={{ marginTop: 16 }}
            onClick={() => setScreen('chart')}
          >
            🗺️ {t('systemMap.toChart')}
          </button>

          {sys.unstableWormhole && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(160,107,255,0.1)',
                border: '1px solid rgba(160,107,255,0.35)'
              }}
            >
              <div className="badge" style={{ marginBottom: 6 }}>
                🌀 {t('system.unstableWormhole')}
              </div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                {t('system.unstableWormholeHint')}
              </div>
              <button className="btn btn-block" onClick={() => enterWormhole()}>
                {t('system.enterWormhole')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** What a place in the system actually offers a captain who lands on it. */
function BodyServices({ sys, body }: { sys: SolarSystem; body: SystemBody }): React.JSX.Element {
  const { t } = useI18n()
  const lines: string[] = []
  const mine = bodyMineSite(sys, body)

  if (body.kind === 'planet') {
    lines.push(
      t('systemMap.service.market'),
      t('systemMap.service.shipyard'),
      t('systemMap.service.bank'),
      t('systemMap.service.hall'),
      t('systemMap.service.board')
    )
  }
  if (body.kind === 'station') {
    lines.push(t('systemMap.service.shipyard'), t('systemMap.service.stationCatalog'))
  }
  if (mine) {
    lines.push(
      t('systemMap.service.mine', {
        resource: mine.resource === 'fuel' ? t('hud.fuel') : goodName(mine.resource)
      })
    )
  }
  if (lines.length === 0) lines.push(t('systemMap.service.none'))

  const station = body.kind === 'station' ? STATIONS[body.station ?? 'science'] : null

  return (
    <div>
      {lines.map((line) => (
        <div key={line} className="muted" style={{ fontSize: 13 }}>
          · {line}
        </div>
      ))}
      {station && (
        <div style={{ marginTop: 8 }}>
          {[
            ...station.weapons.map(weaponName),
            ...station.shields.map(shieldName),
            ...station.gadgets.map(gadgetName)
          ].map((name) => (
            <div key={name} style={{ fontSize: 12 }}>
              ✦ {name}
            </div>
          ))}
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {t('station.hullUpgrades', { max: station.maxHullUpgrades })}
          </div>
          {station.repairCostMul < 1 && (
            <div className="muted" style={{ fontSize: 12 }}>
              {t('station.repairDiscount', { percent: Math.round(station.repairCostMul * 100) })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
