'use client'

import {
  notionWorkspaceSchema,
  type ParsedNotionGraph,
  type ParsedNotionRelationEdge,
  type ParsedNotionProperty,
} from '@/types/notion-schema'

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  text: 'rich_text',
}

function getBidirectionalRelationKey(relation: ParsedNotionRelationEdge) {
  if (relation.direction !== 'two_way' || !relation.targetPropertyName) {
    return null
  }

  const endpoints = [
    `${relation.sourceDatabaseId}:${relation.sourcePropertyName}`,
    `${relation.targetDatabaseId}:${relation.targetPropertyName}`,
  ].toSorted()

  return endpoints.join('<->')
}

function normalizeNotionSchemaInput(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input

  const root = input as {
    workspace?: {
      databases?: Array<{
        properties?: Array<{ type?: unknown }>
      }>
    }
  }

  if (!root.workspace?.databases) return input

  return {
    ...root,
    workspace: {
      ...root.workspace,
      databases: root.workspace.databases.map((database) => ({
        ...database,
        properties: database.properties?.map((property) => {
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
        }),
      })),
    },
  }
}

export function parseNotionSchemaGraph(jsonString: string): ParsedNotionGraph {
  if (!jsonString) {
    return { workspaceName: 'Workspace', databases: [], relations: [] }
  }

  try {
    const parsedJson = JSON.parse(jsonString)
    const normalizedInput = normalizeNotionSchemaInput(parsedJson)
    const parsed = notionWorkspaceSchema.safeParse(normalizedInput)

    if (!parsed.success) {
      console.error('Invalid Notion schema JSON:', parsed.error.issues)
      return { workspaceName: 'Workspace', databases: [], relations: [] }
    }

    const schema = parsed.data
    const databaseIds = new Set(schema.workspace.databases.map((db) => db.id))

    const databases = schema.workspace.databases.map((db) => {
      const properties: ParsedNotionProperty[] = db.properties.map((property) => {
        const isRelation = property.type === 'relation'
        const targetExists =
          isRelation && property.relation
            ? databaseIds.has(property.relation.targetDatabaseId)
            : false

        return {
          ...property,
          isRelation,
          relationResolved: Boolean(targetExists),
          relationDirection: property.relation?.direction,
          targetDatabaseId: property.relation?.targetDatabaseId,
          targetDatabaseName: property.relation?.targetDatabaseName,
        }
      })

      return {
        id: db.id,
        name: db.name,
        description: db.description,
        properties,
      }
    })

    const rawRelations = databases.flatMap((db) =>
      db.properties.flatMap((property): ParsedNotionRelationEdge[] => {
        if (!property.isRelation || !property.relation || !property.relationResolved) {
          if (property.isRelation && !property.relationResolved) {
            console.warn(
              `Relation property "${property.name}" in "${db.name}" points to unknown database "${property.targetDatabaseId}"`,
            )
          }
          return []
        }

        return [
          {
            id: `rel-${db.id}-${property.name}-${property.relation.targetDatabaseId}`,
            sourceDatabaseId: db.id,
            sourceDatabaseName: db.name,
            sourcePropertyName: property.name,
            targetDatabaseId: property.relation.targetDatabaseId,
            targetDatabaseName: property.relation.targetDatabaseName,
            targetPropertyName:
              property.relation.direction === 'two_way'
                ? property.relation.pairedPropertyName
                : property.relation.targetPropertyName,
            direction: property.relation.direction,
            pairedPropertyName: property.relation.pairedPropertyName,
          },
        ]
      }),
    )

    const seenBidirectionalRelationKeys = new Set<string>()
    const relations = rawRelations.filter((relation) => {
      const bidirectionalRelationKey = getBidirectionalRelationKey(relation)

      if (!bidirectionalRelationKey) {
        return true
      }

      if (seenBidirectionalRelationKeys.has(bidirectionalRelationKey)) {
        return false
      }

      seenBidirectionalRelationKeys.add(bidirectionalRelationKey)
      return true
    })

    return {
      workspaceName: schema.workspace.name,
      databases,
      relations,
    }
  } catch (error) {
    console.error('Error parsing Notion schema JSON:', error)
    return { workspaceName: 'Workspace', databases: [], relations: [] }
  }
}
