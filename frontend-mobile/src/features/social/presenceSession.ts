import { socialService, type SocialPrivacy, type Presence } from '../../services/socialService';
import { getSessionRevision } from '../../services/authSession';
import { getApiErrorMessage } from '../../utils/apiError';
import { createFocusSessionId } from '../focus/focusSessionId';
export type Clock = { every(run: () => void, milliseconds: number): () => void };
export const clock: Clock = { every(run, milliseconds) { const timer = setInterval(run, milliseconds); return () => clearInterval(timer); } };
export type PrivacyState = { privacy: SocialPrivacy | null; loading: boolean; saving: boolean; saved: boolean; error: string | null; presence: Presence | null };
const initial = (): PrivacyState => ({ privacy: null, loading: true, saving: false, saved: false, error: null, presence: null });
function validate(value: SocialPrivacy): SocialPrivacy {
  for (const key of ['showPresence','showLastSeen','shareVerifiedMinutes','shareVerifiedSessions'] as const) {
    if (typeof value?.[key] !== 'boolean') throw new Error('Social settings are unavailable.');
  }
  return value;
}
/** A presence UUID reuses the existing non-secret generator, never the ID of a study recording. */
export class PresenceSession {
  private state = initial();
  private listeners = new Set<() => void>();
  private lifetime = new AbortController();
  private pulse: AbortController | null = null;
  private revision = getSessionRevision();
  private sessionId = createFocusSessionId();
  private active = false;
  private pending = false;
  private resume = false;
  private stopTimer?: () => void;
  private loadTask?: Promise<void>;
  private api: typeof socialService;
  private timer: Clock;
  constructor(api = socialService, timer = clock) { this.api = api; this.timer = timer; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(value: Partial<PrivacyState>) { this.state = { ...this.state, ...value }; for (const listener of this.listeners) listener(); }
  async load() {
    if (this.loadTask || this.lifetime.signal.aborted) return this.loadTask;
    this.update({ loading: true, error: null });
    this.loadTask = (async () => {
      try {
        const privacy = validate(await this.api.privacy(this.lifetime.signal, this.revision));
        if (!this.lifetime.signal.aborted) { this.update({ privacy, loading: false }); this.configure(); }
      } catch(error) { if (!this.lifetime.signal.aborted) this.update({ loading: false, error: getApiErrorMessage(error, 'Social settings are unavailable.') }); }
    })();
    await this.loadTask; this.loadTask = undefined;
  }
  async save(value: SocialPrivacy) {
    if (this.state.saving || !this.state.privacy || this.lifetime.signal.aborted) return;
    this.update({ saving: true, saved: false, error: null });
    try {
      const privacy = validate(await this.api.savePrivacy(value, this.lifetime.signal, this.revision));
      if (!this.lifetime.signal.aborted) {
        const changed = privacy.showPresence !== this.state.privacy?.showPresence || privacy.showLastSeen !== this.state.privacy?.showLastSeen;
        this.update({ privacy, saving: false, saved: true, ...(changed ? { presence: null } : {}) }); if (changed) this.configure();
      }
    } catch(error) { if (!this.lifetime.signal.aborted) this.update({ saving: false, error: getApiErrorMessage(error, 'Could not save social privacy. Your settings have not been confirmed.') }); }
  }
  setActive(value: boolean) { if (this.active === value || this.lifetime.signal.aborted) return; this.active = value; this.configure(); }
  private configure() {
    this.stopTimer?.(); this.stopTimer = undefined; this.pulse?.abort(); this.pulse = null;
    if (!this.active || !this.state.privacy || !(this.state.privacy.showPresence || this.state.privacy.showLastSeen) || this.lifetime.signal.aborted) {
      this.update({ presence: null }); return;
    }
    this.pulse = new AbortController();
    if (this.pending) this.resume = true; else void this.tick();
    this.stopTimer = this.timer.every(() => { void this.tick(); }, 30000);
  }
  private async tick() {
    const controller = this.pulse;
    if (this.pending || !this.active || !controller || controller.signal.aborted || this.lifetime.signal.aborted) return;
    this.pending = true;
    try {
      const presence = await this.api.heartbeat(this.sessionId, controller.signal, this.revision);
      if (this.pulse === controller && !controller.signal.aborted) this.update({ presence });
    } catch { if (this.pulse === controller && !controller.signal.aborted) this.update({ presence: null }); }
    finally { this.pending = false; if (this.resume) { this.resume = false; void this.tick(); } }
  }
  dispose() { this.lifetime.abort(); this.pulse?.abort(); this.stopTimer?.(); this.stopTimer = undefined; this.state = initial(); this.listeners.clear(); }
}
