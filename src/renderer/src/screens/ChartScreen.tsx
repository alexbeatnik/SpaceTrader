import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  systemDistance,
  maxRange,
  POLITICS,
  GOOD_IDS,
  TECH_LEVEL_IDS,
  GALAXY_WIDTH,
  GALAXY_HEIGHT,
  wormholeTax,
  questSupplyMissing
} from '@game/index'
import {
  politicsName,
  techLevelName,
  statusName,
  economyName,
  goodName
} from '@i18n/index'
import { fmt } from '../util/format'
import { questTypeLabel } from '../util/questText'
import { useMediaQuery, PHONE_PORTRAIT } from '../hooks/useMediaQuery'

const VIEW_W = 760
const VIEW_H = Math.round((VIEW_W * GALAXY_HEIGHT) / GALAXY_WIDTH)
const SCALE = VIEW_W / GALAXY_WIDTH

export function ChartScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const warpTo = useGameStore((s) => s.warpTo)
  const { t } = useI18n()
  const here = currentSystem(game)
  const range = maxRange(game)

  /**
   * How much bigger the markers are drawn than the map they sit on.
   *
   * The galaxy is wider than it is tall, so on a phone held upright the map can
   * only ever be as large as the screen is wide — about half its desktop size.
   * Everything inside scaled down with it, which left the system dots around
   * two pixels across: too small to read, and far too small to put a thumb on.
   * The map's extent is fixed by the galaxy's proportions, so the markers grow
   * instead.
   */
  const compact = useMediaQuery(PHONE_PORTRAIT)
  const markerScale = compact ? 2.2 : 1
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Active quests: their destination systems get a marker on the map. A marker
  // is dimmed while the supplies needed for hand-in are not (yet) in the hold.
  const activeQuests = game.quests.filter((q) => q.status === 'active')
  const questReadyAt = new Map<number, boolean>()
  for (const q of activeQuests) {
    const ready = questSupplyMissing(game, q) === 0
    questReadyAt.set(q.targetSystem, (questReadyAt.get(q.targetSystem) ?? false) || ready)
  }

  const selected = selectedId !== null ? game.systems[selectedId] : null
  const selectedQuests = selected ? activeQuests.filter((q) => q.targetSystem === selected.id) : []
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

      <div className="grid grid-split">
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
            {/* unmapped wormholes: a swirl with no line, because it goes nowhere
                in particular until someone falls into it */}
            {game.systems.map((sys) =>
              sys.unstableWormhole && (sys.visited || sys.id === here.id) ? (
                <circle
                  key={`u-${sys.id}`}
                  className="quest-ring"
                  cx={sys.x * SCALE}
                  cy={sys.y * SCALE}
                  r={8}
                  fill="none"
                  stroke="rgba(190,120,255,0.8)"
                  strokeWidth={1.3}
                  strokeDasharray="2 3"
                />
              ) : null
            )}
            {/* systems */}
            {game.systems.map((sys) => {
              const reachable = systemDistance(here, sys) <= game.ship.fuel && sys.id !== here.id
              const isHere = sys.id === here.id
              const isSel = sys.id === selectedId
              const isQuest = questReadyAt.has(sys.id)
              const questDim = isQuest && !questReadyAt.get(sys.id)
              const r = (isHere ? 6 : 4) * markerScale
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
                  {/*
                    Labels sit inside the clickable group, so a name reaching
                    over a neighbouring star was swallowing that star's taps —
                    selecting the system you were trying to steer away from.
                    Magnifying them for phones made it routine rather than
                    occasional. Only the markers should answer a tap.
                  */}
                  {isQuest && (
                    <circle
                      className="quest-ring"
                      cx={sys.x * SCALE}
                      cy={sys.y * SCALE}
                      r={r + 6 * markerScale}
                      fill="none"
                      stroke="#ffc04a"
                      strokeWidth={1.6 * markerScale}
                      strokeDasharray="3 3"
                      opacity={questDim ? 0.3 : 1}
                    />
                  )}
                  {isSel && (
                    <circle cx={sys.x * SCALE} cy={sys.y * SCALE} r={r + 5 * markerScale} fill="none" stroke="#fff" strokeWidth={1.5 * markerScale} />
                  )}
                  <circle cx={sys.x * SCALE} cy={sys.y * SCALE} r={r} fill={color} />
                  {isQuest && (
                    <text
                      x={sys.x * SCALE}
                      y={sys.y * SCALE - r - 6 * markerScale}
                      fontSize={11 * markerScale}
                      textAnchor="middle"
                      opacity={questDim ? 0.35 : 1}
                      style={{ pointerEvents: 'none' }}
                    >
                      📋
                    </text>
                  )}
                  {/*
                    Names are dropped for merely-visited systems on a phone.
                    The labels are magnified along with the markers, and two
                    neighbouring stars then print straight through each other —
                    "Mordan" and "Tashkent" came out as one unreadable word.
                    Here, selected and quest targets are the ones worth naming
                    unprompted; any other system gives its name when tapped.
                  */}
                  {(isHere || isSel || isQuest || (sys.visited && !compact)) && (
                    <text
                      x={sys.x * SCALE + r + 3 * markerScale}
                      y={sys.y * SCALE + 3 * markerScale}
                      fontSize={9 * markerScale}
                      fill={isHere ? '#4fd1ff' : isQuest ? '#ffc04a' : '#8b95c4'}
                      opacity={questDim ? 0.5 : 1}
                      style={{ pointerEvents: 'none' }}
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

              {selectedQuests.length > 0 && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,192,74,0.08)',
                    border: '1px solid rgba(255,192,74,0.3)'
                  }}
                >
                  <div className="badge warn" style={{ marginBottom: 8 }}>
                    📋 {t('chart.questHere')}
                  </div>
                  {selectedQuests.map((q) => (
                    <div key={q.id} style={{ marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{questTypeLabel(q)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {t('quest.takenAt', {
                          system: game.systems[q.giverSystem]?.nameId ?? '—'
                        })}{' '}
                        · {fmt(q.reward)} {t('common.cr')}
                      </div>
                    </div>
                  ))}
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
                    <span className="k">{t('system.economy')}</span>
                    <span className="v">{economyName(selected.economyType)}</span>
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
                  {selected.unstableWormhole && (
                    <div className="kv">
                      <span className="k">{t('system.unstableWormhole')}</span>
                      <span className="v"><span className="badge">🌀</span></span>
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
                  <div className="screen-sub" style={{ marginBottom: 6 }}>{t('chart.priceTable')}</div>
                  <div className="chart-price-wrap">
                    <table className="chart-price-table">
                      <thead>
                        <tr>
                          <th>{t('market.good')}</th>
                          <th className="num">{t('chart.buyCol')}</th>
                          <th className="num">{t('chart.sellCol')}</th>
                          <th className="num" title={t('chart.marginHint')}>{t('chart.margin')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GOOD_IDS.filter(
                          (id) => selected.buyPrice[id] > 0 || selected.sellPrice[id] > 0
                        ).map((id) => {
                          const buyP = selected.buyPrice[id]
                          const sellP = selected.sellPrice[id]
                          const hereBuy = here.buyPrice[id]
                          // Profit per unit: buy at the current system, sell here.
                          const margin =
                            selected.id !== here.id && sellP > 0 && hereBuy > 0
                              ? sellP - hereBuy
                              : null
                          return (
                            <tr key={id}>
                              <td>{goodName(id)}</td>
                              <td className="num">{buyP > 0 ? fmt(buyP) : '—'}</td>
                              <td className="num">{sellP > 0 ? fmt(sellP) : '—'}</td>
                              <td
                                className={`num ${
                                  margin === null ? 'muted' : margin > 0 ? 'pos' : margin < 0 ? 'neg' : ''
                                }`}
                              >
                                {margin === null ? '—' : (margin > 0 ? '+' : '') + fmt(margin)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selected.id !== here.id && (
                    <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>
                      {t('chart.marginHint')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
