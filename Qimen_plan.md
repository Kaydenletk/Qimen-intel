# QMDJ Core Engine Bug Fixes - Implementation Plan

## Goal Description
Fixing the 4 identified bugs in the QMDJ Chuyển Bàn engine to match proper logic ("Self Plus" standard) for professional metaphysical analysis.
- Maintain dynamic time based on system parameters or default to current `new Date()` time.
- Update 8 Deities (Bát Thần) array to the standard one requested.
- Fix Chief Star (Trực Phù) detection for "Giáp" hours. There are two underlying causes in the code:
  1. Earth Plate stem distribution used the wrong array `[1, 8, 3, 4, 9, 5, 2, 7, 6]` instead of numerical Luo Shu `[1, 2, 3, 4, 5, 6, 7, 8, 9]`.
  2. Hour Stems of "Giáp" were hardcoded to hide under Mậu instead of properly hiding under the Lead Stem (Tuần Thủ) of the current Xun.
- Update Emptiness (Không Vong) calculation to prioritize Hour branch.

## Proposed Changes

### Configuration
#### server.js
- Keep existing dynamic time behavior where it parses URL parameters or defaults to System Time. No changes needed.

### Data Structures
#### [MODIFY] src/core/tables.js
- Update `BAT_THAN` array to use exact requested 8 deities.
  ```javascript
  export const BAT_THAN = [
    { idx: 0, name: 'Trực Phù',   element: 'Thổ',  type: 'cat'  },
    { idx: 1, name: 'Đằng Xà',    element: 'Hỏa',  type: 'hung' },
    { idx: 2, name: 'Thái Âm',    element: 'Kim',  type: 'cat'  },
    { idx: 3, name: 'Lục Hợp',    element: 'Mộc',  type: 'cat'  },
    { idx: 4, name: 'Bạch Hổ',    element: 'Kim',  type: 'hung' },
    { idx: 5, name: 'Huyền Vũ',   element: 'Thủy', type: 'hung' },
    { idx: 6, name: 'Cửu Địa',    element: 'Thổ',  type: 'cat'  },
    { idx: 7, name: 'Cửu Thiên',  element: 'Kim',  type: 'cat'  },
  ];
  ```

### Core Logic
#### [MODIFY] src/core/flying.js
- Correct Earth Plate array sequences to standard numerical Luo Shu paths.
  ```javascript
  const YANG_SEQ_WITH_5 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const YIN_SEQ_WITH_5  = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  ```
- Make "Giáp" hours correctly hide underneath current Xun lead stem.
  ```javascript
  let hourStemName = STEMS[hourStemIdx].name;
  if (hourStemName === 'Giáp') hourStemName = leadStemName; // Giáp ẩn dưới Tuần Thủ
  ```
- Change Kong Wang (Không Vong) anchor from Day Pillar to Hour Pillar to prioritize short-term divination accurately per user's request.
  ```javascript
  // Calculate Không Vong from Hour Pillar
  const kv = getKhongVong(gioPillar.stemIdx, gioPillar.branchIdx);
  ```

## Verification Plan
### Automated Tests
- Restart `node server.js`
- Hit `/api/analyze?hour=10` or `/` with hour 10. The JSON / HTML should show `hour: 10` and `Tị` as branch.
- Assert that Trực Phù for `10:36` (Giờ Quý Tị, date defaults to today) shows correctly.
- Check user's specific case: Giờ Giáp Ngọ, `date=2026-03-03&hour=12` to ensure it doesn't take Thiên Bồng. 
- Assert Không Vong and 8 deities are accurately rendered.

## Grandmaster Follow-up Fixes

### Data Structures
#### [MODIFY] src/core/tables.js & qmdjEngine.js
- Completely replace `CUC_TABLE` with the historically accurate QMDJ layout where `Vũ Thủy` is `[9, 6, 3]` and all others are properly formatted. 

### Legacy Deities Purge
#### [MODIFY] src/core/dungthan.js & src/core/cachcuc.js & qmdjEngine.js
- Remove any references to `Thanh Long` and `Câu Trận` from the topic definitions. Replace with `Cửu Thiên`/`Cửu Địa` respectively (or remove if redundant). 

### Fu Yin Verification
- Run a node test to ensure `March 3, 2026, 12:00 PM` correctly resolves to `Vũ Thủy`, `Dương Cục 3`, with `Thiên Tâm` as Trực Phù landing symmetrically on its home `Cung 6`.
