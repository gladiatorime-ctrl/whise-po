import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import ru, { type Key } from '@/locales/ru'
import en from '@/locales/en'
import uz from '@/locales/uz'
import ky from '@/locales/ky'

export type Lang = 'ru' | 'en' | 'uz' | 'ky'

export const LANGS: { code: Lang; label: string; native: string; locale: string }[] = [
  { code: 'ru', label: 'RU', native: 'Русский', locale: 'ru-RU' },
  { code: 'uz', label: 'UZ', native: "O'zbekcha", locale: 'uz-UZ' },
  { code: 'ky', label: 'KY', native: 'Кыргызча', locale: 'ky-KG' },
  { code: 'en', label: 'EN', native: 'English', locale: 'en-US' },
]

const DICTS: Record<Lang, Record<Key, string>> = { ru, en, uz, ky }
const STORAGE_KEY = 'lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in DICTS) return saved as Lang
  } catch {
    /* storage may be unavailable */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'ru').slice(0, 2).toLowerCase()
  if (nav === 'uz' || nav === 'ky' || nav === 'en') return nav
  return 'ru'
}

type Params = Record<string, string | number>

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  locale: string
  t: (key: Key, params?: Params) => string
  /** Перевод значения из базы (категория/пол/сезон хранятся по-русски). */
  tv: (prefix: 'gen' | 'sea', value: string) => string
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[lang]
    const t = (key: Key, params?: Params) => {
      let s = dict[key] ?? ru[key] ?? key
      if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v))
      return s
    }
    const tv = (prefix: 'gen' | 'sea', value: string) => {
      const key = `${prefix}.${value}` as Key
      return dict[key] ?? value
    }
    return { lang, setLang, locale: LANGS.find((l) => l.code === lang)!.locale, t, tv }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
