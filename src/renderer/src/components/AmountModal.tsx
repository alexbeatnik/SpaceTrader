import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { fmt } from '../util/format'

interface Props {
  title: string
  max: number
  unitPrice?: number
  confirmLabel: string
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function AmountModal({
  title,
  max,
  unitPrice,
  confirmLabel,
  onConfirm,
  onCancel
}: Props): React.JSX.Element {
  const { t } = useI18n()
  const [amount, setAmount] = useState(Math.min(1, max))

  const clamp = (v: number): number => Math.max(0, Math.min(max, Math.floor(v || 0)))

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal modal-narrow" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="stepper stepper-center">
          <button className="btn btn-sm" onClick={() => setAmount(clamp(amount - 1))}>
            −
          </button>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          />
          <button className="btn btn-sm" onClick={() => setAmount(clamp(amount + 1))}>
            +
          </button>
          <button className="btn btn-sm" onClick={() => setAmount(max)}>
            {t('common.max')}
          </button>
        </div>
        {unitPrice !== undefined && (
          <div className="kv">
            <span className="k">{t('common.total')}</span>
            <span className="v">{fmt(amount * unitPrice)} {t('common.cr')}</span>
          </div>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            disabled={amount <= 0}
            onClick={() => onConfirm(amount)}
          >
            {confirmLabel}
          </button>
          <button className="btn" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
