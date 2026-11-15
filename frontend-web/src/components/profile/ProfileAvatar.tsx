import { useState } from "react";
export function ProfileAvatar({ name, src, className = "size-9" }: { name: string; src?: string; className?: string }) {
    const [failed, setFailed] = useState<string>();
    return <span aria-hidden="true" className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-hover font-semibold text-content-secondary ${className}`}>
        {src && src !== failed ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(src)} /> : Array.from(name)[0]?.toLocaleUpperCase() || "?"}
    </span>;
}
