/**
 * Shared Analysis State for "/" and "/dung-than"
 * Lightweight store with subscribe/getState/analyze actions.
 */

export function createAnalysisContext(initial = {}) {
  const listeners = new Set();
  let state = {
    date: initial.date || '',
    hour: initial.hour || '',
    minute: initial.minute || '',
    tz: initial.tz || '',
    result: initial.result || null,
    loading: false,
    error: null,
  };

  function notify() {
    for (const listener of listeners) listener(state);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    notify();
  }

  async function analyze({ date, hour, minute = '', tz = '', fetcher } = {}) {
    const useFetcher = fetcher || (typeof fetch !== 'undefined' ? fetch : null);
    if (!useFetcher) {
      throw new Error('No fetch implementation available for analysisContext.analyze');
    }

    setState({
      loading: true,
      error: null,
      date: date ?? state.date,
      hour: hour ?? state.hour,
      minute: minute ?? state.minute,
      tz: tz ?? state.tz,
    });

    try {
      const params = new URLSearchParams();
      if (date ?? state.date) params.set('date', String(date ?? state.date));
      if (hour ?? state.hour) params.set('hour', String(hour ?? state.hour));
      if (minute ?? state.minute) params.set('minute', String(minute ?? state.minute));
      if (tz ?? state.tz) params.set('tz', String(tz ?? state.tz));

      const url = `/api/analyze${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await useFetcher(url);
      if (!res.ok) throw new Error(`Analyze request failed: ${res.status}`);
      const result = await res.json();

      setState({ loading: false, result, error: null });
      return result;
    } catch (error) {
      setState({ loading: false, error: error.message || String(error) });
      throw error;
    }
  }

  return {
    getState: () => state,
    setState,
    analyze,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const analysisContext = createAnalysisContext();
