import { useState } from "react";
import { Camera, Pencil, RefreshCw } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";
import { ProfileEditDialog } from "../components/profile/ProfileEditDialog";
import { MetricCard } from "../components/study/MetricCard";
import LoadingState from "../components/ui/LoadingState";
import type { ProfileImageSlot } from "../types/profile";

export default function Profile() {
    const shared = useProfile()!;
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
            <section aria-label="Your identity" className="overflow-hidden rounded-panel border border-outline bg-surface">
                <div className="relative h-36 bg-linear-to-br from-accent-soft via-surface-hover to-surface sm:h-48">
                    {bannerUrl && <img src={bannerUrl} alt="Your profile banner" className="size-full object-cover" />}
                    <button type="button" onClick={() => edit("banner")} aria-label="Change banner" title="Change banner" className="study-button profile-icon-button absolute right-3 bottom-3 bg-surface"><Camera size={16} aria-hidden="true" /><span className="sr-only">Change banner</span></button>
                </div>
                <div className="px-4 pb-6 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-3">
                    <button type="button" aria-label="Change avatar" title="Change avatar" onClick={() => edit("avatar")} className="relative -mt-10 rounded-full border-4 border-surface bg-surface"><ProfileAvatar name={profile.presentationName} src={avatarUrl} className="size-24 text-3xl sm:size-28" /></button>
                    <button type="button" className="study-button profile-icon-button mt-3" aria-label="Edit profile" title="Edit profile" onClick={() => edit()}><Pencil size={16} aria-hidden="true" /><span className="sr-only">Edit profile</span></button></div>
                    <h2 className="mt-4 break-words text-2xl font-bold sm:text-3xl">{profile.presentationName}</h2>
                    <p className="mt-1 break-all text-sm text-content-muted">@{profile.username}</p>
                    <p className={`mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed ${profile.bio ? "text-content-secondary" : "text-content-muted"}`}>{profile.bio || "A little about you, and what you’re learning. Add a bio to get started."}</p>
                    {(imageErrors.avatar || imageErrors.banner) && <div role="alert" className="mt-4 space-y-1 text-sm text-danger">
                        {imageErrors.avatar && <p>Avatar: {imageErrors.avatar}</p>}{imageErrors.banner && <p>Banner: {imageErrors.banner}</p>}
                        <button type="button" className="study-button" disabled={loading} onClick={() => void refresh()}>Retry images</button></div>}
                </div>
            </section>
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
