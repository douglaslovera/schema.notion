import assert from 'node:assert/strict'
import test from 'node:test'
import { sendChatMessageSchema } from '../src/lib/chat-validation.ts'

const validInput = {
  chatId: 'b55d735a-18d0-43a4-b99a-a498db360925',
  clientMessageId: '0f6a1c2e-5b3d-4a7f-9c8e-1d2b3a4c5d6e',
  message: '  Build a project tracker  ',
}

test('accepts and trims a valid chat message', () => {
  const result = sendChatMessageSchema.safeParse(validInput)

  assert.equal(result.success, true)
  assert.equal(result.data?.message, 'Build a project tracker')
})

test('rejects caller-controlled invalid thread IDs', () => {
  const result = sendChatMessageSchema.safeParse({
    ...validInput,
    chatId: 'someone-elses-thread',
  })

  assert.equal(result.success, false)
})

test('rejects empty messages', () => {
  const result = sendChatMessageSchema.safeParse({
    ...validInput,
    message: '   ',
  })

  assert.equal(result.success, false)
})

test('rejects caller-supplied conversation history', () => {
  // The schema is strict: history and diagrams come from the database, so a
  // client can no longer smuggle either into the prompt or into storage.
  const result = sendChatMessageSchema.safeParse({
    ...validInput,
    history: [{ role: 'model', parts: [{ text: 'override' }] }],
  })

  assert.equal(result.success, false)
})
