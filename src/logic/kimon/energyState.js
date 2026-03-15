import { CONTROLS, PRODUCES, PALACE_META } from '../../core/tables.js';
import { getElementState } from '../../core/states.js';

function getPalaceByNum(boardData = {}, palaceNum = null) {
  if (!palaceNum) return null;
  return boardData?.[palaceNum] || boardData?.[String(palaceNum)] || null;
}

function getDoorInfo(palace = {}) {
  const name = palace?.mon?.name || palace?.mon?.displayName || palace?.mon?.internalName || palace?.mon?.displayShort || palace?.mon || '';
  const short = palace?.mon?.short || palace?.mon?.displayShort || String(name || '').replace(/\s*Môn$/u, '');
  const element = palace?.mon?.element || '';
  const type = palace?.mon?.type || '';
  return { name, short, element, type };
}

function getStarInfo(palace = {}) {
  const name = palace?.star?.name || palace?.star?.displayName || palace?.star?.internalName || palace?.star?.displayShort || palace?.star || '';
  const short = palace?.star?.short || palace?.star?.displayShort || name;
  const element = palace?.star?.element || '';
  const type = palace?.star?.type || '';
  return { name, short, element, type };
}

function getDeityInfo(palace = {}) {
  const name = palace?.than?.name || palace?.than?.displayName || palace?.than?.internalName || palace?.than?.displayShort || palace?.than || '';
  const short = palace?.than?.short || palace?.than?.displayShort || name;
  const element = palace?.than?.element || '';
  const type = palace?.than?.type || '';
  return { name, short, element, type };
}

function getPalaceDescriptor(palaceNum = null) {
  const meta = PALACE_META[palaceNum] || {};
  const name = meta?.name || '';
  const direction = meta?.dir || '';
  const element = meta?.element || '';
  return {
    palaceNum,
    name,
    direction,
    element,
    label: palaceNum ? `cung ${palaceNum} (${name})${direction ? ` · ${direction}` : ''}` : '',
  };
}

function classifyDoorPalaceRelation(doorElement = '', palaceElement = '', doorType = '') {
  if (!doorElement || !palaceElement) {
    return {
      key: 'neutral',
      label: 'Chưa rõ quan hệ Môn/Cung',
      structure: 'Thuận lợi',
      summary: 'Chưa đủ dữ liệu để kết luận Môn đang được đất nâng hay đang bị đất siết.',
    };
  }

  if (CONTROLS[doorElement] === palaceElement) {
    return {
      key: 'door_controls_palace',
      label: 'Môn khắc Cung (Môn Bức)',
      structure: 'Môn Bức',
      summary: 'Môn khắc Cung (Môn Bức) -> Cát khí bị nghẽn, mở ra va chạm hoặc sinh chống đối.',
    };
  }

  if (CONTROLS[palaceElement] === doorElement) {
    return {
      key: 'palace_controls_door',
      label: 'Cung khắc Môn',
      structure: doorType === 'cat' ? 'Phản Phục' : 'Thuận lợi',
      summary: 'Cung khắc Môn -> ý định có nhưng đất không nâng, lực mở bị ghìm lại.',
    };
  }

  if (PRODUCES[doorElement] === palaceElement) {
    return {
      key: 'door_produces_palace',
      label: 'Môn sinh Cung',
      structure: 'Thuận lợi',
      summary: 'Môn sinh Cung -> cửa đang bơm lực cho đất, có tiếng nói và có đà để thành hình.',
    };
  }

  if (PRODUCES[palaceElement] === doorElement) {
    return {
      key: 'palace_produces_door',
      label: 'Cung sinh Môn',
      structure: 'Thuận lợi',
      summary: 'Cung sinh Môn -> đất đang nuôi cửa, tiến chậm nhưng có hậu lực.',
    };
  }

  if (doorElement === palaceElement) {
    return {
      key: 'same',
      label: 'Môn hòa Cung',
      structure: 'Thuận lợi',
      summary: 'Môn hòa Cung -> cửa và đất cùng nhịp, ít ma sát nội tại.',
    };
  }

  return {
    key: 'neutral',
    label: 'Môn/Cung trung tính',
    structure: 'Thuận lợi',
    summary: 'Môn và Cung không sinh khắc trực tiếp, lực đi chậm và cần thêm điều kiện để rõ thế.',
  };
}

