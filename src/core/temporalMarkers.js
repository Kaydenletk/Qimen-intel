import { CONTROLS, PRODUCES, STEMS_BY_NAME, WEAKENS } from './tables.js';
import { resolveHiddenStemForHourStem } from './jiaHiddenStem.js';

const DOOR_SCORE = {
  Khai: 4,
  Sinh: 5,
  Hưu: 3,
  Cảnh: 1,
  Đỗ: 0,
  Thương: -2,
  Kinh: -5,
  Tử: -6,
};

const DEITY_SCORE = {
  'Trực Phù': 3,
  'Lục Hợp': 2,
  'Cửu Thiên': 2,
  'Thái Âm': 1,
  'Cửu Địa': 0,
  'Đằng Xà': -1,
  'Chu Tước': -1,
  'Câu Trận': -1,
  'Bạch Hổ': -3,
  'Huyền Vũ': -2,
};

const STAR_SCORE = {
  Tâm: 2,
  Phụ: 2,
  Nhâm: 1,
  Anh: 1,
  Xung: 0,
  Bồng: -1,
  Trụ: -2,
  Cầm: -1,
  Nhuế: -2,
};

const DOOR_BACKGROUND_SCORE = {
  Khai: 4.5,
  Sinh: 5,
  Hưu: 3,
  Cảnh: 1.5,
  Đỗ: -1,
  Thương: -2.5,
  Kinh: -4.5,
  Tử: -7,
};

const DEITY_BACKGROUND_SCORE = {
  'Trực Phù': 1.5,
  'Lục Hợp': 1,
  'Cửu Thiên': 1,
  'Thái Âm': 0.5,
  'Cửu Địa': 0,
  'Đằng Xà': -0.5,
  'Chu Tước': -0.75,
  'Câu Trận': -0.75,
  'Bạch Hổ': -1.5,
  'Huyền Vũ': -1,
};

const STAR_BACKGROUND_SCORE = {
  Tâm: 1.25,
  Phụ: 1.25,
  Nhâm: 0.75,
  Anh: 0.5,
  Xung: 0,
  Bồng: -0.75,
  Trụ: -1.25,
  Cầm: -0.75,
  Nhuế: -1.75,
};

const PALACE_DIRECTION = {
  1: 'Bắc',
  2: 'Tây Nam',
  3: 'Đông',
  4: 'Đông Nam',
  5: 'Trung Cung',
  6: 'Tây Bắc',
  7: 'Tây',
  8: 'Đông Bắc',
  9: 'Nam',
};

function toBackgroundTone(score) {
  if (score >= 4) return 'bright';
  if (score >= -3) return 'neutral';
  if (score >= -7) return 'softDark';
  return 'dark';
}

function normalizeStemName(stemName) {
  return stemName === 'Giáp' ? 'Mậu' : stemName;
}

function getStemElement(stemName) {
  return STEMS_BY_NAME[stemName]?.element || '';
}

function resolveStemMarkerPalace(palaces, stemName, legacyFlagKey, options = {}) {
  const { preferLegacyFlag = true } = options;
  if (!stemName) return { palace: null, source: 'unresolved' };

  const strategies = preferLegacyFlag
    ? [
      { source: 'legacy-flag', match: palace => palace?.[legacyFlagKey] },
      { source: 'heaven-stem', match: palace => palace?.can?.name === stemName },
      { source: 'sent-stem', match: palace => palace?.sentCan?.name === stemName },
      { source: 'earth-stem', match: palace => palace?.earthStem === stemName },
    ]
    : [
      { source: 'heaven-stem', match: palace => palace?.can?.name === stemName },
      { source: 'sent-stem', match: palace => palace?.sentCan?.name === stemName },
      { source: 'legacy-flag', match: palace => palace?.[legacyFlagKey] },
      { source: 'earth-stem', match: palace => palace?.earthStem === stemName },
    ];

  for (const strategy of strategies) {
    for (let p = 1; p <= 9; p++) {
      if (strategy.match(palaces[p])) return { palace: p, source: strategy.source };
    }
  }

  return { palace: null, source: 'unresolved' };
}

