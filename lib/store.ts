import { SERVICES, BARBERS, SHOP_INFO, type Service, type Barber } from './data'

type ShopInfo = typeof SHOP_INFO

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function kv() {
  const { kv } = await import('@vercel/kv')
  return kv
}

export async function getServices(): Promise<Service[]> {
  if (!kvAvailable()) return SERVICES
  try {
    const db = await kv()
    const stored = await db.get<Service[]>('services')
    return stored ?? SERVICES
  } catch {
    return SERVICES
  }
}

export async function getBarbers(): Promise<Barber[]> {
  if (!kvAvailable()) return BARBERS
  try {
    const db = await kv()
    const stored = await db.get<Barber[]>('barbers')
    return stored ?? BARBERS
  } catch {
    return BARBERS
  }
}

export async function getShopInfo(): Promise<ShopInfo> {
  if (!kvAvailable()) return SHOP_INFO
  try {
    const db = await kv()
    const stored = await db.get<ShopInfo>('shopInfo')
    return stored ? { ...SHOP_INFO, ...stored } : SHOP_INFO
  } catch {
    return SHOP_INFO
  }
}

export async function setServices(data: Service[]): Promise<void> {
  const db = await kv()
  await db.set('services', data)
}

export async function setBarbers(data: Barber[]): Promise<void> {
  const db = await kv()
  await db.set('barbers', data)
}

export async function setShopInfo(data: ShopInfo): Promise<void> {
  const db = await kv()
  await db.set('shopInfo', data)
}

export type Photo = {
  id: string
  url: string
  type: 'gallery' | 'before-after' | 'featured'
  barberId?: string
  caption?: string
  beforeUrl?: string
  afterUrl?: string
  createdAt: number
}

export async function getPhotos(): Promise<Photo[]> {
  if (!kvAvailable()) return []
  try {
    const db = await kv()
    const stored = await db.get<Photo[]>('photos')
    return stored ?? []
  } catch {
    return []
  }
}

export async function setPhotos(data: Photo[]): Promise<void> {
  const db = await kv()
  await db.set('photos', data)
}

export async function getInstagramUrls(): Promise<string[]> {
  if (!kvAvailable()) return []
  try {
    const db = await kv()
    const stored = await db.get<string[]>('instagram_urls')
    return stored ?? []
  } catch {
    return []
  }
}

export async function setInstagramUrls(urls: string[]): Promise<void> {
  const db = await kv()
  await db.set('instagram_urls', urls)
}

export type Account = {
  id: string
  name: string
  role: 'admin' | 'barber'
  barberId?: string
  password: string
}

export async function getAccounts(): Promise<Account[]> {
  if (!kvAvailable()) return []
  try {
    const db = await kv()
    const stored = await db.get<Account[]>('accounts')
    return stored ?? []
  } catch {
    return []
  }
}

export async function setAccounts(data: Account[]): Promise<void> {
  const db = await kv()
  await db.set('accounts', data)
}
