import { isAxiosError } from 'axios';
import { socialService, type SocialProfile } from '../../services/socialService';
import { getSessionRevision, assertSessionRevision } from '../../services/authSession';
import { OwnProfileMedia } from '../profile/ownProfileMedia';
import { clock, type Clock } from './presenceSession';
export type MemberState = { status: 'loading' | 'ready' | 'unavailable' | 'error'; profile: SocialProfile | null; avatar: string | null; banner: string | null; imageError: boolean };
export type DirectorySnapshot = { accepted: ReadonlySet<number>; avatars: ReadonlyMap<number, string | null>; members: ReadonlyMap<number, MemberState> };
export const emptyDirectorySnapshot: DirectorySnapshot = { accepted: new Set(), avatars: new Map(), members: new Map() };
const empty = (): MemberState => ({ status: 'loading', profile: null, avatar: null, banner: null, imageError: false });
export class SocialDirectory {
  private snapshot: DirectorySnapshot = emptyDirectorySnapshot;
  private listeners = new Set<() => void>();
  private accepted = new Set<number>();
  private checkedAt = 0;
  private active = false;
  private disposed = false;
  private controller = new AbortController();
  private revision = getSessionRevision();
  private watchers = new Map<number, { avatar: number; profile: number }>();
  private members = new Map<number, MemberState>();
  private avatars = new Map<number, string | null>();
  private media = new Map<number, OwnProfileMedia>();
  private profiles = new Map<number, Promise<void>>();
  private profileControllers = new Map<number, AbortController>();
  private avatarJobs = new Map<number, Promise<void>>();
  private refreshTask?: Promise<void>;
  private stopTimer?: () => void;
  private runningImages = 0;
  private waiting: (() => void)[] = [];
  readonly ownerId: number;
  private api: typeof socialService;
  private timer: Clock;
  private mediaFactory: (id: number) => OwnProfileMedia;
  constructor(ownerId: number, api = socialService, timer: Clock = clock,
    mediaFactory = (id: number) => new OwnProfileMedia(ownerId, `/api/users/${id}/profile`, 'social')) {
    this.ownerId = ownerId; this.api = api; this.timer = timer; this.mediaFactory = mediaFactory;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit() {
    this.snapshot = { accepted: this.active && Date.now() - this.checkedAt < 35000 ? new Set(this.accepted) : new Set(),
      avatars: new Map(this.avatars), members: new Map(this.members) };
    for (const listener of this.listeners) listener();
  }
  isAccepted(id: number) { return this.active && this.accepted.has(id) && Date.now() - this.checkedAt < 35000; }
  avatar(id: number) { return this.isAccepted(id) ? this.avatars.get(id) ?? null : null; }
  member(id: number) { return this.members.get(id); }
  private resources(id: number) {
    let media = this.media.get(id);
    if (!media) { media = this.mediaFactory(id); this.media.set(id, media); }
    return media;
  }
  private async image<T>(run: () => Promise<T>): Promise<T> {
    if (this.runningImages >= 3) await new Promise<void>(resolve => this.waiting.push(resolve));
    else this.runningImages++;
    try { assertSessionRevision(this.revision); if (!this.active || this.disposed) throw new Error('Image request cancelled.'); return await run(); }
    finally { const next = this.waiting.shift(); if (next) next(); else this.runningImages--; }
  }
  watch(id: number, kind: 'avatar' | 'profile') {
    if (!Number.isSafeInteger(id) || id <= 0 || id === this.ownerId || this.disposed) return () => {};
    const counts = this.watchers.get(id) ?? { avatar: 0, profile: 0 }; counts[kind]++; this.watchers.set(id, counts);
    this.configureTimer(); void this.refresh().then(() => {
      if (!this.active || this.disposed || !this.watchers.has(id)) return;
      if (counts.profile && !this.members.has(id)) void this.loadMember(id);
      else if (!counts.profile && this.isAccepted(id)) void this.loadAvatar(id);
    });
    return () => {
      counts[kind]--; if (!counts.avatar && !counts.profile) this.watchers.delete(id);
      if (!counts.profile) { this.profileControllers.get(id)?.abort(); this.members.delete(id); }
      this.configureTimer(); this.emit();
    };
  }
  private configureTimer() {
    if (this.active && this.watchers.size && !this.stopTimer) this.stopTimer = this.timer.every(() => { void this.refresh(true); }, 30000);
    if ((!this.active || !this.watchers.size) && this.stopTimer) { this.stopTimer(); this.stopTimer = undefined; }
  }
  setActive(active: boolean) {
    if (this.active === active || this.disposed) return;
    this.active = active;
    if (!active) {
      this.controller.abort(); for (const controller of this.profileControllers.values()) controller.abort();
      this.profileControllers.clear(); this.profiles.clear(); this.avatarJobs.clear(); this.refreshTask = undefined;
      for (const media of this.media.values()) media.dispose();
      this.media.clear(); this.avatars.clear(); this.members.clear(); this.accepted.clear(); this.checkedAt = 0; this.emit();
    } else { this.controller = new AbortController(); void this.refresh(true); }
    this.configureTimer();
  }
  async refresh(force = false) {
    if (this.refreshTask) return this.refreshTask;
    if (!this.active || this.disposed || !this.watchers.size) return;
    const controller = this.controller;
    const task = (async () => {
      try {
        assertSessionRevision(this.revision);
        if (force || !this.checkedAt || Date.now() - this.checkedAt >= 30000) {
          const accepted = await this.api.accepted(this.ownerId, controller.signal, this.revision);
          if (controller.signal.aborted || this.disposed) return;
          for (const id of this.accepted) if (!accepted.has(id)) this.revoke(id);
          this.accepted = accepted; this.checkedAt = Date.now(); this.emit();
        }
        if (controller.signal.aborted || this.disposed) return;
        await Promise.all([...this.watchers].map(async ([id, counts]) => {
          if (counts.profile) await this.loadMember(id);
          else if (this.isAccepted(id)) await this.loadAvatar(id);
        }));
      } catch {
        if (controller.signal.aborted || this.disposed) return;
        for (const id of this.media.keys()) this.revoke(id);
        this.accepted.clear(); this.checkedAt = 0; this.emit();
      }
    })();
    this.refreshTask = task;
    await task; if (this.refreshTask === task) this.refreshTask = undefined;
    // A foreground event or newly mounted row may arrive during an older, aborted refresh.
    if (!this.disposed && this.active && controller !== this.controller && !this.checkedAt) void this.refresh(true);
  }
  private async loadAvatar(id: number) {
    if (this.avatars.has(id)) return;
    if (this.avatarJobs.has(id)) return this.avatarJobs.get(id);
    const media = this.resources(id);
    const job = this.image(async () => {
      if (!this.isAccepted(id) || !this.watchers.has(id) || this.media.get(id) !== media) return null;
      return media.load('avatar');
    }).then(uri => {
      if (this.media.get(id) === media && this.isAccepted(id)) { this.avatars.set(id, uri); this.emit(); }
    }).catch(error => { if (this.media.get(id) !== media) return;
      if (isAxiosError(error) && error.response?.status === 403) this.revoke(id);
      else { this.avatars.set(id, null); this.emit(); }
    });
    this.avatarJobs.set(id, job); await job; if (this.avatarJobs.get(id) === job) this.avatarJobs.delete(id);
  }
  async loadMember(id: number, explicit = false) {
    if (this.profiles.has(id)) return this.profiles.get(id);
    if (!this.active || this.disposed || !this.watchers.get(id)?.profile) return;
    const controller = new AbortController(); this.profileControllers.set(id, controller);
    if (!this.members.has(id)) { this.members.set(id, empty()); this.emit(); }
    const current = () => !controller.signal.aborted && !this.disposed && this.active && this.profileControllers.get(id) === controller;
    const task = (async () => {
      try {
        const profile = await this.api.profile(id, controller.signal, this.revision);
        if (!current()) return;
        if (profile.id !== id) throw new Error('Unexpected member profile.');
        if (explicit) {
          try { profile.presence = await this.api.presence(id, controller.signal, this.revision); }
          catch(error) { if (isAxiosError(error) && [403,404].includes(error.response?.status ?? 0)) throw error; profile.presence = null; }
        }
        if (!current()) return;
        const media = this.resources(id);
        if (explicit) { media.invalidate('avatar'); media.invalidate('banner'); this.avatars.delete(id); }
        const previous = this.members.get(id);
        this.members.set(id, { ...empty(), avatar: previous?.avatar ?? null, banner: previous?.banner ?? null, status: 'ready', profile }); this.emit();
        const results = await Promise.allSettled((['avatar','banner'] as const).map(slot => this.image(async () => {
          if (!current() || this.media.get(id) !== media) return null; return media.load(slot);
        })));
        if (!current() || this.media.get(id) !== media) return;
        if (results.some(result => result.status === 'rejected' && isAxiosError(result.reason) && result.reason.response?.status === 403)) {
          this.revoke(id); return;
        }
        const avatar = results[0].status === 'fulfilled' ? results[0].value : null;
        const banner = results[1].status === 'fulfilled' ? results[1].value : null;
        this.avatars.set(id, avatar);
        this.members.set(id, { status: 'ready', profile, avatar, banner, imageError: results.some(result => result.status === 'rejected') }); this.emit();
      } catch(error) {
        if (!current()) return;
        const unavailable = isAxiosError(error) && [403,404].includes(error.response?.status ?? 0);
        this.revoke(id, unavailable ? 'unavailable' : 'error');
      }
    })();
    this.profiles.set(id, task); await task; if (this.profiles.get(id) === task) this.profiles.delete(id);
  }
  revoke(id: number, status: 'unavailable' | 'error' = 'unavailable') {
    this.checkedAt = 0;
    this.profileControllers.get(id)?.abort(); this.accepted.delete(id); this.media.get(id)?.dispose(); this.media.delete(id);
    this.avatars.delete(id); this.avatarJobs.delete(id);
    this.members.set(id, { ...empty(), status }); this.emit();
  }
  invalidateRelations() { this.checkedAt = 0; void this.refresh(true); }
  dispose() {
    this.setActive(false); this.disposed = true; this.controller.abort(); this.stopTimer?.(); this.stopTimer = undefined;
    this.watchers.clear(); this.members.clear(); this.listeners.clear();
  }
}
