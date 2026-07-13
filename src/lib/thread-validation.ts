import { z } from 'zod'

const DEFAULT_THREAD_TITLE = 'Nuevo workspace'
const MAX_THREAD_TITLE_CHARS = 54

export const chatIdSchema = z.uuid()
export const shareTokenSchema = z.string().regex(/^[a-f0-9]{32}$/)

export function buildThreadTitle(firstUserMessage: string) {
  const title = firstUserMessage.trim()

  if (!title) {
    return DEFAULT_THREAD_TITLE
  }

  return title.length > MAX_THREAD_TITLE_CHARS
    ? `${title.slice(0, MAX_THREAD_TITLE_CHARS).trimEnd()}...`
    : title
}
