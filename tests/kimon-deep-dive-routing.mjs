import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const detectTopicSource = readFileSync(new URL('../src/logic/kimon/detectTopic.js', import.meta.url), 'utf8');
const promptBuilderSource = readFileSync(new URL('../src/logic/kimon/promptBuilder.js', import.meta.url), 'utf8');
const strategyPromptSource = readFileSync(new URL('../src/logic/kimon/strategyPrompt.js', import.meta.url), 'utf8');
const modelRouterSource = readFileSync(new URL('../src/logic/kimon/modelRouter.js', import.meta.url), 'utf8');

assert.match(serverSource, /import \{ detectDeepDive, detectTopicHybrid \} from '\.\/src\/logic\/kimon\/detectTopic\.js';/);
assert.match(serverSource, /const isDeepDive = !isAutoLoad && detectDeepDive\(userContext\);/);
assert.match(serverSource, /const effectiveTier = \(isDeepDive \|\| hasCriticalTopicFlags \|\| forceStrategyTopic\) \? 'strategy' : tier;/);

assert.match(detectTopicSource, /You are an intent classifier\./);
assert.match(detectTopicSource, /return a strict JSON object only/i);
assert.match(detectTopicSource, /Return exactly this shape:/);
assert.doesNotMatch(detectTopicSource, /Kymon - Một Chiến lược gia AI/);

assert.match(strategyPromptSource, /export const KYMON_PRO_SYSTEM_PROMPT = /);
assert.match(strategyPromptSource, /\[SYSTEM ROLE & PERSONA\]/);
assert.match(strategyPromptSource, /\[CORE METAPHORS - TỪ ĐIỂN ẨN DỤ BẮT BUỘC\]/);
assert.match(strategyPromptSource, /\[STRICT CONSTRAINTS - RÀNG BUỘC NGHIÊM NGẶT\]/);
assert.match(strategyPromptSource, /\[DEEP DIVE & CHAIN OF THOUGHT - CHUỖI TƯ DUY SÂU SẮC\]/);
assert.match(strategyPromptSource, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);
assert.match(strategyPromptSource, /buildStrategySystemInstruction\(\) \{\s*return KYMON_PRO_SYSTEM_PROMPT;/s);

assert.match(promptBuilderSource, /import \{ KYMON_PRO_SYSTEM_PROMPT \} from '\.\/strategyPrompt\.js';/);
assert.match(promptBuilderSource, /buildKimonSystemInstruction\(\{ tier = 'topic' \} = \{\}\) \{\s*void tier;\s*return KYMON_PRO_SYSTEM_PROMPT;/s);
assert.match(promptBuilderSource, /\[INTERNAL INSIGHTS\]/);
assert.match(promptBuilderSource, /\[PHÂN TÍCH CHỦ ĐỀ:/);
assert.match(promptBuilderSource, /\[FLAGS DỤNG THẦN/);
assert.match(promptBuilderSource, /\[ĐIỂM CẦN BÁM\]/);
assert.doesNotMatch(promptBuilderSource, /\[SYSTEM ROLE & PERSONA\]/);
assert.doesNotMatch(promptBuilderSource, /\[CORE METAPHORS - TỪ ĐIỂN ẨN DỤ BẮT BUỘC\]/);
assert.doesNotMatch(promptBuilderSource, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);

assert.match(modelRouterSource, /import \{ buildKimonPrompt, buildCompanionPrompt \} from '\.\/promptBuilder\.js';/);
assert.match(modelRouterSource, /import \{ buildStrategyPrompt, buildStrategySystemInstruction \} from '\.\/strategyPrompt\.js';/);
assert.match(modelRouterSource, /systemPrompt: buildStrategySystemInstruction\(\),/);

console.log('kimon-deep-dive-routing.mjs: OK');
