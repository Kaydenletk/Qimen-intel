import { CONTROLS, PALACE_META, PRODUCES } from './tables.js';
import { evaluateStates } from './states.js';
import QMDJ_DICTIONARY from '../lib/qmdj_dictionary.json' with { type: 'json' };

const BRANCH_TO_PALACE = {
  Tý: 1,
  Sửu: 8,
  Dần: 8,
  Mão: 3,
  Thìn: 4,
  Tỵ: 4,
  Tị: 4,
  Ngọ: 9,
  Mùi: 2,
  Thân: 2,
  Dậu: 7,
  Tuất: 6,
  Hợi: 6,
};

const DAY_STEM_GRAVE_BRANCH = QMDJ_DICTIONARY?.stateRules?.dayStemGraveBranches || {};
const CUU_DON_PATTERNS = Array.isArray(QMDJ_DICTIONARY?.cuuDonPatterns) ? QMDJ_DICTIONARY.cuuDonPatterns : [];

function getPatternDef(key, fallback = {}) {
  return {
    ...(QMDJ_DICTIONARY?.majorPatterns?.[key] || {}),
    ...fallback,
  };
}

function getHeavenStemName(palace = {}) {
  return palace?.can?.name || palace?.can || '';
}

function getEarthStemName(palace = {}) {
  return palace?.earthStem || '';
}

function getDoorShort(palace = {}) {
  return palace?.mon?.short || palace?.mon?.name?.replace(/\s*Môn$/u, '') || palace?.mon || '';
}

function getDoorElement(palace = {}) {
  return palace?.mon?.element || '';
}

function getDeityName(palace = {}) {
  return palace?.than?.name || palace?.than || '';
}

function getDisplayDeityName(palace = {}) {
  const deityName = getDeityName(palace);
  return deityName === 'Huyền Vũ' ? 'Chu Tước' : deityName;
}

function createPatternHit(def, palaceNum, overrides = {}) {
  return {
    id: def.id,
    name: def.name,
    type: def.type || 'hung',
    priority: def.priority || 0,
    desc: def.desc || '',
    source: def.source || 'special-pattern',
    scope: def.scope || 'palace',
    palace: palaceNum,
    dir: PALACE_META[palaceNum]?.dir || '',
    scoreDelta: Number(def.scoreDelta || 0),
    formationScore: Number(def.formationScore || def.scoreDelta || 0),
    isPhysicalConstraint: Boolean(def.isPhysicalConstraint),
    aliases: Array.isArray(def.aliases) ? def.aliases : [],
    tags: Array.isArray(def.tags) ? def.tags : [],
    ...overrides,
  };
}

function pushPattern(store, palaceNum, hit) {
  if (!store[palaceNum]) store[palaceNum] = [];
  store[palaceNum].push(hit);
}

function getUsefulGodPalaceNums(chart = {}) {
  const candidates = [
    chart?.selectedTopicUsefulPalace,
    chart?.usefulGodPalace,
    chart?.topicResult?.usefulGodPalace,
  ]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value > 0 && value !== 5);

  return new Set(candidates);
}

function getTrucSuTargetPalace(chart = {}) {
  const palaceNum = Number(chart?.trucSuPalace || chart?.directEnvoyActionPalace || 0);
  return Number.isFinite(palaceNum) && palaceNum > 0 ? palaceNum : null;
}

function getTrucPhuTargetPalace(chart = {}) {
  const palaceNum = Number(chart?.trucPhuPalace || 0);
  return Number.isFinite(palaceNum) && palaceNum > 0 ? palaceNum : null;
}

function getDayStemTargetPalace(chart = {}) {
  const explicit = Number(chart?.dayMarkerPalace || 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    if (chart?.palaces?.[palaceNum]?.isNgayCan) return palaceNum;
  }
  return null;
}

function evaluateCuuDon(palace = {}, palaceNum) {
  const doorShort = getDoorShort(palace);
  const heavenStem = getHeavenStemName(palace);
  const deityName = getDeityName(palace);

  return CUU_DON_PATTERNS
    .filter(pattern => pattern?.door === doorShort && pattern?.stem === heavenStem && pattern?.deity === deityName)
    .map(pattern => createPatternHit(pattern, palaceNum));
}

