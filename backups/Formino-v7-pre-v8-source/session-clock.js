/** Formino 4.8: deterministic workout clock and date-scoped training reset. */
'use strict';
const FORMINO_CLOCK = (() => {
  function elapsedSeconds(iso, nowMs = Date.now()) {
    if (!iso) return 0;
    const t = typeof iso === 'number' ? iso : Date.parse(iso);
    if (!Number.isFinite(t) || t <= 0) return 0;
    return Math.max(0, Math.floor((nowMs - t) / 1000));
  }
  function formatElapsed(total) {
    const n = Math.max(0, Math.floor(Number(total) || 0));
    return [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60]
      .map(x => String(x).padStart(2, '0')).join(':');
  }
  function trainingCountForDate(state, date) {
    const completed = (state.sessions || []).filter(s => s.date === date).length;
    const draft = state.activeSession?.date === date ? 1 : 0;
    return {saved: completed, draft, total: completed + draft};
  }
  function clearTrainingDate(state, date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid local date');
    return {...state,
      sessions: (state.sessions || []).filter(s => s.date !== date),
      activeSession: state.activeSession?.date === date ? null : state.activeSession};
  }
  return Object.freeze({elapsedSeconds, formatElapsed, trainingCountForDate, clearTrainingDate});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = FORMINO_CLOCK;
