import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { questDescription, questTypeLabel } from '../util/questText'
import { fmt } from '../util/format'

/** Shown after a quest is handed in, celebrating the reward. */
export function QuestCompleteModal(): React.JSX.Element | null {
  const game = useGameStore((s) => s.game)
  const quest = useGameStore((s) => s.questReward)
  const dismiss = useGameStore((s) => s.dismissQuestReward)
  const { t } = useI18n()

  if (!quest || !game) return null

  return (
    <div className="overlay">
      <div className="modal modal-narrow modal-center">
        <div className="ship-emoji" style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <h2>{t('quest.rewardTitle')}</h2>
        <div className="badge" style={{ margin: '4px 0 12px' }}>{questTypeLabel(quest)}</div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 16 }}>
          {questDescription(quest, game)}
        </p>
        <div className="kv">
          <span className="k">{t('quest.reward')}</span>
          <span className="v pos">+{fmt(quest.reward)} {t('common.cr')}</span>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={dismiss}>
          {t('common.close')}
        </button>
      </div>
    </div>
  )
}
