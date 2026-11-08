import { useState } from "react";
import { useSocial } from "../../contexts/SocialContext";
import { getApiErrorMessage } from "../../utils/apiError";
import type { SocialPrivacy } from "../../services/socialService";
export function SocialPrivacySettings() {
    const social = useSocial();
    const [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
    async function toggle(key: keyof SocialPrivacy, value: boolean) {
        if (!social?.privacy) return;
        setSaving(true); setError(null);
        try { await social.savePrivacy({ ...social.privacy, [key]: value }); }
        catch (failure) { setError(getApiErrorMessage(failure, 'Could not save privacy settings.')); }
        finally { setSaving(false); }
    }
    return <section className="study-panel space-y-3" aria-labelledby="social-privacy-heading" aria-busy={saving}>
        <h2 id="social-privacy-heading" className="text-xl font-semibold">Social privacy</h2>
        <p className="text-sm text-content-muted">Only accepted Tracking partners can open your profile. These optional details are hidden by default. Room presence is separate.</p>
        {social?.privacy ? (Object.entries({ showPresence: 'Share online/offline status', showLastSeen: 'Share last activity', shareVerifiedMinutes: 'Share verified focus time', shareVerifiedSessions: 'Share verified sessions' }) as [keyof SocialPrivacy, string][]).map(([key, label]) =>
            <label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5 accent-accent" checked={!!social.privacy?.[key]} disabled={saving} onChange={e => void toggle(key, e.target.checked)} /><span>{label}</span></label>)
            : <p role="status" className="text-sm text-content-muted">{social?.error || 'Loading privacy settings…'}</p>}
        <p className="text-xs text-content-muted">When both status and last activity are hidden, global activity is not recorded. Closing a tab lets its presence expire within 90 seconds.</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>;
}
