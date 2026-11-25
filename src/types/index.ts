export type Role = 'buyer' | 'seller' | 'admin'

export interface Profile {
  id: string
  email: string | null
  name: string | null
  role: Role
  created_at: string
}

export interface Shop {
  id: string
  owner_id: string
  name: string
  address: string | null
  phone: string | null
  max_url: string | null
  about: string | null
  verified: boolean
  requested: boolean
  created_at: string
}

export interface Product {
  id: string
  shop_id: string
  title: string
  price: number
  category: string
  gender: string | null
  season: string | null
  description: string | null
  published: boolean
  created_at: string
  shops?: Shop
  product_photos?: Photo[]
  product_sizes?: Size[]
}

export interface Size {
  product_id: string
  size: string
  qty: number
}

export interface Photo {
  id: string
  product_id: string
  url: string
  position: number
}

export interface Favorite {
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

export interface Notification {
  id: string
  user_id: string
  text: string
  read: boolean
  created_at: string
}

export interface Report {
  id: string
  product_id: string | null
  user_id: string | null
  reason: string
  done: boolean
  created_at: string
  products?: Product
  profiles?: Profile
}

export const CATEGORIES = [
  'Одежда',
  'Обувь',
  'Аксессуары',
  'Косметика',
  'Дом',
  'Электроника',
  'Спорт',
  'Книги',
  'Другое',
] as const

// Категории, где имеют смысл пол/сезон и размеры
export const FASHION_CATEGORIES: readonly string[] = ['Одежда', 'Обувь', 'Аксессуары']
export const SIZED_CATEGORIES: readonly string[] = ['Одежда', 'Обувь']
export const isFashion = (c: string) => FASHION_CATEGORIES.includes(c)
export const isSized = (c: string) => SIZED_CATEGORIES.includes(c)

export const GENDERS = ['Женское', 'Мужское', 'Унисекс'] as const
export const SEASONS = ['Всесезон', 'Зима', 'Лето', 'Демисезон'] as const

export const BUCKET = 'product-photos'
