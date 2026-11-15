import { AcademicHeading } from "../components/academic/Academic";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { getSocialImage, getSocialProfile, type SocialProfile as Profile } from "../services/socialService";
import { ProfileIdentity } from "../components/profile/ProfileIdentity";
import { MetricCard } from "../components/study/MetricCard";
import LoadingState from "../components/ui/LoadingState";
import { ROUTES } from "../routes/paths";

function SocialProfileView({ id }: { id: number }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [assets, setAssets] = useState<{ avatar: Blob | null; banner: Blob | null }>({ avatar: null, banner: null });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController(); let pending = false, loadedImages = false;
        const load = async () => {
            if (document.hidden || pending) return;
            pending = true;
            try {
                const value = await getSocialProfile(id, controller.signal);
                if (controller.signal.aborted) return;
                setProfile(value); setError(null);
                if (!loadedImages) {
                    const results = await Promise.allSettled([getSocialImage(id, 'avatar', controller.signal), getSocialImage(id, 'banner', controller.signal)]);
                    if (controller.signal.aborted) return;
                    setAssets({ avatar: results[0].status === 'fulfilled' ? results[0].value : null, banner: results[1].status === 'fulfilled' ? results[1].value : null });
                    setImageError(results.some(r => r.status === 'rejected')); loadedImages = true;
                }
            } catch (failure) {
                if (controller.signal.aborted) return;
                setProfile(null); setAssets({ avatar: null, banner: null }); loadedImages = false;
                setError(axios.isAxiosError(failure) && [403,404].includes(failure.response?.status ?? 0)
                    ? 'Profile unavailable. An accepted Tracking connection is required.' : 'Could not load this profile. Please try again.');
            } finally { pending = false; }
        };
        const visible = () => { if (!document.hidden) void load(); };
        void load(); const timer = window.setInterval(() => void load(), 30000);
        document.addEventListener('visibilitychange', visible);
        return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
    }, [id, revision]);
    const avatarUrl = useObjectUrl(assets.avatar), bannerUrl = useObjectUrl(assets.banner);
    return <div className="academic-page academic-module space-y-6" data-social-profile>
        <AcademicHeading title="Member profile" eyebrow="Tracking partner" glyph="people">
            <button type="button" className="study-button" onClick={() => setRevision(r => r + 1)}>Refresh profile</button></AcademicHeading>
        {error && <p role="alert" className="study-panel text-danger">{error}</p>}
        {!profile && !error && <LoadingState message="Loading member profile…" />}
        {profile && <><ProfileIdentity showPresenceDot={false} emphasizePresence name={profile.presentationName} username={profile.username} bio={profile.bio} avatarUrl={avatarUrl} bannerUrl={bannerUrl} presence={profile.presence} registrationDate={profile.registrationDate}>
            {imageError && <p role="status" className="mt-3 text-sm text-warning">Some images could not be loaded. Refresh to retry.</p>}
        </ProfileIdentity>
            {Object.keys(profile.statistics).length > 0 && <section aria-label="Shared study statistics" className="grid gap-3 sm:grid-cols-2">
                {profile.statistics.verifiedMinutes !== undefined && <MetricCard label="Verified focus time" value={`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(profile.statistics.verifiedMinutes)} min`} detail="Shared by this member" />}
                {profile.statistics.verifiedSessions !== undefined && <MetricCard label="Verified sessions" value={profile.statistics.verifiedSessions} detail="Shared by this member" />}
            </section>}
        </>}
    </div>;
}
export default function SocialProfile() {
    const { userId } = useParams(); const { currentUser } = useAuth();
    const id = Number(userId);
    if (!Number.isSafeInteger(id) || id <= 0) return <div><h1 className="text-heading">Member profile</h1><p role="alert">Invalid profile address.</p></div>;
    if (id === currentUser?.id) return <Navigate to={ROUTES.profile} replace />;
    return <SocialProfileView key={id} id={id} />;
}
