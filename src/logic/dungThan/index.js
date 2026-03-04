import { normalizeTopicContext } from './normalizeChart.js';
import { buildCareerInsight } from './careerLogic.js';
import { buildGeneralInsight } from './generalLogic.js';
import { buildHealthInsight } from './healthLogic.js';
import { buildLoveInsight } from './loveLogic.js';
import { buildWealthInsight } from './wealthLogic.js';
export { generateEnergyFlowSummary, generateDeterministicEnergyFlow } from './energyFlowLogic.js';

const HEALTH_TOPICS = new Set(['suc-khoe']);
const LOVE_TOPICS = new Set(['tinh-duyen']);
const WEALTH_TOPICS = new Set(['tai-van', 'kinh-doanh', 'ky-hop-dong', 'doi-no', 'bat-dong-san']);
const CAREER_TOPICS = new Set(['su-nghiep', 'xin-viec', 'thi-cu', 'dam-phan', 'kien-tung', 'muu-luoc']);

function buildFallbackInsight(context) {
  return buildGeneralInsight(context);
}

export function generateStrategicInsight({ chart, topicKey, topicResult }) {
  try {
    const context = normalizeTopicContext({ chart, topicResult });
    context.topicKey = topicKey;
    context.topicResult = topicResult;

    if (HEALTH_TOPICS.has(topicKey)) return buildHealthInsight(context);
    if (LOVE_TOPICS.has(topicKey)) return buildLoveInsight(context);
    if (WEALTH_TOPICS.has(topicKey)) return buildWealthInsight(context);
    if (CAREER_TOPICS.has(topicKey)) return buildCareerInsight(context, topicKey);
    return buildGeneralInsight(context);
  } catch (error) {
    const context = normalizeTopicContext({ chart, topicResult });
    const fallback = buildFallbackInsight({ ...context, topicResult });
    fallback.narrative = `Fallback strategy activated: ${error.message}. ${fallback.narrative}`;
    return fallback;
  }
}
