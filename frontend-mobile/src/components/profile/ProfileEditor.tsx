import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { useAppearance } from '../../hooks/useAppearance';
import type { OwnProfile, ProfileImageSlot } from '../../services/ownProfileService';
import type { ImageChange } from '../../features/profile/ownProfileMedia';
import { pickProfileImage } from '../../features/profile/pickProfileImage';
import { saveOwnProfile } from '../../features/profile/saveOwnProfile';
import { normalizeProfileName, profileTextError, unicodeLength } from '../../features/profile/profileValidation';
import { getApiErrorMessage } from '../../utils/apiError';
import { CreationModal } from '../ui/CreationModal';
import { ActionButton } from '../ui/ActionButton';
import { FormField } from '../ui/FormField';
import { StatusMessage } from '../ui/StatusMessage';
import { ProfileImageControls } from './ProfileImageControls';
import { ProfileCover } from './ProfileCover';
export function ProfileEditor({ profile, onClose, onSaved }: { profile: OwnProfile; onClose(): void; onSaved(): void }) {
  const shared = useNavigationData();
  const { theme } = useAppearance();
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [images, setImages] = useState<Record<ProfileImageSlot, ImageChange>>({ avatar: null, banner: null });
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState<ProfileImageSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef(false);
  const files = useRef(new Set<string>());
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller;
    const owned = files.current;
    return () => { controller.abort(); for (const uri of owned) shared.releaseImage(uri); owned.clear(); };
  // The provider owns these files for this account; dispose on editor unmount, not on identity refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const busy = saving || picking !== null;
  const validation = profileTextError(displayName, bio);
  const preview = (slot: ProfileImageSlot) => {
    const draft = images[slot];
    return draft === 'remove' ? null : draft?.uri ?? (slot === 'avatar' ? shared.avatar : shared.banner ?? null);
  };
  function changeImage(slot: ProfileImageSlot, next: ImageChange) {
    const previous = images[slot];
    if (previous && previous !== 'remove') { shared.releaseImage(previous.uri); files.current.delete(previous.uri); }
    setImages(value => ({ ...value, [slot]: next }));
  }
  async function chooseImage(slot: ProfileImageSlot) {
    if (operation.current) return;
    operation.current = true; setPicking(slot); setError(null);
    try {
      const asset = await pickProfileImage();
      if (!asset || lifetime.current?.signal.aborted) return;
      const draft = await shared.prepareImage(slot, asset);
      if (lifetime.current?.signal.aborted) { shared.releaseImage(draft.uri); return; }
      files.current.add(draft.uri); changeImage(slot, draft);
    } catch(cause) {
      if (!lifetime.current?.signal.aborted) setError(cause instanceof Error ? cause.message : 'Photo selection unavailable. Check access in device Settings and retry.');
    } finally { operation.current = false; if (!lifetime.current?.signal.aborted) setPicking(null); }
  }
  async function save() {
    if (operation.current || validation || !lifetime.current) return;
    operation.current = true; setSaving(true); setError(null);
    const signal = lifetime.current.signal;
    try {
      await saveOwnProfile({ displayName, bio, images }, signal, shared.imageBytes);
      if (signal.aborted) return;
      await shared.refresh();
      if (!signal.aborted) { onSaved(); onClose(); }
    } catch(cause) {
      if (signal.aborted) return;
      await shared.refresh();
      if (!signal.aborted) setError(`${getApiErrorMessage(cause, 'Could not save your profile.')} Some changes may already be saved. Review and retry.`);
    } finally { operation.current = false; if (!signal.aborted) setSaving(false); }
  }
  return <CreationModal visible showBack={false} title="Edit profile" cancelLabel="Close profile editor" busy={busy} onClose={onClose}>
    <ProfileCover banner={preview('banner')} avatar={preview('avatar')} name={normalizeProfileName(displayName) || profile.username} />
    {(['avatar','banner'] as const).map(slot => <ProfileImageControls key={slot} slot={slot} change={images[slot]}
      busy={busy} picking={picking === slot} onSelect={() => { void chooseImage(slot); }}
      onRemove={() => changeImage(slot, 'remove')} onUndo={() => changeImage(slot, null)} />)}
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>PNG, JPEG or WebP. Changes apply only after Save changes.</Text>
    <FormField variant="subtle" label="Display name" value={displayName} onChangeText={setDisplayName} editable={!busy} autoCapitalize="words"
      hint={`${unicodeLength(normalizeProfileName(displayName))}/60 characters · leave empty to use ${profile.username}`} />
    <FormField variant="subtle" label="Bio" value={bio} onChangeText={setBio} editable={!busy} multiline textAlignVertical="top"
      style={{ minHeight: 84, paddingVertical: 10 }} hint={`${unicodeLength(bio)}/300 characters · plain text`} />
    {error || validation ? <StatusMessage error message={error || validation!} /> : null}
    <ActionButton title="Save changes" busy={saving} disabled={busy || !!validation} onPress={() => { void save(); }} />
    <ActionButton title="Cancel" secondary disabled={busy} onPress={onClose} />
  </CreationModal>;
}
