import { useLayoutEffect, useRef } from 'react';

const REVIEW_STEPS = ['Partner', 'Goal', 'Record', 'Evidence', 'Confirm'] as const;
export function WorkflowStepper({ step, available, onStep, busy = false }: { step: number; available: number; onStep(step: number): void; busy?: boolean }) {
    const container = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
        const node = container.current;
        if (!node) return;
        const reveal = () => {
            const active = node.querySelector<HTMLButtonElement>('[aria-current="step"]');
            if (active) node.scrollLeft = active.offsetLeft - (node.clientWidth - active.offsetWidth) / 2;
        };
        reveal();
        const observer = new ResizeObserver(reveal);
        observer.observe(node);
        return () => observer.disconnect();
    }, [step]);

    return <nav ref={container} aria-label="Validation steps" className="workflow-stepper">
        {REVIEW_STEPS.map((label, index) => (
            <button type="button" key={label} aria-current={step === index ? 'step' : undefined}
                disabled={busy || index > available} onClick={() => onStep(index)}>
                <span aria-hidden="true">{index + 1}</span>{label}
            </button>
        ))}
    </nav>;
}
