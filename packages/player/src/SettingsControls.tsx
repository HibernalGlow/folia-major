import type { ReactNode } from 'react';

// packages/player/src/SettingsControls.tsx

export function SettingsCard({
    action,
    children,
    description,
    icon,
    title,
}: {
    action?: ReactNode;
    children?: ReactNode;
    description?: string;
    icon: ReactNode;
    title: string;
}) {
    return (
        <section className="rounded-xl border border-current/10 bg-current/[0.035] p-4">
            <header className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 opacity-70">{icon}</span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {description ? <p className="mt-1 text-xs leading-5 opacity-55">{description}</p> : null}
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}

export function SettingsSwitch({
    checked,
    label,
    onChange,
}: {
    checked: boolean;
    label: string;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition-colors ${checked ? 'bg-[var(--folia-accent)]' : 'bg-current/15'}`}
            onClick={() => onChange(!checked)}
        >
            <span className={`block size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}
