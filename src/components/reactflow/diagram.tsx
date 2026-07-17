'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { parseNotionSchemaGraph } from '@/lib/parse-utils'
import { useChatStore } from '@/stores/chat'
import type { ParsedNotionProperty } from '@/types/notion-schema'
import Dagre from '@dagrejs/dagre'
import { LayoutGrid } from '@/components/ui/icons'
import CustomEdge from './custom-edge'
import CustomNode from './custom-node'
import { getNotionDatabaseColor } from './notion-colors'
import {
  type HandleSide,
  getDefaultTargetHandleId,
  getPropertySourceHandleId,
  getPropertyTargetHandleId,
} from './property-handles'

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
type EdgeLineMode = 'straight' | 'curved'
type AppEdge = Edge<{
  lineMode: EdgeLineMode
  sourcePropertyName?: string
  targetPropertyName?: string
}>
type NodePositionMap = Record<string, { x: number; y: number }>
type LayoutIntent = 'none' | 'all' | 'missing-only'
type DiagramProps = {
  diagram?: string | null
  chatId?: string | null
  storedNodePositions?: NodePositionMap
  persistNodePositions?: boolean
  showCanvasActions?: boolean
}

const EMPTY_POSITIONS_BY_CHAT: Record<string, NodePositionMap> = {}
const EMPTY_NODE_POSITIONS: NodePositionMap = {}

