import type { WidgetId, WidgetSetting } from './widgetPreferences';
export interface RowFrame { y: number; height: number; x?: number; width?: number }
/** Drop once, preserving every widget's visibility and the source array. */
export function moveWidgetTo(rows: WidgetSetting[], id: WidgetId, destination: number) {
  const from = rows.findIndex(row => row.id === id);
  if (from < 0 || !Number.isFinite(destination)) return rows;
  const to = Math.max(0, Math.min(rows.length - 1, Math.trunc(destination)));
  if (from === to) return rows;
  const next = [...rows];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
export function widgetDropIndex(point: number, frames: RowFrame[], pointX?: number) {
  if (!frames.length || !Number.isFinite(point)) return -1;
  if (pointX !== undefined && frames.every(frame => frame.x !== undefined && frame.width !== undefined)) {
    let nearest = 0, distance = Infinity;
    frames.forEach((frame,index) => {
      const dx = Math.max(frame.x!-pointX, 0, pointX-frame.x!-frame.width!);
      const dy = Math.max(frame.y-point, 0, point-frame.y-frame.height);
      const score = dx*dx + dy*dy;
      if (score < distance) { distance = score; nearest = index; }
    });
    return nearest;
  }
  const found = frames.findIndex(frame => point < frame.y + frame.height);
  return found < 0 ? frames.length - 1 : found;
}

/** Visible-card drops retain hidden widgets and their relative order in the saved layout. */
export function moveVisibleWidgetTo(rows: WidgetSetting[], id: WidgetId, targetId?: WidgetId) {
  if (!targetId) return rows;
  const target = rows.findIndex(row => row.id === targetId);
  return target < 0 ? rows : moveWidgetTo(rows, id, target);
}
