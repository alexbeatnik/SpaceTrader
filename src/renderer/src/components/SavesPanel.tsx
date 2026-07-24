import { useCallback, useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { fmtCr } from '../util/format'
import { shipName } from '@i18n/index'
import { AUTO_SLOT, MANUAL_SLOT_IDS, type SaveSlotId, type SaveSlotInfo } from '@shared/saves'

/**
 * `menu` runs before a game exists: slots can only be loaded or deleted.
 * `game` runs with a voyage in progress and adds saving into a slot.
 */
type Mode = 'menu' | 'game'

type Pending = { slot: SaveSlotId; action: 'save' | 'load' | 'delete' } | null

const ALL_SLOTS: SaveSlotId[] = [AUTO_SLOT, ...MANUAL_SLOT_IDS]

export function SavesPanel({ mode }: { mode: Mode }): React.JSX.Element {
  const { t, locale } = useI18n()
  const listSaves = useGameStore((s) => s.listSaves)
  const saveToSlot = useGameStore((s) => s.saveToSlot)
  const loadGame = useGameStore((s) => s.loadGame)
  const deleteSave = useGameStore((s) => s.deleteSave)

  const [slots, setSlots] = useState<SaveSlotInfo[] | null>(null)
  // A destructive action is armed on its own row rather than in a dialog, so
  // the slot being overwritten stays visible while the player confirms.
  const [pending, setPending] = useState<Pending>(null)

  const refresh = useCallback(async () => {
    setSlots(await listSaves())
  }, [listSaves])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const infoFor = (slot: SaveSlotId): SaveSlotInfo =>
    slots?.find((s) => s.slot === slot) ?? { slot, meta: null }

  const run = async (slot: SaveSlotId, action: 'save' | 'load' | 'delete'): Promise<void> => {
    setPending(null)
    if (action === 'save') await saveToSlot(slot)
    else if (action === 'delete') await deleteSave(slot)
    else {
      await loadGame(slot)
      return // The store switched screens; this panel is on its way out.
    }
    await refresh()
  }

  const formatWhen = (savedAt: number): string =>
    savedAt > 0 ? new Date(savedAt).toLocaleString(locale) : t('saves.unknownTime')

  return (
    <div className="saves-list">
      {slots === null ? (
        <div className="muted">{t('saves.loading')}</div>
      ) : (
        ALL_SLOTS.map((slot) => {
          const info = infoFor(slot)
          const meta = info.meta
          const isAuto = slot === AUTO_SLOT
          const armed = pending?.slot === slot ? pending.action : null

          return (
            <div className={`save-slot${meta ? '' : ' empty'}`} key={slot}>
              <div className="save-slot-main">
                <div className="save-slot-name">
                  {isAuto ? `💾 ${t('saves.autoSlot')}` : `${t('saves.slot', { n: slot })}`}
                </div>
                {meta ? (
                  <>
                    <div className="save-slot-line">
                      {meta.commanderName} · {t('common.day')} {meta.day} · {fmtCr(meta.credits)}
                    </div>
                    <div className="save-slot-line muted">
                      {shipName(meta.shipType)}
                      {meta.systemName ? ` · ${meta.systemName}` : ''} · {formatWhen(meta.savedAt)}
                    </div>
                  </>
                ) : (
                  <div className="save-slot-line muted">
                    {info.corrupt ? t('saves.corrupt') : t('saves.empty')}
                  </div>
                )}
                {isAuto && <div className="save-slot-line muted">{t('saves.autoHint')}</div>}
              </div>

              <div className="save-slot-actions">
                {armed ? (
                  <>
                    <span className="save-slot-confirm">{t(`saves.confirm.${armed}`)}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => void run(slot, armed)}>
                      {t('common.yes')}
                    </button>
                    <button className="btn btn-sm" onClick={() => setPending(null)}>
                      {t('common.no')}
                    </button>
                  </>
                ) : (
                  <>
                    {/* The autosave slot belongs to the game, not the player:
                        writing into it by hand would only be undone by the next
                        action anyway. */}
                    {mode === 'game' && !isAuto && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          meta ? setPending({ slot, action: 'save' }) : void run(slot, 'save')
                        }
                      >
                        {t('saves.save')}
                      </button>
                    )}
                    <button
                      className="btn btn-sm"
                      disabled={!meta}
                      onClick={() =>
                        mode === 'game'
                          ? setPending({ slot, action: 'load' })
                          : void run(slot, 'load')
                      }
                    >
                      {t('saves.load')}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={!meta && !info.corrupt}
                      onClick={() => setPending({ slot, action: 'delete' })}
                    >
                      {t('saves.delete')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
