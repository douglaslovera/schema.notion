import { notionPropertyTypes } from '@/types/notion-schema'

/**
 * Sent to MCP clients on initialize. The client's own model does the design
 * work, so it needs the same contract our OpenRouter prompt enforces.
 */
export const MCP_SERVER_INSTRUCTIONS = `
schema.notion stores Notion workspace designs ("projects") and renders each one as a diagram canvas the user can share.

You (the client's model) design the schema; this server only stores, validates and shares it.

Typical flow:
1. list_projects or create_project.
2. get_project to read the current diagram before changing it.
3. Design or edit the full workspace JSON (see the "diagram-format" resource or the design_notion_workspace prompt).
4. save_diagram with the COMPLETE JSON — never a partial patch. It is validated before saving; fix any reported errors and retry.
5. Optionally share_project to get a public read-only link and an embed URL.

Always link the user to the project's "url" so they can see the canvas.
`.trim()

export const DIAGRAM_FORMAT_GUIDE = `
# schema.notion diagram format

A diagram is one JSON object describing a Notion workspace made of related databases.

{
  "workspace": {
    "name": "Human friendly workspace name",
    "databases": [
      {
        "id": "content-calendar",
        "name": "Content Calendar",
        "description": "Optional, short and useful",
        "properties": [
          { "name": "Title", "type": "title" },
          { "name": "Status", "type": "status", "options": ["Idea", "Draft", "Published"] },
          {
            "name": "Author",
            "type": "relation",
            "relation": {
              "targetDatabaseId": "team",
              "targetDatabaseName": "Team",
              "direction": "two_way",
              "pairedPropertyName": "Posts"
            }
          }
        ]
      }
    ]
  }
}

## Databases
- "id": kebab-case, stable. Keep existing ids when editing so relations keep working.
- "name": human friendly (e.g. "Content Calendar"), never snake_case.
- "properties": exactly one property of type "title"; property names unique within the database.

## Property types (exact names)
${notionPropertyTypes.join(', ')}

## Per-type configuration
- select / multi_select / status: "options": string[]
- number: "numberFormat": string (optional)
- formula: "expression": string
- rollup: "rollup": { "relationPropertyName": string, "targetPropertyName": string, "function": string }
  - relationPropertyName must be a relation property in the same database.
- relation: "relation": {
    "targetDatabaseId": string (must be the id of a database in this workspace),
    "targetDatabaseName": string,
    "direction": "one_way" | "two_way",
    "targetPropertyName": string (optional; anchors the line to a property in the target),
    "pairedPropertyName": string (required for two_way; the property shown in the target database)
  }

## Design guidance
- Favour structures that work for non-technical Notion users: statuses, owners, dates, priorities, tags, links, metrics.
- Use relation + rollup + formula where they add real value.
- For two_way relations, also add the paired relation property in the target database pointing back, so both sides render.
- When editing, return the full updated workspace and keep everything the user didn't ask to remove.
`.trim()

export function buildDesignPrompt(request: string, currentDiagram: string) {
  const current = currentDiagram
    ? `\n\nThe project's current diagram is below. Edit it rather than starting over, and keep database ids stable:\n\n${currentDiagram}`
    : ''

  return `Design a Notion workspace for this request:\n\n${request}\n\nFollow this format exactly:\n\n${DIAGRAM_FORMAT_GUIDE}${current}\n\nWhen the design is ready, call save_diagram with the complete JSON.`
}
