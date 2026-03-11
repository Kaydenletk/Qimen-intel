export function normalizeVietnameseBase(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function normalizeLooseVietnameseText(text = '') {
  return normalizeVietnameseBase(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toTightSearchKey(text = '') {
  return normalizeLooseVietnameseText(text).replace(/\s+/g, '');
}
