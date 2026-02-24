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
      className="bg-white dark:bg-card shadow-xl rounded-lg w-72 border overflow-hidden"
      style={{ borderColor: data.color.border }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      <div
        className="p-3"
        style={{
          backgroundColor: data.color.background,
          color: data.color.text,
          borderBottom: `1px solid ${data.color.border}`,
        }}
      >
        <h1 className="text-lg font-semibold truncate">{data.label}</h1>
        {data.description && (
          <p className="text-xs/4 mt-1 opacity-80 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
      <div className="p-3">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-muted-foreground mb-2">
          Properties
        </h2>
        <ul className="space-y-1 text-xs">
          {data.properties.map((property) => (
            <li
              key={`${id}-${property.name}`}
              className="flex justify-between items-center gap-2 p-1.5 bg-gray-50 dark:bg-muted hover:bg-gray-100 dark:hover:bg-muted-foreground/10 rounded border border-transparent"
              style={
                property.isRelation && property.targetDatabaseColor
                  ? { borderLeftColor: property.targetDatabaseColor, borderLeftWidth: 3 }
                  : undefined
              }
            >
              <div className="min-w-0 flex items-center gap-1.5">
                {property.isRelation && property.targetDatabaseColor && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: property.targetDatabaseColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="font-medium text-gray-700 dark:text-foreground truncate">
                  {property.name}
                </span>
                {property.isRelation && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {property.relationDirection === 'two_way' ? '↔' : '→'}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 shrink-0">
                {property.isRelation && property.targetDatabaseName && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full border"
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
                <span className="text-gray-500 dark:text-muted-foreground bg-gray-200 dark:bg-muted px-1.5 py-0.5 rounded-full text-xxs">
                  {property.type}
                </span>
              </span>
            </li>
          ))}
          {data.properties.length === 0 && (
            <li className="text-gray-400 dark:text-muted-foreground italic">
              No properties defined.
            </li>
          )}
        </ul>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </div>
  )
}
