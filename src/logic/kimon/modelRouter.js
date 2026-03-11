/**
 * modelRouter.js — Tiered AI Routing Orchestrator
 *
 * Routes requests to the correct model + prompt based on detected tier.
 * Single entry point for server.js.
 */

import { buildKimonPrompt, buildCompanionPrompt, buildKimonSystemInstruction } from './promptBuilder.js';
import { buildStrategyPrompt, buildStrategySystemInstruction } from './strategyPrompt.js';

// ══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const MODELS = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
};

const TIER_CONFIG = {
  companion: {
    model: MODELS.flash,
    maxTokens: 1800,
    requestTimeoutMs: 20000,
    detectTimeoutMs: 5000,
    streamKeepAliveMs: 10000,
  },
  topic: {
    model: MODELS.flash,
    maxTokens: 4096,
    requestTimeoutMs: 30000,
    detectTimeoutMs: 6000,
    streamKeepAliveMs: 12000,
  },
  strategy: {
    model: MODELS.pro,
    maxTokens: 5120,
    requestTimeoutMs: 45000,
    detectTimeoutMs: 7000,
    streamKeepAliveMs: 12000,
  },
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

export function getTierRuntimeConfig(tier) {
  const selected = TIER_CONFIG[tier] || TIER_CONFIG.companion;
  return {
    requestTimeoutMs: selected.requestTimeoutMs,
    detectTimeoutMs: selected.detectTimeoutMs,
    streamKeepAliveMs: selected.streamKeepAliveMs,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDING BY TIER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * buildPromptByTier — Build system + user prompt based on tier
 * @param {{ tier: string, topic: string, qmdjData: object, userContext: string, isAutoLoad?: boolean, groundingBundle?: object|null }} params
 * @returns {{ systemPrompt: string, userPrompt: string, responseFormat: 'json'|'text' }}
 */
export function buildPromptByTier({ tier, topic, qmdjData, userContext, isAutoLoad = false, groundingBundle = null }) {
  if (tier === 'companion') {
    const { systemPrompt, userPrompt } = buildCompanionPrompt({ qmdjData, userContext, groundingBundle });
    return { systemPrompt, userPrompt, responseFormat: 'text' };
  }

  if (tier === 'strategy') {
    const { systemPrompt, userPrompt } = buildStrategyPrompt({
      qmdjData,
      userContext,
      topicKey: topic,
      groundingBundle,
    });
    return { systemPrompt, userPrompt, responseFormat: 'json' };
  }

  // Default: topic tier (uses existing Deep Dive prompt)
  return {
    systemPrompt: buildKimonSystemInstruction({ groundingBundle }),
    userPrompt: buildKimonPrompt({ qmdjData, userContext, isAutoLoad, groundingBundle }),
    responseFormat: 'json',
  };
}
