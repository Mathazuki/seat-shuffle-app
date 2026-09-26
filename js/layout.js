import { store } from './store.js';
import { getDeskSizePct } from './deskGrid.js';

const DRAG_THRESHOLD_PX = 6;

let selectedDeskId = null;

export function renderLayout(container) {
  const state = store.getState();
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'panel-intro';
  intro.textContent = '机をドラッグして自由に配置できます。机をタップすると「前方指定」や削除ができます。';
  container.appendChild(intro);

  const toolbar = document.createElement('div');
  toolbar.className = 'layout-toolbar';
  const addBtn = document.createElement('button');
  addBtn.className = 'primary-btn';
  addBtn.textContent = '机を追加';
  addBtn.addEventListener('click', () => {
    store.addDesk();
  });
  toolbar.appendChild(addBtn);

  const countInfo = document.createElement('span');
  countInfo.className = 'count-info';
  countInfo.textContent = `机の数: ${state.layout.desks.length}`;
  toolbar.appendChild(countInfo);
  container.appendChild(toolbar);

  const body = document.createElement('div');
  body.className = 'layout-body';
  container.appendChild(body);

  const canvas = document.createElement('div');
  canvas.className = 'layout-canvas';
  body.appendChild(canvas);

  const sidePanel = document.createElement('div');
  sidePanel.className = 'layout-side-panel';
  body.appendChild(sidePanel);

  const { wPct, hPct } = getDeskSizePct(state.layout.desks.length);

  state.layout.desks.forEach((desk, index) => {
    canvas.appendChild(renderDeskEl(desk, index, canvas, sidePanel, container, wPct, hPct));
  });

  renderSidePanel(sidePanel, state, container);
}

function renderDeskEl(desk, index, canvas, sidePanel, fullContainer, deskWPct, deskHPct) {
  const el = document.createElement('div');
  el.className = 'desk';
  if (desk.frontZone) el.classList.add('desk-front');
  if (desk.id === selectedDeskId) el.classList.add('desk-selected');
  el.style.left = `${desk.xPct}%`;
  el.style.top = `${desk.yPct}%`;
  el.style.width = `${deskWPct}%`;
  el.style.height = `${deskHPct}%`;
  el.textContent = String(index + 1);
  el.dataset.deskId = desk.id;

  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startXPct = desk.xPct;
  let startYPct = desk.yPct;

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startXPct = desk.xPct;
    startYPct = desk.yPct;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) moved = true;
    if (!moved) return;
    const rect = canvas.getBoundingClientRect();
    const deltaXPct = (dx / rect.width) * 100;
    const deltaYPct = (dy / rect.height) * 100;
    const newX = clamp(startXPct + deltaXPct, 0, 100 - deskWPct);
    const newY = clamp(startYPct + deltaYPct, 0, 100 - deskHPct);
    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;
  });

  const finishDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* noop */
    }
    if (moved) {
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const deltaXPct = (dx / rect.width) * 100;
      const deltaYPct = (dy / rect.height) * 100;
      const newX = clamp(startXPct + deltaXPct, 0, 100 - deskWPct);
      const newY = clamp(startYPct + deltaYPct, 0, 100 - deskHPct);
      store.updateDesk(desk.id, { xPct: newX, yPct: newY, manuallyPlaced: true });
    } else {
      selectedDeskId = selectedDeskId === desk.id ? null : desk.id;
      renderLayout(fullContainer);
    }
  };

  el.addEventListener('pointerup', finishDrag);
  el.addEventListener('pointercancel', finishDrag);

  return el;
}

function renderSidePanel(sidePanel, state, fullContainer) {
  sidePanel.innerHTML = '';
  if (!selectedDeskId) {
    const hint = document.createElement('p');
    hint.className = 'empty-msg';
    hint.textContent = '机をタップすると設定が表示されます。';
    sidePanel.appendChild(hint);
    return;
  }

  const desk = state.layout.desks.find((d) => d.id === selectedDeskId);
  if (!desk) {
    selectedDeskId = null;
    return;
  }

  const index = state.layout.desks.indexOf(desk);
  const title = document.createElement('h3');
  title.textContent = `机 ${index + 1}`;
  sidePanel.appendChild(title);

  const label = document.createElement('label');
  label.className = 'checkbox-row';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!desk.frontZone;
  checkbox.addEventListener('change', () => {
    store.updateDesk(desk.id, { frontZone: checkbox.checked });
  });
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' 前方ゾーンにする(視力・身長などの前方指定に使用)'));
  sidePanel.appendChild(label);

  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn danger';
  delBtn.textContent = 'この机を削除';
  delBtn.addEventListener('click', () => {
    store.removeDesk(desk.id);
    selectedDeskId = null;
    renderLayout(fullContainer);
  });
  sidePanel.appendChild(delBtn);
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}
