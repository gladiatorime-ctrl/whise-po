import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Показываем понятную ошибку до первого обращения к API
  console.error(
    'Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Создайте файл .env по образцу .env.example'
  )
}

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