function classifyStarPalaceRelation(starElement = '', palaceElement = '', starType = '') {
  if (!starElement || !palaceElement) return '';
  if (CONTROLS[starElement] === palaceElement) {
    return 'Tinh khắc Cung -> tư duy hoặc ngôi sao điều khiển đang ép đất, dễ thành quá tay hoặc quá gắt.';
  }
  if (CONTROLS[palaceElement] === starElement) {
    return starType === 'cat'
      ? 'Cung khắc Tinh -> sao đẹp bị ghìm, có tài nhưng khó bung.'
      : 'Cung khắc Tinh -> hung tinh bị đất đè bớt, lực xấu có phần mềm lại.';
  }
  if (PRODUCES[starElement] === palaceElement) {
    return 'Tinh sinh Cung -> sao đang tiếp đất, lực ý nghĩa đi vào thực tế tốt hơn.';
  }
  if (PRODUCES[palaceElement] === starElement) {
    return 'Cung sinh Tinh -> đất đang nuôi ngôi sao, ý nghĩa của sao rõ hơn mặt nổi.';
  }
  if (starElement === palaceElement) {
    return 'Tinh hòa Cung -> sao và đất cùng khí, ý nghĩa dễ bộc lộ rõ.';
  }
  return 'Tinh/Cung trung tính -> sao có mặt nhưng không quyết định toàn bộ thế trận.';
}

function mapVitalityLabel(state = '') {
  if (!state) return 'Chưa rõ khí';
  return `${state} khí`;
}

function buildDoorTimeRelation(doorElement = '', solarTerm = '') {
  if (!doorElement || !solarTerm) {
    return {
      label: 'Chưa rõ nhịp thời',
      vitality: 'Chưa rõ khí',
      summary: 'Chưa đủ dữ liệu thời tiết khí để chấm lực thực của Môn.',
    };
  }

  const doorState = getElementState(doorElement, solarTerm);
  const vitality = mapVitalityLabel(doorState.state);
  let summary = `${doorState.season} khiến Môn ở trạng thái ${vitality}.`;

  if (doorState.state === 'Vượng' || doorState.state === 'Tướng') {
    summary = `${doorState.season} nâng Môn lên ${vitality} -> có lực thực để đẩy việc đi.`;
  } else if (doorState.state === 'Hưu') {
    summary = `${doorState.season} đưa Môn về ${vitality} -> có cửa nhưng lực đi không bùng, phải nuôi thêm điều kiện.`;
  } else if (doorState.state === 'Tù') {
    summary = `${doorState.season} ép Môn vào ${vitality} -> lực bất tòng tâm, có ý nhưng khó thành miếng.`;
  } else if (doorState.state === 'Tử') {
    summary = `${doorState.season} đẩy Môn vào ${vitality} -> khí cửa suy kiệt, danh có mà lực thực rất mỏng.`;
  }

  return {
    label: vitality,
    vitality,
    summary,
    rawState: doorState.state,
    season: doorState.season,
  };
}

function buildFlagsList(palace = {}) {
  const flags = [];
  if (palace?.khongVong) flags.push('Không Vong');
  if (palace?.dichMa) flags.push('Dịch Mã');
  if (palace?.trucPhu) flags.push('Trực Phù');
  if (palace?.trucSu) flags.push('Trực Sử');
  return flags;
}

function normalizePatternName(item = {}) {
  return item?.name || item?.internalName || '';
}

function classifyTransparency({ palace = {}, specialPatterns = [] } = {}) {
  if (palace?.khongVong) {
    return {
      label: 'Không Vong',
      summary: 'Không Vong -> hình có thể đẹp nhưng lõi đang rỗng, chưa thể tin ngay bằng mắt hoặc bằng lời.',
    };
  }

  if (specialPatterns.some(pattern => normalizePatternName(pattern) === 'Nhật kỳ nhập mộ')) {
    return {
      label: 'Nhập Mộ',
      summary: 'Nhập Mộ -> khí bị chôn, chủ thể hoặc cơ hội đang bị nhốt, chưa bung ra được.',
    };
  }

  return {
    label: 'Rõ ràng',
    summary: 'Trục này chưa dính lớp che mờ lớn, có thể đọc tín hiệu trực diện hơn.',
  };
}

