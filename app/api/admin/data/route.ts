import { NextRequest, NextResponse } from 'next/server'
import { getServices, getBarbers, getShopInfo, setServices, setBarbers, setShopInfo } from '@/lib/store'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  const username = req.headers.get('x-admin-username') ?? 'admin'
  if (username === 'admin') return pw === process.env.ADMIN_PASSWORD
  // Barbers can read data but not write
  const envKey = `BARBER_LOGIN_${username.toUpperCase()}`
  return pw === process.env[envKey]
}

function checkAdminOnly(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [services, barbers, shopInfo] = await Promise.all([
    getServices(),
    getBarbers(),
    getShopInfo(),
  ])
  return NextResponse.json({ services, barbers, shopInfo })
}

export async function POST(req: NextRequest) {
  if (!checkAdminOnly(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { type, data } = await req.json()
    if (type === 'services') await setServices(data)
    else if (type === 'barbers') await setBarbers(data)
    else if (type === 'shopInfo') await setShopInfo(data)
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin save error:', err)
    return NextResponse.json({ error: 'Save failed — KV may not be configured' }, { status: 500 })
  }
}
