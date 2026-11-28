import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import ru, { type Key } from '@/locales/ru'
import en from '@/locales/en'
import uz from '@/locales/uz'
import ky from '@/locales/ky'
import kk from '@/locales/kk'
import tyv from '@/locales/tyv'

export type Lang = 'ru' | 'tyv' | 'kk' | 'ky' | 'uz' | 'en'

export const LANGS: { code: Lang; label: string; native: string; locale: string }[] = [
  { code: 'ru', label: 'RU', native: 'Русский', locale: 'ru-RU' },
  // Intl не знает тувинский — для форматирования чисел и дат берём русскую локаль
  { code: 'tyv', label: 'TYV', native: 'Тыва дыл', locale: 'ru-RU' },
  { code: 'kk', label: 'KK', native: 'Қазақша', locale: 'kk-KZ' },
  { code: 'ky', label: 'KY', native: 'Кыргызча', locale: 'ky-KG' },
  { code: 'uz', label: 'UZ', native: "O'zbekcha", locale: 'uz-UZ' },
  { code: 'en', label: 'EN', native: 'English', locale: 'en-US' },
]

const DICTS: Record<Lang, Record<Key, string>> = { ru, tyv, kk, ky, uz, en }
const STORAGE_KEY = 'lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in DICTS) return saved as Lang
  } catch {
    /* storage may be unavailable */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'ru').toLowerCase()
  if (nav.startsWith('tyv')) return 'tyv'
  const short = nav.slice(0, 2)
  if (short === 'kk' || short === 'ky' || short === 'uz' || short === 'en') return short
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
