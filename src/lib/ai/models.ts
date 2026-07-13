/**
 * OpenRouter model selection by application process.
 *
 * Keep model choices here so each process can move to a different model
 * without changing provider or orchestration code.
 */
export const AI_MODELS = {
  validateUserIntent: 'nvidia/nemotron-3-super-120b-a12b:free',
  generateNotionSchema: 'nvidia/nemotron-3-super-120b-a12b:free',
} as const
