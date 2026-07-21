import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  systemDistance,
  maxRange,
  POLITICS,
  TRADE_GOODS,
  GOOD_IDS,
  TECH_LEVEL_IDS,
  standardPrice,
  GALAXY_WIDTH,
  GALAXY_HEIGHT,
  wormholeTax
} from '@game/index'
import {
  politicsName,
  techLevelName,
  statusName,
  goodName
} from '@i18n/index'
import { fmt } from '../util/format'

const VIEW_W = 760
const VIEW_H = Math.round((VIEW_W * GALAXY_HEIGHT) / GALAXY_WIDTH)
const SCALE = VIEW_W / GALAXY_WIDTH

export function ChartScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const warpTo = useGameStore((s) => s.warpTo)
  const { t } = useI18n()
  const here = currentSystem(game)
  const range = maxRange(game)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selected = selectedId !== null ? game.systems[selectedId] : null
  const selDist = selected ? systemDistance(here, selected) : 0
  const viaWormhole = selected ? here.wormholeTo === selected.id : false
  const canWarp = selected
    ? viaWormhole
      ? game.credits >= wormholeTax(game)
      : selDist <= game.ship.fuel
    : false

  return (
    <div>
      <div className="screen-title">🗺️ {t('chart.title')}</div>
      <div className="screen-sub">
        {t('chart.range')}: {range} {t('common.pc')} · {t('hud.fuel')}: {game.ship.fuel}/{range}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="chart-canvas-wrap">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ display: 'block' }}>
            {/* fuel range ring */}
            <circle
              cx={here.x * SCALE}
              cy={here.y * SCALE}
              r={game.ship.fuel * SCALE}
              fill="rgba(79,209,255,0.06)"
              stroke="rgba(79,209,255,0.35)"
              strokeDasharray="4 4"
            />
            {/* wormhole links */}
            {game.systems.map((sys) =>
              sys.wormholeTo !== null && sys.id < sys.wormholeTo ? (
                <line
                  key={`w-${sys.id}`}
                  x1={sys.x * SCALE}
                  y1={sys.y * SCALE}
                  x2={game.systems[sys.wormholeTo].x * SCALE}
                  y2={game.systems[sys.wormholeTo].y * SCALE}
                  stroke="rgba(160,107,255,0.4)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
              ) : null
            )}
            {/* systems */}
            {game.systems.map((sys) => {
              const reachable = systemDistance(here, sys) <= game.ship.fuel && sys.id !== here.id
              const isHere = sys.id === here.id
              const isSel = sys.id === selectedId
              const r = isHere ? 6 : 4
              const color = isHere
                ? '#4fd1ff'
                : reachable
                  ? '#38e08a'
                  : sys.visited
                    ? '#8b95c4'
                    : '#3a4270'
              return (
                <g
                  key={sys.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(sys.id)}
                >
                  {isSel && (
                    <circle cx={sys.x * SCALE} cy={sys.y * SCALE} r={r + 5} fill="none" stroke="#fff" strokeWidth={1.5} />
                  )}
                  <circle cx={sys.x * SCALE} cy={sys.y * SCALE} r={r} fill={color} />
                  {(isHere || sys.visited || isSel) && (
                    <text
                      x={sys.x * SCALE + r + 3}
                      y={sys.y * SCALE + 3}
                      fontSize={9}
                      fill={isHere ? '#4fd1ff' : '#8b95c4'}
                    >
                      {sys.nameId}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className="panel panel-pad">
          {!selected ? (
            <div className="muted">{t('chart.selectTarget')}</div>
          ) : (
            <div>
              <div className="screen-title" style={{ fontSize: 18 }}>{selected.nameId}</div>
              {selected.id === here.id ? (
                <div className="badge" style={{ marginBottom: 10 }}>{t('system.hereNow')}</div>
              ) : (
                <div className="badge" style={{ marginBottom: 10 }}>
                  {viaWormhole ? t('chart.viaWormhole') : `${selDist} ${t('common.pc')}`}
                </div>
              )}

              {selected.visited ? (
                <>
                  <div className="kv">
                    <span className="k">{t('system.techLevel')}</span>
                    <span className="v">{techLevelName(TECH_LEVEL_IDS[selected.techLevel])}</span>
                  </div>
                  <div className="kv">
                    <span className="k">{t('system.government')}</span>
                    <span className="v">{politicsName(selected.politics)}</span>
                  </div>
                  <div className="kv">
                    <span className="k">{t('system.pirates')}</span>
                    <span className="v">{POLITICS[selected.politics].strengthPirates}/7</span>
                  </div>
                  {selected.status !== 'uneventful' && (
                    <div className="kv">
                      <span className="k">{t('system.status')}</span>
                      <span className="v"><span className="badge warn">{statusName(selected.status)}</span></span>
                    </div>
                  )}
                </>
              ) : (
                <div className="muted" style={{ marginBottom: 10 }}>{t('chart.unvisited')}</div>
              )}

              {selected.id !== here.id && (
                <>
                  {viaWormhole && (
                    <div className="kv">
                      <span className="k">{t('chart.wormholeTax')}</span>
                      <span className="v">{fmt(wormholeTax(game))} {t('common.cr')}</span>
                    </div>
                  )}
                  {!viaWormhole && (
                    <div className="kv">
                      <span className="k">{t('chart.fuelNeeded')}</span>
                      <span className={`v ${selDist <= game.ship.fuel ? 'pos' : 'neg'}`}>
                        {selDist} {t('common.pc')}
                      </span>
                    </div>
                  )}
                  <button
                    className="btn btn-primary btn-block"
                    style={{ marginTop: 14 }}
                    disabled={!canWarp}
                    onClick={() => {
                      warpTo(selected.id)
                      setSelectedId(null)
                    }}
                  >
                    ⚡ {t('chart.warp')}
                  </button>
                  {!canWarp && (
                    <div className="screen-sub" style={{ marginTop: 8 }}>{t('chart.outOfRange')}</div>
                  )}
                </>
              )}

              {selected.visited && (
                <div style={{ marginTop: 14 }}>
                  <div className="screen-sub" style={{ marginBottom: 4 }}>{t('market.avgPrice')}</div>
                  {GOOD_IDS.filter((id) => standardPrice(TRADE_GOODS[id], selected) > 0)
                    .slice(0, 6)
                    .map((id) => (
                      <div className="kv" key={id} style={{ padding: '3px 0' }}>
                        <span className="k">{goodName(id)}</span>
                        <span className="v">{fmt(standardPrice(TRADE_GOODS[id], selected))}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
