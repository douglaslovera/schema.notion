import {
  type NotionWorkspaceSchema,
  notionWorkspaceSchema,
} from '../types/notion-schema.ts'

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  text: 'rich_text',
}

export type DiagramValidationResult =
  | {
      success: true
      diagram: NotionWorkspaceSchema
      json: string
      warnings: string[]
    }
  | { success: false; errors: string[] }

/**
 * Map loose property type names (e.g. "text") to the Notion names the canvas
 * understands. Anything unrecognised is left for schema validation to reject.
 */
export function normalizeNotionSchemaInput(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input

  const root = input as {
    workspace?: {
      databases?: Array<{
        properties?: Array<{ type?: unknown }>
      }>
    }
  }

  if (!Array.isArray(root.workspace?.databases)) return input

  return {
    ...root,
    workspace: {
      ...root.workspace,
      databases: root.workspace.databases.map((database) => ({
        ...database,
        properties: Array.isArray(database?.properties)
          ? database.properties.map((property) => {
              if (
                property?.type &&
                typeof property.type === 'string' &&
                PROPERTY_TYPE_ALIASES[property.type]
              ) {
                return {
                  ...property,
                  type: PROPERTY_TYPE_ALIASES[property.type],
                }
              }

              return property
            })
          : database?.properties,
      })),
    },
  }
}

/**
 * Cross-reference checks the zod schema can't express: unique database ids,
 * unique property names, relations and rollups that point at real targets.
 * Missing relation anchors only cost the canvas an edge handle, so they warn.
 */
function checkReferences(schema: NotionWorkspaceSchema) {
  const errors: string[] = []
  const warnings: string[] = []
  const databasesById = new Map(
    schema.workspace.databases.map((database) => [database.id, database]),
  )

  if (databasesById.size !== schema.workspace.databases.length) {
    const seen = new Set<string>()
    for (const database of schema.workspace.databases) {
      if (seen.has(database.id)) {
        errors.push(`Duplicate database id "${database.id}"`)
      }
      seen.add(database.id)
    }
  }

  for (const database of schema.workspace.databases) {
    const propertyNames = new Set<string>()
    let titleCount = 0

    for (const property of database.properties) {
      if (propertyNames.has(property.name)) {
        errors.push(
          `Database "${database.id}" has duplicate property "${property.name}"`,
        )
      }
      propertyNames.add(property.name)

      if (property.type === 'title') titleCount++

      if (property.relation) {
        const target = databasesById.get(property.relation.targetDatabaseId)
        if (!target) {
          errors.push(
            `Relation "${database.id}.${property.name}" targets unknown database "${property.relation.targetDatabaseId}"`,
          )
          continue
        }

        const anchor =
          property.relation.direction === 'two_way'
            ? property.relation.pairedPropertyName
            : property.relation.targetPropertyName
        if (
          anchor &&
          !target.properties.some((candidate) => candidate.name === anchor)
        ) {
          warnings.push(
            `Relation "${database.id}.${property.name}" references missing property "${anchor}" in "${target.id}"`,
          )
        }
      }
    }

    if (titleCount !== 1) {
      errors.push(
        `Database "${database.id}" must have exactly one title property (found ${titleCount})`,
      )
    }

    for (const property of database.properties) {
      if (!property.rollup) continue

      const relation = database.properties.find(
        (candidate) => candidate.name === property.rollup?.relationPropertyName,
      )
      if (relation?.type !== 'relation') {
        errors.push(
          `Rollup "${database.id}.${property.name}" references missing relation "${property.rollup.relationPropertyName}"`,
        )
        continue
      }

      const target = relation.relation
        ? databasesById.get(relation.relation.targetDatabaseId)
        : undefined
      if (
        target &&
        !target.properties.some(
          (candidate) => candidate.name === property.rollup?.targetPropertyName,
        )
      ) {
        errors.push(
          `Rollup "${database.id}.${property.name}" references missing property "${property.rollup.targetPropertyName}" in "${target.id}"`,
        )
      }
    }
  }

  return { errors, warnings }
}

/**
 * Validate a diagram coming from outside the app's own model call (e.g. an MCP
 * client) and return the canonical JSON string to persist.
 */
export function validateDiagram(input: unknown): DiagramValidationResult {
  let value = input

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return { success: false, errors: ['Diagram is not valid JSON'] }
    }
  }

  const parsed = notionWorkspaceSchema.safeParse(
    normalizeNotionSchemaInput(value),
  )

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    }
  }

  const diagram = parsed.data as NotionWorkspaceSchema
  const { errors, warnings } = checkReferences(diagram)

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    diagram,
    json: JSON.stringify(diagram, null, 2),
    warnings,
  }
}
