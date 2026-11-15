import type { WidgetId, WidgetSetting } from './widgetPreferences';
export interface RowFrame { y: number; height: number }
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
export function widgetDropIndex(point: number, frames: RowFrame[]) {
  if (!frames.length || !Number.isFinite(point)) return -1;
  const found = frames.findIndex(frame => point < frame.y + frame.height);
  return found < 0 ? frames.length - 1 : found;
}
