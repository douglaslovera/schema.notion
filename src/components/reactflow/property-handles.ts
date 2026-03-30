export type HandleSide = 'left' | 'right'

const DEFAULT_SOURCE_HANDLE_ID = 'database-source'
const DEFAULT_TARGET_HANDLE_ID = 'database-target'

function normalizeHandleSegment(value: string) {
  return encodeURIComponent(value.trim())
}

export function getDefaultSourceHandleId(side: HandleSide) {
  return `${DEFAULT_SOURCE_HANDLE_ID}-${side}`
}

export function getDefaultTargetHandleId(side: HandleSide) {
  return `${DEFAULT_TARGET_HANDLE_ID}-${side}`
}

export function getPropertySourceHandleId(
  propertyName: string,
  side: HandleSide,
) {
  return `property-source-${normalizeHandleSegment(propertyName)}-${side}`
}

export function getPropertyTargetHandleId(
  propertyName: string,
  side: HandleSide,
) {
  return `property-target-${normalizeHandleSegment(propertyName)}-${side}`
}
