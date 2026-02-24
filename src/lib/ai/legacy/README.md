# Legacy AI Features

The runtime AI contract was reduced to:
- `validateUserIntent`
- `sendUserMessage`
- `normalizeChat`

Removed runtime features (kept as legacy design intent only):
- LLM schema comparison summaries
- SQL/Mongo script generation from diagram JSON

If needed later:
1. Reintroduce legacy prompts in `/src/lib/prompts/legacy`
2. Restore provider methods in `/src/lib/ai/providers/*`
3. Extend `/src/lib/ai/types.ts` and `/src/lib/ai/index.ts`
4. Rewire `/src/stores/chat.ts` to call them
