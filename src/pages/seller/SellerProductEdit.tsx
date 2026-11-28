import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Trash2, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/image'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { BUCKET, CATEGORY, GENDERS, SEASONS, type Photo, type Product, type Shop, type Size } from '@/types'

interface SizeRow {
  size: string
  qty: number
}

export default function SellerProductEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, tv } = useI18n()

  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [gender, setGender] = useState<string>('none')
  const [season, setSeason] = useState<string>('none')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(isNew)
  const [sizes, setSizes] = useState<SizeRow[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle()
      const s = shopData as Shop | null
      setShop(s)
      if (!isNew && s) {
        const { data: p } = await supabase
          .from('products')
          .select('*, product_photos(*), product_sizes(*)')
          .eq('id', id!)
          .single()
        const product = p as Product | null
        if (product) {
          setTitle(product.title)
          setPrice(String(product.price))
          setGender(product.gender ?? 'none')
          setSeason(product.season ?? 'none')
          setDescription(product.description ?? '')
          setPublished(product.published)
          setSizes(product.product_sizes?.map((x: Size) => ({ size: x.size, qty: x.qty })) ?? [])
          setPhotos(product.product_photos ?? [])
        }
      }
      setLoading(false)
    })()
  }, [user, id, isNew])

  if (!user) return null
  if (!loading && !shop) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">{t('sp.needShop')}</p>
        <Button asChild>
          <Link to="/seller">{t('sp.createShop')}</Link>
        </Button>
      </div>
    )
  }

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length || !user) return
    setUploading(true)
    try {
      for (const original of Array.from(files)) {
  const file = await compressImage(original)
        const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, '_')}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000' })
        if (error) throw error
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        if (isNew) {
          // Для нового товара копим локально, вставим после создания
          setPhotos((prev) => [...prev, { id: `local-${crypto.randomUUID()}`, product_id: '', url: urlData.publicUrl, position: prev.length }])
        } else {
          const { data, error: insErr } = await supabase
            .from('product_photos')
            .insert({ product_id: id!, url: urlData.publicUrl, position: photos.length })
            .select()
            .single()
          if (insErr) throw insErr
          setPhotos((prev) => [...prev, data as Photo])
        }
      }
      toast.success(t('pe.photosOk'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pe.photoErr'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removePhoto = async (photo: Photo) => {
    if (!confirm(t('pe.confirmPhoto'))) return
    if (!photo.id.startsWith('local-')) {
      const { error } = await supabase.from('product_photos').delete().eq('id', photo.id)
      if (error) {
        toast.error(error.message)
        return
      }
      // Удаляем файл из Storage (имя файла — последний сегмент пути в URL)
      const path = photo.url.split(`/${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)])
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!shop) return
    if (!title.trim()) {
      toast.error(t('pe.needTitle'))
      return
    }
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error(t('pe.badPrice'))
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        price: Math.round(priceNum),
        category: CATEGORY,
        gender: gender === 'none' ? null : gender,
        season: season === 'none' ? null : season,
        description: description.trim() || null,
        published,
      }

      let productId = id!
      if (isNew) {
        const { data, error } = await supabase
          .from('products')
          .insert({ ...payload, shop_id: shop.id })
          .select()
          .single()
        if (error) throw error
        productId = (data as Product).id
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id!)
        if (error) throw error
        // Пересохраняем размеры
        await supabase.from('product_sizes').delete().eq('product_id', productId)
      }

      // Фото, загруженные до создания товара
      const localPhotos = photos.filter((p) => p.id.startsWith('local-'))
      if (localPhotos.length) {
        const { error } = await supabase
          .from('product_photos')
          .insert(localPhotos.map((p, i) => ({ product_id: productId, url: p.url, position: i })))
        if (error) throw error
      }

      // Размеры
      const cleanSizes = sizes.filter((s) => s.size.trim())
      if (cleanSizes.length) {
        const { error } = await supabase
          .from('product_sizes')
          .insert(cleanSizes.map((s) => ({ product_id: productId, size: s.size.trim(), qty: Math.max(0, s.qty) })))
        if (error) throw error
      }

      toast.success(isNew ? t('pe.createdOk') : t('pe.savedOk'))
      navigate('/seller/products')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pe.saveErr'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-muted-foreground">{t('common.loading')}</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">
        {isNew ? t('pe.newTitle') : t('pe.editTitle')}
      </h1>

      <form onSubmit={submit} className="space-y-6">
        <div className="border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-title">{t('pe.title')}</Label>
            <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">{t('pe.price')}</Label>
              <Input id="p-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t('f.gender')}</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('pe.notSet')}</SelectItem>
                  {GENDERS.map((g) => <SelectItem key={g} value={g}>{tv('gen', g)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('f.season')}</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('pe.notSet')}</SelectItem>
                  {SEASONS.map((s) => <SelectItem key={s} value={s}>{tv('sea', s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">{t('pe.description')}</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="p-pub" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="p-pub">{t('pe.publish')}</Label>
          </div>
        </div>

        <div className="border bg-card p-6 space-y-4">
          <h2 className="font-semibold">{t('pe.sizesTitle')}</h2>
          {sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={s.size}
                onChange={(e) => setSizes(sizes.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))}
                placeholder={t('pe.sizePh')}
                className="w-40"
              />
              <Input
                type="number"
                min={0}
                value={s.qty}
                onChange={(e) =>
                  setSizes(sizes.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))
                }
                placeholder={t('pe.qtyPh')}
                className="w-28"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                aria-label={t('pe.delSize')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setSizes([...sizes, { size: '', qty: 1 }])}>
            <Plus className="h-4 w-4 mr-1" /> {t('pe.addSize')}
          </Button>
        </div>

        <div className="border bg-card p-6 space-y-4">
          <h2 className="font-semibold">{t('pe.photos')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square border bg-secondary overflow-hidden">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-card/90 border"
                  aria-label={t('pe.delPhoto')}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-square border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">{uploading ? t('pe.uploading') : t('pe.add')}</span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadPhotos(e.target.files)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? t('common.saving') : isNew ? t('pe.createBtn') : t('pe.saveBtn')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/seller/products')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
