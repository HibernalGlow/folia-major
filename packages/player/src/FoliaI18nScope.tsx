import { I18nextProvider, useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

/** Selects Folia's namespace while preserving the host's shared i18next instance. */
export function FoliaI18nScope({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation('folia-player');
    return (
        <I18nextProvider i18n={i18n} defaultNS="folia-player">
            {children}
        </I18nextProvider>
    );
}
