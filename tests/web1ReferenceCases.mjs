export const PERIMETER = [1, 8, 3, 4, 9, 2, 7, 6];

const STANDARD_WEB1_RING = ['Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử', 'Kinh'];

function ringToDoorByPalace(ring) {
  return Object.fromEntries(PERIMETER.map((palace, idx) => [palace, ring[idx]]));
}

export const WEB1_REFERENCE_CASES = [
  {
    id: '2026-03-03-0500',
    timestamp: '2026-03-03 05:00',
    dateIso: '2026-03-03T12:00:00',
    hour: 5,
    referenceType: 'web1-screenshot',
    source: 'Golden board frozen from current web1 reference screenshot',
    expectedTrucSuPalace: 8,
    expectedDoorRing: STANDARD_WEB1_RING,
  },
  {
    id: '2026-03-06-1526',
    timestamp: '2026-03-06 15:26',
    dateIso: '2026-03-06T15:26:00',
    hour: 15,
    referenceType: 'user-reported-reference',
    source: 'User-reported web1 target for Nhâm Thân / Dương 1 Cục',
    expectedTrucSuPalace: 9,
    expectedDoorRing: ['Cảnh', 'Tử', 'Kinh', 'Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ'],
  },
  {
    id: '2026-03-03-1605',
    timestamp: '2026-03-03 16:05',
    dateIso: '2026-03-03T16:05:00',
    hour: 16,
    referenceType: 'derived-fixture',
    source: 'Door ring frozen from existing web1-aligned case expectation',
    expectedTrucSuPalace: 8,
    expectedDoorRing: STANDARD_WEB1_RING,
  },
  {
    id: '2026-03-03-1700',
    timestamp: '2026-03-03 17:00',
    dateIso: '2026-03-03T17:00:00',
    hour: 17,
    referenceType: 'derived-fixture',
    source: 'Door ring frozen from existing web1-aligned case expectation',
    expectedTrucSuPalace: 8,
    expectedDoorRing: STANDARD_WEB1_RING,
  },
  {
    id: '2026-03-03-1706',
    timestamp: '2026-03-03 17:06',
    dateIso: '2026-03-03T17:06:00',
    hour: 17,
    referenceType: 'derived-fixture',
    source: 'Door ring frozen from existing web1-aligned case expectation',
    expectedTrucSuPalace: 8,
    expectedDoorRing: STANDARD_WEB1_RING,
  },
].map((entry) => ({
  ...entry,
  expectedDoorByPalace: ringToDoorByPalace(entry.expectedDoorRing),
}));