function resolveHourMarker(palaces, gioPillar) {
  const hourStem = resolveHiddenStemForHourStem(gioPillar?.stemName || '', gioPillar?.branchName || '');
  return resolveStemMarkerPalace(palaces, hourStem, 'isGioCan', { preferLegacyFlag: false });
}

export function resolveHourPalace(chart) {
  return resolveHourMarker(chart?.palaces || {}, chart?.gioPillar || {}).palace;
}

function scoreStemRelation(palace) {
  const heavenElement = getStemElement(palace?.can?.name || palace?.sentCan?.name || '');
  const earthElement = getStemElement(palace?.earthStem || '');

  if (!heavenElement || !earthElement) return 0;
  if (heavenElement === earthElement) return 1;
  if (PRODUCES[heavenElement] === earthElement) return 1;
  if (PRODUCES[earthElement] === heavenElement) return 0;
  if (CONTROLS[heavenElement] === earthElement) return 1;
  if (CONTROLS[earthElement] === heavenElement) return -2;
  if (WEAKENS[heavenElement] === earthElement) return -1;
  return 0;
}

function scoreFlags(chart, palace) {
  const components = {
    trucSu: palace?.trucSu ? 1 : 0,
    trucPhu: palace?.trucPhu ? 1 : 0,
    dichMa: palace?.dichMa ? 1 : 0,
    khongVong: palace?.khongVong ? -2 : 0,
    phucAm: chart?.isPhucAm ? -1 : 0,
    phanNgam: chart?.isPhanNgam ? -1 : 0,
  };
  return {
    score: Object.values(components).reduce((sum, value) => sum + value, 0),
    components,
  };
}

function scoreComboPenalty(palace) {
  const doorKey = palace?.mon?.short || '';
  const deityKey = palace?.than?.name || '';
  const starKey = palace?.star?.short || '';
  let comboPenaltyScore = 0;

  if (doorKey === 'Kinh' && starKey === 'Nhuế') comboPenaltyScore -= 2;
  if (doorKey === 'Kinh' && deityKey === 'Chu Tước') comboPenaltyScore -= 2;
  if (starKey === 'Nhuế' && deityKey === 'Chu Tước') comboPenaltyScore -= 2;
  if (doorKey === 'Kinh' && starKey === 'Nhuế' && deityKey === 'Chu Tước') comboPenaltyScore -= 4;

  return comboPenaltyScore;
}

function toToneAndVerdict(score) {
  let tone = 'neutral';
  let verdict = 'trung';

  if (score >= 7) {
    tone = 'very-bright';
    verdict = 'thuận';
  } else if (score >= 3) {
    tone = 'bright';
    verdict = 'thuận';
  } else if (score <= -8) {
    tone = 'dark';
    verdict = 'nghịch';
  } else if (score <= -4) {
    tone = 'dim';
    verdict = 'nghịch';
  }

  return { tone, verdict };
}

function buildAlertTags(palace) {
  const tags = [];
  if (palace?.trucPhu) tags.push('Trực Phù');
  if (palace?.trucSu) tags.push('Trực Sử');
  if (palace?.khongVong) tags.push('Không Vong');
  if (palace?.dichMa) tags.push('Dịch Mã');
  return tags;
}

function scoreBackgroundTagAdjustments(chart, palace) {
  const components = {
    trucSu: 0,
    trucPhu: 0,
    dichMa: 0,
    khongVong: palace?.khongVong ? -0.5 : 0,
    phucAm: chart?.isPhucAm ? 0 : 0,
    phanNgam: chart?.isPhanNgam ? -0.5 : 0,
  };

  const reasons = [];
  if (components.khongVong) reasons.push('Không Vong chỉ làm tối nhẹ nền');
  if (components.phanNgam) reasons.push('Phản Ngâm tạo thêm một nấc cảnh báo nền');

  return {
    score: Object.values(components).reduce((sum, value) => sum + value, 0),
    components,
    reasons,
  };
}

