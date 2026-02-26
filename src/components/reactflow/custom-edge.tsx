import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
} from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { CSSProperties } from 'react'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  style = {},
  markerEnd,
  markerStart,
}: EdgeProps) {
  const lineMode =
    (data as { lineMode?: 'straight' | 'curved' } | undefined)?.lineMode ||
    'straight'

  const [edgePath, labelX, labelY] =
    lineMode === 'curved'
      ? getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0,
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
                fontSize: 11,
                pointerEvents: 'none',
                borderColor:
                  typeof style === 'object' && style && 'stroke' in style
                    ? ((style as CSSProperties).stroke as string)
                    : undefined,
              } satisfies CSSProperties
            }
            className="nodrag nopan rounded-full border bg-background/95 px-2.5 py-1 text-muted-foreground shadow-xs backdrop-blur-sm"
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
