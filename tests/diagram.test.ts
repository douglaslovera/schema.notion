import assert from 'node:assert/strict'
import test from 'node:test'
import { validateDiagram } from '../src/lib/diagram.ts'

const workspace = (databases: unknown[]) => ({
  workspace: { name: 'Content', databases },
})

const posts = {
  id: 'posts',
  name: 'Posts',
  properties: [
    { name: 'Title', type: 'title' },
    {
      name: 'Author',
      type: 'relation',
      relation: {
        targetDatabaseId: 'team',
        targetDatabaseName: 'Team',
        direction: 'two_way',
        pairedPropertyName: 'Posts',
      },
    },
    {
      name: 'Author Count',
      type: 'rollup',
      rollup: {
        relationPropertyName: 'Author',
        targetPropertyName: 'Name',
        function: 'count',
      },
    },
  ],
}

const team = {
  id: 'team',
  name: 'Team',
  properties: [{ name: 'Name', type: 'title' }],
}

test('accepts a valid workspace and returns canonical JSON', () => {
  const result = validateDiagram(workspace([posts, team]))

  assert.equal(result.success, true)
  if (!result.success) return
  assert.deepEqual(JSON.parse(result.json), result.diagram)
  assert.deepEqual(result.warnings, [
    'Relation "posts.Author" references missing property "Posts" in "team"',
  ])
})

test('accepts JSON strings and normalizes type aliases', () => {
  const result = validateDiagram(
    JSON.stringify(
      workspace([
        {
          id: 'notes',
          name: 'Notes',
          properties: [
            { name: 'Name', type: 'title' },
            { name: 'Body', type: 'text' },
          ],
        },
      ]),
    ),
  )

  assert.equal(result.success, true)
  if (!result.success) return
  assert.equal(result.diagram.workspace.databases[0].properties[1].type, 'rich_text')
})

test('rejects malformed JSON and schema violations', () => {
  assert.deepEqual(validateDiagram('{nope'), {
    success: false,
    errors: ['Diagram is not valid JSON'],
  })

  const result = validateDiagram(
    workspace([{ id: 'x', name: 'X', properties: [{ name: 'A', type: 'nope' }] }]),
  )
  assert.equal(result.success, false)
})

test('rejects broken references', () => {
  const result = validateDiagram(
    workspace([
      posts,
      { ...team, properties: [] },
      { ...team, properties: [{ name: 'Name', type: 'title' }] },
    ]),
  )

  assert.equal(result.success, false)
  if (result.success) return
  assert.ok(result.errors.includes('Duplicate database id "team"'))
  assert.ok(
    result.errors.includes(
      'Database "team" must have exactly one title property (found 0)',
    ),
  )

  const orphan = validateDiagram(
    workspace([
      {
        ...posts,
        properties: [
          { name: 'Title', type: 'title' },
          { name: 'Title', type: 'rich_text' },
          posts.properties[1],
          { ...posts.properties[2], rollup: { ...posts.properties[2].rollup, relationPropertyName: 'Missing' } },
        ],
      },
    ]),
  )
  assert.equal(orphan.success, false)
  if (orphan.success) return
  assert.deepEqual(orphan.errors, [
    'Database "posts" has duplicate property "Title"',
    'Relation "posts.Author" targets unknown database "team"',
    'Rollup "posts.Author Count" references missing relation "Missing"',
  ])
})

test('rejects rollups targeting a missing property', () => {
  const result = validateDiagram(
    workspace([
      {
        ...posts,
        properties: [
          ...posts.properties.slice(0, 2),
          {
            ...posts.properties[2],
            rollup: { ...posts.properties[2].rollup, targetPropertyName: 'Ghost' },
          },
        ],
      },
      team,
    ]),
  )

  assert.equal(result.success, false)
  if (result.success) return
  assert.deepEqual(result.errors, [
    'Rollup "posts.Author Count" references missing property "Ghost" in "team"',
  ])
})
