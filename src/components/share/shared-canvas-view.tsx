'use client'

import { Diagram } from '@/components/reactflow/diagram'
import { ReactFlowProvider } from '@xyflow/react'

export function SharedCanvasView({ diagram }: { diagram: string }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-background subtle-canvas">
      <ReactFlowProvider>
        <Diagram
          diagram={diagram}
          persistNodePositions={false}
          showCanvasActions={false}
        />
      </ReactFlowProvider>
    </div>
  )
}
