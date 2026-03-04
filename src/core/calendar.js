/**
 * calendar.js — Solar Calendar Bridge (Layer 0)
 * Meeus Ch.25 algorithm — ±1 day accuracy.
 * Converts a JS Date to Tiết Khí, Nguyên, and Cục number.
 */

import { TIET_KHI_DEFS, CUC_TABLE } from './tables.js';

/** Julian Day from Gregorian calendar date */
export function toJD(year, month, day) {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/** Apparent solar longitude in degrees for a Julian Day */
export function solarLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const O = 125.04 - 1934.136 * T;
  let lon = ((L0 + C) % 360 + 360) % 360;
  lon -= 0.00569 - 0.00478 * Math.sin(O * Math.PI / 180);
  return ((lon % 360) + 360) % 360;
}

/** Iterate to find the JD when solar longitude equals targetLon */
export function jdOfSolarLon(targetLon, nearYear, nearMonth) {
  let jd = toJD(nearYear, nearMonth, 1);
  for (let i = 0; i < 50; i++) {
    let diff = targetLon - solarLongitude(jd);
    if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.0001) break;
    jd += diff / 360 * 365.25;
  }
  return jd;
}

/**
 * getSolarTermInfo(date) → SolarTermInfo
 * Returns: { name, isDuong, sectorIdx, daysSince, nguyen, nguyenName, cucSo, cucArr }
 */
export function getSolarTermInfo(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const timeOfDay = (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
  const targetJD = toJD(y, m, d) + timeOfDay;

  // 24 sectors of 15° each, offset from 270° (Đông Chí = 270°)
  const lon = solarLongitude(targetJD);
  const sectorIdx = Math.floor(((lon - 270 + 360) % 360) / 15) % 24;
  const tk = TIET_KHI_DEFS[sectorIdx];

  const termStartJD = jdOfSolarLon(tk.lon, y, Math.max(1, m - 1));
  const daysSince = Math.floor(targetJD - termStartJD);
  const nguyen = daysSince < 5 ? 0 : daysSince < 10 ? 1 : 2;
  const cucArr = CUC_TABLE[tk.name] || [1, 7, 4];

  return {
    name: tk.name,
    isDuong: tk.isDuong,
    sectorIdx,
    daysSince,
    nguyen,
    nguyenName: ['Thượng', 'Trung', 'Hạ'][nguyen],
    cucSo: cucArr[nguyen],
    cucArr,
  };
}
