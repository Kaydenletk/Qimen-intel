/**
 * modelRouter.js — Tiered AI Routing Orchestrator
 *
 * Routes requests to the correct model + prompt based on detected tier.
 * Single entry point for server.js.
 */

import { buildKimonSystemInstruction, buildKimonPrompt, buildCompanionPrompt } from './promptBuilder.js';
import { buildStrategyPrompt, buildStrategySystemInstruction } from './strategyPrompt.js';

// ══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const MODELS = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
};

const TIER_CONFIG = {
  companion: { model: MODELS.flash, maxTokens: 800 },
  topic:     { model: MODELS.flash, maxTokens: 3072 },
  strategy:  { model: MODELS.pro,   maxTokens: 3072 },
};

// ══════════════════════════════════════════════════════════════════════════════
// MODEL SELECTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * selectModel — Pick model + maxTokens based on tier
 * @param {string} tier - 'companion' | 'topic' | 'strategy'
 * @returns {{ model: string, maxTokens: number }}
 */
export function selectModel(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG.companion;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDING BY TIER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * buildPromptByTier — Build system + user prompt based on tier
 * @param {{ tier: string, topic: string, qmdjData: object, userContext: string, isAutoLoad?: boolean }} params
 * @returns {{ systemPrompt: string, userPrompt: string, responseFormat: 'json'|'text' }}
 */
export function buildPromptByTier({ tier, topic, qmdjData, userContext, isAutoLoad = false }) {
  if (tier === 'companion') {
    const { systemPrompt, userPrompt } = buildCompanionPrompt({ qmdjData, userContext });
    return { systemPrompt, userPrompt, responseFormat: 'text' };
  }

  if (tier === 'strategy') {
    const { systemPrompt, userPrompt } = buildStrategyPrompt({
      qmdjData,
      userContext,
      topicKey: topic,
    });
    return { systemPrompt, userPrompt, responseFormat: 'json' };
  }

  // Default: topic tier (uses existing Deep Dive prompt)
  return {
    systemPrompt: buildKimonSystemInstruction(),
    userPrompt: buildKimonPrompt({ qmdjData, userContext, isAutoLoad }),
    responseFormat: 'json',
  };
}
