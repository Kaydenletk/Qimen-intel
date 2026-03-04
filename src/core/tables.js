/**
 * tables.js — Master Lookup Tables
 * All pure-data constants for the QMDJ engine.
 * No logic, no imports.
 */

// ── Ten Heavenly Stems (Thập Thiên Can) ──────────────────────────────────────
export const STEMS = {
  0: { name: 'Giáp', element: 'Mộc', yin: 0 },
  1: { name: 'Ất', element: 'Mộc', yin: 1 },
  2: { name: 'Bính', element: 'Hỏa', yin: 0 },
  3: { name: 'Đinh', element: 'Hỏa', yin: 1 },
  4: { name: 'Mậu', element: 'Thổ', yin: 0 },
  5: { name: 'Kỷ', element: 'Thổ', yin: 1 },
  6: { name: 'Canh', element: 'Kim', yin: 0 },
  7: { name: 'Tân', element: 'Kim', yin: 1 },
  8: { name: 'Nhâm', element: 'Thủy', yin: 0 },
  9: { name: 'Quý', element: 'Thủy', yin: 1 },
};
export const STEMS_BY_NAME = Object.fromEntries(Object.values(STEMS).map(s => [s.name, s]));

// ── Twelve Earthly Branches (Thập Nhị Địa Chi) ───────────────────────────────
// Palace compass: Tý(N)→1  Sửu/Dần(NE)→8  Mão(E)→3  Thìn/Tỵ(SE)→4
//                 Ngọ(S)→9  Mùi/Thân(SW)→2  Dậu(W)→7  Tuất/Hợi(NW)→6
export const BRANCHES = {
  0: { name: 'Tý', element: 'Thủy', yin: 0, palace: 1, hiddenStems: [8] },
  1: { name: 'Sửu', element: 'Thổ', yin: 1, palace: 8, hiddenStems: [5, 9, 7] },
  2: { name: 'Dần', element: 'Mộc', yin: 0, palace: 8, hiddenStems: [0, 2, 4] },
  3: { name: 'Mão', element: 'Mộc', yin: 1, palace: 3, hiddenStems: [1] },
  4: { name: 'Thìn', element: 'Thổ', yin: 0, palace: 4, hiddenStems: [4, 1, 8] },
  5: { name: 'Tỵ', element: 'Hỏa', yin: 1, palace: 4, hiddenStems: [2, 5, 0] },
  6: { name: 'Ngọ', element: 'Hỏa', yin: 0, palace: 9, hiddenStems: [3, 5] },
  7: { name: 'Mùi', element: 'Thổ', yin: 1, palace: 2, hiddenStems: [5, 3, 1] },
  8: { name: 'Thân', element: 'Kim', yin: 0, palace: 2, hiddenStems: [6, 8, 4] },
  9: { name: 'Dậu', element: 'Kim', yin: 1, palace: 7, hiddenStems: [7] },
  10: { name: 'Tuất', element: 'Thổ', yin: 0, palace: 6, hiddenStems: [4, 7, 3] },
  11: { name: 'Hợi', element: 'Thủy', yin: 1, palace: 6, hiddenStems: [8, 0] },
};
export const BRANCHES_BY_NAME = Object.fromEntries(Object.values(BRANCHES).map(b => [b.name, b]));

// ── Ngũ Hành cycles ───────────────────────────────────────────────────────────
export const PRODUCES = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
export const CONTROLS = { Mộc: 'Thổ', Hỏa: 'Kim', Thổ: 'Thủy', Kim: 'Mộc', Thủy: 'Hỏa' };
export const WEAKENS = { Mộc: 'Thủy', Hỏa: 'Mộc', Thổ: 'Hỏa', Kim: 'Thổ', Thủy: 'Kim' };

