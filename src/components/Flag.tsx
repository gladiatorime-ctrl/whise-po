import type { Lang } from '@/lib/i18n'

// Мини-флаги в виде SVG (не эмодзи: на Windows эмодзи-флаги не отображаются).
// Все в пропорции 3:2, упрощённые.
export default function Flag({ lang, className = 'h-4 w-6' }: { lang: Lang; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} shrink-0 rounded-[3px] ring-1 ring-black/15`}
      aria-hidden="true"
      focusable="false"
    >
      {lang === 'ru' && (
        <>
          <rect width="30" height="20" fill="#fff" />
          <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
          <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
        </>
      )}
      {lang === 'en' && (
        <>
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
          <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6.5" />
          <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth="3.6" />
        </>
      )}
      {lang === 'uz' && (
        <>
          <rect width="30" height="20" fill="#fff" />
          <rect width="30" height="6.2" fill="#0099B5" />
          <rect y="13.8" width="30" height="6.2" fill="#1EB53A" />
          <rect y="6.2" width="30" height="0.7" fill="#CE1126" />
          <rect y="13.1" width="30" height="0.7" fill="#CE1126" />
          <circle cx="5" cy="3.1" r="2.1" fill="#fff" />
          <circle cx="5.9" cy="3.1" r="1.8" fill="#0099B5" />
          <circle cx="9" cy="1.8" r="0.5" fill="#fff" />
          <circle cx="11" cy="3.4" r="0.5" fill="#fff" />
          <circle cx="9" cy="4.6" r="0.5" fill="#fff" />
        </>
      )}
      {lang === 'ky' && (
        <>
          <rect width="30" height="20" fill="#E8112D" />
          <circle cx="15" cy="10" r="5.2" fill="#FFEF00" />
          <circle cx="15" cy="10" r="3.2" fill="#E8112D" />
          <circle cx="15" cy="10" r="1.6" fill="none" stroke="#FFEF00" strokeWidth="0.5" />
          <circle cx="15" cy="10" r="6.4" fill="none" stroke="#FFEF00" strokeWidth="2.2" strokeDasharray="0.7 0.9" />
        </>
      )}
      {lang === 'kk' && (
        <>
          <rect width="30" height="20" fill="#00AFCA" />
          <circle cx="16" cy="8.6" r="3.2" fill="#FEC50C" />
          <circle cx="16" cy="8.6" r="4.5" fill="none" stroke="#FEC50C" strokeWidth="1.5" strokeDasharray="0.6 0.8" />
          <path d="M11.5 14.5q4.5 2.6 9 0" stroke="#FEC50C" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <rect x="1.6" y="2" width="1.6" height="16" fill="#FEC50C" />
        </>
      )}
      {lang === 'tyv' && (
        <>
          <rect width="30" height="20" fill="#63B3E6" />
          <path d="M0 0L13 10L0 20Z" fill="#fff" />
          <path d="M0 2.4L10.2 10L0 17.6Z" fill="#FECC00" />
        </>
      )}
    </svg>
  )
}
