import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { widgetKey } from '../features/dashboard/widgetPreferences';
export function dashboardWidgetStorage(userId: number) {
    const key = widgetKey(userId);
    const file = (suffix = '') => {
        const directory = new Directory(Paths.document, 'dashboard-layouts');
        directory.create({ intermediates: true, idempotent: true });
        return new File(directory, `${key}.json${suffix}`);
    };
    return {
        async read() {
            if (Platform.OS === 'web') return localStorage.getItem(key);
            const current = file(); return current.exists ? current.text() : null;
        },
        async write(value: string) {
            if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
            const temporary = file('.tmp'); temporary.write(value);
            await temporary.move(file(), { overwrite: true });
        },
    };
}
