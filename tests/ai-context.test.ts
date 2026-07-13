import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_CONTEXT_MESSAGES, buildModelContext } from '../src/lib/ai/context.ts'
import type { Message } from '../src/types/chat.ts'

const DIAGRAM = '{"workspace":"Projects","databases":[]}'

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: crypto.randomUUID(),
    timestamp: 1_700_000_000_000,
    role: 'user',
    diagram: '',
    message: 'Build a project tracker',
    ...overrides,
  }
}

test('replays message text and never the stored diagram snapshots', () => {
  const context = buildModelContext([
    message({ role: 'user', message: 'Build a CRM' }),
    message({ role: 'model', message: 'Listo', diagram: DIAGRAM }),
  ])

  assert.deepEqual(context, [
    { role: 'user', parts: [{ text: 'Build a CRM' }] },
    { role: 'model', parts: [{ text: 'Listo' }] },
  ])

  // The diagram is sent once per request by the caller, not once per turn.
  assert.doesNotMatch(JSON.stringify(context), /workspace/)
})

test('caps the replayed history', () => {
  const history = Array.from({ length: MAX_CONTEXT_MESSAGES + 10 }, (_, index) =>
    message({ message: `Message ${index}` }),
  )

  const context = buildModelContext(history)

  assert.equal(context.length, MAX_CONTEXT_MESSAGES)
  // The cap keeps the most recent turns, not the oldest.
  assert.deepEqual(context.at(-1), {
    role: 'user',
    parts: [{ text: `Message ${MAX_CONTEXT_MESSAGES + 9}` }],
  })
})

test('drops empty messages so the model never sees blank turns', () => {
  const context = buildModelContext([
    message({ message: '   ' }),
    message({ message: 'Build a CRM' }),
  ])

  assert.equal(context.length, 1)
})