// ── 9 Palaces ─────────────────────────────────────────────────────────────────
export const PALACE_META = {
  1: { name: 'Khảm', dir: 'Bắc', trigram: '☵', element: 'Thủy' },
  2: { name: 'Khôn', dir: 'Tây Nam', trigram: '☷', element: 'Thổ' },
  3: { name: 'Chấn', dir: 'Đông', trigram: '☳', element: 'Mộc' },
  4: { name: 'Tốn', dir: 'Đông Nam', trigram: '☴', element: 'Mộc' },
  5: { name: 'Trung', dir: 'Trung Tâm', trigram: '⊕', element: 'Thổ' },
  6: { name: 'Càn', dir: 'Tây Bắc', trigram: '☰', element: 'Kim' },
  7: { name: 'Đoài', dir: 'Tây', trigram: '☱', element: 'Kim' },
  8: { name: 'Cấn', dir: 'Đông Bắc', trigram: '☶', element: 'Thổ' },
  9: { name: 'Ly', dir: 'Nam', trigram: '☲', element: 'Hỏa' },
};

// ── Cửu Tinh (Nine Stars) ─────────────────────────────────────────────────────
export const CUU_TINH = [
  { idx: 0, name: 'Thiên Bồng', short: 'Bồng', element: 'Thủy', type: 'hung', palace: 1 },
  { idx: 1, name: 'Thiên Nhuế', short: 'Nhuế', element: 'Thổ', type: 'hung', palace: 2 },
  { idx: 2, name: 'Thiên Xung', short: 'Xung', element: 'Mộc', type: 'cat', palace: 3 },
  { idx: 3, name: 'Thiên Phụ', short: 'Phụ', element: 'Mộc', type: 'cat', palace: 4 },
  { idx: 4, name: 'Thiên Cầm', short: 'Cầm', element: 'Thổ', type: 'binh', palace: 5 },
  { idx: 5, name: 'Thiên Tâm', short: 'Tâm', element: 'Kim', type: 'cat', palace: 6 },
  { idx: 6, name: 'Thiên Trụ', short: 'Trụ', element: 'Kim', type: 'hung', palace: 7 },
  { idx: 7, name: 'Thiên Nhậm', short: 'Nhâm', element: 'Thủy', type: 'cat', palace: 8 },
  { idx: 8, name: 'Thiên Anh', short: 'Anh', element: 'Hỏa', type: 'binh', palace: 9 },
];

// ── Bát Môn — fixed to Địa Bàn palaces ───────────────────────────────────────
export const BAT_MON_DIABAN = {
  1: { name: 'Hưu Môn', short: 'Hưu', element: 'Thủy', type: 'cat' },
  2: { name: 'Tử Môn', short: 'Tử', element: 'Thổ', type: 'hung' },
  3: { name: 'Thương Môn', short: 'Thương', element: 'Mộc', type: 'binh' },
  4: { name: 'Đỗ Môn', short: 'Đỗ', element: 'Mộc', type: 'binh' },
  6: { name: 'Khai Môn', short: 'Khai', element: 'Kim', type: 'cat' },
  7: { name: 'Kinh Môn', short: 'Kinh', element: 'Kim', type: 'hung' },
  8: { name: 'Sinh Môn', short: 'Sinh', element: 'Thổ', type: 'cat' },
  9: { name: 'Cảnh Môn', short: 'Cảnh', element: 'Hỏa', type: 'binh' },
};

// ── Bát Thần — idx 0-7: core 8 for Lo Shu rotation; 8-9: extended ────────────
export const BAT_THAN = [
  { idx: 0, name: 'Trực Phù', element: 'Thổ', type: 'cat' },
  { idx: 1, name: 'Đằng Xà', element: 'Hỏa', type: 'hung' },
  { idx: 2, name: 'Thái Âm', element: 'Kim', type: 'cat' },
  { idx: 3, name: 'Lục Hợp', element: 'Mộc', type: 'cat' },
  { idx: 4, name: 'Câu Trận', element: 'Thổ', type: 'hung' },
  { idx: 5, name: 'Chu Tước', element: 'Hỏa', type: 'hung' },
  { idx: 6, name: 'Cửu Địa', element: 'Thổ', type: 'cat' },
  { idx: 7, name: 'Cửu Thiên', element: 'Kim', type: 'cat' },
];
export const BAT_THAN_BY_NAME = Object.fromEntries(BAT_THAN.map(t => [t.name, t]));

