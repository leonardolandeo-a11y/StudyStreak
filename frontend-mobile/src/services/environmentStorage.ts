import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { environmentKey, type EnvironmentStorage } from '../features/environment/environmentPreferences';
// Settings and Dashboard may coexist in Expo Router. Share only their pending I/O,
// not preferences, so reads on Back wait for the last atomic write of that account.
const pending = new Map<string, Promise<void>>();
export function environmentStorage(userId: number): EnvironmentStorage {
    const key = environmentKey(userId);
    const file = (suffix = '') => {
        const directory = new Directory(Paths.document, 'study-environments');
        directory.create({ intermediates: true, idempotent: true });
        return new File(directory, `account-${userId}.json${suffix}`);
    };
    return {
        async read() {
            await pending.get(key)?.catch(() => {});
            if (Platform.OS === 'web') return localStorage.getItem(key);
            const current = file(); return current.exists ? current.text() : null;
        },
        write(value: string) {
            const task = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
                if (Platform.OS === 'web') { localStorage.setItem(key,value); return; }
                const temporary = file('.tmp'); temporary.write(value);
                await temporary.move(file(), { overwrite: true });
            });
            pending.set(key,task);
            const cleanup = () => { if (pending.get(key) === task) pending.delete(key); };
            void task.then(cleanup,cleanup);
            return task;
        },
    };
}
