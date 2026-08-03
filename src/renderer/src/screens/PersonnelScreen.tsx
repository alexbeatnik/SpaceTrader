import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  MERCENARIES,
  ROBOTS,
  CREW_ROLES,
  effectiveSkills,
  crewWages,
  freeQuarters,
  assignRoles,
  crewCount,
  crewRoster,
  crewLoad,
  crewRepairPerDay,
  minCrew,
  recommendedCrew,
  roleRisk,
  robotsForSale,
  robotsPowered,
  shipRobots,
  ROBOT_FUEL_PER_DAY,
  type Skills,
  type CrewRole
} from '@game/index'
import { mercName } from '@i18n/index'
import { fmt } from '../util/format'

function SkillRow({ m }: { m: Skills }): React.JSX.Element {
  const { t } = useI18n()
  return (
    <div className="skill-tags">
      <span>{t('skill.pilot')} {m.pilot}</span>
      <span>{t('skill.fighter')} {m.fighter}</span>
      <span>{t('skill.trader')} {m.trader}</span>
      <span>{t('skill.engineer')} {m.engineer}</span>
      <span>{t('skill.electrician')} {m.electrician}</span>
    </div>
  )
}

export function PersonnelScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const hire = useGameStore((s) => s.hireMercenary)
  const fire = useGameStore((s) => s.fireMercenary)
  const buyRobot = useGameStore((s) => s.buyRobot)
  const sellRobot = useGameStore((s) => s.sellRobot)
  const { t } = useI18n()
  const sys = currentSystem(game)
  const eff = effectiveSkills(game)
  const posts = assignRoles(game)
  const roster = crewRoster(game)
  const robots = shipRobots(game)
  const forSale = robotsForSale(game)
  const heads = crewCount(game)
  const required = minCrew(game)
  const advised = recommendedCrew(game)
  const short = heads < required
  const powered = robotsPowered(game)

  const handName = (role: CrewRole): string => {
    const hand = posts[role].hand
    if (!hand) return t('crew.unmanned')
    if (hand.kind === 'commander') return t('crew.commander')
    if (hand.kind === 'robot') return t(`robot.${hand.id}`)
    return mercName(hand.id)
  }

  const riskLabel = (role: CrewRole): string => {
    const risk = roleRisk(game, role)
    if (risk < 0.005) return t('crew.risk.low')
    if (risk < 0.02) return t('crew.risk.medium')
    return t('crew.risk.high')
  }

  const riskClass = (role: CrewRole): string => {
    const risk = roleRisk(game, role)
    return risk < 0.005 ? 'pos' : risk < 0.02 ? '' : 'neg'
  }

  return (
    <div>
      <div className="screen-title">🧑‍🚀 {t('crew.title')}</div>
      <div className="screen-sub">
        {t('crew.wages')}: {fmt(crewWages(game))} {t('common.cr')} · {t('crew.quarters')}:{' '}
        {freeQuarters(game.ship)} · {t('crew.repairRate', { hp: crewRepairPerDay(game) })}
      </div>

      {/* Manning summary */}
      <div className="panel panel-pad" style={{ marginBottom: 12 }}>
        <div className="kv">
          <span className="k">{t('crew.aboard')}</span>
          <span className={`v ${short ? 'neg' : 'pos'}`}>
            {heads} / {t('crew.minimum')} {required} · {t('crew.recommended')} {advised}
          </span>
        </div>
        {short ? (
          <div className="screen-sub neg" style={{ marginTop: 6 }}>
            ⚠ {t('crew.undercrewed', { load: crewLoad(game).toFixed(1) })}
          </div>
        ) : (
          <div className="screen-sub" style={{ marginTop: 6 }}>{t('crew.wellManned')}</div>
        )}
      </div>

      {/* Watch bill */}
      <div className="panel panel-pad" style={{ marginBottom: 12 }}>
        <div className="screen-sub" style={{ marginBottom: 8 }}>{t('crew.stations')}</div>
        <table>
          <thead>
            <tr>
              <th>{t('crew.station')}</th>
              <th>{t('crew.manning')}</th>
              <th className="num">{t('crew.strength')}</th>
              <th className="num">{t('crew.risk.title')}</th>
            </tr>
          </thead>
          <tbody>
            {CREW_ROLES.map((role) => (
              <tr key={role}>
                <td>{t(`role.${role}`)}</td>
                <td className={posts[role].covered ? 'muted' : ''}>
                  {handName(role)}
                  {posts[role].covered && <> · {t('crew.doubleDuty')}</>}
                </td>
                <td className="num">{posts[role].strength}</td>
                <td className={`num ${riskClass(role)}`}>{riskLabel(role)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        {/* Aboard */}
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 10 }}>{t('crew.hired')}</div>
          {game.ship.crew.length === 0 && robots.length === 0 ? (
            <div className="muted">{t('crew.noneHired')}</div>
          ) : (
            <>
              {game.ship.crew.map((id) => {
                const m = MERCENARIES[id]
                return (
                  <div key={id} className="kv" style={{ alignItems: 'flex-start' }}>
                    <span className="k">
                      <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {mercName(id)}{' '}
                        <span className="badge">{t(`profession.${m.profession}`)}</span>
                      </div>
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
              })}
              {robots.map((id, index) => {
                const r = ROBOTS[id]
                return (
                  <div key={`${id}-${index}`} className="kv" style={{ alignItems: 'flex-start' }}>
                    <span className="k">
                      <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                        🤖 {t(`robot.${id}`)}{' '}
                        <span className="badge">{t(`profession.${r.profession}`)}</span>
                        {!powered && <span className="badge bad" style={{ marginLeft: 6 }}>{t('crew.dormant')}</span>}
                      </div>
                      <SkillRow m={r.skills} />
                    </span>
                    <span className="v" style={{ textAlign: 'right' }}>
                      <div className="muted">{t('crew.noWage')}</div>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ marginTop: 6 }}
                        onClick={() => sellRobot(index)}
                      >
                        {t('common.sell')} {fmt(Math.round(r.price * 0.75))}
                      </button>
                    </span>
                  </div>
                )
              })}
            </>
          )}

          <div className="screen-sub" style={{ margin: '18px 0 10px' }}>{t('crew.commanderSkills')}</div>
          <SkillRow m={eff} />
        </div>

        {/* Hiring hall */}
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 10 }}>{t('crew.roster')} · {sys.nameId}</div>
          {roster.length === 0 ? (
            <div className="muted">{t('crew.noneAvailable')}</div>
          ) : (
            roster.map((id) => {
              const m = MERCENARIES[id]
              return (
                <div key={id} className="kv" style={{ alignItems: 'flex-start' }}>
                  <span className="k">
                    <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {mercName(id)} <span className="badge">{t(`profession.${m.profession}`)}</span>
                    </div>
                    <SkillRow m={m.skills} />
                  </span>
                  <span className="v" style={{ textAlign: 'right' }}>
                    <div>{fmt(m.wage)} {t('common.cr')}/{t('common.day').toLowerCase()}</div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: 6 }}
                      disabled={freeQuarters(game.ship) <= 0}
                      onClick={() => hire(id)}
                    >
                      {t('crew.hire')}
                    </button>
                  </span>
                </div>
              )
            })
          )}
          {freeQuarters(game.ship) <= 0 && (
            <div className="screen-sub" style={{ marginTop: 8 }}>{t('crew.noQuarters')}</div>
          )}

          {/* Robot dealer */}
          <div className="screen-sub" style={{ margin: '18px 0 10px' }}>
            🤖 {t('crew.robotDealer')}
          </div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            {t('crew.robotHint', { fuel: ROBOT_FUEL_PER_DAY.toFixed(2) })}
          </div>
          {forSale.length === 0 ? (
            <div className="muted">{t('crew.noRobots')}</div>
          ) : (
            forSale.map((id) => {
              const r = ROBOTS[id]
              return (
                <div key={id} className="kv" style={{ alignItems: 'flex-start' }}>
                  <span className="k">
                    <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {t(`robot.${id}`)} <span className="badge">{t(`profession.${r.profession}`)}</span>
                    </div>
                    <SkillRow m={r.skills} />
                  </span>
                  <span className="v" style={{ textAlign: 'right' }}>
                    <div>{fmt(r.price)} {t('common.cr')}</div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: 6 }}
                      disabled={freeQuarters(game.ship) <= 0 || game.credits < r.price}
                      onClick={() => buyRobot(id)}
                    >
                      {t('common.buy')}
                    </button>
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
