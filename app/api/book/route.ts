import { NextRequest, NextResponse } from 'next/server'
import { BARBERS, SERVICES } from '@/lib/data'
import { createBooking } from '@/lib/google-calendar'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      barberId,
      serviceId,
      serviceName,
      durationMinutes,
      date,
      time,
      clientName,
      clientPhone,
      clientEmail,
    } = body

    if (!barberId || !serviceId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const barber = BARBERS.find(b => b.id === barberId)
    const service = SERVICES.find(s => s.id === serviceId)

    if (!barber || !service) {
      return NextResponse.json({ error: 'Invalid barber or service' }, { status: 400 })
    }

    const calendarId = process.env[barber.calendarEnvKey]

    if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      // Dev mode: simulate success without actual calendar
      console.log('[DEV] Booking (no calendar configured):', {
        barber: barber.name,
        service: serviceName,
        date,
        time,
        client: clientName,
      })
      return NextResponse.json({
        success: true,
        eventId: 'dev-mock-' + Date.now(),
        dev: true,
      })
    }

    const event = await createBooking({
      calendarId,
      serviceName: serviceName ?? service.name,
      clientName,
      clientPhone,
      clientEmail,
      date,
      time,
      durationMinutes: durationMinutes ?? service.duration,
    })

    return NextResponse.json({ success: true, eventId: event.id })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
