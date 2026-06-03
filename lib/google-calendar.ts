import { google } from 'googleapis'
import { addMinutes, format } from 'date-fns'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

export type TimeSlot = {
  time: string
  available: boolean
}

export async function getAvailableSlots(
  calendarId: string,
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  const dayStart = new Date(`${date}T11:00:00+04:00`)
  const dayEnd = new Date(`${date}T20:00:00+04:00`)

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone: 'Asia/Tbilisi',
      items: [{ id: calendarId }],
    },
  })

  const busySlots = data.calendars?.[calendarId]?.busy ?? []

  const slots: TimeSlot[] = []
  let current = dayStart

  while (addMinutes(current, durationMinutes) <= dayEnd) {
    const slotEnd = addMinutes(current, durationMinutes)
    const isOccupied = busySlots.some(busy => {
      const busyStart = new Date(busy.start!)
      const busyEnd = new Date(busy.end!)
      return current < busyEnd && slotEnd > busyStart
    })

    slots.push({ time: format(current, 'HH:mm'), available: !isOccupied })
    current = addMinutes(current, 30)
  }

  return slots
}

export async function createBooking({
  calendarId,
  serviceName,
  clientName,
  clientPhone,
  clientEmail,
  date,
  time,
  durationMinutes,
}: {
  calendarId: string
  serviceName: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string
  time: string
  durationMinutes: number
}) {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  const [hours, minutes] = time.split(':').map(Number)
  const startTime = new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+04:00`
  )
  const endTime = addMinutes(startTime, durationMinutes)

  const event = await calendar.events.insert({
    calendarId,
    sendUpdates: clientEmail ? 'all' : 'none',
    requestBody: {
      summary: `${serviceName} — ${clientName}`,
      description: [
        `Service: ${serviceName}`,
        `Client: ${clientName}`,
        `Phone: ${clientPhone}`,
        clientEmail ? `Email: ${clientEmail}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Tbilisi' },
      end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Tbilisi' },
      attendees: clientEmail ? [{ email: clientEmail, displayName: clientName }] : [],
    },
  })

  return event.data
}
