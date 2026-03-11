export const PERIMETER = [1, 8, 3, 4, 9, 2, 7, 6];

function ringToDoorByPalace(ring) {
  return Object.fromEntries(PERIMETER.map((palace, idx) => [palace, ring[idx]]));
}

export const WEB1_REFERENCE_CASES = [
  {
    id: '2026-03-03-0500',
    timestamp: '2026-03-03 05:00',
    dateIso: '2026-03-03T12:00:00',
    hour: 5,
    referenceType: 'derived-reference',
    source: 'Regression fixture after linear Self-plus Earth Plate + star-carried Heaven Plate migration',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu'],
  },
  {
    id: '2026-03-06-1526',
    timestamp: '2026-03-06 15:26',
    dateIso: '2026-03-06T15:26:00',
    hour: 15,
    referenceType: 'user-reported-reference',
    source: 'User-reported target for Nhâm Thân / Dương 1 Cục',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ'],
  },
  {
    id: '2026-03-03-1605',
    timestamp: '2026-03-03 16:05',
    dateIso: '2026-03-03T16:05:00',
    hour: 16,
    referenceType: 'derived-reference',
    source: 'Regression fixture after linear Self-plus Earth Plate + star-carried Heaven Plate migration',
    expectedTrucSuPalace: 8,
    expectedDoorRing: ['Kinh', 'Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử'],
  },
  {
    id: '2026-03-03-1700',
    timestamp: '2026-03-03 17:00',
    dateIso: '2026-03-03T17:00:00',
    hour: 17,
    referenceType: 'derived-reference',
    source: 'Regression fixture after linear Self-plus Earth Plate + star-carried Heaven Plate migration',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Đỗ', 'Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu', 'Sinh', 'Thương'],
  },
  {
    id: '2026-03-03-1706',
    timestamp: '2026-03-03 17:06',
    dateIso: '2026-03-03T17:06:00',
    hour: 17,
    referenceType: 'derived-reference',
    source: 'Regression fixture after linear Self-plus Earth Plate + star-carried Heaven Plate migration',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Đỗ', 'Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu', 'Sinh', 'Thương'],
  },
  {
    id: '2026-03-07-0924',
    timestamp: '2026-03-07 09:24',
    dateIso: '2026-03-07T09:24:00',
    hour: 9,
    referenceType: 'derived-reference',
    source: 'Golden fixture frozen after linear Self-plus Earth Plate + star-carried Heaven Plate migration',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu'],
  },
].map((entry) => ({
  ...entry,
  expectedDoorByPalace: ringToDoorByPalace(entry.expectedDoorRing),
}));