function isSupportiveActionPalace(palace = {}, palaceNum = null) {
  const doorElement = getDoorElement(palace);
  const palaceElement = PALACE_META[palaceNum]?.element || '';
  if (!doorElement || !palaceElement) return false;
  return (
    doorElement === palaceElement
    || PRODUCES[doorElement] === palaceElement
    || PRODUCES[palaceElement] === doorElement
    || CONTROLS[palaceElement] === doorElement
  );
}

export function evaluateSpecialPatterns(chart = {}) {
  const byPalace = {};
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    byPalace[palaceNum] = [];
  }

  const palaces = chart?.palaces || {};
  const usefulGodPalaces = getUsefulGodPalaceNums(chart);
  const trucSuPalace = getTrucSuTargetPalace(chart);
  const trucPhuPalace = getTrucPhuTargetPalace(chart);
  const dayStemPalace = getDayStemTargetPalace(chart);

  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    if (palaceNum === 5) continue;
    const palace = palaces[palaceNum];
    if (!palace) continue;

    const heavenStem = getHeavenStemName(palace);
    const earthStem = getEarthStemName(palace);
    const doorShort = getDoorShort(palace);
    const deityName = getDeityName(palace);
    const displayDeity = getDisplayDeityName(palace);
    const hasCachCuc = Array.isArray(palace?.cachCuc) && palace.cachCuc.length > 0;
    const isUsefulGod = usefulGodPalaces.has(palaceNum);
    const isActionPalace = trucSuPalace === palaceNum;

    for (const stateHit of evaluateStates(palace, { palaceNum, isUsefulGod, isActionPalace })) {
      pushPattern(byPalace, palaceNum, stateHit);
    }

    for (const cuuDonHit of evaluateCuuDon(palace, palaceNum)) {
      pushPattern(byPalace, palaceNum, cuuDonHit);
    }

    if (heavenStem === 'Mậu' && earthStem === 'Canh') {
      pushPattern(byPalace, palaceNum, createPatternHit(
        getPatternDef('thanh_long_bi_thuong', {
          id: 'thanh_long_bi_thuong',
          name: 'Thanh Long bị thương',
          type: 'Hung',
          priority: 10,
          desc: 'Có cửa mở nhưng phải trả giá: mở mà hao, đau tiền hoặc đau lực ngay từ lúc khởi sự.',
          scoreDelta: -4,
        }),
        palaceNum
      ));
    }

    if (heavenStem === 'Nhâm') {
      pushPattern(byPalace, palaceNum, createPatternHit(
        getPatternDef('thien_la', {
          id: 'thien_la',
          name: 'Thiên La',
          type: 'warning',
          priority: 7,
          desc: 'Lưới vô hình đang giăng ra: vướng thủ tục, ràng buộc, pháp lý hoặc nút thắt khó thoát nhanh.',
          scoreDelta: -2,
          isPhysicalConstraint: true,
        }),
        palaceNum
      ));
    }

    if (displayDeity === 'Chu Tước' && doorShort === 'Kinh' && palace?.khongVong) {
      pushPattern(byPalace, palaceNum, createPatternHit(
        getPatternDef('chu_tuoc_khau_thiet_ao', {
          id: 'chu_tuoc_khau_thiet_ao',
          name: 'Chu Tước khẩu thiệt ảo',
          type: 'Hung',
          priority: 9,
          desc: 'Tin đồn và lời nói gây hoang mang, nhưng bản chất nỗi sợ đang bị thổi phồng hơn thực tế.',
          scoreDelta: -3,
        }),
        palaceNum,
        { source: 'deity-door-void' }
      ));
    }

    const promiseDoor = ['Khai', 'Sinh', 'Hưu'].includes(doorShort);
    const promiseDeity = ['Trực Phù', 'Lục Hợp', 'Cửu Thiên', 'Cửu Địa'].includes(deityName);
    if (palace?.khongVong && (promiseDoor || promiseDeity || hasCachCuc)) {
      pushPattern(byPalace, palaceNum, createPatternHit(
        getPatternDef('khong_vong_hoa_ao', {
          id: 'khong_vong_hoa_ao',
          name: 'Không Vong hóa ảo',
          type: 'Hung',
          priority: 8,
          desc: 'Bề mặt nhìn có hứa hẹn nhưng lõi đang rỗng: lời hứa, cơ hội hoặc cát khí dễ thành bánh vẽ.',
          scoreDelta: -2,
          isPhysicalConstraint: true,
        }),
        palaceNum,
        { source: 'void-modifier' }
      ));
    }
  }

  const graveBranch = DAY_STEM_GRAVE_BRANCH[chart?.dayPillar?.stemName || ''];
  const gravePalace = BRANCH_TO_PALACE[graveBranch] || null;
  if (gravePalace && gravePalace !== 5 && palaces[gravePalace]) {
    pushPattern(byPalace, gravePalace, createPatternHit(
      getPatternDef('nhat_ky_nhap_mo', {
        id: 'nhat_ky_nhap_mo',
        name: 'Nhật kỳ nhập mộ',
        type: 'warning',
        priority: 8,
        desc: 'Chủ thể bị nhốt trong bóng tối của chính mình: thấy đường nhưng chưa bung được lực, cơ hội dễ bị che mờ.',
        scoreDelta: -3,
        source: 'day-stem-grave',
        scope: 'day',
        isPhysicalConstraint: true,
      }),
      gravePalace,
      {
        relatedStem: chart?.dayPillar?.stemName || '',
        relatedBranch: graveBranch,
      }
    ));
  }

  if (trucPhuPalace && dayStemPalace && trucPhuPalace === dayStemPalace && palaces[trucPhuPalace]) {
    pushPattern(byPalace, trucPhuPalace, createPatternHit(
      getPatternDef('phu_ky_tuong_tro', {
        id: 'phu_ky_tuong_tro',
        name: 'Phù Kỳ tương trợ',
        type: 'Cát',
        priority: 8,
        desc: 'Trực Phù đồng cung với Nhật Kỳ: có người đỡ lưng, bản thân dễ gặp trợ lực đúng lúc.',
        scoreDelta: 2,
        source: 'truc-phu-day-stem',
        scope: 'day',
      }),
      trucPhuPalace
    ));
  }

  if (
    trucSuPalace
    && palaces[trucSuPalace]
    && isSupportiveActionPalace(palaces[trucSuPalace], trucSuPalace)
    && !palaces[trucSuPalace]?.khongVong
    && trucSuPalace !== 5
  ) {
    pushPattern(byPalace, trucSuPalace, createPatternHit(
      getPatternDef('su_gia_dac_the', {
        id: 'su_gia_dac_the',
        name: 'Sứ giả đắc thế',
        type: 'Cát',
        priority: 7,
        desc: 'Trực Sử lâm cung sinh/hòa: đường hành động dễ thông, lệnh phát ra ít bị méo.',
        scoreDelta: 2,
        source: 'truc-su-supported',
        scope: 'action',
      }),
      trucSuPalace
    ));
  }

  if (trucSuPalace && palaces[trucSuPalace] && (trucSuPalace === 5 || palaces[trucSuPalace]?.khongVong)) {
    pushPattern(byPalace, trucSuPalace, createPatternHit(
      getPatternDef('su_gia_bi_vuong', {
        id: 'su_gia_bi_vuong',
        name: 'Sứ giả bị vướng',
        type: 'warning',
        priority: 8,
        desc: 'Trực Sử bị kẹt giữa bàn hoặc dính Không Vong: lệnh không thông, tín hiệu phát ra dễ hụt.',
        scoreDelta: -3,
        source: 'truc-su-obstructed',
        scope: 'action',
        isPhysicalConstraint: true,
      }),
      trucSuPalace,
      {
        obstructedBy: trucSuPalace === 5 ? 'Trung Cung' : 'Không Vong',
        desc: trucSuPalace === 5
          ? 'Trực Sử rơi vào Trung Cung: mệnh lệnh bị kẹt giữa bàn, đường hành động khó phát lệnh rõ ràng.'
          : 'Trực Sử dính Tuần Không/Không Vong: người đưa việc hoặc đường hành động đang bị vướng, tín hiệu phát ra dễ hụt.',
      }
    ));
  }

  const allPatterns = Object.values(byPalace)
    .flat()
    .sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      return (b.scoreDelta || 0) - (a.scoreDelta || 0);
    });

  const patternScoreDelta = {};
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    patternScoreDelta[palaceNum] = (byPalace[palaceNum] || []).reduce((sum, hit) => sum + Number(hit?.scoreDelta || 0), 0);
  }

  return {
    byPalace,
    patternScoreDelta,
    allPatterns,
    topPatterns: allPatterns.slice(0, 8),
  };
}
