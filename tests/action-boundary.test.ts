import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const THREAD_ACTIONS = new URL('../src/lib/thread-actions.ts', import.meta.url)
const CHAT_ACTIONS = new URL('../src/lib/chat-actions.ts', import.meta.url)
const THREAD_DAL = new URL('../src/lib/thread.ts', import.meta.url)
const AI_SERVICE = new URL('../src/lib/ai/service.ts', import.meta.url)
const AUTH_DAL = new URL('../src/lib/auth.ts', import.meta.url)
const ALLOWLIST_DAL = new URL('../src/lib/access-allowlist.ts', import.meta.url)
const MCP_SERVER = new URL('../src/lib/mcp/server.ts', import.meta.url)

const ACTION_MODULES = [THREAD_ACTIONS, CHAT_ACTIONS]
const SERVER_ONLY_MODULES = [
  THREAD_DAL,
  AI_SERVICE,
  AUTH_DAL,
  ALLOWLIST_DAL,
  MCP_SERVER,
]

test('only dedicated action modules declare the use-server boundary', async () => {
  for (const file of ACTION_MODULES) {
    assert.match(await readFile(file, 'utf8'), /^'use server'/)
  }

  for (const file of SERVER_ONLY_MODULES) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /^'use server'/)
  }
})

test('every exported sensitive action resolves the allowlisted session', async () => {
  for (const file of ACTION_MODULES) {
    const source = await readFile(file, 'utf8')
    const exportedActions = source.match(/export async function /g) ?? []
    const authorizationChecks =
      source.match(/await requireAllowlistedCurrentUser\(\)/g) ?? []

    assert.ok(exportedActions.length > 0)
    assert.equal(authorizationChecks.length, exportedActions.length)
  }
})

test('public actions never accept a user ID', async () => {
  for (const file of ACTION_MODULES) {
    const source = await readFile(file, 'utf8')
    assert.doesNotMatch(source, /export async function[^\{]+userId/)
  }
})

test('the chat action derives model context from the database, not the caller', async () => {
  const source = await readFile(CHAT_ACTIONS, 'utf8')

  // History and the current diagram must come from appendUserMessage. If the
  // action ever reads them off its own input again, the client regains control
  // of the prompt and of stored history.
  assert.match(source, /await appendUserMessage\(/)
  assert.doesNotMatch(source, /data\.(history|conversation|diagram)/)
})