function classifyTension({ palace = {}, isPhucAm = false, isPhanNgam = false, specialPatterns = [] } = {}) {
  const patternNames = specialPatterns.map(normalizePatternName);
  if (isPhanNgam || patternNames.some(name => /xung/i.test(name))) {
    return {
      label: 'Xung',
      summary: 'Xung -> lực dội ngược, dễ thay đổi nhịp hoặc va chạm trong lúc triển khai.',
    };
  }

  if (
    isPhucAm
    || patternNames.some(name => /nhập mộ/i.test(name))
    || palace?.khongVong
  ) {
    return {
      label: 'Hình',
      summary: 'Hình -> thế bị bó, mắc vòng lặp hoặc tự siết bởi nút thắt chưa gỡ.',
    };
  }

  return {
    label: 'Hòa hợp',
    summary: 'Hòa hợp -> lực trong ngoài chưa đối đầu gay gắt, còn chỗ để điều hòa nhịp.',
  };
}

function hasPositiveSignals({ door = {}, deity = {}, cachCuc = [], specialPatterns = [] } = {}) {
  const positiveDoor = ['cat'].includes(String(door?.type || '').toLowerCase());
  const positiveDeity = ['Trực Phù', 'Lục Hợp', 'Cửu Địa', 'Cửu Thiên', 'Thái Âm'].includes(deity?.name || '');
  const positivePattern = [...cachCuc, ...specialPatterns].some(item => /cát/i.test(String(item?.type || '')));
  return positiveDoor || positiveDeity || positivePattern;
}

function deriveEffectiveState({
  vitality = '',
  structure = '',
  transparency = '',
  specialPatterns = [],
  cachCuc = [],
  positiveSignals = false,
} = {}) {
  const patternNames = specialPatterns.map(normalizePatternName);
  const vitalityWeak = /Tù|Tử/u.test(vitality);

  if (transparency === 'Không Vong') {
    return positiveSignals ? 'hình đẹp nhưng ruột rỗng' : 'ảo ảnh';
  }

  if (patternNames.includes('Thanh Long bị thương')) return 'mở mà hao';
  if (patternNames.includes('Nhật kỳ nhập mộ')) return 'thấy đường nhưng chưa bung lực';

  if (structure === 'Môn Bức' && vitalityWeak) return 'kẹt lực';
  if (structure === 'Môn Bức') return 'có cửa nhưng dễ sinh chống đối';
  if (vitalityWeak) return 'lực bất tòng tâm';
  if (/Vượng|Tướng/u.test(vitality) && positiveSignals) return 'thành hình';
  if (cachCuc.length || specialPatterns.length || positiveSignals) return 'có cửa nhưng yếu lực';
  return 'trung tính';
}

function deriveRescueCondition({
  transparency = '',
  structure = '',
  vitality = '',
  positiveSignals = false,
} = {}) {
  if (transparency === 'Không Vong' && positiveSignals) {
    return 'Chỉ mở cửa hành động khi đã kiểm chứng được người thật, việc thật hoặc dòng tiền thật; nếu chưa, mọi tín hiệu đẹp vẫn chỉ là lớp sơn ngoài.';
  }
  if (structure === 'Môn Bức' && /Tù|Tử/u.test(vitality)) {
    return 'Muốn cứu phải đổi nhịp và giảm lực ép trực diện; càng gồng càng bị đất phản lại.';
  }
  return '';
}

