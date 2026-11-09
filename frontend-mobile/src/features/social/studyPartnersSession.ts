import { isAxiosError } from 'axios';
import { socialService, type Presence } from '../../services/socialService';
import { getSessionRevision } from '../../services/authSession';
import type { SocialDirectory } from './socialDirectory';
import { clock, type Clock } from './presenceSession';
export interface StudyPartner { id: number; username: string; name: string; presence: Presence | null; avatar: string | null; imageError: boolean; profileReady: boolean; }
export interface PartnersState { items: StudyPartner[]; page: number; pages: number; total: number; loading: boolean; refreshing: boolean; error: string | null; partial: boolean; }
const initial = (): PartnersState => ({ items: [], page: 0, pages: 1, total: 0, loading: true, refreshing: false, error: null, partial: false });
const denied = (error: unknown) => isAxiosError(error) && [403,404].includes(error.response?.status ?? 0);
export function partnerGroup(partner: StudyPartner): 'Online' | 'Offline' | 'Other partners' {
  return partner.presence?.status === 'ONLINE' ? 'Online' : partner.presence?.status === 'OFFLINE' ? 'Offline' : 'Other partners';
}
/** Pagination/polling for one open panel; image files and own heartbeat remain owned by 6.4b. */
export class StudyPartnersSession {
  private state = initial();
  private listeners = new Set<() => void>();
  private controller = new AbortController();
  private active = false;
  private disposed = false;
  private task?: Promise<void>;
  private stopTimer?: () => void;
  private tick = 0;
  private running = 0;
  private queue: (() => void)[] = [];
  private revision = getSessionRevision();
  private revoked = new Set<number>();
  private unsubscribe: () => void;
  private directory: SocialDirectory;
  private api: typeof socialService;
  private timer: Clock;
  constructor(directory: SocialDirectory, api = socialService, timer = clock) {
    this.directory = directory; this.api = api; this.timer = timer;
    this.unsubscribe = directory.subscribeRevocations(id => {
      this.revoked.add(id); this.update({ items: this.state.items.filter(item => item.id !== id) });
    });
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(value: Partial<PartnersState>) { if (this.disposed) return; this.state = { ...this.state, ...value }; for (const listener of this.listeners) listener(); }
  setActive(value: boolean) {
    if (value === this.active || this.disposed) return;
    this.active = value;
    if (!value) {
      this.controller.abort(); this.task = undefined; this.stopTimer?.(); this.stopTimer = undefined;
      this.update({ items: [], loading: true, refreshing: false, partial: false }); return;
    }
    this.controller = new AbortController(); void this.refresh(true);
    this.stopTimer = this.timer.every(() => { void this.refresh(); }, 60000);
  }
  setPage(page: number) {
    if (!Number.isSafeInteger(page) || page < 0 || page >= this.state.pages || page === this.state.page) return;
    this.controller.abort(); this.controller = new AbortController(); this.task = undefined;
    this.update({ page, items: [], loading: true, error: null, partial: false }); void this.refresh(true);
  }
  retry() {
    if (this.task) return this.task;
    for (const item of this.state.items) this.directory.invalidatePartnerAvatar(item.id);
    return this.refresh(true);
  }
  private async limited<T>(signal: AbortSignal, run: () => Promise<T>): Promise<T> {
    if (this.running >= 2) await new Promise<void>(resolve => this.queue.push(resolve)); else this.running++;
    try { if (signal.aborted || this.disposed) throw new Error('Partner request cancelled.'); return await run(); }
    finally { const next = this.queue.shift(); if (next) next(); else this.running--; }
  }
  async refresh(full = false) {
    if (this.task) return this.task;
    if (!this.active || this.disposed) return;
    const controller = this.controller, page = this.state.page;
    const current = () => !controller.signal.aborted && this.controller === controller && this.active && !this.disposed;
    this.update({ refreshing: true, loading: this.state.items.length === 0, error: null });
    const task = (async () => {
      try {
        const response = await this.api.activePage(page, controller.signal, this.revision);
        if (!current()) return;
        if (!Array.isArray(response.content) || !Number.isSafeInteger(response.totalPages) || response.totalPages < 0 || !Number.isSafeInteger(response.totalElements) || response.totalElements < 0) throw new Error('Invalid Tracking page.');
        if (page > 0 && page >= response.totalPages) {
          this.task = undefined; this.setPage(Math.max(0, response.totalPages - 1)); return;
        }
        const ids = new Map<number, string>();
        for (const link of response.content.slice(0,10)) {
          if (link.status !== 'ACCEPTED') continue;
          const id = link.requesterId === this.directory.ownerId ? link.receiverId : link.receiverId === this.directory.ownerId ? link.requesterId : null;
          if (id !== null && Number.isSafeInteger(id) && id > 0 && id !== this.directory.ownerId) ids.set(id, (link.requesterId === this.directory.ownerId ? link.receiverUsername : link.requesterUsername) || 'Member');
        }
        this.revoked.clear();
        const previous = new Map(this.state.items.map(item => [item.id, item]));
        for (const item of this.state.items) if (!ids.has(item.id)) this.directory.invalidatePartnerAvatar(item.id);
        this.update({ items: this.state.items.filter(item => ids.has(item.id)), pages: Math.max(1,response.totalPages), total: response.totalElements });
        if (full) this.tick = 0; else this.tick++;
        let partial = false;
        const rows = await Promise.all([...ids].map(([id, username]) => this.limited(controller.signal, async (): Promise<StudyPartner | null> => {
          const old = previous.get(id);
          try {
            let row: StudyPartner;
            if (full || !old?.profileReady) {
              const profile = await this.api.profile(id, controller.signal, this.revision);
              if (!current() || this.revoked.has(id)) return null;
              if (profile.id !== id) throw new Error('Unexpected partner profile.');
              row = { id, username: profile.username, name: profile.presentationName || profile.username, presence: profile.presence ?? null, profileReady: true, avatar: null, imageError: false };
              try { row.avatar = await this.directory.partnerAvatar(id, controller.signal); }
              catch(error) { if (denied(error)) throw error; row.imageError = true; partial = true; }
            } else if (old.presence?.status === 'HIDDEN' && !old.presence.lastSeenAt && this.tick % 3 !== 0) row = old;
            else row = { ...old, presence: await this.api.presence(id, controller.signal, this.revision) };
            return current() && !this.revoked.has(id) ? row : null;
          } catch(error) {
            if (!current()) return null;
            if (denied(error)) { this.directory.revoke(id); return null; }
            partial = true;
            return { id, username, name: old?.name || username, presence: null, avatar: full ? null : old?.avatar ?? null, imageError: old?.imageError ?? false, profileReady: full ? false : old?.profileReady ?? false };
          }
        }).catch(() => null)));
        if (!current()) return;
        this.update({ items: rows.filter((row): row is StudyPartner => row !== null && !this.revoked.has(row.id)).sort((a,b) => a.name.localeCompare(b.name)), loading: false, partial: partial || rows.some(row => row?.imageError || row && !row.profileReady), error: null });
      } catch {
        if (!current()) return;
        for (const item of this.state.items) this.directory.invalidatePartnerAvatar(item.id);
        this.update({ items: [], loading: false, error: 'Could not load study partners. Please try again.', partial: false });
      } finally { if (current()) this.update({ refreshing: false }); }
    })();
    this.task = task; await task; if (this.task === task) this.task = undefined;
  }
  dispose() { this.setActive(false); this.disposed = true; this.controller.abort(); this.stopTimer?.(); this.unsubscribe(); this.listeners.clear(); this.state = initial(); }
}
