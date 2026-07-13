import { z } from 'zod'

const MAX_MESSAGE_CHARS = 4_000

export const sendChatMessageSchema = z
  .object({
    chatId: z.uuid(),
    clientMessageId: z.uuid(),
    message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  })
  .strict()

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>
