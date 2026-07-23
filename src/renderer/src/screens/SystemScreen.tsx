import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  POLITICS,
  TRADE_GOODS,
  GOOD_IDS,
  TECH_LEVEL_IDS,
  standardPrice
} from '@game/index'
import {
  techLevelName,
  politicsName,
  statusName,
  resourceName,
  economyName,
  goodName
} from '@i18n/index'
import { fmt } from '../util/format'

function StrengthBar({ value }: { value: number }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
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
  const { t } = useI18n()
  const sys = currentSystem(game)
  const gov = POLITICS[sys.politics]

  return (
    <div>
      <div className="screen-title">🪐 {sys.nameId}</div>
      <div className="screen-sub">
        {t('system.hereNow')} · {t('common.day')} {game.day}
      </div>

      <div className="grid grid-2">
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
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => setScreen('market')}>
              💱 {t('nav.market')}
            </button>
            <button className="btn" onClick={() => setScreen('chart')}>
              🗺️ {t('nav.chart')}
            </button>
          </div>
        </div>
      </div>

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
            {GOOD_IDS.map((id) => {
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
