import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  atCapital,
  currentSystem,
  canTurnIn,
  questSupply,
  freeCargoBays,
  deliverableUnits,
  escortShipProblem,
  boardQuestProblem,
  escortLegs,
  ESCORT_MIN_WEAPONS,
  ESCORT_MIN_SHIELDS,
  type Quest
} from '@game/index'
import { goodName } from '@i18n/index'
import { questDescription, questTypeLabel } from '../util/questText'
import { fmt } from '../util/format'

const ICON: Record<string, string> = {
  delivery: '📦',
  relief: '⛑️',
  bounty: '🎯',
  passenger: '🧳',
  smuggle: '🕶️',
  fetch: '📥',
  escort: '🛡️'
}

export function QuestsScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const acceptBoard = useGameStore((s) => s.acceptBoardQuest)
  const abandon = useGameStore((s) => s.abandonQuest)
  const turnIn = useGameStore((s) => s.turnInQuest)
  const startEscort = useGameStore((s) => s.startEscort)
  const buy = useGameStore((s) => s.buy)
  const { t } = useI18n()

  // Escort contracts only take a military hull with guns and a shield fitted.
  const escortProblem = escortShipProblem(game)
  const escortRequirement = t('quest.escortRequirements', {
    weapons: ESCORT_MIN_WEAPONS,
    shields: ESCORT_MIN_SHIELDS
  })

  const here = currentSystem(game)
  // The board hangs in the port office. Out at a belt or a station there is
  // nothing to read and nothing to sign, so it is not offered at all.
  const docked = atCapital(game)
  const board = docked ? (here.questBoard ?? []) : []
  const active = game.quests.filter((q) => q.status === 'active')
  const completed = game.quests.filter((q) => q.status === 'completed')

  // Coloured "have / need" progress line for cargo-backed quests. At the
  // delivery point only hauled-in cargo counts, so that is what gets shown.
  const Progress = ({ q }: { q: Quest }): React.JSX.Element | null => {
    const need = questSupply(q)
    if (!need) return null
    const atTarget = q.targetSystem === game.currentSystem
    const have = atTarget ? deliverableUnits(game, need.good) : game.ship.cargo[need.good]
    const ok = have >= need.amount
    return (
      <span className={ok ? 'pos' : 'neg'} style={{ fontWeight: 600 }}>
        {goodName(need.good)} {have}/{need.amount}
      </span>
    )
  }

  return (
    <div>
      <div className="screen-title">📋 {t('quest.title')}</div>
      <div className="screen-sub">
        {t('quest.active')}: {active.length} · {t('quest.done')}: {completed.length}
      </div>

      <div className="quest-sections">
        {/* Active assignments stay above jobs that can still be accepted. */}
        <section className="quest-section quest-active">
          <div className="screen-sub" style={{ margin: '20px 0 8px' }}>▶ {t('quest.active')}</div>
          {active.length === 0 ? (
            <div className="panel panel-pad muted">{t('quest.none')}</div>
          ) : (
            <div className="grid" style={{ gap: 12 }}>
              {active.map((q) => {
                const ready = canTurnIn(game, q)
                const need = questSupply(q)
                const missing = need ? Math.max(0, need.amount - game.ship.cargo[need.good]) : 0
                const atTarget = q.targetSystem === game.currentSystem
                const mustSourceElsewhere =
                  need !== null && atTarget && deliverableUnits(game, need.good) < need.amount
                const canBuyHere =
                  need !== null &&
                  missing > 0 &&
                  !atTarget &&
                  here.buyPrice[need.good] > 0 &&
                  here.qty[need.good] > 0 &&
                  freeCargoBays(game.ship) > 0
                return (
                  <div className="panel panel-pad" key={q.id}>
                    <div className="row" style={{ gap: 12 }}>
                      <span style={{ fontSize: 26 }}>{ICON[q.type]}</span>
                      <div className="col-fill">
                        <div style={{ fontWeight: 600 }}>{questTypeLabel(q)}</div>
                        <div className="muted" style={{ fontSize: 13 }}>{questDescription(q, game)}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          📍 {t('quest.takenAt', { system: game.systems[q.giverSystem]?.nameId ?? '—' })}
                          {' · '}🎯 {game.systems[q.targetSystem]?.nameId ?? '—'}
                          {need && <> · <Progress q={q} /></>}
                          {q.type === 'escort' && <> · 🚀 {t('escort.legs', { legs: escortLegs(game, q) })}</>}
                        </div>
                        {q.type === 'escort' && (
                          <div className={escortProblem ? 'neg' : 'muted'} style={{ fontSize: 12, marginTop: 4 }}>
                            {escortProblem ? `⚔ ${t(escortProblem)}` : `🛡 ${t('quest.escortHint')}`}
                          </div>
                        )}
                        {need && missing > 0 && !atTarget && (
                          <button className="btn btn-sm" style={{ marginTop: 6 }} disabled={!canBuyHere} onClick={() => buy(need.good, missing)}>
                            🛒 {t('quest.buySupplies')}
                          </button>
                        )}
                        {mustSourceElsewhere && (
                          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>⚠ {t('quest.sourceElsewhere')}</div>
                        )}
                      </div>
                      <div className="quest-card-actions">
                        <div className="pos" style={{ fontWeight: 600 }}>{fmt(q.reward)} {t('common.cr')}</div>
                        <div className="row-end" style={{ gap: 6, marginTop: 6 }}>
                          {q.type === 'bounty' ? (
                            <div className="muted" style={{ fontSize: 11, alignSelf: 'center' }}>{t('quest.viaCombat')}</div>
                          ) : q.type === 'escort' ? (
                            <button className="btn btn-sm btn-primary" disabled={escortProblem !== null || q.giverSystem !== game.currentSystem} onClick={() => startEscort(q.id)}>
                              🛡 {t('quest.beginEscort')}
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-primary" disabled={!ready} onClick={() => turnIn(q.id)}>{t('quest.turnIn')}</button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => abandon(q.id)}>{t('quest.abandon')}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Job board at the current planet */}
        <section className="quest-section quest-board">
          <div className="screen-sub" style={{ marginBottom: 8, marginTop: 4 }}>
            🪧 {t('quest.board')} · {here.nameId}
          </div>
          {board.length === 0 ? (
            <div className="panel panel-pad muted">{docked ? t('quest.boardEmpty') : t('error.noPortHere')}</div>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {board.map((q) => {
            const need = questSupply(q)
            // Anything that makes this job impossible for the current ship —
            // no berth, wrong hull, or a hold that could never take the freight.
            const problem = boardQuestProblem(game, q)
            return (
              <div className="panel panel-pad" key={q.id}>
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{ICON[q.type]}</span>
                  <div className="col-fill">
                    <div style={{ fontWeight: 600 }}>
                      {questTypeLabel(q)}
                      {need && (
                        <span className="badge" style={{ marginLeft: 8 }}>
                          {need.amount} × {goodName(need.good)}
                        </span>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>{questDescription(q, game)}</div>
                    {q.type === 'escort' && (
                      <div
                        className={escortProblem ? 'neg' : 'muted'}
                        style={{ fontSize: 12, marginTop: 4 }}
                      >
                        ⚔ {escortRequirement}
                        {escortProblem && <> · {t(escortProblem)}</>}
                      </div>
                    )}
                    {/* The escort line already carries its own reason. */}
                    {problem && q.type !== 'escort' && (
                      <div className="neg" style={{ fontSize: 12, marginTop: 4 }}>
                        ⚠ {t(problem)}
                      </div>
                    )}
                  </div>
                  <div className="quest-card-actions">
                    <div className="pos" style={{ fontWeight: 600 }}>{fmt(q.reward)} {t('common.cr')}</div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: 6 }}
                      disabled={problem !== null}
                      onClick={() => acceptBoard(q.id)}
                    >
                      {t('quest.accept')}
                    </button>
                  </div>
                </div>
              </div>
            )
              })}
            </div>
          )}
        </section>

      {/* Completed */}
        {completed.length > 0 && (
        <section className="quest-section quest-completed">
          <div className="screen-sub" style={{ margin: '20px 0 8px' }}>✅ {t('quest.done')}</div>
          <div className="grid" style={{ gap: 12 }}>
            {completed.map((q, i) => (
              <div className="panel panel-pad" key={`${q.id}-${i}`} style={{ opacity: 0.55 }}>
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div className="col-fill">
                    <div style={{ fontWeight: 600 }}>{questTypeLabel(q)}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{questDescription(q, game)}</div>
                  </div>
                  <div className="pos" style={{ fontWeight: 600 }}>+{fmt(q.reward)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </div>
  )
}
