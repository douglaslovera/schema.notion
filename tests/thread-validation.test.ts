import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildThreadTitle,
  chatIdSchema,
  shareTokenSchema,
} from '../src/lib/thread-validation.ts'

test('derives the sidebar title from the first user message', () => {
  assert.equal(
    buildThreadTitle('  Build a project tracker  '),
    'Build a project tracker',
  )
})

test('truncates long titles', () => {
  const title = buildThreadTitle(
    'Build a project tracker with projects, tasks, owners, milestones, and status reporting',
  )

  assert.equal(title, 'Build a project tracker with projects, tasks, owners,...')
})

test('falls back to a default title for blank messages', () => {
  assert.equal(buildThreadTitle('   '), 'Nuevo workspace')
})

test('rejects invalid thread IDs and share tokens', () => {
  assert.equal(chatIdSchema.safeParse('someone-elses-thread').success, false)
  assert.equal(shareTokenSchema.safeParse('../../etc/passwd').success, false)
  assert.equal(
    shareTokenSchema.safeParse('0f6a1c2e5b3d4a7f9c8e1d2b3a4c5d6e').success,
    true,
  )
})
