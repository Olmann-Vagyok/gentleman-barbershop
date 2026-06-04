import { NextRequest, NextResponse } from 'next/server'
import { getServices, getBarbers, getShopInfo, setServices, setBarbers, setShopInfo } from '@/lib/store'
import { authFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [services, barbers, shopInfo] = await Promise.all([getServices(), getBarbers(), getShopInfo()])
  return NextResponse.json({ services, barbers, shopInfo })
}

export async function POST(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { type, data } = await req.json()
    if (type === 'services')  await setServices(data)
    else if (type === 'barbers')   await setBarbers(data)
    else if (type === 'shopInfo')  await setShopInfo(data)
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin save error:', err)
    return NextResponse.json({ error: 'Save failed — KV may not be configured' }, { status: 500 })
  }
}
