const BASE_SIZE_PCT = 9;
const MIN_SIZE_PCT = 4;
const MARGIN_X_PCT = 6;
const MARGIN_Y_PCT = 8;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/** 机の数に応じて、はみ出さずに収まる机1つあたりの大きさ(%)を求める */
export function getDeskSizePct(count) {
  if (count <= 0) return { wPct: BASE_SIZE_PCT, hPct: BASE_SIZE_PCT };
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * (4 / 3))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const wPct = clamp((100 - MARGIN_X_PCT * 2) / cols - 1, MIN_SIZE_PCT, BASE_SIZE_PCT);
  const hPct = clamp((100 - MARGIN_Y_PCT * 2) / rows - 1.5, MIN_SIZE_PCT, BASE_SIZE_PCT);
  return { wPct, hPct };
}

/**
 * 机を自動配置する際の位置(%)を求める。0〜100の範囲に必ず収まる。
 * @param {number} index その机が並ぶ順番(0始まり)
 * @param {number} count 自動配置の対象となる机の総数
 */
export function computeGridPosition(index, count) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * (4 / 3))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const { wPct, hPct } = getDeskSizePct(count);
  const usableW = 100 - MARGIN_X_PCT * 2 - wPct;
  const usableH = 100 - MARGIN_Y_PCT * 2 - hPct;
  const xStep = cols > 1 ? usableW / (cols - 1) : 0;
  const yStep = rows > 1 ? usableH / (rows - 1) : 0;
  const xPct = clamp(MARGIN_X_PCT + col * xStep, 0, 100 - wPct);
  const yPct = clamp(MARGIN_Y_PCT + row * yStep, 0, 100 - hPct);
  return { xPct, yPct };
}
