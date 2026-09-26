import { store } from './store.js';
import { runShuffle } from './shuffle.js';
import { playSlotAnimation } from './animation.js';
import { exportSeatChartImage } from './imageExport.js';

const DESK_W_PCT = 9;
const DESK_H_PCT = 9;

let currentAssignment = null; // deskId -> studentId
let currentSeatsSnapshot = null;
let isAnimating = false;

export function initProjection({ stageEl, shuffleBtn, saveImageBtn, errorEl }) {
  renderBlankStage(stageEl);
  saveImageBtn.disabled = true;

  shuffleBtn.addEventListener('click', () => {
    if (isAnimating) return;
    hideError(errorEl);

    const state = store.getState();
    const result = runShuffle({
      roster: state.roster,
      desks: state.layout.desks,
      conditions: state.conditions
    });

    if (!result.ok) {
      showError(errorEl, result.message);
      return;
    }

    currentAssignment = result.assignment;
    isAnimating = true;
    shuffleBtn.disabled = true;
    saveImageBtn.disabled = true;

    const reels = renderBlankStage(stageEl, state.layout.desks);
    const nameById = new Map(state.roster.map((s) => [s.id, s.name]));
    const reelData = reels.map((reel) => ({
      deskEl: reel.el,
      finalName: nameById.get(currentAssignment[reel.desk.id]) || ''
    }));
    const namePool = state.roster.map((s) => s.name);

    playSlotAnimation(reelData, namePool, () => {
      isAnimating = false;
      shuffleBtn.disabled = false;
      saveImageBtn.disabled = false;

      currentSeatsSnapshot = state.layout.desks.map((desk) => ({
        xPct: desk.xPct,
        yPct: desk.yPct,
        frontZone: !!desk.frontZone,
        studentName: nameById.get(currentAssignment[desk.id]) || ''
      }));
      store.addHistoryEntry({ timestamp: Date.now(), seats: currentSeatsSnapshot });
    });
  });

  saveImageBtn.addEventListener('click', () => {
    if (!currentSeatsSnapshot) return;
    exportSeatChartImage(currentSeatsSnapshot, '座席表');
  });
}

export function refreshProjectionStage(stageEl) {
  currentAssignment = null;
  currentSeatsSnapshot = null;
  renderBlankStage(stageEl);
}

function renderBlankStage(stageEl, desks) {
  const list = desks || store.getState().layout.desks;
  stageEl.innerHTML = '';
  const stage = document.createElement('div');
  stage.className = 'seat-chart-stage';
  stageEl.appendChild(stage);

  return list.map((desk) => {
    const el = document.createElement('div');
    el.className = 'desk desk-display';
    if (desk.frontZone) el.classList.add('desk-front');
    el.style.left = `${desk.xPct}%`;
    el.style.top = `${desk.yPct}%`;
    el.style.width = `${DESK_W_PCT}%`;
    el.style.height = `${DESK_H_PCT}%`;
    el.textContent = '';
    stage.appendChild(el);
    return { desk, el };
  });
}

function showError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError(errorEl) {
  errorEl.classList.add('hidden');
}
