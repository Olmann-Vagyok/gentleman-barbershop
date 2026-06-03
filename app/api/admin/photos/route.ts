import { NextRequest, NextResponse } from 'next/server'
import { getPhotos, setPhotos, type Photo } from '@/lib/store'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw && pw === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const photos = await getPhotos()
  return NextResponse.json({ photos })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const photo: Photo = await req.json()
  const photos = await getPhotos()
  photos.unshift(photo)
  await setPhotos(photos)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const photos = await getPhotos()
  await setPhotos(photos.filter(p => p.id !== id))
  return NextResponse.json({ success: true })
}
