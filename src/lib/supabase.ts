import { createClient } from '@supabase/supabase-js'

// URL проекта Supabase. Он публичный, поэтому храним прямо в коде,
// чтобы сборка не зависела от переменных окружения.
const SUPABASE_URL = 'https://yyqnyjntbvzhxontepfg.supabase.co'

// Ключ тоже публичный, но берём из секрета, чтобы можно было менять без правки кода.
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY не задан при сборке — запросы упадут')
}

console.log('[supabase] url =', SUPABASE_URL, '| длина ключа =', SUPABASE_ANON_KEY.length)

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