function applyBackgroundModifierRules(palace, baseScore) {
  const doorKey = palace?.mon?.short || '';
  const deityKey = palace?.than?.name || '';
  const starKey = palace?.star?.short || '';
  const modifiers = [];

  // Modifier rules are applied after the base score so the board can model
  // shielding and toxic resonance without changing the underlying chart data.

  // Rule 1: Trực Phù acts as a shield and prevents heavy structures from collapsing too far.
  if (deityKey === 'Trực Phù' && baseScore < 0) {
    const shieldBoost = baseScore <= -5 ? 4 : Math.max(2, Math.abs(baseScore) * 0.5);
    modifiers.push({
      key: 'trucPhuShield',
      score: shieldBoost,
      reason: `Trực Phù che chắn, giảm lực xấu ${shieldBoost >= 0 ? '+' : ''}${Math.round(shieldBoost * 100) / 100}`,
    });
  }

  // Rule 2: Kinh + Đằng Xà creates a toxic resonance and must be punished harder.
  if (doorKey === 'Kinh' && deityKey === 'Đằng Xà') {
    modifiers.push({
      key: 'toxicResonance',
      score: -3,
      reason: 'Kinh + Đằng Xà cộng hưởng hung, tăng cảnh báo -3',
    });
  }

  // Keep a lighter synergy penalty for Tử + Nhuế so it stays unfavorable even when shielded.
  if (doorKey === 'Tử' && starKey === 'Nhuế') {
    modifiers.push({
      key: 'deathGrainFriction',
      score: -1,
      reason: 'Tử + Nhuế tạo thế trì trệ, giảm thêm -1',
    });
  }

  return modifiers;
}

function scorePalaceBackground(chart, palace) {
  if (!palace) {
    return {
      baseScore: 0,
      modifierAdjustments: {},
      tagAdjustments: {
        trucSu: 0,
        trucPhu: 0,
        dichMa: 0,
        khongVong: 0,
        phucAm: 0,
        phanNgam: 0,
      },
      finalScore: 0,
      backgroundTone: 'neutral',
      alertTags: [],
      reasons: [],
    };
  }

  const doorKey = palace?.mon?.short || '';
  const deityKey = palace?.than?.name || '';
  const starKey = palace?.star?.short || '';
  const doorScore = DOOR_BACKGROUND_SCORE[doorKey] ?? 0;
  const deityScore = DEITY_BACKGROUND_SCORE[deityKey] ?? 0;
  const starScore = STAR_BACKGROUND_SCORE[starKey] ?? 0;
  const stemRelationScore = scoreStemRelation(palace) * 0.5;
  const baseScore = doorScore + deityScore + starScore + stemRelationScore;
  const modifiers = applyBackgroundModifierRules(palace, baseScore);
  const modifierScore = modifiers.reduce((sum, modifier) => sum + modifier.score, 0);
  const tagInfo = scoreBackgroundTagAdjustments(chart, palace);
  const finalScore = baseScore + modifierScore + tagInfo.score;
  const backgroundTone = toBackgroundTone(finalScore);
  const reasons = [];
  const modifierAdjustments = Object.fromEntries(modifiers.map(modifier => [modifier.key, modifier.score]));

  if (doorScore) reasons.push(`Môn ${doorKey} tác động nền ${doorScore >= 0 ? '+' : ''}${doorScore}`);
  if (starScore) reasons.push(`Tinh ${starKey} tác động nền ${starScore >= 0 ? '+' : ''}${starScore}`);
  if (deityScore) reasons.push(`Thần ${deityKey} tác động nền ${deityScore >= 0 ? '+' : ''}${deityScore}`);
  if (stemRelationScore) reasons.push(`Can quan hệ ${stemRelationScore >= 0 ? '+' : ''}${stemRelationScore}`);
  modifiers.forEach(modifier => reasons.push(modifier.reason));
  reasons.push(...tagInfo.reasons);

  return {
    baseScore,
    modifierAdjustments,
    tagAdjustments: tagInfo.components,
    finalScore,
    backgroundTone,
    alertTags: buildAlertTags(palace),
    reasons,
  };
}

