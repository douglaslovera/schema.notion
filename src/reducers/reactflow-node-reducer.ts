import type { Node, NodeChange } from '@xyflow/react'
import { applyNodeChanges } from '@xyflow/react'
import type { NotionDatabase, NotionProperty } from '@/types/notion-schema'

export type TableNode = Node<{
  label: string
  properties: NotionProperty[]
}>

export type NodeAction =
  | { type: 'INIT_NODES'; payload: NotionDatabase[] }
  | { type: 'ADD_NODE'; payload: NotionDatabase }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'UPDATE_NODES'; payload: { changes: NodeChange[] } }

const nodesPerRow = 3
const horizontalSpacing = 300
const verticalSpacing = 250

export function nodesReducer(
  state: TableNode[],
  action: NodeAction,
): TableNode[] {
  switch (action.type) {
    case 'INIT_NODES': {
      return action.payload.map((database, index) => {
        const rowIndex = Math.floor(index / nodesPerRow)
        const colIndex = index % nodesPerRow

        return {
          id: database.id,
          type: 'test',
          position: {
            x: colIndex * horizontalSpacing,
            y: rowIndex * verticalSpacing,
          },
          data: {
            label: database.name,
            properties: database.properties,
          },
        }
      })
    }

    case 'ADD_NODE': {
      const newIndex = state.length
      const rowIndex = Math.floor(newIndex / nodesPerRow)
      const colIndex = newIndex % nodesPerRow

      return [
        ...state,
        {
          id: action.payload.id,
          type: 'test',
          position: {
            x: colIndex * horizontalSpacing,
            y: rowIndex * verticalSpacing,
          },
          data: {
            label: action.payload.name,
            properties: action.payload.properties,
          },
        },
      ]
    }

    case 'UPDATE_NODES': {
      return applyNodeChanges(action.payload.changes, state) as TableNode[]
    }

    case 'REMOVE_NODE':
      return state.filter((node) => node.id !== action.payload)

    default:
      return state
  }
}
