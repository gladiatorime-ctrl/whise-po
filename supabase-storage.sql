-- Хранилище для фото товаров + исправление триггера верификации
-- Выполнить один раз в SQL Editor Supabase

-- 1. Папка (bucket) для фото товаров
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- 2. Любой посетитель может смотреть фото
create policy "фото публичны"
on storage.objects for select
using (bucket_id = 'product-photos');

-- 3. Только владелец товара загружает фото в свою папку (папка = id пользователя)
create policy "фото загружает владелец"
on storage.objects for insert
with check (
  bucket_id = 'product-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Удалять может владелец папки или админ
create policy "фото удаляет владелец"
on storage.objects for delete
using (
  bucket_id = 'product-photos'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);

-- 5. Исправление: продавец должен иметь возможность ПОДАТЬ заявку
--    на верификацию (менять поле requested), админ — подтверждать (verified)
create or replace function public.protect_verified () returns trigger
language plpgsql security definer as $$
begin
  if not public.is_admin() then
    new.verified := old.verified;
  end if;
  return new;
end $$;

-- 4. Ссылка на MAX у магазина (вместо WhatsApp)
alter table shops add column if not exists max_url text;
