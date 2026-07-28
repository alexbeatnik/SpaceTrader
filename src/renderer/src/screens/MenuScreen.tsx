import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { LocaleToggle } from '../components/LocaleToggle'
import { SavesPanel } from '../components/SavesPanel'
import { AUTO_SLOT } from '@shared/saves'

export function MenuScreen(): React.JSX.Element {
  const { t } = useI18n()
  const startNewGame = useGameStore((s) => s.startNewGame)
  const loadGame = useGameStore((s) => s.loadGame)
  const listSaves = useGameStore((s) => s.listSaves)
  const [name, setName] = useState('Jameson')
  const [hasAutoSave, setHasAutoSave] = useState(false)
  const [hasAnySave, setHasAnySave] = useState(false)
  const [showSaves, setShowSaves] = useState(false)

  // Re-checked when the slot dialog closes too: deleting the last save there
  // has to take the buttons that open it away.
  useEffect(() => {
    void listSaves().then((slots) => {
      setHasAutoSave(slots.some((s) => s.slot === AUTO_SLOT && s.meta))
      setHasAnySave(slots.some((s) => s.meta))
    })
  }, [listSaves, showSaves])

  const onStart = (): void => {
    startNewGame({ commanderName: name.trim() || 'Jameson' })
  }

  return (
    <div className="menu-screen">
Н      <h1 className="menu-title">SPACE TRADER</h1>
      <p className="menu-tagline">{t('menu.tagline')}</p>

      <div className="panel menu-card">
        <span className="field-label">{t('menu.commanderName')}</span>
        <input
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onStart()}
        />
        <button className="btn btn-primary btn-block" onClick={onStart}>
          🚀 {t('menu.startGame')}
        </button>
        {hasAutoSave && (
          <button
            className="btn btn-block"
            onClick={() => {
              void loadGame()
            }}
          >
            {t('menu.continue')}
          </button>
        )}
        {hasAnySave && (
          <button className="btn btn-block" onClick={() => setShowSaves(true)}>
            💾 {t('saves.loadGame')}
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span className="field-label">{t('menu.language')}</span>
          <LocaleToggle />
        </div>
      </div>

      {showSaves && (
        <div className="overlay" onClick={() => setShowSaves(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>💾 {t('saves.title')}</h2>
            <SavesPanel mode="menu" />
            <button
              className="btn btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setShowSaves(false)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
