import { useI18n } from '../hooks/useI18n'
import { SavesPanel } from '../components/SavesPanel'

export function SavesScreen(): React.JSX.Element {
  const { t } = useI18n()

  return (
    <div>
      <div className="screen-title">💾 {t('saves.title')}</div>
      <div className="screen-sub">{t('saves.subtitle')}</div>

      <div className="panel panel-pad">
        <SavesPanel mode="game" />
      </div>
    </div>
  )
}
