import { NextRequest, NextResponse } from 'next/server'
import { BARBERS, WORKING_HOURS } from '@/lib/data'
import { getAvailableSlots } from '@/lib/google-calendar'
import { format, addMinutes } from 'date-fns'

function mockSlots(durationMinutes: number) {
  const slots = []
  let totalMinutes = WORKING_HOURS.startHour * 60
  const endMinutes = WORKING_HOURS.endHour * 60
  while (totalMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    slots.push({
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      available: true,
    })
    totalMinutes += 30
  }
  return slots
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const barberId = searchParams.get('barberId')
  const date = searchParams.get('date')
  const duration = parseInt(searchParams.get('duration') ?? '45', 10)

  if (!barberId || !date) {
    return NextResponse.json({ error: 'Missing barberId or date' }, { status: 400 })
  }

  const barber = BARBERS.find(b => b.id === barberId)
  if (!barber) {
    return NextResponse.json({ error: 'Barber not found' }, { status: 404 })
  }

  const calendarId = process.env[barber.calendarEnvKey]

  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    // Calendar not configured — return mock open slots for development
    return NextResponse.json({ slots: mockSlots(duration), mock: true })
  }

  try {
    const slots = await getAvailableSlots(calendarId, date, duration)
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Google Calendar error:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
