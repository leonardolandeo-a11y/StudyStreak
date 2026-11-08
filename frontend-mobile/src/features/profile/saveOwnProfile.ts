import { patchOwnProfile, putOwnProfileImage, deleteOwnProfileImage, type ProfileImageSlot } from '../../services/ownProfileService';
import { assertSessionRevision, getSessionRevision } from '../../services/authSession';
import type { ImageChange, ProfileImageDraft } from './ownProfileMedia';
import { normalizeProfileName, profileTextError, profileImageError } from './profileValidation';
/** The API has separate writes, not a transaction; callers refresh even after a partial failure. */
export async function saveOwnProfile(input: { displayName: string; bio: string; images: Record<ProfileImageSlot, ImageChange> },
  signal: AbortSignal, bytes: (draft: ProfileImageDraft) => Promise<ArrayBuffer>) {
  const revision = getSessionRevision();
  const check = () => { assertSessionRevision(revision); if (signal.aborted) throw new Error('Profile update cancelled.'); };
  const error = profileTextError(input.displayName, input.bio); if (error) throw new Error(error);
  check();
  await patchOwnProfile(normalizeProfileName(input.displayName) || null, input.bio || null, signal, revision);
  for (const slot of ['avatar', 'banner'] as const) {
    check(); const change = input.images[slot];
    if (change === 'remove') await deleteOwnProfileImage(slot, signal, revision);
    else if (change) {
      const body = await bytes(change); check();
      const invalid = profileImageError(slot, { type: change.type, size: body.byteLength });
      if (invalid) throw new Error(invalid);
      await putOwnProfileImage(slot, body, change.type, signal, revision);
    }
  }
  check();
}
