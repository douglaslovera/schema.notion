'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Dagre from '@dagrejs/dagre'
import CustomEdge from './custom-edge'
import CustomNode from './custom-node'
import { getNotionDatabaseColor } from './notion-colors'
import { parseNotionSchemaGraph } from '@/lib/parse-utils'
import type { ParsedNotionProperty } from '@/types/notion-schema'
import { useChatStore } from '@/stores/chat'

interface NodeData {
  label: string
  description?: string
  color: ReturnType<typeof getNotionDatabaseColor>
  properties: Array<
    ParsedNotionProperty & {
      targetDatabaseColor?: string
    }
  >
  [key: string]: unknown
}

type AppNode = Node<NodeData, string>
type AppEdge = Edge

const nodeTypes = {
  test: CustomNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

const getLayoutedElements = (
  nodesToLayout: AppNode[],
  edgesToLayout: AppEdge[],
  options: { direction: string },
) => {
  const dagreGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({
    rankdir: options.direction,
    nodesep: 120,
    ranksep: 180,
    marginx: 20,
    marginy: 20,
  })

  for (const edge of edgesToLayout) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  for (const node of nodesToLayout) {
    const nodeWidth = node.measured?.width || 260
    const baseHeight = 100
    const estimatedHeight = baseHeight + node.data.properties.length * 34
    const nodeHeight = node.measured?.height || estimatedHeight

    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    })
  }

  Dagre.layout(dagreGraph)

  const layoutedNodes = nodesToLayout.map((node) => {
    const dagreNodeInfo = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: dagreNodeInfo.x - dagreNodeInfo.width / 2,
        y: dagreNodeInfo.y - dagreNodeInfo.height / 2,
      },
      positionAbsolute: undefined,
      dragging: false,
    }
  })

  return {
    nodes: layoutedNodes,
    edges: edgesToLayout,
  }
}

export function Diagram() {
  const [isMounted, setIsMounted] = useState(false)
  const rawChatDiagram = useChatStore(
    isMounted ? (state) => state.chatDiagram : () => null,
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([])
  const { fitView } = useReactFlow()
  const initialLayoutPerformedRef = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || rawChatDiagram === null) {
      setNodes([])
      setEdges([])
      initialLayoutPerformedRef.current = false
      return
    }

    const graph = parseNotionSchemaGraph(rawChatDiagram)
    const databaseColorMap = new Map(
      graph.databases.map((database) => [database.id, getNotionDatabaseColor(database.id)]),
    )

    const newInitialNodes: AppNode[] = graph.databases.map((database, i) => {
      const dbColor = databaseColorMap.get(database.id) || getNotionDatabaseColor(database.id)

      return {
        id: database.id || `node-${i}`,
        data: {
          label: database.name,
          description: database.description,
          color: dbColor,
          properties: database.properties.map((property) => ({
            ...property,
            targetDatabaseColor: property.targetDatabaseId
              ? databaseColorMap.get(property.targetDatabaseId)?.border
              : undefined,
          })),
        },
        type: 'test',
        position: { x: 0, y: 0 },
      }
    })

    const newInitialEdges: AppEdge[] = graph.relations.map((relation) => {
      const targetColor =
        databaseColorMap.get(relation.targetDatabaseId)?.border || '#94a3b8'
      const isBidirectional = relation.direction === 'two_way'

      const label = isBidirectional
        ? `${relation.sourcePropertyName} ↔ ${relation.targetDatabaseName}${relation.pairedPropertyName ? ` (${relation.pairedPropertyName})` : ''}`
        : `${relation.sourcePropertyName} → ${relation.targetDatabaseName}`

      return {
        id: relation.id,
        source: relation.sourceDatabaseId,
        target: relation.targetDatabaseId,
        label,
        type: 'custom',
        style: {
          stroke: targetColor,
          strokeWidth: 2,
          ...(isBidirectional ? {} : { strokeDasharray: '6 4' }),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: targetColor,
          width: 18,
          height: 18,
        },
        markerStart: isBidirectional
          ? {
              type: MarkerType.ArrowClosed,
              color: targetColor,
              width: 18,
              height: 18,
            }
          : undefined,
      }
    })

    setNodes(newInitialNodes)
    setEdges(newInitialEdges)
    initialLayoutPerformedRef.current = false
  }, [isMounted, rawChatDiagram, setNodes, setEdges])

  useEffect(() => {
    if (!isMounted || nodes.length === 0 || initialLayoutPerformedRef.current) {
      return
    }

    const allNodesMeasured = nodes.every(
      (node) =>
        node.measured?.width &&
        node.measured?.height &&
        node.measured.width > 0 &&
        node.measured.height > 0,
    )

    if (allNodesMeasured) {
      const layouted = getLayoutedElements(nodes, edges, { direction: 'LR' })
      setNodes(layouted.nodes)
      initialLayoutPerformedRef.current = true

      requestAnimationFrame(() => {
        fitView({
          padding: 0.18,
          minZoom: 0.2,
          maxZoom: 1.2,
        })
      })
    }
  }, [nodes, edges, fitView, isMounted, setNodes])

  if (!isMounted) {
    return null
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      minZoom={0.1}
      maxZoom={1.5}
      fitView={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={18}
        size={1}
        color="var(--canvas-dot)"
      />
      <div className="text-foreground">
        <Controls
          position="bottom-right"
          className="[&>button]:!h-8 [&>button]:!w-8 [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button]:!shadow-xs [&>button:hover]:!bg-accent [&>button:hover]:!text-foreground"
          showInteractive={false}
        />
      </div>
    </ReactFlow>
  )
}
