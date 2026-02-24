import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { CSSProperties } from 'react'
import type { EdgeProps } from '@xyflow/react'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style = {},
  markerEnd,
  markerStart,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
      />
      <EdgeLabelRenderer>
        {label && (
          <div
            style={
              {
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 12,
                pointerEvents: 'none',
                borderColor:
                  typeof style === 'object' && style && 'stroke' in style
                    ? ((style as CSSProperties).stroke as string)
                    : undefined,
              } satisfies CSSProperties
            }
            className="nodrag nopan bg-background text-foreground border border-muted-foreground/50 rounded-md px-2 py-1"
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
