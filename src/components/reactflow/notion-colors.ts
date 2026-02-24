const PASTEL_PALETTE = [
  { background: '#FDECC8', border: '#EAB96B', text: '#533A0B' }, // yellow
  { background: '#F9DDE1', border: '#E6A2AE', text: '#5E1F2B' }, // red/pink
  { background: '#DFF1E4', border: '#9DCCA8', text: '#1D4A2A' }, // green
  { background: '#DCEEFE', border: '#97C0EC', text: '#123A63' }, // blue
  { background: '#EADFFA', border: '#B79CE8', text: '#3D2466' }, // purple
  { background: '#FBE7D4', border: '#EAB98A', text: '#5E3510' }, // orange
  { background: '#E6F4F1', border: '#9FD0C6', text: '#1B4B43' }, // teal
  { background: '#EFE9E2', border: '#CDBEAF', text: '#4A3A2B' }, // brown/gray
] as const

export type NotionColor = (typeof PASTEL_PALETTE)[number]

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getNotionDatabaseColor(databaseId: string): NotionColor {
  const idx = hashString(databaseId) % PASTEL_PALETTE.length
  return PASTEL_PALETTE[idx]
}
