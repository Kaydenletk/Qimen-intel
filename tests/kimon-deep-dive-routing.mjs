import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const detectTopicSource = readFileSync(new URL('../src/logic/kimon/detectTopic.js', import.meta.url), 'utf8');
const promptBuilderSource = readFileSync(new URL('../src/logic/kimon/promptBuilder.js', import.meta.url), 'utf8');
const strategyPromptSource = readFileSync(new URL('../src/logic/kimon/strategyPrompt.js', import.meta.url), 'utf8');
const modelRouterSource = readFileSync(new URL('../src/logic/kimon/modelRouter.js', import.meta.url), 'utf8');

assert.match(serverSource, /import \{ detectDeepDive, detectTopicHybrid \} from '\.\/src\/logic\/kimon\/detectTopic\.js';/);
assert.match(serverSource, /const isDeepDive = !isAutoLoad && detectDeepDive\(userContext\);/);
assert.match(serverSource, /const effectiveTier = isDeepDive \? 'strategy' : tier;/);
assert.match(serverSource, /const enrichedQmdjData = enrichQmdjDataWithDetectedTopic\(qmdjData, topic \|\| 'chung'\);/);
assert.match(detectTopicSource, /const DEEP_DIVE_KEYWORDS = \[/);
assert.match(detectTopicSource, /export function detectDeepDive\(userMessage\)/);
assert.match(promptBuilderSource, /\[INTERNAL INSIGHTS\]/);
assert.match(promptBuilderSource, /\[PHÂN TÍCH CHỦ ĐỀ:/);
assert.match(promptBuilderSource, /Cảnh Môn và Thiên Phụ/);
assert.match(strategyPromptSource, /\[INTERNAL INSIGHTS\]/);
assert.match(modelRouterSource, /topic:\s+\{ model: MODELS\.pro,\s+maxTokens: 3072 \}/);

console.log('kimon-deep-dive-routing.mjs: OK');