function summarizeEnergyState(state = {}) {
  const parts = [
    `${state?.vitality || 'Chưa rõ khí'}`,
    `${state?.structure || 'Thuận lợi'}`,
    `${state?.transparency || 'Rõ ràng'}`,
    `${state?.tension || 'Hòa hợp'}`,
    state?.effectiveState ? `=> ${state.effectiveState}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function hasNamedSignal(items = [], matcher) {
  if (!Array.isArray(items) || !matcher) return false;
  return items.some(item => {
    const name = normalizePatternName(item);
    return matcher.test(String(name || ''));
  });
}

function isDynamicHourState(state = {}) {
  const star = String(state?.star || '');
  const flags = Array.isArray(state?.flags) ? state.flags : [];
  const tension = String(state?.tension || '');
  return (
    /Thiên Xung/i.test(star)
    || flags.includes('Dịch Mã')
    || tension === 'Xung'
    || hasNamedSignal(state?.specialPatterns, /thiên độn|nhân độn|dịch mã/i)
  );
}

function buildPivotPoint(bundle = {}) {
  const hourState = bundle?.hourState || null;
  const userState = bundle?.userState || null;
  if (!hourState) return null;

  const signals = [];

  if (/Trực Phù/i.test(String(hourState.deity || ''))) {
    signals.push({
      key: 'truc_phu_hour',
      title: 'Trực Phù giáng lâm',
      summary: 'Trực Phù đã giáng lâm ở Cung Giờ: đây là lệnh bài miễn tử. Dù toàn cục còn âm u, giờ này vẫn có một luồng che chở đủ để nhìn xuyên màn sương.',
    });
  }

  if (/Thiên Xung/i.test(String(hourState.star || ''))) {
    signals.push({
      key: 'thien_xung_hour',
      title: 'Thiên Xung thông mạch',
      summary: 'Thiên Xung nhập giờ như một cú hích điện từ: đại não thông mạch, trực giác bật sáng, nhịp trì trệ bắt đầu gãy.',
    });
  }

  if (/Câu Trận/i.test(String(userState?.deity || '')) && isDynamicHourState(hourState)) {
    signals.push({
      key: 'let_go_gain',
      title: 'Buông bỏ để được',
      summary: 'Nhật Can đang bị Câu Trận níu lại, nhưng giờ đã có lực động. Điểm sáng không đến từ việc gồng thêm, mà đến từ lúc thôi vùng vẫy và để áp lực tự rơi khỏi vai.',
    });
  }

  if (!signals.length) return null;

  return {
    signals,
    summary: signals.map(item => item.summary).join(' '),
  };
}

export function buildPalaceEnergyState({
  palaceNum = null,
  palace = null,
  solarTerm = '',
  isPhucAm = false,
  isPhanNgam = false,
  label = '',
} = {}) {
  if (!palaceNum || !palace) return null;

  const descriptor = getPalaceDescriptor(palaceNum);
  const door = getDoorInfo(palace);
  const star = getStarInfo(palace);
  const deity = getDeityInfo(palace);
  const heavenStem = palace?.can?.name || palace?.can?.displayShort || palace?.can || '';
  const earthStem = palace?.earthStem || '';
  const flags = buildFlagsList(palace);
  const cachCuc = Array.isArray(palace?.cachCuc) ? palace.cachCuc : [];
  const specialPatterns = Array.isArray(palace?.specialPatterns) ? palace.specialPatterns : [];
  const doorPalaceRelation = classifyDoorPalaceRelation(door.element, descriptor.element, door.type);
  const doorTimeRelation = buildDoorTimeRelation(door.element, solarTerm);
  const transparency = classifyTransparency({ palace, specialPatterns });
  const tension = classifyTension({ palace, isPhucAm, isPhanNgam, specialPatterns });
  const structure = (isPhucAm || isPhanNgam) && doorPalaceRelation.structure !== 'Môn Bức'
    ? 'Phản Phục'
    : doorPalaceRelation.structure;
  const positiveSignals = hasPositiveSignals({ door, deity, cachCuc, specialPatterns });
  const effectiveState = deriveEffectiveState({
    vitality: doorTimeRelation.vitality,
    structure,
    transparency: transparency.label,
    specialPatterns,
    cachCuc,
    positiveSignals,
  });
  const rescueCondition = deriveRescueCondition({
    transparency: transparency.label,
    structure,
    vitality: doorTimeRelation.vitality,
    positiveSignals,
  });

  return {
    label,
    palace: descriptor.label,
    palaceNum,
    palaceName: descriptor.name,
    direction: descriptor.direction,
    door: door.name ? `${door.name}${door.element ? ` (${door.element})` : ''}` : '',
    star: star.name ? `${star.name}${star.element ? ` (${star.element})` : ''}` : '',
    deity: deity.name ? `${deity.name}${deity.element ? ` (${deity.element})` : ''}` : '',
    heavenStem,
    earthStem,
    vitality: doorTimeRelation.vitality,
    structure,
    transparency: transparency.label,
    tension: tension.label,
    doorPalaceRelation: `${doorPalaceRelation.label}${doorPalaceRelation.summary ? ` -> ${doorPalaceRelation.summary.replace(/^[^-].*?->\s*/u, '')}` : ''}`.trim(),
    doorTimeRelation: doorTimeRelation.summary,
    starPalaceRelation: classifyStarPalaceRelation(star.element, descriptor.element, star.type),
    cachCuc,
    specialPatterns,
    flags,
    effectiveState,
    rescueCondition,
    summary: summarizeEnergyState({
      vitality: doorTimeRelation.vitality,
      structure,
      transparency: transparency.label,
      tension: tension.label,
      effectiveState,
    }),
  };
}

function buildFallbackPalaceState({
  palaceNum = null,
  door = '',
  star = '',
  deity = '',
  heavenStem = '',
  earthStem = '',
  solarTerm = '',
  label = '',
} = {}) {
  if (!palaceNum) return null;
  const fallbackPalace = {
    mon: { name: door, short: String(door || '').replace(/\s*Môn$/u, '') },
    star: { name: star },
    than: { name: deity },
    can: { name: heavenStem },
    earthStem,
  };
  const doorElement = ['Khai', 'Kinh'].includes(fallbackPalace.mon.short) ? 'Kim'
    : ['Sinh', 'Tử'].includes(fallbackPalace.mon.short) ? 'Thổ'
      : ['Cảnh'].includes(fallbackPalace.mon.short) ? 'Hỏa'
        : ['Đỗ', 'Thương'].includes(fallbackPalace.mon.short) ? 'Mộc'
          : ['Hưu'].includes(fallbackPalace.mon.short) ? 'Thủy' : '';
  fallbackPalace.mon.element = doorElement;
  return buildPalaceEnergyState({
    palaceNum,
    palace: fallbackPalace,
    solarTerm,
    label,
  });
}

export function buildEnergyStateBundle({
  qmdjData = {},
  usefulPalaceNum = null,
} = {}) {
  const boardData = qmdjData?.displayPalaces || {};
  const selectedUsefulPalaceNum = Number(
    usefulPalaceNum
    || qmdjData?.selectedTopicCanonicalDungThan?.palaceNum
    || qmdjData?.selectedTopicUsefulPalace
    || 0
  ) || null;
  const solarTerm = qmdjData?.solarTerm || '';
  const usefulGodState = selectedUsefulPalaceNum
    ? buildPalaceEnergyState({
      palaceNum: selectedUsefulPalaceNum,
      palace: getPalaceByNum(boardData, selectedUsefulPalaceNum),
      solarTerm,
      isPhucAm: Boolean(qmdjData?.isPhucAm),
      isPhanNgam: Boolean(qmdjData?.isPhanNgam),
      label: 'Dụng Thần',
    })
    : null;

  const hourPalaceNum = Number(qmdjData?.hourMarkerPalace || 0) || null;
  const directEnvoyPalaceNum = Number(qmdjData?.directEnvoyPalace || 0) || null;

  const hourState = hourPalaceNum
    ? buildPalaceEnergyState({
      palaceNum: hourPalaceNum,
      palace: getPalaceByNum(boardData, hourPalaceNum),
      solarTerm,
      isPhucAm: Boolean(qmdjData?.isPhucAm),
      isPhanNgam: Boolean(qmdjData?.isPhanNgam),
      label: 'Cung Giờ',
    }) || buildFallbackPalaceState({
      palaceNum: hourPalaceNum,
      door: qmdjData?.hourDoor || '',
      star: qmdjData?.hourStar || '',
      deity: qmdjData?.hourDeity || '',
      heavenStem: qmdjData?.hourStem || '',
      solarTerm,
      label: 'Cung Giờ',
    })
    : null;

  const directEnvoyState = directEnvoyPalaceNum
    ? buildPalaceEnergyState({
      palaceNum: directEnvoyPalaceNum,
      palace: getPalaceByNum(boardData, directEnvoyPalaceNum),
      solarTerm,
      isPhucAm: Boolean(qmdjData?.isPhucAm),
      isPhanNgam: Boolean(qmdjData?.isPhanNgam),
      label: 'Trực Sử',
    }) || buildFallbackPalaceState({
      palaceNum: directEnvoyPalaceNum,
      door: qmdjData?.directEnvoyDoor || '',
      star: qmdjData?.directEnvoyStar || '',
      deity: qmdjData?.directEnvoyDeity || '',
      heavenStem: qmdjData?.dayStem || '',
      solarTerm,
      label: 'Trực Sử',
    })
    : null;

  const userPalaceNum = Number(
    qmdjData?.selectedTopicMarkersForAI?.userPalace
    || qmdjData?.dayMarkerPalace
    || 0
  ) || null;

  const userState = userPalaceNum
    ? buildPalaceEnergyState({
      palaceNum: userPalaceNum,
      palace: getPalaceByNum(boardData, userPalaceNum),
      solarTerm,
      isPhucAm: Boolean(qmdjData?.isPhucAm),
      isPhanNgam: Boolean(qmdjData?.isPhanNgam),
      label: 'Nhật Can',
    })
    : null;

  const energyStates = {
    usefulGod: usefulGodState,
    user: userState,
    hour: hourState,
    directEnvoy: directEnvoyState,
  };

  const pivotPoint = buildPivotPoint({
    usefulGodState,
    userState,
    hourState,
    directEnvoyState,
  });

  let topicStateSummary = '';
  if (usefulGodState) {
    topicStateSummary = `Dụng Thần đang ở trạng thái ${usefulGodState.summary}.`;
    if (usefulGodState.rescueCondition) {
      topicStateSummary += ` ${usefulGodState.rescueCondition}`;
    }
  }
  if (pivotPoint?.summary) {
    topicStateSummary = [topicStateSummary, pivotPoint.summary].filter(Boolean).join(' ');
  }

  return {
    energyStates,
    usefulGodState,
    userState,
    hourState,
    directEnvoyState,
    pivotPoint,
    topicStateSummary,
  };
}

function formatNamedList(items = []) {
  if (!Array.isArray(items) || !items.length) return 'không có';
  return items
    .map(item => item?.name || item?.internalName || item?.id || '')
    .filter(Boolean)
    .join(' | ') || 'không có';
}

function buildSingleStateContext(title, state) {
  if (!state) return '';
  return [
    `${title}: ${state.palace || '—'}`,
    `- vitality: ${state.vitality}`,
    `- structure: ${state.structure}`,
    `- transparency: ${state.transparency}`,
    `- tension: ${state.tension}`,
    state.doorPalaceRelation ? `- Môn/Cung: ${state.doorPalaceRelation}` : '',
    state.doorTimeRelation ? `- Môn/Thời: ${state.doorTimeRelation}` : '',
    state.starPalaceRelation ? `- Tinh/Cung: ${state.starPalaceRelation}` : '',
    `- Cách cục: ${formatNamedList(state.cachCuc)}`,
    `- Pattern động: ${formatNamedList(state.specialPatterns)}`,
    `- Flags: ${state.flags.length ? state.flags.join(' | ') : 'không có'}`,
    `- Kết luận lực thực: ${state.effectiveState}`,
    state.rescueCondition ? `- Điều kiện cứu: ${state.rescueCondition}` : '',
  ].filter(Boolean).join('\n');
}

export function buildEnergyStateContext(bundle = {}) {
  const parts = [
    buildSingleStateContext('Dụng Thần', bundle?.usefulGodState),
    buildSingleStateContext('Nhật Can', bundle?.userState),
    buildSingleStateContext('Cung Giờ', bundle?.hourState),
    buildSingleStateContext('Trực Sử', bundle?.directEnvoyState),
  ].filter(Boolean);
  const pivotPoint = bundle?.pivotPoint;
  const pivotContext = pivotPoint?.signals?.length
    ? [
      '[PIVOT POINT]',
      ...pivotPoint.signals.map(item => `- ${item.title}: ${item.summary}`),
    ].join('\n')
    : '';
  if (!parts.length && !pivotContext) return '';
  return ['[ENERGY STATE]', ...parts, pivotContext].filter(Boolean).join('\n');
}
