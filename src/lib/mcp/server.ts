import 'server-only'

import { PATHS } from '@/constants/paths'
import { validateDiagram } from '@/lib/diagram'
import {
  ThreadOwnershipError,
  appendAssistantMessage,
  createThreadForUser,
  deleteThreadForUser,
  disableCanvasSharingForUser,
  duplicateThreadForUser,
  enableCanvasSharingForUser,
  getThreadForUser,
  getThreadSummariesForUser,
  renameThreadForUser,
} from '@/lib/thread'
import { chatIdSchema } from '@/lib/thread-validation'
import type { User } from '@/types/auth'
import type { SidebarThread } from '@/types/thread'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import {
  DIAGRAM_FORMAT_GUIDE,
  MCP_SERVER_INSTRUCTIONS,
  buildDesignPrompt,
} from './guide'

const DIAGRAM_FORMAT_URI = 'schema-notion://guides/diagram-format'
const MAX_DIAGRAM_CHARS = 500_000

const projectId = chatIdSchema.describe('Project id (UUID) from list_projects')
const title = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .describe('Shown in the sidebar; truncated after 54 characters')
const diagram = z
  .record(z.string(), z.unknown())
  .describe(
    `Complete workspace JSON: { "workspace": { "name", "databases": [...] } }. See ${DIAGRAM_FORMAT_URI}.`,
  )

class ToolInputError extends Error {}

function getAppUrl() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    ''
  ).replace(/\/+$/, '')
}

function shareLinks(shareToken: string | null, isShared: boolean) {
  if (!isShared || !shareToken) {
    return { isShared: false, shareUrl: null, embedUrl: null }
  }

  return {
    isShared: true,
    shareUrl: `${getAppUrl()}${PATHS.SHARE}/${shareToken}`,
    embedUrl: `${getAppUrl()}${PATHS.EMBED}/${shareToken}`,
  }
}

function toProject(thread: SidebarThread) {
  return {
    projectId: thread.chatId,
    title: thread.title,
    updatedAt: thread.updatedAt.toISOString(),
    url: `${getAppUrl()}${PATHS.CHAT}/${thread.chatId}`,
    ...shareLinks(thread.shareToken, thread.isCanvasShared),
  }
}

function parseDiagram(value: string) {
  if (!value) return null

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  }
}

