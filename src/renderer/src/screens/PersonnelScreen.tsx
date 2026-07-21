import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  MERCENARIES,
  effectiveSkills,
  crewWages,
  freeQuarters
} from '@game/index'
import { mercName } from '@i18n/index'
import { fmt } from '../util/format'

function SkillRow({ m }: { m: { pilot: number; fighter: number; trader: number; engineer: number } }): React.JSX.Element {
  const { t } = useI18n()
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-dim)' }}>
      <span>{t('skill.pilot')} {m.pilot}</span>
      <span>{t('skill.fighter')} {m.fighter}</span>
      <span>{t('skill.trader')} {m.trader}</span>
      <span>{t('skill.engineer')} {m.engineer}</span>
    </div>
  )
}

export function PersonnelScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const hire = useGameStore((s) => s.hireMercenary)
  const fire = useGameStore((s) => s.fireMercenary)
  const { t } = useI18n()
  const sys = currentSystem(game)
  const available = sys.mercenaryId ? MERCENARIES[sys.mercenaryId] : null
  const eff = effectiveSkills(game)

  return (
    <div>
      <div className="screen-title">🧑‍🚀 {t('crew.title')}</div>
      <div className="screen-sub">
        {t('crew.wages')}: {fmt(crewWages(game))} {t('common.cr')} · {t('crew.quarters')}: {freeQuarters(game.ship)}
      </div>

      <div className="grid grid-2">
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 10 }}>{t('crew.hired')}</div>
          {game.ship.crew.length === 0 ? (
            <div className="muted">{t('crew.noneHired')}</div>
          ) : (
            game.ship.crew.map((id) => {
              const m = MERCENARIES[id]
              return (
                <div key={id} className="kv" style={{ alignItems: 'flex-start' }}>
                  <span className="k">
                    <div style={{ color: 'var(--text)', fontWeight: 600 }}>{mercName(id)}</div>
                    <SkillRow m={m.skills} />
                  </span>
                  <span className="v" style={{ textAlign: 'right' }}>
                    <div>{fmt(m.wage)} {t('common.cr')}/{t('common.day').toLowerCase()}</div>
                    <button className="btn btn-sm btn-danger" style={{ marginTop: 6 }} onClick={() => fire(id)}>
                      {t('crew.fire')}
                    </button>
                  </span>
                </div>
              )
            })
          )}

          <div className="screen-sub" style={{ margin: '18px 0 10px' }}>{t('crew.commanderSkills')}</div>
          <SkillRow m={eff} />
        </div>

        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 10 }}>{t('crew.roster')} · {sys.nameId}</div>
          {!available ? (
            <div className="muted">{t('crew.noneAvailable')}</div>
          ) : (
            <div className="kv" style={{ alignItems: 'flex-start' }}>
              <span className="k">
                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{mercName(available.id)}</div>
                <SkillRow m={available.skills} />
              </span>
              <span className="v" style={{ textAlign: 'right' }}>
                <div>{fmt(available.wage)} {t('common.cr')}/{t('common.day').toLowerCase()}</div>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: 6 }}
                  disabled={freeQuarters(game.ship) <= 0}
                  onClick={() => hire(available.id)}
                >
                  {t('crew.hire')}
                </button>
              </span>
            </div>
          )}
          {available && freeQuarters(game.ship) <= 0 && (
            <div className="screen-sub" style={{ marginTop: 8 }}>{t('crew.noQuarters')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
