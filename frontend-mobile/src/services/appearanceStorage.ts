import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { AppearanceStorage } from '../features/appearance/appearanceStore';

const key = 'studystreak:appearance:v1';
function directory() {
  const value = new Directory(Paths.document, 'appearance');
  value.create({ intermediates: true, idempotent: true });
  return value;
}

export const appearanceStorage: AppearanceStorage = {
  async read() {
    if (Platform.OS === 'web') return globalThis.localStorage.getItem(key);
    const file = new File(directory(), 'preferences-v1.json');
    return file.exists ? file.text() : null;
  },
  async write(value) {
    if (Platform.OS === 'web') { globalThis.localStorage.setItem(key, value); return; }
    const temporary = new File(directory(), 'preferences-v1.json.tmp');
    temporary.write(value);
    await temporary.move(new File(directory(), 'preferences-v1.json'), { overwrite: true });
  },
};