function scorePalaceEnergy(chart, palace) {
  if (!palace) {
    return {
      score: 0,
      tone: 'neutral',
      verdict: 'trung',
      breakdown: {
        doorScore: 0,
        deityScore: 0,
        starScore: 0,
        flagScore: 0,
        flagComponents: {
          trucSu: 0,
          trucPhu: 0,
          dichMa: 0,
          khongVong: 0,
          phucAm: 0,
          phanNgam: 0,
        },
        stemRelationScore: 0,
        comboPenaltyScore: 0,
        patternScoreDelta: 0,
      },
    };
  }

  const doorKey = palace?.mon?.short || '';
  const deityKey = palace?.than?.name || '';
  const starKey = palace?.star?.short || '';
  const doorScore = DOOR_SCORE[doorKey] ?? 0;
  const deityScore = DEITY_SCORE[deityKey] ?? 0;
  const starScore = STAR_SCORE[starKey] ?? 0;
  const flagInfo = scoreFlags(chart, palace);
  const flagScore = flagInfo.score;
  const stemRelationScore = scoreStemRelation(palace);
  const comboPenaltyScore = scoreComboPenalty(palace);
  const patternScoreDelta = Number(palace?.patternScoreDelta || 0);
  const score = doorScore + deityScore + starScore + flagScore + stemRelationScore + comboPenaltyScore + patternScoreDelta;
  const { tone, verdict } = toToneAndVerdict(score);

  return {
    score,
    tone,
    verdict,
    breakdown: {
      doorScore,
      deityScore,
      starScore,
      flagScore,
      flagComponents: flagInfo.components,
      stemRelationScore,
      comboPenaltyScore,
      patternScoreDelta,
    },
  };
}

export function scoreHourPalace(chart, palace) {
  const result = scorePalaceEnergy(chart, palace);
  return {
    hourEnergyScore: result.score,
    hourEnergyTone: result.tone,
    hourEnergyVerdict: result.verdict,
    breakdown: result.breakdown,
  };
}

export function scoreDirectEnvoyPalace(chart, palace) {
  const result = scorePalaceEnergy(chart, palace);
  return {
    directEnvoyActionScore: result.score,
    directEnvoyActionTone: result.tone,
    directEnvoyActionVerdict: result.verdict,
    breakdown: {
      ...result.breakdown,
    },
  };
}

function buildTemporalBadgesByPalace(dayMarkerPalace, hourMarkerPalace, monthMarkerPalace) {
  const temporalBadgesByPalace = {};
  for (let p = 1; p <= 9; p++) {
    const badges = [];
    if (p === dayMarkerPalace) badges.push('Ngày');
    if (p === hourMarkerPalace) badges.push('Giờ');
    if (p === monthMarkerPalace) badges.push('Tháng');
    temporalBadgesByPalace[p] = badges;
  }
  return temporalBadgesByPalace;
}

function buildSpecialTags(palace) {
  const tags = [];
  if (palace?.trucPhu) tags.push('Trực Phù');
  if (palace?.trucSu) tags.push('Trực Sử');
  if (palace?.khongVong) tags.push('Không Vong');
  if (palace?.dichMa) tags.push('Dịch Mã');
  if (palace?.dayMarker) tags.push('Ngày');
  if (palace?.hourMarker) tags.push('Giờ');
  if (palace?.monthMarker) tags.push('Tháng');
  return tags;
}