const nodeTypes = {
  test: CustomNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

const FIT_VIEW_OPTIONS = {
  padding: 0.18,
  minZoom: 0.2,
  maxZoom: 1.2,
} as const

function areAllNodesMeasured(nodes: AppNode[]) {
  return nodes.every(
    (node) =>
      node.measured?.width &&
      node.measured?.height &&
      node.measured.width > 0 &&
      node.measured.height > 0,
  )
}

function extractNodePositions(nodes: AppNode[]): NodePositionMap {
  return Object.fromEntries(
    nodes.map((node) => [node.id, { x: node.position.x, y: node.position.y }]),
  )
}

function getNodeCenterX(node: AppNode) {
  const width = node.measured?.width || 260
  const x = node.position.x
  return x + width / 2
}

function getFacingHandleSides(
  sourceNode: AppNode | undefined,
  targetNode: AppNode | undefined,
): { sourceSide: HandleSide; targetSide: HandleSide } {
  if (!sourceNode || !targetNode) {
    return { sourceSide: 'right', targetSide: 'left' }
  }

  return getNodeCenterX(sourceNode) <= getNodeCenterX(targetNode)
    ? { sourceSide: 'right', targetSide: 'left' }
    : { sourceSide: 'left', targetSide: 'right' }
}

function getExistingPropertyName(
  node: AppNode | undefined,
  propertyName: string | undefined,
) {
  if (!node || !propertyName) {
    return undefined
  }

  const normalizedPropertyName = propertyName.trim()

  return node.data.properties.find(
    (property) => property.name.trim() === normalizedPropertyName,
  )?.name
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

export function Diagram({
  diagram: controlledDiagram,
  chatId: controlledChatId,
  storedNodePositions,
  persistNodePositions = true,
  showCanvasActions = true,
}: DiagramProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [edgeLineMode, setEdgeLineMode] = useState<EdgeLineMode>('straight')
  const storeChatDiagram = useChatStore(
    isMounted ? (state) => state.chatDiagram : () => null,
  )
  const storeChatId = useChatStore(
    isMounted ? (state) => state.chatId : () => null,
  )
  const diagramNodePositionsByChatId = useChatStore(
    isMounted
      ? (state) => state.diagramNodePositionsByChatId
      : () => EMPTY_POSITIONS_BY_CHAT,
  )
  const setDiagramNodePositions = useChatStore(
    (state) => state.setDiagramNodePositions,
  )
  const pruneDiagramNodePositions = useChatStore(
    (state) => state.pruneDiagramNodePositions,
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([])
  const { fitView } = useReactFlow()

  const pendingLayoutIntentRef = useRef<LayoutIntent>('none')
  const pendingLayoutShouldFitRef = useRef(false)
  const latestNodesRef = useRef<AppNode[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    latestNodesRef.current = nodes
  }, [nodes])

  const usesStoreData = controlledDiagram === undefined
  const rawChatDiagram = usesStoreData ? storeChatDiagram : controlledDiagram
  const activeChatId = usesStoreData ? storeChatId : (controlledChatId ?? null)
  const activeStoredPositions = persistNodePositions
    ? usesStoreData
      ? isMounted && activeChatId
        ? diagramNodePositionsByChatId[activeChatId] || EMPTY_NODE_POSITIONS
        : EMPTY_NODE_POSITIONS
      : (storedNodePositions ?? EMPTY_NODE_POSITIONS)
    : EMPTY_NODE_POSITIONS

  const fitCanvas = useCallback(() => {
    requestAnimationFrame(() => {
      fitView(FIT_VIEW_OPTIONS)
    })
  }, [fitView])

  const persistPositionsForNodes = useCallback(
    (nodesToPersist: AppNode[]) => {
      if (!persistNodePositions || !activeChatId) return
      setDiagramNodePositions(
        activeChatId,
        extractNodePositions(nodesToPersist),
      )
    },
    [activeChatId, persistNodePositions, setDiagramNodePositions],
  )

  const persistLatestNodePositions = useCallback(() => {
    if (!persistNodePositions || !activeChatId) return
    persistPositionsForNodes(latestNodesRef.current)
  }, [activeChatId, persistNodePositions, persistPositionsForNodes])

  const applyLayout = useCallback(
    (mode: Exclude<LayoutIntent, 'none'>, fitAfterLayout: boolean) => {
      if (nodes.length === 0 || !areAllNodesMeasured(nodes)) {
        return false
      }

      const layouted = getLayoutedElements(nodes, edges, { direction: 'LR' })
      const layoutedNodeMap = new Map(
        layouted.nodes.map((node) => [node.id, node]),
      )

      const nextNodes = nodes.map((node) => {
        if (mode === 'missing-only' && activeStoredPositions[node.id]) {
          return node
        }

        return layoutedNodeMap.get(node.id) || node
      })

      setNodes(nextNodes)
      persistPositionsForNodes(nextNodes)

      if (fitAfterLayout) {
        fitCanvas()
      }

      return true
    },
    [
      nodes,
      edges,
      activeStoredPositions,
      setNodes,
      persistPositionsForNodes,
      fitCanvas,
    ],
  )

  const handleFormatCanvas = useCallback(() => {
    applyLayout('all', true)
  }, [applyLayout])

  const toggleEdgeLineMode = useCallback(() => {
    setEdgeLineMode((current) =>
      current === 'straight' ? 'curved' : 'straight',
    )
  }, [])

  const schedulePersistAfterDrag = useCallback(() => {
    if (!persistNodePositions) return
    requestAnimationFrame(() => {
      persistLatestNodePositions()
    })
  }, [persistLatestNodePositions, persistNodePositions])

  useEffect(() => {
    if ((usesStoreData && !isMounted) || rawChatDiagram === null) {
      setNodes([])
      setEdges([])
      pendingLayoutIntentRef.current = 'none'
      pendingLayoutShouldFitRef.current = false
      return
    }

    const graph = parseNotionSchemaGraph(rawChatDiagram)
    const storedPositionsForChat = activeStoredPositions
    const databaseColorMap = new Map(
      graph.databases.map((database) => [
        database.id,
        getNotionDatabaseColor(database.id),
      ]),
    )

    const newInitialNodes: AppNode[] = graph.databases.map((database, i) => {
      const dbColor =
        databaseColorMap.get(database.id) || getNotionDatabaseColor(database.id)
      const storedPosition = storedPositionsForChat[database.id]

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
        position: storedPosition || { x: 0, y: 0 },
      }
    })

    const newInitialEdges: AppEdge[] = graph.relations.map((relation) => {
      const targetColor =
        databaseColorMap.get(relation.targetDatabaseId)?.border || '#94a3b8'
      const isBidirectional = relation.direction === 'two_way'
      const sourceNode = newInitialNodes.find(
        (node) => node.id === relation.sourceDatabaseId,
      )
      const targetNode = newInitialNodes.find(
        (node) => node.id === relation.targetDatabaseId,
      )
      const { sourceSide, targetSide } = getFacingHandleSides(
        sourceNode,
        targetNode,
      )
      const targetPropertyName = getExistingPropertyName(
        targetNode,
        relation.targetPropertyName,
      )

      const label = isBidirectional
        ? `${relation.sourcePropertyName} ↔ ${relation.targetDatabaseName}${relation.pairedPropertyName ? ` (${relation.pairedPropertyName})` : ''}`
        : `${relation.sourcePropertyName} → ${relation.targetDatabaseName}${relation.targetPropertyName ? ` (${relation.targetPropertyName})` : ''}`

      return {
        id: relation.id,
        source: relation.sourceDatabaseId,
        target: relation.targetDatabaseId,
        sourceHandle: getPropertySourceHandleId(
          relation.sourcePropertyName,
          sourceSide,
        ),
        targetHandle: targetPropertyName
          ? getPropertyTargetHandleId(targetPropertyName, targetSide)
          : getDefaultTargetHandleId(targetSide),
        label,
        type: 'custom',
        data: {
          lineMode: edgeLineMode,
          sourcePropertyName: relation.sourcePropertyName,
          targetPropertyName,
        },
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

    const validNodeIds = newInitialNodes.map((node) => node.id)
    if (persistNodePositions && activeChatId) {
      pruneDiagramNodePositions(activeChatId, validNodeIds)
    }

    const storedMatchCount = newInitialNodes.filter(
      (node) => storedPositionsForChat[node.id],
    ).length

    let nextLayoutIntent: LayoutIntent = 'none'
    let shouldFitAfterAutoLayout = false

    if (newInitialNodes.length > 0) {
      if (storedMatchCount === 0) {
        nextLayoutIntent = 'all'
        shouldFitAfterAutoLayout = true
      } else if (storedMatchCount < newInitialNodes.length) {
        nextLayoutIntent = 'missing-only'
      }
    }

    pendingLayoutIntentRef.current = nextLayoutIntent
    pendingLayoutShouldFitRef.current = shouldFitAfterAutoLayout

    setNodes(newInitialNodes)
    setEdges(newInitialEdges)
  }, [
    isMounted,
    usesStoreData,
    rawChatDiagram,
    activeChatId,
    activeStoredPositions,
    persistNodePositions,
    edgeLineMode,
    pruneDiagramNodePositions,
    setNodes,
    setEdges,
  ])

  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        data: {
          ...(edge.data || {}),
          lineMode: edgeLineMode,
        },
      })),
    )
  }, [edgeLineMode, setEdges])

  useEffect(() => {
    if (nodes.length === 0) {
      return
    }

    const nodesById = new Map(nodes.map((node) => [node.id, node]))

    setEdges((currentEdges) => {
      let changed = false

      const nextEdges = currentEdges.map((edge) => {
        const sourceNode = nodesById.get(edge.source)
        const targetNode = nodesById.get(edge.target)
        const { sourceSide, targetSide } = getFacingHandleSides(
          sourceNode,
          targetNode,
        )
        const nextSourceHandle = edge.data?.sourcePropertyName
          ? getPropertySourceHandleId(edge.data.sourcePropertyName, sourceSide)
          : edge.sourceHandle
        const targetPropertyName = getExistingPropertyName(
          targetNode,
          edge.data?.targetPropertyName,
        )
        const nextTargetHandle = targetPropertyName
          ? getPropertyTargetHandleId(targetPropertyName, targetSide)
          : getDefaultTargetHandleId(targetSide)

        if (
          edge.sourceHandle === nextSourceHandle &&
          edge.targetHandle === nextTargetHandle &&
          edge.data?.targetPropertyName === targetPropertyName
        ) {
          return edge
        }

        changed = true

        return {
          ...edge,
          sourceHandle: nextSourceHandle,
          targetHandle: nextTargetHandle,
          data: {
            ...(edge.data || {}),
            lineMode: edge.data?.lineMode ?? edgeLineMode,
            targetPropertyName,
          },
        }
      })

      return changed ? nextEdges : currentEdges
    })
  }, [nodes, edgeLineMode, setEdges])

  useEffect(() => {
    if ((usesStoreData && !isMounted) || nodes.length === 0) {
      return
    }

    const pendingLayoutIntent = pendingLayoutIntentRef.current
    if (pendingLayoutIntent === 'none') {
      return
    }

    if (!areAllNodesMeasured(nodes)) {
      return
    }

    const shouldFit = pendingLayoutShouldFitRef.current
    pendingLayoutIntentRef.current = 'none'
    pendingLayoutShouldFitRef.current = false

    applyLayout(pendingLayoutIntent, shouldFit)
  }, [nodes, isMounted, usesStoreData, applyLayout])

  if (usesStoreData && !isMounted) {
    return null
  }

  const canFormatCanvas = nodes.length > 0 && areAllNodesMeasured(nodes)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={persistNodePositions ? schedulePersistAfterDrag : undefined}
      onSelectionDragStop={
        persistNodePositions ? schedulePersistAfterDrag : undefined
      }
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      minZoom={0.1}
      maxZoom={1.5}
      zoomOnScroll={false}
      panOnScroll
      fitView={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={18}
        size={1}
        color="var(--canvas-dot)"
      />

      {showCanvasActions ? (
        <Panel position="bottom-left" className="mb-28 ml-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFormatCanvas}
              disabled={!canFormatCanvas}
              className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Formatear canvas"
              title="Formatear canvas"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Formatear</span>
            </button>

            <button
              type="button"
              onClick={toggleEdgeLineMode}
              disabled={edges.length === 0}
              className="flex h-8 items-center rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cambiar estilo de líneas"
              title="Cambiar líneas entre rectas y curvas"
            >
              {edgeLineMode === 'straight'
                ? 'Líneas: rectas'
                : 'Líneas: curvas'}
            </button>
          </div>
        </Panel>
      ) : null}

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
