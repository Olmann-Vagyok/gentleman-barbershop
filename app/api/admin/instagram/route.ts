import { NextRequest, NextResponse } from 'next/server'
import { getInstagramUrls, setInstagramUrls } from '@/lib/store'
import { authFromRequest } from '@/lib/auth'

async function guard(req: NextRequest) {
  const s = await authFromRequest(req)
  return s.valid && s.role === 'admin'
}

export async function GET(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ urls: await getInstagramUrls() })
}

export async function POST(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { url } = await req.json()
  const clean   = url.split('?')[0].replace(/\/$/, '') + '/'
  const urls    = await getInstagramUrls()
  if (!urls.includes(clean)) { urls.unshift(clean); await setInstagramUrls(urls) }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { url } = await req.json()
  await setInstagramUrls((await getInstagramUrls()).filter(u => u !== url))
  return NextResponse.json({ success: true })
}