function buildBoardPalaces(palaces) {
  const boardPalaces = {};
  for (let p = 1; p <= 9; p++) {
    const palace = palaces[p] || {};
    boardPalaces[p] = {
      direction: PALACE_DIRECTION[p],
      palaceNum: p,
      heavenlyStem: palace?.can?.name || '',
      earthlyStem: palace?.earthStem || '',
      door: palace?.mon?.short || '',
      star: palace?.star?.short || '',
      deity: palace?.than?.name || '',
      specialTags: Array.isArray(palace?.specialTags) ? [...palace.specialTags] : [],
      alertTags: Array.isArray(palace?.alertTags) ? [...palace.alertTags] : [],
      score: palace?.score ?? 0,
      backgroundTone: palace?.backgroundTone || palace?.tone || 'neutral',
      tone: palace?.backgroundTone || palace?.tone || 'neutral',
      toneDetail: palace?.toneDetail || 'neutral',
      backgroundDebug: palace?.backgroundDebug || null,
    };
  }
  return boardPalaces;
}

function buildQuickReadSummary(hourEnergyVerdict, hourEnergyTone, directEnvoyActionVerdict, directEnvoyActionTone) {
  const hourDark = hourEnergyTone === 'dark' || hourEnergyTone === 'dim';
  const routeBright = directEnvoyActionTone === 'bright' || directEnvoyActionTone === 'very-bright';
  const routeDark = directEnvoyActionTone === 'dark' || directEnvoyActionTone === 'dim';

  if (hourDark && routeBright) return 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa';
  if (hourDark && routeDark) return 'Khí giờ đang nghịch, đường hành động cũng hẹp, nên giảm lực và quan sát';
  if (hourEnergyVerdict === 'thuận' && routeBright) return 'Khí giờ đang thuận, đi đúng cửa thì rất dễ thành việc';
  if (hourEnergyVerdict === 'thuận' && routeDark) return 'Khí giờ đang thuận, nhưng cửa hành động chưa thật thông';
  if (hourEnergyVerdict === 'trung' && routeBright) return '';
  if (hourEnergyVerdict === 'trung' && routeDark) return 'Khí giờ chưa rõ, lại gặp đường hành động hẹp, nên đi chậm';
  return '';
}

export function buildHourDiagnosticRecord(chart, hour = null) {
  const hourMarkerPalace = chart?.hourMarkerPalace || null;
  const hourPalace = hourMarkerPalace ? chart?.palaces?.[hourMarkerPalace] : null;
  const routePalaceNum = chart?.directEnvoyActionPalace || chart?.trucSuPalace || null;

  return {
    hour,
    hourPillar: `${chart?.gioPillar?.stemName || ''}${chart?.gioPillar?.branchName || ''}`,
    dayPillar: `${chart?.dayPillar?.stemName || ''}${chart?.dayPillar?.branchName || ''}`,
    hourMarkerPalace,
    hourMarkerResolutionSource: chart?.hourMarkerResolutionSource || 'unresolved',
    hourPalaceDirection: PALACE_DIRECTION[hourMarkerPalace] || '—',
    door: hourPalace?.mon?.short || '—',
    star: hourPalace?.star?.short || '—',
    deity: hourPalace?.than?.name || '—',
    hourEnergyScore: chart?.hourEnergyScore ?? 0,
    hourEnergyTone: chart?.hourEnergyTone || 'neutral',
    trucSuPalace: chart?.trucSuPalace || null,
    trucSuScore: chart?.directEnvoyActionScore ?? 0,
    finalCombinedVerdict: chart?.hourQuickReadSummary || '',
    currentState: hourMarkerPalace ? `P${hourMarkerPalace} ${PALACE_DIRECTION[hourMarkerPalace] || ''}`.trim() : '—',
    actionRoute: routePalaceNum ? `P${routePalaceNum} ${PALACE_DIRECTION[routePalaceNum] || ''}`.trim() : '—',
  };
}

