import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  maxLoan,
  fineToClear,
  notoriety,
  sentenceDays,
  standing,
  wantedByBank,
  wantedByLaw
} from '@game/index'
import { fmt } from '../util/format'

export function BankScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const getLoan = useGameStore((s) => s.getLoan)
  const payDebt = useGameStore((s) => s.payDebt)
  const buyInsurance = useGameStore((s) => s.buyInsurance)
  const cancelInsurance = useGameStore((s) => s.cancelInsurance)
  const payFine = useGameStore((s) => s.payFine)
  const { t } = useI18n()

  const available = Math.max(0, maxLoan(game) - game.debt)
  const affordablePay = Math.min(game.debt, game.credits)
  const [loanAmt, setLoanAmt] = useState(available)
  const [payAmt, setPayAmt] = useState(affordablePay)

  // The amounts are seeded once at mount; re-sync them when the figures they
  // track change (a taken loan shrinks what is left, a repayment the debt), or
  // the field keeps quoting a number from before the action.
  useEffect(() => {
    setLoanAmt(available)
  }, [available])
  useEffect(() => {
    setPayAmt(affordablePay)
  }, [affordablePay])

  const fine = fineToClear(game)
  const wanted = notoriety(game)

  return (
    <div>
      <div className="screen-title">🏦 {t('bank.title')}</div>
      <div className="screen-sub">{t('bank.interest')}</div>

      <div className="grid grid-2">
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('bank.loan')}</div>
          <div className="kv">
            <span className="k">{t('bank.debt')}</span>
            <span className="v neg">{fmt(game.debt)} {t('common.cr')}</span>
          </div>
          <div className="kv">
            <span className="k">{t('bank.maxLoan')}</span>
            <span className="v">{fmt(available)} {t('common.cr')}</span>
          </div>

          <div className="stepper" style={{ marginTop: 14 }}>
            <input
              type="number"
              value={loanAmt}
              onChange={(e) => setLoanAmt(Math.max(0, Math.min(available, Number(e.target.value) || 0)))}
              style={{ width: 120 }}
            />
            <button className="btn btn-primary" disabled={available <= 0} onClick={() => getLoan(loanAmt)}>
              {t('bank.getLoan')}
            </button>
          </div>

          <div className="stepper" style={{ marginTop: 10 }}>
            <input
              type="number"
              value={payAmt}
              onChange={(e) =>
                setPayAmt(Math.max(0, Math.min(game.debt, game.credits, Number(e.target.value) || 0)))
              }
              style={{ width: 120 }}
            />
            <button className="btn" disabled={game.debt <= 0} onClick={() => payDebt(payAmt)}>
              {t('bank.payDebt')}
            </button>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('bank.insurance')}</div>
          <div className="kv">
            <span className="k">{t('bank.insurance')}</span>
            <span className="v">
              {game.insurance ? (
                <span className="badge">{t('bank.insuranceActive')}</span>
              ) : (
                <span className="muted">{t('bank.insuranceInactive')}</span>
              )}
            </span>
          </div>
          {game.insurance && (
            <div className="kv">
              <span className="k">{t('bank.noClaim')}</span>
              <span className="v">{Math.min(90, game.noClaim)}%</span>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            {game.insurance ? (
              <button className="btn btn-danger btn-block" onClick={cancelInsurance}>
                {t('bank.cancelInsurance')}
              </button>
            ) : (
              <button
                className="btn btn-block"
                disabled={!game.ship.escapePod}
                onClick={buyInsurance}
              >
                {t('bank.buyInsurance')}
              </button>
            )}
            {!game.ship.escapePod && (
              <div className="screen-sub" style={{ marginTop: 8 }}>{t('bank.needPod')}</div>
            )}
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('record.title')}</div>
          <div className="kv">
            <span className="k">{t('record.standing')}</span>
            <span className={`v ${wanted > 0 ? 'neg' : game.record.policeRecord > 0 ? 'pos' : ''}`}>
              {t(`standing.${standing(game)}`)}
            </span>
          </div>
          {wanted > 0 && (
            <div className="kv">
              <span className="k">{t('record.notoriety')}</span>
              <span className="v neg">{wanted}</span>
            </div>
          )}
          <div className="kv">
            <span className="k">{t('record.reputation')}</span>
            <span className="v">{game.record.reputation}</span>
          </div>

          {wantedByLaw(game) && (
            <div className="screen-sub" style={{ marginTop: 10 }}>{t('record.wantedLaw')}</div>
          )}
          {wantedByBank(game) && (
            <div className="screen-sub" style={{ marginTop: 6 }}>
              {t('record.wantedBank', { debt: fmt(game.debt) })}
            </div>
          )}
          {wanted === 0 && !wantedByBank(game) && (
            <div className="screen-sub" style={{ marginTop: 10 }}>{t('record.clean')}</div>
          )}

          {fine > 0 && (
            <div style={{ marginTop: 14 }}>
              <button
                className="btn btn-block"
                disabled={game.credits < fine}
                onClick={payFine}
              >
                {t('record.payFine', { amount: fmt(fine) })}
              </button>
              <div className="screen-sub" style={{ marginTop: 8 }}>{t('record.fineHint')}</div>
              <div className="screen-sub" style={{ marginTop: 4 }}>
                {t('record.sentenceHint', { days: sentenceDays(game) })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
