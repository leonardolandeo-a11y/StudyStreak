import { useEffect, useState } from 'react';

// Event-driven policy: no polling/RAF when hidden, reduced, or on constrained devices.
export function useAmbientMotion() {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
        const constrained = (device.deviceMemory !== undefined && device.deviceMemory <= 2) ||
            (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) || device.connection?.saveData === true;
        const update = () => setActive(!document.hidden && !reduced.matches && document.documentElement.dataset.motion !== 'reduce' && !constrained);
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
        update(); reduced.addEventListener('change', update); document.addEventListener('visibilitychange', update);
        return () => { observer.disconnect(); reduced.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
    }, []);
    return active;
}
