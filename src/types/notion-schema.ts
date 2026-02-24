import { z } from 'zod'

export const notionPropertyTypes = [
  'title',
  'rich_text',
  'number',
  'select',
  'multi_select',
  'status',
  'date',
  'people',
  'files',
  'checkbox',
  'url',
  'email',
  'phone_number',
  'formula',
  'relation',
  'rollup',
  'created_time',
  'created_by',
  'last_edited_time',
  'last_edited_by',
  'unique_id',
  'button',
] as const

export type NotionPropertyType = (typeof notionPropertyTypes)[number]
export type RelationDirection = 'one_way' | 'two_way'

export interface RelationPropertyMetadata {
  targetDatabaseId: string
  targetDatabaseName: string
  direction: RelationDirection
  pairedPropertyName?: string
}

export interface RollupPropertyMetadata {
  relationPropertyName: string
  targetPropertyName: string
  function: string
}

export interface NotionProperty {
  name: string
  type: NotionPropertyType
  options?: string[]
  numberFormat?: string
  expression?: string
  relation?: RelationPropertyMetadata
  rollup?: RollupPropertyMetadata
}

export interface NotionDatabase {
  id: string
  name: string
  description?: string
  properties: NotionProperty[]
}

export interface NotionWorkspaceSchema {
  workspace: {
    name: string
    databases: NotionDatabase[]
  }
}

const relationMetadataSchema = z
  .object({
    targetDatabaseId: z.string().min(1),
    targetDatabaseName: z.string().min(1),
    direction: z.enum(['one_way', 'two_way']),
    pairedPropertyName: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.direction === 'two_way' && !value.pairedPropertyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'pairedPropertyName is required for two_way relations',
        path: ['pairedPropertyName'],
      })
    }
  })

const rollupMetadataSchema = z.object({
  relationPropertyName: z.string().min(1),
  targetPropertyName: z.string().min(1),
  function: z.string().min(1),
})

export const notionPropertySchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(notionPropertyTypes),
    options: z.array(z.string()).optional(),
    numberFormat: z.string().optional(),
    expression: z.string().optional(),
    relation: relationMetadataSchema.optional(),
    rollup: rollupMetadataSchema.optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (value.type === 'relation' && !value.relation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'relation metadata is required when type is relation',
        path: ['relation'],
      })
    }
    if (value.type === 'rollup' && !value.rollup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rollup metadata is required when type is rollup',
        path: ['rollup'],
      })
    }
  })

export const notionDatabaseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    properties: z.array(notionPropertySchema),
  })
  .passthrough()

export const notionWorkspaceSchema = z
  .object({
    workspace: z
      .object({
        name: z.string().min(1),
        databases: z.array(notionDatabaseSchema),
      })
      .passthrough(),
  })
  .passthrough()

export type ParsedNotionProperty = NotionProperty & {
  isRelation: boolean
  relationResolved: boolean
  relationDirection?: RelationDirection
  targetDatabaseId?: string
  targetDatabaseName?: string
}

export interface ParsedNotionDatabase {
  id: string
  name: string
  description?: string
  properties: ParsedNotionProperty[]
}

export interface ParsedNotionRelationEdge {
  id: string
  sourceDatabaseId: string
  sourceDatabaseName: string
  sourcePropertyName: string
  targetDatabaseId: string
  targetDatabaseName: string
  direction: RelationDirection
  pairedPropertyName?: string
}

export interface ParsedNotionGraph {
  workspaceName: string
  databases: ParsedNotionDatabase[]
  relations: ParsedNotionRelationEdge[]
}
