import { NextRequest, NextResponse } from 'next/server'
import { BARBERS } from '@/lib/data'
import { authFromRequest } from '@/lib/auth'
import { google } from 'googleapis'
import { addDays, addMinutes, startOfDay } from 'date-fns'

function getGoogleAuth(readonly = false) {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [readonly
      ? 'https://www.googleapis.com/auth/calendar.readonly'
      : 'https://www.googleapis.com/auth/calendar'],
  })
}

export async function GET(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Google Calendar not configured', bookings: [] })
  }

  const barbersToFetch =
    session.role === 'barber'
      ? BARBERS.filter(b => b.id === session.barberId)
      : BARBERS

  try {
    const auth     = getGoogleAuth(true)
    const calendar = google.calendar({ version: 'v3', auth })
    const now      = startOfDay(new Date())
    const timeMin  = now.toISOString()
    const timeMax  = addDays(now, 60).toISOString()

    const allBookings: object[] = []

    for (const barber of barbersToFetch) {
      const calendarId = process.env[barber.calendarEnvKey]
      if (!calendarId) continue

      const { data } = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      })

      for (const event of data.items ?? []) {
        if (!event.start?.dateTime) continue
        allBookings.push({
          id:          event.id,
          barberId:    barber.id,
          barber:      barber.name,
          summary:     event.summary ?? '',
          start:       event.start.dateTime,
          end:         event.end?.dateTime,
          description: event.description ?? '',
        })
      }
    }

    allBookings.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    return NextResponse.json({ bookings: allBookings })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch bookings', bookings: [] }, { status: 500 })
  }
}

// Create a booking manually (admin)
export async function POST(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { barberId, date, time, durationMinutes, title, clientName, clientPhone, description } = await req.json()

  const barber = BARBERS.find(b => b.id === barberId)
  if (!barber) return NextResponse.json({ error: 'Barber not found' }, { status: 404 })

  const calendarId = process.env[barber.calendarEnvKey]
  if (!calendarId) return NextResponse.json({ error: 'Calendar not configured' }, { status: 500 })

  try {
    const auth     = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const [h, m]  = (time as string).split(':').map(Number)
    const start   = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00+04:00`)
    const end     = addMinutes(start, durationMinutes ?? 30)

    const summary = title || (clientName ? `ჯავშანი — ${clientName}` : 'ჯავშანი')
    const desc    = [
      clientName  ? `კლიენტი: ${clientName}` : '',
      clientPhone ? `ტელეფონი: ${clientPhone}` : '',
      description ?? '',
    ].filter(Boolean).join('\n')

    const { data } = await calendar.events.insert({
      calendarId,
      sendUpdates: 'none',
      requestBody: {
        summary,
        description: desc || undefined,
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Tbilisi' },
        end:   { dateTime: end.toISOString(),   timeZone: 'Asia/Tbilisi' },
      },
    })

    return NextResponse.json({ success: true, eventId: data.id })
  } catch (err) {
    console.error('Create booking error:', err)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

// Edit a booking
export async function PATCH(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, barberId, date, startTime, endTime, summary, description } = await req.json()

  const barber = BARBERS.find(b => b.id === barberId)
  if (!barber) return NextResponse.json({ error: 'Barber not found' }, { status: 404 })

  const calendarId = process.env[barber.calendarEnvKey]
  if (!calendarId) return NextResponse.json({ error: 'Calendar not configured' }, { status: 500 })

  try {
    const auth     = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const [sh, sm] = (startTime as string).split(':').map(Number)
    const [eh, em] = (endTime   as string).split(':').map(Number)
    const start = new Date(`${date}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00+04:00`)
    const end   = new Date(`${date}T${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00+04:00`)

    await calendar.events.patch({
      calendarId,
      eventId,
      sendUpdates: 'none',
      requestBody: {
        summary,
        description: description || undefined,
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Tbilisi' },
        end:   { dateTime: end.toISOString(),   timeZone: 'Asia/Tbilisi' },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Edit booking error:', err)
    return NextResponse.json({ error: 'Failed to edit booking' }, { status: 500 })
  }
}

// Delete a booking
export async function DELETE(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, barberId } = await req.json()

  const barber = BARBERS.find(b => b.id === barberId)
  if (!barber) return NextResponse.json({ error: 'Barber not found' }, { status: 404 })

  const calendarId = process.env[barber.calendarEnvKey]
  if (!calendarId) return NextResponse.json({ error: 'Calendar not configured' }, { status: 500 })

  try {
    const auth     = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({ calendarId, eventId, sendUpdates: 'none' })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete booking error:', err)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
