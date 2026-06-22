import { useLocalSettingsStore } from '@/store'
import { en, ru, kk } from '@/utils/locales'
import type { TranslationDict } from '@/utils/locales'

const LOCALE_MAP: Record<string, TranslationDict> = { en, ru, kk }

export function useTranslation() {
  const language = useLocalSettingsStore((s) => s.language)
  const t = LOCALE_MAP[language] ?? en

  return { t, language }
}
