import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface StudyTabOption<T extends string> {
  value: T;
  label: string;
}

/** Code-owned accessible tabs with shadcn-style composition and existing StudyStreak tokens. */
export function StudyTabs<T extends string>({
  options,
  value,
  onValueChange,
  label,
  children,
}: {
  options: readonly StudyTabOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (options.length === 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % options.length; break;
      case 'ArrowLeft': next = (index - 1 + options.length) % options.length; break;
      case 'Home': next = 0; break;
      case 'End': next = options.length - 1; break;
      default: return;
    }
    event.preventDefault();
    buttons.current[next]?.focus();
    onValueChange(options[next].value);
  }

  return <div className="space-y-5">
    <div className="study-tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => <button
        key={option.value}
        ref={element => { buttons.current[index] = element; }}
        type="button"
        role="tab"
        id={`${id}-tab-${option.value}`}
        aria-controls={`${id}-panel-${option.value}`}
        aria-selected={option.value === value}
        tabIndex={option.value === value ? 0 : -1}
        className="study-tab"
        onClick={() => onValueChange(option.value)}
        onKeyDown={event => handleKeyDown(event, index)}
      >{option.label}</button>)}
    </div>
    {options.map(option => <div
      key={option.value}
      className="min-w-0"
      role="tabpanel"
      id={`${id}-panel-${option.value}`}
      aria-labelledby={`${id}-tab-${option.value}`}
      tabIndex={option.value === value ? 0 : -1}
      hidden={option.value !== value}
    >{option.value === value ? children : null}</div>)}
  </div>;
}
