export const CAR_STATUS_ORDER = ['IN_STOCK', 'REPAIRING', 'LISTED', 'SOLD', 'ARCHIVED'] as const

export type CarStatusValue = (typeof CAR_STATUS_ORDER)[number]

export const CAR_STATUS_LABEL: Record<CarStatusValue, string> = {
  IN_STOCK: 'В наличии',
  REPAIRING: 'На ремонте',
  LISTED: 'Выставлено',
  SOLD: 'Продано',
  ARCHIVED: 'Архив',
}

export const CAR_STATUS_BADGE_VARIANT: Record<CarStatusValue, string> = {
  IN_STOCK: 'outline',
  REPAIRING: 'secondary',
  LISTED: 'default',
  SOLD: 'default',
  ARCHIVED: 'secondary',
}

export function getNextStatuses(current: CarStatusValue) {
  const index = CAR_STATUS_ORDER.indexOf(current)
  return index === -1 ? CAR_STATUS_ORDER : CAR_STATUS_ORDER.slice(index + 1)
}
