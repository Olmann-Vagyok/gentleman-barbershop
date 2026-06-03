import { NextRequest, NextResponse } from 'next/server'
import { getInstagramUrls, setInstagramUrls } from '@/lib/store'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw && pw === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const urls = await getInstagramUrls()
  return NextResponse.json({ urls })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { url } = await req.json()
  const clean = url.split('?')[0].replace(/\/$/, '') + '/'
  const urls = await getInstagramUrls()
  if (!urls.includes(clean)) {
    urls.unshift(clean)
    await setInstagramUrls(urls)
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { url } = await req.json()
  const urls = await getInstagramUrls()
  await setInstagramUrls(urls.filter(u => u !== url))
  return NextResponse.json({ success: true })
}
