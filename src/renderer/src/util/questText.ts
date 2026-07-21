import type { Quest, GameState } from '@game/index'
import { t, goodName } from '@i18n/index'

/** Human-readable one-line description of a quest's objective. */
export function questDescription(q: Quest, game: GameState): string {
  const system = game.systems[q.targetSystem]?.nameId ?? ''
  switch (q.type) {
    case 'delivery':
      return t('quest.desc.delivery', { system })
    case 'relief':
      return t('quest.desc.relief', {
        amount: q.amount ?? 0,
        good: goodName(q.good ?? ''),
        system
      })
    case 'bounty':
      return t('quest.desc.bounty', { bounty: q.bountyName ?? '', system })
  }
}

export function questTypeLabel(q: Quest): string {
  return t(`quest.type.${q.type}`)
}
