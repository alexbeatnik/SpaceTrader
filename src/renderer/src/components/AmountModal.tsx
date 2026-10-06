import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { fmt } from '../util/format'

interface Props {
  title: string
  max: number
  unitPrice?: number
  confirmLabel: string
  /**
   * The amount the dialog opens on, clamped to `max`. One unit unless the
   * caller knows better — selling, where "all of it" is the usual answer.
   */
  initial?: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function AmountModal({
  title,
  max,
  unitPrice,
  confirmLabel,
  initial = 1,
  onConfirm,
  onCancel
}: Props): React.JSX.Element {
  const { t } = useI18n()
  const clamp = (v: number): number => Math.max(0, Math.min(max, Math.floor(v || 0)))
  const [amount, setAmount] = useState(() => clamp(initial))
  const inputRef = useRef<HTMLInputElement>(null)
  // Only where there is a real keyboard: focusing the field on a phone throws
  // the on-screen one up over the very dialog it belongs to.
  const hasKeyboard = useMediaQuery('(pointer: fine)')

  useEffect(() => {
    if (!hasKeyboard) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [hasKeyboard])

  // Escape backs out from anywhere in the dialog, the way the backdrop does.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal modal-narrow" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="stepper stepper-center">
          <button className="btn btn-sm" onClick={() => setAmount(clamp(amount - 1))}>
            −
          </button>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            value={amount}
            onChange={(e) => setAmount(clamp(Number(e.target.value)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && amount > 0) onConfirm(amount)
            }}
          />
          <button className="btn btn-sm" onClick={() => setAmount(clamp(amount + 1))}>
            +
          </button>
          <button className="btn btn-sm" onClick={() => setAmount(max)}>
            {t('common.max')}
          </button>
        </div>
        {/* Dragging to "about half" beats tapping + thirty times, which is what
            a hold of sixty bays otherwise asks of a thumb. */}
        {max > 1 && (
          <input
            className="amount-range"
            type="range"
            min={0}
            max={max}
            value={amount}
            aria-label={title}
            onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          />
        )}
        <div className="kv">
          <span className="k">{t('common.qty')}</span>
          <span className="v">
            {amount} / {max}
          </span>
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
