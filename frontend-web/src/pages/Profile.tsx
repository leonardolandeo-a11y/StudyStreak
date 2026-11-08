import { useState } from "react";
import { Camera, Pencil, RefreshCw } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { ProfileIdentity } from "../components/profile/ProfileIdentity";
import { useSocial } from "../contexts/SocialContext";
import { ProfileEditDialog } from "../components/profile/ProfileEditDialog";
import { MetricCard } from "../components/study/MetricCard";
import LoadingState from "../components/ui/LoadingState";
import type { ProfileImageSlot } from "../types/profile";

export default function Profile() {
    const shared = useProfile()!;
    const social = useSocial();
    const [editing, setEditing] = useState<{ initialField?: ProfileImageSlot } | null>(null);
    const [saved, setSaved] = useState(false);
    const { profile, error, loading, avatarUrl, bannerUrl, imageErrors, refresh } = shared;
    function edit(initialField?: ProfileImageSlot) { setSaved(false); setEditing({ initialField }); }
    return <div className="space-y-6" data-profile-page>
        <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">Your space</p><h1 className="mt-1 text-heading font-bold">Profile</h1></div>
            <button className="study-button" type="button" aria-label="Refresh profile" title="Refresh profile" disabled={loading} onClick={() => void refresh()}><RefreshCw size={17} aria-hidden="true" /><span className="sr-only">Refresh profile</span></button></header>
        {saved && <p role="status" className="rounded-control bg-success-surface p-3 text-sm text-success">Profile saved.</p>}
        {error && <div role="alert" className="rounded-control border border-danger-outline bg-danger-surface p-4 text-sm text-danger"><p>{error}</p><button className="study-button mt-3" type="button" disabled={loading} onClick={() => void refresh()}>Try again</button></div>}
        {!profile && loading && <LoadingState message="Loading your profile…" />}
        {profile && <>
            <ProfileIdentity name={profile.presentationName} username={profile.username}
                bio={profile.bio || "A little about you, and what you’re learning. Add a bio to get started."}
                avatarUrl={avatarUrl} bannerUrl={bannerUrl} presence={social?.presence} registrationDate={social?.registrationDate}
                onAvatarClick={() => edit("avatar")}
                bannerAction={<button type="button" onClick={() => edit("banner")} aria-label="Change banner" title="Change banner" className="study-button profile-icon-button absolute right-3 bottom-3 bg-surface"><Camera size={16} aria-hidden="true" /><span className="sr-only">Change banner</span></button>}
                editAction={<button type="button" className="study-button profile-icon-button mt-3" aria-label="Edit profile" title="Edit profile" onClick={() => edit()}><Pencil size={16} aria-hidden="true" /><span className="sr-only">Edit profile</span></button>}>
                {(imageErrors.avatar || imageErrors.banner) && <div role="alert" className="mt-4 space-y-1 text-sm text-danger">
                    {imageErrors.avatar && <p>Avatar: {imageErrors.avatar}</p>}{imageErrors.banner && <p>Banner: {imageErrors.banner}</p>}
                    <button type="button" className="study-button" disabled={loading} onClick={() => void refresh()}>Retry images</button></div>}
            </ProfileIdentity>
            <section aria-labelledby="profile-study-heading"><h2 id="profile-study-heading" className="text-lg font-semibold">Your study journey</h2>
                <p className="mt-1 text-sm text-content-muted">Confirmed focus, over time. Streaks also include historical study records.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCard label="Current streak" value={profile.statistics.studyStreak} detail="Consecutive study days · includes historical records" />
                    <MetricCard label="Best streak" value={profile.statistics.bestStudyStreak} detail="Personal best in study days · includes historical records" />
                    <MetricCard label="Verified focus time" value={`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(profile.statistics.verifiedMinutes)} min`} detail="Lifetime confirmed individual and group focus" />
                    <MetricCard label="Verified sessions" value={profile.statistics.verifiedSessions} detail="Lifetime completed and verified sessions · excludes legacy entries" />
                    <MetricCard label="Active goals" value={profile.statistics.activeGoals} detail="Your goals still in progress" />
                </div>
            </section>
            {editing && <ProfileEditDialog profile={profile} initialField={editing.initialField} onClose={() => setEditing(null)} onSaved={() => setSaved(true)} />}
        </>}
    </div>;
}
