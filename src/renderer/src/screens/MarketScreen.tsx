import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  TRADE_GOODS,
  GOOD_IDS,
  isSpecialGood,
  freeCargoBays,
  type GoodId
} from '@game/index'
import { goodName } from '@i18n/index'
import { fmt } from '../util/format'
import { AmountModal } from '../components/AmountModal'

type Dialog = { mode: 'buy' | 'sell'; good: GoodId } | null

export function MarketScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const buy = useGameStore((s) => s.buy)
  const sell = useGameStore((s) => s.sell)
  const { t } = useI18n()
  const [dialog, setDialog] = useState<Dialog>(null)
  const sys = currentSystem(game)

  const maxBuy = (id: GoodId): number => {
    const price = sys.buyPrice[id]
    if (price <= 0) return 0
    return Math.min(sys.qty[id], freeCargoBays(game.ship), Math.floor(game.credits / price))
  }

  return (
    <div>
      <div className="screen-title">💱 {t('market.title')}</div>
      <div className="screen-sub">{sys.nameId}</div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>{t('market.good')}</th>
              <th className="num">{t('market.available')}</th>
              <th className="num">{t('market.buyPrice')}</th>
              <th className="num">{t('market.sellPrice')}</th>
              <th className="num">{t('market.inHold')}</th>
              <th className="num">{t('common.profit')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {GOOD_IDS.filter(
              (id) =>
                !isSpecialGood(id) ||
                sys.buyPrice[id] > 0 ||
                sys.sellPrice[id] > 0 ||
                game.ship.cargo[id] > 0
            ).map((id) => {
              const good = TRADE_GOODS[id]
              const held = game.ship.cargo[id]
              const buyP = sys.buyPrice[id]
              const sellP = sys.sellPrice[id]
              const profit = held > 0 && sellP > 0 ? (sellP - game.buyingPrice[id]) * held : 0
              return (
                <tr key={id} className="row-hover">
                  <td>
                    {goodName(id)}
                    {good.illegal && <span className="illegal-tag">{t('market.illegal')}</span>}
                  </td>
                  <td className="num muted">{sys.qty[id] > 0 ? sys.qty[id] : '—'}</td>
                  <td className="num">{buyP > 0 ? fmt(buyP) : <span className="muted">{t('market.notSold')}</span>}</td>
                  <td className="num">{sellP > 0 ? fmt(sellP) : <span className="muted">{t('market.notWanted')}</span>}</td>
                  <td className="num">{held > 0 ? held : '—'}</td>
                  <td className={`num ${profit > 0 ? 'pos' : profit < 0 ? 'neg' : 'muted'}`}>
                    {held > 0 && sellP > 0 ? (profit >= 0 ? '+' : '') + fmt(profit) : '—'}
                  </td>
                  <td className="num">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={maxBuy(id) <= 0}
                        onClick={() => setDialog({ mode: 'buy', good: id })}
                      >
                        {t('common.buy')}
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={held <= 0 || sellP <= 0}
                        onClick={() => setDialog({ mode: 'sell', good: id })}
                      >
                        {t('common.sell')}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {dialog && (
        <AmountModal
          title={
            dialog.mode === 'buy'
              ? t('market.buyAmount', { good: goodName(dialog.good) })
              : t('market.sellAmount', { good: goodName(dialog.good) })
          }
          max={
            dialog.mode === 'buy'
              ? maxBuy(dialog.good)
              : game.ship.cargo[dialog.good]
          }
          unitPrice={
            dialog.mode === 'buy' ? sys.buyPrice[dialog.good] : sys.sellPrice[dialog.good]
          }
          confirmLabel={dialog.mode === 'buy' ? t('common.buy') : t('common.sell')}
          onConfirm={(amount) => {
            if (dialog.mode === 'buy') buy(dialog.good, amount)
            else sell(dialog.good, amount)
            setDialog(null)
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  )
}
