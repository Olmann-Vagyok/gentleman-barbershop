import { NextResponse } from 'next/server'
import { getPhotos } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const photos = await getPhotos()
  return NextResponse.json({ photos })
}
