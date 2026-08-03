import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  currentBody,
  currentBodyIndex,
  currentMineSite,
  atCapital,
  systemBodies,
  POLITICS,
  TRADE_GOODS,
  GOOD_IDS,
  isSpecialGood,
  TECH_LEVEL_IDS,
  standardPrice,
  systemNews
} from '@game/index'
import {
  techLevelName,
  politicsName,
  statusName,
  resourceName,
  economyName,
  goodName,
  stationName,
  terrainName,
  renderMessage
} from '@i18n/index'
import { fmt } from '../util/format'
import { bodyDisplayName } from '../util/bodyText'

function StrengthBar({ value }: { value: number }): React.JSX.Element {
  return (
    <div className="row" style={{ gap: 2 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 8,
            borderRadius: 2,
            background: i < value ? 'var(--accent)' : 'rgba(255,255,255,0.08)'
          }}
        />
      ))}
    </div>
  )
}

export function SystemScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const setScreen = useGameStore((s) => s.setScreen)
  const startMining = useGameStore((s) => s.startMining)
  const flyToBody = useGameStore((s) => s.flyToBody)
  const enterWormhole = useGameStore((s) => s.enterWormhole)
  const { t } = useI18n()
  const sys = currentSystem(game)
  const gov = POLITICS[sys.politics]
  // Mining follows the ship: the belt out in the system, not just the planet.
  const mine = currentMineSite(game)
  const here = currentBody(game)
  const docked = atCapital(game)
  const news = systemNews(sys)

  return (
    <div>
      <div className="screen-title">🪐 {sys.nameId}</div>
      <div className="screen-sub">
        {docked
          ? t('system.hereNow')
          : t('systemMap.awayFromPort', {
              place: bodyDisplayName(sys.nameId, here)
            })}{' '}
        · {t('common.day')} {game.day}
      </div>

      {!docked && (
        <div className="panel panel-pad" style={{ marginTop: 12 }}>
          <div className="row-wrap" style={{ gap: 14 }}>
            <span style={{ fontSize: 26 }}>{here?.kind === 'station' ? '🛰️' : '🪨'}</span>
            <div className="col-fill" style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 600 }}>
                {here?.kind === 'station'
                  ? stationName(here.station ?? 'science')
                  : terrainName(here?.terrain ?? 'rockyMoon')}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {here?.kind === 'station' ? t('station.noMarket') : t('body.barrenBlurb')}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => flyToBody(0)}>
              🚀 {t('systemMap.returnToPort')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <div className="panel panel-pad">
          <div className="kv">
            <span className="k">{t('system.techLevel')}</span>
            <span className="v">{techLevelName(TECH_LEVEL_IDS[sys.techLevel])}</span>
          </div>
          <div className="kv">
            <span className="k">{t('system.government')}</span>
            <span className="v">{politicsName(sys.politics)}</span>
          </div>
          <div className="kv">
            <span className="k">{t('system.economy')}</span>
            <span className="v"><span className="badge">{economyName(sys.economyType)}</span></span>
          </div>
          <div className="kv">
            <span className="k">{t('system.resource')}</span>
            <span className="v">
              {sys.specialResource === 'none'
                ? t('system.noSpecialResource')
                : resourceName(sys.specialResource)}
            </span>
          </div>
          <div className="kv">
            <span className="k">{t('system.status')}</span>
            <span className="v">
              {sys.status === 'uneventful' ? (
                statusName(sys.status)
              ) : (
                <span className="badge warn">{statusName(sys.status)}</span>
              )}
            </span>
          </div>
          {sys.wormholeTo !== null && (
            <div className="kv">
              <span className="k">{t('system.wormhole')}</span>
              <span className="v">
                <span className="badge">{game.systems[sys.wormholeTo].nameId}</span>
              </span>
            </div>
          )}
          {sys.unstableWormhole && (
            <div className="kv">
              <span className="k">{t('system.unstableWormhole')}</span>
              <span className="v">
                <button className="btn btn-sm" onClick={() => enterWormhole()}>
                  🌀 {t('system.enterWormhole')}
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="panel panel-pad">
          <div className="kv">
            <span className="k">{t('system.police')}</span>
            <span className="v"><StrengthBar value={gov.strengthPolice} /></span>
          </div>
          <div className="kv">
            <span className="k">{t('system.pirates')}</span>
            <span className="v"><StrengthBar value={gov.strengthPirates} /></span>
          </div>
          <div className="kv">
            <span className="k">{t('system.traders')}</span>
            <span className="v"><StrengthBar value={gov.strengthTraders} /></span>
          </div>
          <div className="kv">
            <span className="k">{t('systemMap.bodies', { count: systemBodies(sys).length })}</span>
            <span className="v">
              {docked ? t('body.capital') : `#${currentBodyIndex(game)}`}
            </span>
          </div>
          <div className="row-wrap" style={{ marginTop: 16, gap: 10 }}>
            <button
              className="btn btn-primary"
              disabled={!docked}
              onClick={() => setScreen('market')}
            >
              💱 {t('nav.market')}
            </button>
            <button className="btn" onClick={() => setScreen('systemMap')}>
              🛰️ {t('system.openSystemMap')}
            </button>
            <button className="btn" onClick={() => setScreen('chart')}>
              🗺️ {t('nav.chart')}
            </button>
          </div>
        </div>
      </div>

      {news.length > 0 && (
        <div className="panel panel-pad" style={{ marginTop: 16 }}>
          <div className="screen-sub" style={{ marginBottom: 10 }}>📰 {t('system.news')}</div>
          {news.map((item) => (
            <div key={item.id} className={`news-item news-${item.tone}`}>
              <div className="news-headline">{t(item.headlineKey)}</div>
              <div className="news-body">{renderMessage(item.bodyKey, item.params)}</div>
            </div>
          ))}
        </div>
      )}

      {mine && (
        <div className="panel panel-pad" style={{ marginTop: 16 }}>
          <div className="row" style={{ gap: 14 }}>
            <span style={{ fontSize: 30 }}>
              {mine.kind === 'asteroidField' ? '☄️' : mine.kind === 'gasGiant' ? '🪐' : '🧊'}
            </span>
            <div className="col-fill">
              <div style={{ fontWeight: 600 }}>{t(`mining.kind.${mine.kind}`)}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t('mining.yields', {
                  resource: mine.resource === 'fuel' ? t('hud.fuel') : goodName(mine.resource)
                })}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => startMining()}>
              ⛏️ {t('mining.start')}
            </button>
          </div>
        </div>
      )}

      <div className="panel panel-pad" style={{ marginTop: 16 }}>
        <div className="screen-sub" style={{ marginBottom: 10 }}>{t('market.avgPrice')}</div>
        <table>
          <thead>
            <tr>
              <th>{t('market.good')}</th>
              <th className="num">{t('market.avgPrice')}</th>
              <th className="num">{t('market.buyPrice')}</th>
              <th className="num">{t('market.sellPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {GOOD_IDS.filter(
              (id) => !isSpecialGood(id) || sys.buyPrice[id] > 0 || sys.sellPrice[id] > 0
            ).map((id) => {
              const good = TRADE_GOODS[id]
              const avg = standardPrice(good, sys)
              return (
                <tr key={id} className="row-hover">
                  <td>
                    {goodName(id)}
                    {good.illegal && <span className="illegal-tag">{t('market.illegal')}</span>}
                  </td>
                  <td className="num muted">{avg > 0 ? fmt(avg) : '—'}</td>
                  <td className="num">{sys.buyPrice[id] > 0 ? fmt(sys.buyPrice[id]) : '—'}</td>
                  <td className="num">{sys.sellPrice[id] > 0 ? fmt(sys.sellPrice[id]) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
