import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react'
import { useEffect } from 'react'
import type { NotionColor } from './notion-colors'
import {
  getDefaultSourceHandleId,
  getDefaultTargetHandleId,
  getPropertySourceHandleId,
  getPropertyTargetHandleId,
} from './property-handles'

const hiddenHandleStyle = {
  width: 10,
  height: 10,
  background: 'transparent',
  border: 0,
  opacity: 0,
  pointerEvents: 'none' as const,
  zIndex: 2,
}

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
  const propertiesLayoutSignature = data.properties
    .map(
      (property) =>
        `${property.name}:${property.type}:${property.targetDatabaseName || ''}:${property.relationDirection || ''}`,
    )
    .join('|')

  // biome-ignore lint/correctness/useExhaustiveDependencies: width/handle geometry depends on rendered content
  useEffect(() => {
    updateNodeInternals(id)
  }, [
    id,
    data.label,
    data.description,
    data.properties.length,
    propertiesLayoutSignature,
    updateNodeInternals,
  ])

  return (
    <div className="relative inline-block overflow-visible">
      <div
        className="min-w-[18.5rem] max-w-[42rem] overflow-hidden rounded-2xl border bg-card shadow-[0_1px_0_0_var(--line-subtle)]"
        style={{ borderColor: `${data.color.border}88` }}
      >
        <div
          className="relative border-b p-3"
          style={{
            backgroundColor: data.color.background,
            color: data.color.text,
            borderBottomColor: `${data.color.border}88`,
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            id={getDefaultTargetHandleId('left')}
            style={hiddenHandleStyle}
          />
          <Handle
            type="source"
            position={Position.Left}
            id={getDefaultSourceHandleId('left')}
            style={hiddenHandleStyle}
          />
          <Handle
            type="target"
            position={Position.Right}
            id={getDefaultTargetHandleId('right')}
            style={hiddenHandleStyle}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={getDefaultSourceHandleId('right')}
            style={hiddenHandleStyle}
          />

          <h1 className="truncate pr-4 text-[15px] font-semibold tracking-tight">
            {data.label}
          </h1>
          {data.description && (
            <p className="mt-1 line-clamp-2 pr-4 text-xs/4 opacity-80">
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
                className="relative flex items-start justify-between gap-2 rounded-xl border border-transparent bg-[color:var(--surface)] p-2 transition-colors hover:bg-accent/50"
                style={
                  property.isRelation && property.targetDatabaseColor
                    ? {
                        borderLeftColor: property.targetDatabaseColor,
                        borderLeftWidth: 3,
                      }
                    : undefined
                }
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={getPropertyTargetHandleId(property.name, 'left')}
                  style={{ ...hiddenHandleStyle, top: '50%', left: -5 }}
                />
                <Handle
                  type="source"
                  position={Position.Left}
                  id={getPropertySourceHandleId(property.name, 'left')}
                  style={{ ...hiddenHandleStyle, top: '50%', left: -5 }}
                />
                <Handle
                  type="target"
                  position={Position.Right}
                  id={getPropertyTargetHandleId(property.name, 'right')}
                  style={{ ...hiddenHandleStyle, top: '50%', right: -5 }}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={getPropertySourceHandleId(property.name, 'right')}
                  style={{ ...hiddenHandleStyle, top: '50%', right: -5 }}
                />

                <div className="min-w-0 flex flex-1 items-start gap-1.5">
                  {property.isRelation && property.targetDatabaseColor && (
                    <span
                      className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: property.targetDatabaseColor }}
                      aria-hidden="true"
                    />
                  )}

                  <span className="whitespace-normal break-words font-medium text-foreground">
                    {property.name}
                  </span>

                  {property.isRelation && (
                    <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">
                      {property.relationDirection === 'two_way' ? '↔' : '→'}
                    </span>
                  )}
                </div>

                <span className="flex shrink-0 items-center gap-1">
                  {property.isRelation && property.targetDatabaseName && (
                    <span
                      className="rounded-full border px-1.5 py-0.5 text-[10px]"
                      style={{
                        borderColor:
                          property.targetDatabaseColor || 'var(--border)',
                        color:
                          property.relationResolved === false
                            ? '#b91c1c'
                            : undefined,
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

                  <span className="rounded-full border border-border/70 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
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
      </div>
    </div>
  )
}
