import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { AppearanceStorage } from '../features/appearance/appearanceStore';
import { parseAppearance } from '../features/appearance/theme';

const legacyKey = 'studystreak:appearance:v1';
const migrationKey = 'studystreak:appearance:v2:legacy-owner';
function directory() {
  const value = new Directory(Paths.document, 'appearance');
  value.create({ intermediates: true, idempotent: true });
  return value;
}
async function read(key: string, filename: string) {
  if (Platform.OS === 'web') return globalThis.localStorage.getItem(key);
  const file = new File(directory(), filename);
  return file.exists ? file.text() : null;
}
async function write(key: string, filename: string, value: string) {
  if (Platform.OS === 'web') { globalThis.localStorage.setItem(key, value); return; }
  const temporary = new File(directory(), filename + '.tmp');
  temporary.write(value);
  await temporary.move(new File(directory(), filename), { overwrite: true });
}
// Serialize reads, migration claims and atomic writes across provider instances.
let task: Promise<unknown> = Promise.resolve();
function serialize<T>(run: () => Promise<T>): Promise<T> {
  const result = task.catch(() => {}).then(run);
  task = result;
  return result;
}
export function createAccountAppearanceStorage(userId: number | null): AppearanceStorage {
  if (userId !== null && (!Number.isSafeInteger(userId) || userId <= 0)) throw new Error('Invalid appearance account.');
  const account = userId === null ? 'guest' : String(userId);
  const key = `studystreak:appearance:v2:${account}`;
  const filename = `preferences-v2-${account}.json`;
  return {
    read: () => serialize(async () => {
      const saved = await read(key, filename);
      if (saved !== null || userId === null) return saved;
      const owner = await read(migrationKey, 'legacy-owner-v2.json');
      if (owner !== null && owner !== account) return null;
      const legacy = await read(legacyKey, 'preferences-v1.json');
      if (legacy === null) return null;
      let input: unknown;
      try { input = JSON.parse(legacy); } catch { return null; }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
      const prior = input as Record<string, unknown>;
      if (!['light', 'dark', 'system'].includes(String(prior.mode)) || !['mint', 'blue', 'purple', 'orange'].includes(String(prior.accent))) return null;
      // Lavender preserves the previous study surfaces. Never alter the v1 source.
      const migrated = JSON.stringify(parseAppearance(JSON.stringify({ ...prior, background: 'lavender' })));
      // Claim first: a partial write failure must never give the next account v1.
      await write(migrationKey, 'legacy-owner-v2.json', account);
      await write(key, filename, migrated);
      return migrated;
    }),
    write: value => serialize(() => write(key, filename, value)),
  };
}
export const appearanceStorage = createAccountAppearanceStorage(null);