function fail(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

function validateForSave(input: unknown) {
  const result = validateDiagram(input)

  if (!result.success) {
    throw new ToolInputError(
      `The diagram is invalid. Fix these errors and call again:\n- ${result.errors.join('\n- ')}`,
    )
  }

  if (result.json.length > MAX_DIAGRAM_CHARS) {
    throw new ToolInputError(
      `The diagram is too large (${result.json.length} characters, max ${MAX_DIAGRAM_CHARS}).`,
    )
  }

  return result
}

/**
 * Wrap a tool handler so expected failures become readable tool errors the
 * client's model can act on, and nothing internal leaks.
 */
function handle<Args>(
  operation: string,
  run: (args: Args) => Promise<CallToolResult>,
) {
  return async (args: Args): Promise<CallToolResult> => {
    try {
      return await run(args)
    } catch (error) {
      if (error instanceof ToolInputError) {
        return fail(error.message)
      }

      if (error instanceof ThreadOwnershipError) {
        return fail('Project not found')
      }

      console.error(`[mcp:${operation}] Failed`, {
        name: (error as Error)?.name,
      })
      return fail(`Unable to ${operation.replaceAll('_', ' ')}`)
    }
  }
}

export function createSchemaNotionMcpServer(user: User) {
  const server = new McpServer(
    { name: 'schema-notion', version: '1.0.0' },
    { instructions: MCP_SERVER_INSTRUCTIONS },
  )

  async function requireProject(id: string) {
    const thread = await getThreadForUser(id, user.id)

    if (!thread) {
      throw new ThreadOwnershipError()
    }

    return thread
  }

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        'List the Notion workspace projects owned by the user, most recently updated first.',
      annotations: { readOnlyHint: true },
    },
    handle('list_projects', async () => {
      const threads = await getThreadSummariesForUser(user.id)
      return ok({ projects: threads.map(toProject) })
    }),
  )

  server.registerTool(
    'get_project',
    {
      title: 'Get project',
      description:
        'Get a project with its current diagram JSON and sharing status. Read this before editing a diagram.',
      inputSchema: {
        projectId,
        includeConversation: z
          .boolean()
          .optional()
          .describe('Also return the chat history of the project'),
      },
      annotations: { readOnlyHint: true },
    },
    handle('get_project', async (args: {
      projectId: string
      includeConversation?: boolean
    }) => {
      const thread = await requireProject(args.projectId)

      return ok({
        ...toProject(thread),
        diagram: parseDiagram(thread.diagram),
        ...(args.includeConversation
          ? {
              conversation: thread.conversation.map((message) => ({
                role: message.role === 'model' ? 'assistant' : 'user',
                message: message.message,
                sentAt: new Date(message.timestamp).toISOString(),
              })),
            }
          : {}),
      })
    }),
  )

  server.registerTool(
    'create_project',
    {
      title: 'Create project',
      description:
        'Create a new project. Optionally pass an initial diagram; it is validated the same way as save_diagram.',
      inputSchema: { title, diagram: diagram.optional() },
    },
    handle('create_project', async (args: {
      title: string
      diagram?: Record<string, unknown>
    }) => {
      const validated = args.diagram ? validateForSave(args.diagram) : null
      const thread = await createThreadForUser(user.id, crypto.randomUUID(), {
        title: args.title,
        diagram: validated?.json,
        message: 'Diagrama creado desde un cliente MCP.',
      })

      return ok({
        ...toProject(thread),
        warnings: validated?.warnings ?? [],
      })
    }),
  )

  server.registerTool(
    'rename_project',
    {
      title: 'Rename project',
      description: 'Change the title of a project.',
      inputSchema: { projectId, title },
      annotations: { idempotentHint: true },
    },
    handle('rename_project', async (args: { projectId: string; title: string }) =>
      ok(toProject(await renameThreadForUser(args.projectId, user.id, args.title))),
    ),
  )

  server.registerTool(
    'duplicate_project',
    {
      title: 'Duplicate project',
      description:
        'Copy a project (diagram and chat history) into a new, unshared project.',
      inputSchema: { projectId },
    },
    handle('duplicate_project', async (args: { projectId: string }) => {
      const duplicate = await duplicateThreadForUser(
        args.projectId,
        user.id,
        crypto.randomUUID(),
      )

      if (!duplicate) {
        throw new ThreadOwnershipError()
      }

      return ok(toProject(duplicate))
    }),
  )

  server.registerTool(
    'delete_project',
    {
      title: 'Delete project',
      description:
        'Permanently delete a project, its diagram, chat history and share links. Confirm with the user first.',
      inputSchema: { projectId },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    handle('delete_project', async (args: { projectId: string }) => {
      const deleted = await deleteThreadForUser(args.projectId, user.id)

      if (!deleted) {
        throw new ThreadOwnershipError()
      }

      return ok({ deleted: true, projectId: args.projectId })
    }),
  )

  server.registerTool(
    'validate_diagram',
    {
      title: 'Validate diagram',
      description:
        'Check a diagram against the schema.notion format without saving it.',
      inputSchema: { diagram },
      annotations: { readOnlyHint: true },
    },
    handle('validate_diagram', async (args: {
      diagram: Record<string, unknown>
    }) => {
      const result = validateDiagram(args.diagram)

      return ok(
        result.success
          ? { valid: true, warnings: result.warnings }
          : { valid: false, errors: result.errors },
      )
    }),
  )

  server.registerTool(
    'save_diagram',
    {
      title: 'Save diagram',
      description:
        "Replace a project's diagram with a complete workspace JSON. The canvas updates on the next page load. Shared links show the new version immediately.",
      inputSchema: {
        projectId,
        diagram,
        summary: z
          .string()
          .trim()
          .min(1)
          .max(500)
          .optional()
          .describe(
            "One sentence describing the change, shown in the project's chat history",
          ),
      },
    },
    handle('save_diagram', async (args: {
      projectId: string
      diagram: Record<string, unknown>
      summary?: string
    }) => {
      const validated = validateForSave(args.diagram)
      await appendAssistantMessage(user.id, args.projectId, {
        message: args.summary ?? 'Diagrama actualizado desde un cliente MCP.',
        diagram: validated.json,
      })

      const thread = await requireProject(args.projectId)
      return ok({
        ...toProject(thread),
        saved: true,
        databases: validated.diagram.workspace.databases.length,
        warnings: validated.warnings,
      })
    }),
  )

  server.registerTool(
    'share_project',
    {
      title: 'Share project',
      description:
        "Make a project's canvas publicly viewable (read-only) and return the share and embed URLs. Re-sharing reuses the same link.",
      inputSchema: { projectId },
      annotations: { idempotentHint: true, openWorldHint: true },
    },
    handle('share_project', async (args: { projectId: string }) => {
      const shareToken = await enableCanvasSharingForUser(
        args.projectId,
        user.id,
      )
      return ok({ projectId: args.projectId, ...shareLinks(shareToken, true) })
    }),
  )

  server.registerTool(
    'unshare_project',
    {
      title: 'Stop sharing project',
      description:
        "Disable the public link for a project's canvas. Sharing again later restores the same link.",
      inputSchema: { projectId },
      annotations: { idempotentHint: true },
    },
    handle('unshare_project', async (args: { projectId: string }) => {
      await disableCanvasSharingForUser(args.projectId, user.id)
      return ok({ projectId: args.projectId, isShared: false })
    }),
  )

  server.registerResource(
    'diagram-format',
    DIAGRAM_FORMAT_URI,
    {
      title: 'Diagram format',
      description: 'The JSON contract save_diagram expects',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: DIAGRAM_FORMAT_GUIDE }],
    }),
  )

  server.registerPrompt(
    'design_notion_workspace',
    {
      title: 'Design a Notion workspace',
      description:
        'Design or edit a project diagram with your own model, then save it.',
      argsSchema: {
        request: z.string().describe('What the workspace should support'),
        projectId: z
          .string()
          .optional()
          .describe('Existing project to edit (optional)'),
      },
    },
    async ({ request, projectId: rawProjectId }) => {
      let currentDiagram = ''

      if (rawProjectId) {
        const id = chatIdSchema.safeParse(rawProjectId)
        const thread = id.success
          ? await getThreadForUser(id.data, user.id)
          : null
        currentDiagram = thread?.diagram ?? ''
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: buildDesignPrompt(request, currentDiagram),
            },
          },
        ],
      }
    },
  )

  return server
}
