import type { SystemBody } from '@game/index'
import { orbitNumeral, stationShortName } from '@i18n/index'

/**
 * What to call a place inside a star system.
 *
 * The capital planet is what everyone means when they say the system's name,
 * so it keeps it plain. Everything else is the system name plus a Roman
 * numeral for its orbit, or the station's speciality.
 */
export function bodyDisplayName(systemName: string, body: SystemBody | undefined): string {
  if (!body) return systemName
  if (body.kind === 'planet') return systemName
  if (body.kind === 'station') return `${systemName} ${stationShortName(body.station ?? 'science')}`
  return `${systemName} ${orbitNumeral(body.orbit)}`
}
