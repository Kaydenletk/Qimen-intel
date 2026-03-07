export const JIA_HIDDEN_STEM_BY_BRANCH = {
  Tý: 'Mậu',
  Tuất: 'Kỷ',
  Thân: 'Canh',
  Ngọ: 'Tân',
  Thìn: 'Nhâm',
  Dần: 'Quý',
};

export function resolveHiddenStemForHourStem(stemName, branchName) {
  const normalizedStem = String(stemName || '').trim();
  const normalizedBranch = String(branchName || '').trim();

  if (normalizedStem !== 'Giáp') return normalizedStem;
  return JIA_HIDDEN_STEM_BY_BRANCH[normalizedBranch] || 'Mậu';
}
