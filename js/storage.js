const STORAGE_KEY = 'seatShuffleApp:v1';

export function defaultState() {
  return {
    roster: [],
    layout: { desks: [] },
    conditions: { byStudentId: {} },
    history: []
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      layout: { ...defaultState().layout, ...(parsed.layout || {}) },
      conditions: { ...defaultState().conditions, ...(parsed.conditions || {}) }
    };
  } catch (e) {
    console.error('状態の読み込みに失敗しました', e);
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('状態の保存に失敗しました', e);
  }
}
