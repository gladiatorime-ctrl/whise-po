import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Получаем переменные. В Vite они всегда начинаются с import.meta.env
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка для отладки (если ключи есть, вы увидите их длину в консоли)
console.log('Длина URL:', url ? url.length : 0)
console.log('Длина ключа:', anonKey ? anonKey.length : 0)

if (!url || !anonKey) {
  toast.error('Ключи Supabase не загружены! Проверьте Secrets.')
  console.error('ОШИБКА: Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
}

// Создаем клиент. Если url нет, ставим заглушку, чтобы не было ошибки
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
