const PASTEL_PALETTE = [
  { background: '#F7ECD3', border: '#D9BD82', text: '#4E3A16' }, // sand
  { background: '#F2E2E5', border: '#D4A9B3', text: '#4A2C33' }, // rose
  { background: '#E2EFE4', border: '#A6C4AA', text: '#25412A' }, // green
  { background: '#E1ECF8', border: '#A4BEDF', text: '#203A57' }, // blue
  { background: '#EAE4F4', border: '#B8A9D6', text: '#352B4F' }, // violet
  { background: '#F5E7DB', border: '#D4B191', text: '#51351E' }, // clay
  { background: '#E4F0EE', border: '#A5C8C1', text: '#1F433E' }, // mint
  { background: '#ECE7DF', border: '#C4B8A8', text: '#44382B' }, // taupe
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
