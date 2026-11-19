// src/lib/upload.ts
import { supabase } from './supabase'; // <-- Проверьте, как называется ваш файл с Supabase! Возможно, './supabaseClient'

export async function uploadFile(file: File) {
  try {
    console.log('1. Отправка на Render...');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://popkapirie.onrender.com/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || 'Ошибка сервера');
    }

    const { url, name, size } = await response.json();
    console.log('2. Ссылка из MEGA:', url);

    // Сохраняем в Supabase
    const { data, error } = await supabase
      .from('files')
      .insert({ name, size, mega_url: url })
      .select();

    if (error) throw error;

    alert('Успех! Файл загружен.');
    return data;

  } catch (error: any) {
    console.error(error);
    alert('Ошибка: ' + error.message);
  }
}
