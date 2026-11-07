interface SwitchProps {
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    labelledBy: string;
}

export function Switch({ id, checked, onCheckedChange, labelledBy }: SwitchProps) {
    return <button id={id} type="button" role="switch" aria-checked={checked} aria-labelledby={labelledBy}
        onClick={() => onCheckedChange(!checked)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-control">
        <span aria-hidden="true" className={`flex h-6 w-10 items-center rounded-full border p-0.5 transition-colors ${checked ? "border-accent bg-accent" : "border-outline-strong bg-surface-hover"}`}>
            <span className={`size-4 rounded-full transition-transform motion-reduce:transition-none ${checked ? "translate-x-4 bg-on-accent" : "translate-x-0 bg-content-muted"}`} />
        </span>
    </button>;
}