// ── Lục Nghi + Tam Kỳ (9 Thiên Can for palace rotation) ──────────────────────
export const CAN_SEQUENCE_9 = [
  { stemIdx: 4, name: 'Mậu', note: 'ẩn Giáp', isTamKy: false },
  { stemIdx: 5, name: 'Kỷ', note: '', isTamKy: false },
  { stemIdx: 6, name: 'Canh', note: '', isTamKy: false },
  { stemIdx: 7, name: 'Tân', note: '', isTamKy: false },
  { stemIdx: 8, name: 'Nhâm', note: '', isTamKy: false },
  { stemIdx: 9, name: 'Quý', note: '', isTamKy: false },
  { stemIdx: 3, name: 'Đinh', note: 'Tam Kỳ', isTamKy: true },
  { stemIdx: 2, name: 'Bính', note: 'Tam Kỳ', isTamKy: true },
  { stemIdx: 1, name: 'Ất', note: 'Tam Kỳ', isTamKy: true },
];

// ──// Cục (Escape Number) table: [Thượng Nguyên, Trung Nguyên, Hạ Nguyên]
export const CUC_TABLE = {
  // Dương Độn
  'Đông Chí': [1, 7, 4], 'Tiểu Hàn': [2, 8, 5], 'Đại Hàn': [3, 9, 6],
  'Lập Xuân': [8, 5, 2], 'Vũ Thủy': [9, 6, 3], 'Kinh Trập': [1, 7, 4],
  'Xuân Phân': [3, 9, 6], 'Thanh Minh': [4, 1, 7], 'Cốc Vũ': [5, 2, 8],
  'Lập Hạ': [4, 1, 7], 'Tiểu Mãn': [5, 2, 8], 'Mang Chủng': [6, 3, 9],

  // Âm Độn
  'Hạ Chí': [9, 3, 6], 'Tiểu Thử': [8, 2, 5], 'Đại Thử': [7, 1, 4],
  'Lập Thu': [2, 5, 8], 'Xử Thử': [1, 4, 7], 'Bạch Lộ': [9, 3, 6],
  'Thu Phân': [7, 1, 4], 'Hàn Lộ': [6, 9, 3], 'Sương Giáng': [5, 8, 2],
  'Lập Đông': [6, 9, 3], 'Tiểu Tuyết': [5, 8, 2], 'Đại Tuyết': [4, 7, 1],
};

// ── 24 Solar Terms ────────────────────────────────────────────────────────────
export const TIET_KHI_DEFS = [
  { lon: 270, name: 'Đông Chí', isDuong: true }, { lon: 285, name: 'Tiểu Hàn', isDuong: true },
  { lon: 300, name: 'Đại Hàn', isDuong: true }, { lon: 315, name: 'Lập Xuân', isDuong: true },
  { lon: 330, name: 'Vũ Thủy', isDuong: true }, { lon: 345, name: 'Kinh Trập', isDuong: true },
  { lon: 0, name: 'Xuân Phân', isDuong: true }, { lon: 15, name: 'Thanh Minh', isDuong: true },
  { lon: 30, name: 'Cốc Vũ', isDuong: true }, { lon: 45, name: 'Lập Hạ', isDuong: true },
  { lon: 60, name: 'Tiểu Mãn', isDuong: true }, { lon: 75, name: 'Mang Chủng', isDuong: true },
  { lon: 90, name: 'Hạ Chí', isDuong: false }, { lon: 105, name: 'Tiểu Thử', isDuong: false },
  { lon: 120, name: 'Đại Thử', isDuong: false }, { lon: 135, name: 'Lập Thu', isDuong: false },
  { lon: 150, name: 'Xử Thử', isDuong: false }, { lon: 165, name: 'Bạch Lộ', isDuong: false },
  { lon: 180, name: 'Thu Phân', isDuong: false }, { lon: 195, name: 'Hàn Lộ', isDuong: false },
  { lon: 210, name: 'Sương Giáng', isDuong: false }, { lon: 225, name: 'Lập Đông', isDuong: false },
  { lon: 240, name: 'Tiểu Tuyết', isDuong: false }, { lon: 255, name: 'Đại Tuyết', isDuong: false },
];
