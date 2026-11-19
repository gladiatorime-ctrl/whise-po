import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner' // Убедитесь, что sonner импортирован

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Принудительная проверка при загрузке
if (!url || !anonKey) {
  toast.error('Ключи Supabase не загружены! Проверьте Secrets.')
  console.error('URL:', url ? 'Есть' : 'Нет', 'Key:', anonKey ? 'Есть' : 'Нет')
}

// Убираем пробелы по краям, если они есть
const cleanUrl = url?.trim()
const cleanKey = anonKey?.trim()

export const supabase = createClient(
  cleanUrl ?? 'https://placeholder.supabase.co', 
  cleanKey ?? 'placeholder', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
