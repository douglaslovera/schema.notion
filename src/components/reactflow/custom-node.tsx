import { useEffect } from 'react'
import { useUpdateNodeInternals, Handle, Position } from '@xyflow/react'
import type { NotionColor } from './notion-colors'

type Props = {
  id: string
  data: {
    label: string
    description?: string
    color: NotionColor
    properties: Array<{
      name: string
      type: string
      isRelation?: boolean
      relationDirection?: 'one_way' | 'two_way'
      targetDatabaseName?: string
      targetDatabaseColor?: string
      relationResolved?: boolean
    }>
  }
}

export default function CustomNode({ id, data }: Props) {
  const updateNodeInternals = useUpdateNodeInternals()

  // biome-ignore lint/correctness/useExhaustiveDependencies: .-.
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, data.properties.length, updateNodeInternals])

  return (
    <div
      className="w-[18.5rem] overflow-hidden rounded-2xl border bg-card shadow-[0_1px_0_0_var(--line-subtle)]"
      style={{ borderColor: `${data.color.border}88` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: data.color.border, width: 8, height: 8 }}
      />
      <div
        className="border-b p-3"
        style={{
          backgroundColor: data.color.background,
          color: data.color.text,
          borderBottomColor: `${data.color.border}88`,
        }}
      >
        <h1 className="truncate text-[15px] font-semibold tracking-tight">
          {data.label}
        </h1>
        {data.description && (
          <p className="mt-1 line-clamp-2 text-xs/4 opacity-80">
            {data.description}
          </p>
        )}
      </div>
      <div className="p-3">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Properties
        </h2>
        <ul className="space-y-1 text-xs">
          {data.properties.map((property) => (
            <li
              key={`${id}-${property.name}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-transparent bg-[color:var(--surface)] p-2 transition-colors hover:bg-accent/50"
              style={
                property.isRelation && property.targetDatabaseColor
                  ? {
                      borderLeftColor: property.targetDatabaseColor,
                      borderLeftWidth: 3,
                    }
                  : undefined
              }
            >
              <div className="min-w-0 flex items-center gap-1.5">
                {property.isRelation && property.targetDatabaseColor && (
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: property.targetDatabaseColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="truncate font-medium text-foreground">
                  {property.name}
                </span>
                {property.isRelation && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {property.relationDirection === 'two_way' ? '↔' : '→'}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 shrink-0">
                {property.isRelation && property.targetDatabaseName && (
                  <span
                    className="rounded-full border px-1.5 py-0.5 text-[10px]"
                    style={{
                      borderColor:
                        property.targetDatabaseColor || 'var(--border)',
                      color: property.relationResolved === false ? '#b91c1c' : undefined,
                    }}
                    title={
                      property.relationResolved === false
                        ? 'Target database not found'
                        : `Related to ${property.targetDatabaseName}`
                    }
                  >
                    {property.targetDatabaseName}
                  </span>
                )}
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border/70">
                  {property.type}
                </span>
              </span>
            </li>
          ))}
          {data.properties.length === 0 && (
            <li className="italic text-muted-foreground">
              No properties defined.
            </li>
          )}
        </ul>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: data.color.border, width: 8, height: 8 }}
      />
    </div>
  )
}
