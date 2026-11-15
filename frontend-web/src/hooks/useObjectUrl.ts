import { useEffect, useState } from "react";

/** Never persist protected binary URLs; release on replacement and unmount. */
export function useObjectUrl(blob: Blob | null): string | undefined {
    const [view, setView] = useState<{ blob: Blob; url: string } | null>(null);
    useEffect(() => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        let active = true;
        void Promise.resolve().then(() => { if (active) setView({ blob, url }); });
        return () => { active = false; URL.revokeObjectURL(url); };
    }, [blob]);
    return view?.blob === blob ? view?.url : undefined;
}