export function annotateTemporalMarkers(chart) {
  const palaces = chart?.palaces || {};
  const dayStem = normalizeStemName(chart?.dayPillar?.stemName || '');
  const monthStem = normalizeStemName(chart?.monthPillar?.stemName || '');

  const dayMarker = resolveStemMarkerPalace(palaces, dayStem, 'isNgayCan');
  const hourMarker = resolveHourMarker(palaces, chart?.gioPillar || {});
  const monthMarker = resolveStemMarkerPalace(palaces, monthStem, 'isThangCan');
  const dayMarkerPalace = dayMarker.palace;
  const hourMarkerPalace = hourMarker.palace;
  const monthMarkerPalace = monthMarker.palace;
  const temporalBadgesByPalace = buildTemporalBadgesByPalace(dayMarkerPalace, hourMarkerPalace, monthMarkerPalace);

  for (let p = 1; p <= 9; p++) {
    palaces[p].dayMarker = p === dayMarkerPalace;
    palaces[p].hourMarker = p === hourMarkerPalace;
    palaces[p].monthMarker = p === monthMarkerPalace;
    palaces[p].temporalBadges = temporalBadgesByPalace[p];
  }

  for (let p = 1; p <= 9; p++) {
    const energy = scorePalaceEnergy(chart, palaces[p]);
    const background = scorePalaceBackground(chart, palaces[p]);
    palaces[p].palaceNum = p;
    palaces[p].direction = PALACE_DIRECTION[p];
    palaces[p].score = energy.score;
    palaces[p].toneDetail = energy.tone;
    palaces[p].backgroundTone = background.backgroundTone;
    palaces[p].tone = background.backgroundTone;
    palaces[p].verdict = energy.verdict;
    palaces[p].scoreBreakdown = energy.breakdown;
    palaces[p].backgroundDebug = background;
    palaces[p].alertTags = background.alertTags;
    palaces[p].specialTags = buildSpecialTags(palaces[p]);
  }

  const hourPalace = hourMarkerPalace ? palaces[hourMarkerPalace] : null;
  const hourEnergy = scoreHourPalace(chart, hourPalace);
  const directEnvoyPalace = chart?.trucSuPalace ? palaces[chart.trucSuPalace] : null;
  const directEnvoyAction = scoreDirectEnvoyPalace(chart, directEnvoyPalace);
  const hourQuickReadSummary = buildQuickReadSummary(
    hourEnergy.hourEnergyVerdict,
    hourEnergy.hourEnergyTone,
    directEnvoyAction.directEnvoyActionVerdict,
    directEnvoyAction.directEnvoyActionTone,
  );

  if (hourPalace) {
    hourPalace.hourEnergyScore = hourEnergy.hourEnergyScore;
    hourPalace.hourEnergyTone = hourEnergy.hourEnergyTone;
    hourPalace.hourEnergyVerdict = hourEnergy.hourEnergyVerdict;
  }

  return {
    ...chart,
    palaces,
    dayMarkerPalace,
    hourMarkerPalace,
    monthMarkerPalace,
    dayMarkerResolutionSource: dayMarker.source,
    hourMarkerResolutionSource: hourMarker.source,
    monthMarkerResolutionSource: monthMarker.source,
    temporalBadgesByPalace,
    boardPalaces: buildBoardPalaces(palaces),
    hourEnergyScore: hourEnergy.hourEnergyScore,
    hourEnergyTone: hourEnergy.hourEnergyTone,
    hourEnergyVerdict: hourEnergy.hourEnergyVerdict,
    hourEnergyBreakdown: hourEnergy.breakdown,
    directEnvoyActionPalace: chart?.trucSuPalace || null,
    directEnvoyActionScore: directEnvoyAction.directEnvoyActionScore,
    directEnvoyActionTone: directEnvoyAction.directEnvoyActionTone,
    directEnvoyActionVerdict: directEnvoyAction.directEnvoyActionVerdict,
    directEnvoyActionBreakdown: directEnvoyAction.breakdown,
    hourQuickReadSummary,
  };
}
