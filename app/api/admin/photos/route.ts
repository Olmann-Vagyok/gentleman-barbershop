import { NextRequest, NextResponse } from 'next/server'
import { getPhotos, setPhotos, type Photo } from '@/lib/store'
import { authFromRequest } from '@/lib/auth'

async function guard(req: NextRequest) {
  const s = await authFromRequest(req)
  return s.valid && s.role === 'admin'
}

export async function GET(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ photos: await getPhotos() })
}

export async function POST(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const photo: Photo = await req.json()
  const photos = await getPhotos()
  photos.unshift(photo)
  await setPhotos(photos)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await setPhotos((await getPhotos()).filter(p => p.id !== id))
  return NextResponse.json({ success: true })
}
