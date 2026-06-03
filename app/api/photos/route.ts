import { NextResponse } from 'next/server'
import { getPhotos } from '@/lib/store'

export async function GET() {
  const photos = await getPhotos()
  return NextResponse.json({ photos })
}
