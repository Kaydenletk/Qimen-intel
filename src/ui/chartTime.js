export function formatLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isIsoDateInputValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return false;
  const text = String(rawValue).trim();
  if (text.length !== 10) return false;
  const parts = text.split('-');
  if (parts.length !== 3) return false;
  const [year, month, day] = parts;
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) return false;
  return [year, month, day].every(part => [...part].every(ch => ch >= '0' && ch <= '9'));
}

export function parseBoundedInt(rawValue, min, max) {
  if (rawValue === null || rawValue === undefined) return null;
  const text = String(rawValue).trim();
  if (!text || !/^-?\d+$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function readSearchParam(searchParams, key) {
  if (!searchParams) return null;
  if (typeof searchParams.get === 'function') return searchParams.get(key);
  const value = searchParams[key];
  return value === undefined ? null : value;
}

export function hasExplicitTimeOverride(searchParams) {
  return ['date', 'hour', 'minute'].some(key => {
    const value = readSearchParam(searchParams, key);
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

export function getLocalTimeParts(now = new Date()) {
  return {
    date: formatLocalDateInput(now),
    hour: now.getHours(),
    minute: now.getMinutes(),
    jsDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0),
  };
}

export function getEffectiveChartTime(searchParams, now = new Date()) {
  const mode = hasExplicitTimeOverride(searchParams) ? 'manual' : 'live';
  const nowParts = getLocalTimeParts(now);

  if (mode === 'live') {
    return {
      mode,
      date: nowParts.jsDate,
      hour: nowParts.hour,
      minute: nowParts.minute,
      dateInputValue: nowParts.date,
      hasExplicitOverride: false,
    };
  }

  const dateParam = readSearchParam(searchParams, 'date');
  const hourParam = readSearchParam(searchParams, 'hour');
  const minuteParam = readSearchParam(searchParams, 'minute');
  const parsedHour = parseBoundedInt(hourParam, 0, 23);
  const parsedMinute = parseBoundedInt(minuteParam, 0, 59);
  const hour = parsedHour ?? nowParts.hour;
  const minute = parsedMinute ?? nowParts.minute;

  if (!dateParam) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return {
      mode,
      date,
      hour,
      minute,
      dateInputValue: formatLocalDateInput(date),
      hasExplicitOverride: true,
    };
  }

  if (!isIsoDateInputValue(dateParam)) {
    const fallbackDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return {
      mode,
      date: fallbackDate,
      hour,
      minute,
      dateInputValue: formatLocalDateInput(fallbackDate),
      hasExplicitOverride: true,
    };
  }

  const [yRaw, mRaw, dRaw] = String(dateParam).split('-').map(n => Number(n));
  const date = new Date(yRaw, mRaw - 1, dRaw, hour, minute, 0, 0);
  return {
    mode,
    date,
    hour,
    minute,
    dateInputValue: formatLocalDateInput(date),
    hasExplicitOverride: true,
  };
}

export function isSameResolvedMinute(left, right) {
  if (!left || !right) return false;
  return left.dateInputValue === right.dateInputValue
    && Number(left.hour) === Number(right.hour)
    && Number(left.minute) === Number(right.minute);
}

export function getMillisecondsUntilNextMinute(now = new Date()) {
  return ((59 - now.getSeconds()) * 1000) + (1000 - now.getMilliseconds()) + 10;
}
