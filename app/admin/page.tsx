'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BARBERS } from '@/lib/data'

type Service = { id: string; name: string; duration: number; price: number; description: string }
type Barber = { id: string; name: string; title: string; experience: string; speciality: string; bio: string; calendarEnvKey: string }
type ShopInfo = { [key: string]: string }
type Booking = { id: string; barber: string; barberId?: string; summary: string; start: string; end: string; description: string }
type Photo = { id: string; url: string; type: 'gallery' | 'before-after' | 'featured'; barberId?: string; caption?: string; beforeUrl?: string; afterUrl?: string; createdAt: number }
type Account = { id: string; name: string; role: 'admin' | 'barber'; barberId?: string; password: string }
type Session = { role: 'admin' | 'barber'; name: string; barberId: string | null; password: string }
type Tab = 'dashboard' | 'calendar' | 'bookings' | 'services' | 'barbers' | 'gallery' | 'shop' | 'accounts'

const BARBER_COLORS: Record<string, string> = {
  mariam: '#C9A84C',
  george: '#4C9AC9',
  nabi: '#84C94C',
  raoul: '#C94C84',
  sida: '#9A4CC9',
}

function getBarberColor(barberId: string) {
  return BARBER_COLORS[barberId] ?? '#888'
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [selectedName, setSelectedName] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch('/api/admin/accounts', { headers: { 'x-admin-password': 'prefetch' } })
      .then(r => r.json()).then(d => setAccounts(d.accounts ?? [])).catch(() => {})
  }, [])

  async function handleLogin() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: selectedName, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'შეცდომა'); setLoading(false); return }
    const session: Session = { ...data, password }
    localStorage.setItem('admin_session', JSON.stringify(session))
    onLogin(session)
    setLoading(false)
  }

  const names = ['admin', ...accounts.map(a => a.name)]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3 mb-12 justify-center">
          <img src="/Logo.jpg" alt="Gentleman" className="h-12 w-auto" />
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-6 text-center">ადმინ პანელი</p>

        <div className="flex flex-col gap-3 mb-4">
          <select value={selectedName} onChange={e => setSelectedName(e.target.value)}
            className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3 text-sm outline-none focus:border-[#C9A84C]">
            <option value="admin">👑 ადმინი</option>
            {accounts.map(a => (
              <option key={a.id} value={a.name}>✂️ {a.name}</option>
            ))}
          </select>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="პაროლი" autoFocus
            className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3 text-sm outline-none focus:border-[#C9A84C] tracking-wide" />
        </div>
        {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-3.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50">
          {loading ? '...' : 'შესვლა'}
        </button>
      </div>
    </div>
  )
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

function CalendarView({ bookings, session, onBlock }: {
  bookings: Booking[]
  session: Session
  onBlock: (barberId: string, date: string, start: string, end: string) => void
}) {
  const [view, setView] = useState<'week' | 'day'>('week')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [blockModal, setBlockModal] = useState<{ barberId: string; date: string; start: string } | null>(null)

  const hours = Array.from({ length: 18 }, (_, i) => {
    const h = 11 + Math.floor(i / 2)
    const m = i % 2 === 0 ? '00' : '30'
    return `${String(h).padStart(2, '0')}:${m}`
  })

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  function prevDay() { const d = new Date(selectedDay); d.setDate(d.getDate() - 1); setSelectedDay(d) }
  function nextDay() { const d = new Date(selectedDay); d.setDate(d.getDate() + 1); setSelectedDay(d) }

  function getBookingsForDay(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => b.start?.startsWith(dateStr))
  }

  function getBookingsForDayAndBarber(date: Date, barberId: string) {
    return getBookingsForDay(date).filter(b => {
      const barber = BARBERS.find(bar => bar.name === b.barber)
      return barber?.id === barberId
    })
  }

  function slotTop(time: string) {
    const [h, m] = time.split(':').map(Number)
    const minutesFromStart = (h - 11) * 60 + m
    return (minutesFromStart / 540) * 100
  }

  function slotHeight(start: string, end: string) {
    const [sh, sm] = start.split('T')[1]?.split(':').map(Number) ?? [11, 0]
    const [eh, em] = end.split('T')[1]?.split(':').map(Number) ?? [11, 30]
    const startAdj = (sh + 4) % 24; const endAdj = (eh + 4) % 24
    const durationMins = (endAdj - startAdj) * 60 + (em - sm)
    return Math.max((durationMins / 540) * 100, 3)
  }

  function getTimeFromSlot(slotTime: string) { return slotTime }

  const visibleBarbers = session.role === 'admin'
    ? BARBERS
    : BARBERS.filter(b => b.id === session.barberId)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">კალენდარი</h1>
          <p className="text-gray-600 text-sm">
            {view === 'week'
              ? `${weekDays[0].toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : selectedDay.toLocaleDateString('ka-GE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-[#2a2a2a]">
            <button onClick={() => setView('week')} className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${view === 'week' ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'text-gray-500 hover:text-white'}`}>
              კვირა
            </button>
            <button onClick={() => setView('day')} className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${view === 'day' ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'text-gray-500 hover:text-white'}`}>
              დღე
            </button>
          </div>
          {/* Nav */}
          <button onClick={view === 'week' ? prevWeek : prevDay} className="px-3 py-2 border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">←</button>
          <button onClick={view === 'week' ? nextWeek : nextDay} className="px-3 py-2 border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">→</button>
        </div>
      </div>

      {/* Barber legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {visibleBarbers.map(b => (
          <div key={b.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBarberColor(b.id) }} />
            <span className="text-xs text-gray-400">{b.name}</span>
          </div>
        ))}
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid gap-0 mb-1" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
              <div />
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString()
                return (
                  <div key={i} className="text-center py-2 cursor-pointer" onClick={() => { setSelectedDay(day); setView('day') }}>
                    <div className="text-[10px] tracking-widest uppercase text-gray-600">{day.toLocaleDateString('ka-GE', { weekday: 'short' })}</div>
                    <div className={`text-sm font-medium mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'text-white'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grid */}
            <div className="grid gap-0 border border-[#1a1a1a]" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
              {/* Time labels */}
              <div>
                {hours.filter((_, i) => i % 2 === 0).map(h => (
                  <div key={h} className="h-16 flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-gray-700">{h}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const dayBookings = getBookingsForDay(day)
                const isToday = day.toDateString() === new Date().toDateString()
                return (
                  <div key={di} className={`relative border-l border-[#1a1a1a] ${isToday ? 'bg-[#C9A84C]/3' : ''}`} style={{ height: `${8 * 32}px` }}>
                    {/* Hour lines */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="absolute w-full border-t border-[#1a1a1a]" style={{ top: `${(i / 9) * 100}%` }} />
                    ))}
                    {/* Half-hour lines */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={`h${i}`} className="absolute w-full border-t border-[#111]" style={{ top: `${((i + 0.5) / 9) * 100}%` }} />
                    ))}
                    {/* Bookings */}
                    {dayBookings.map((booking, bi) => {
                      const barber = BARBERS.find(b => b.name === booking.barber)
                      const color = getBarberColor(barber?.id ?? '')
                      const timeStr = booking.start.split('T')[1]?.substring(0, 5) ?? '11:00'
                      const [bh, bm] = timeStr.split(':').map(Number)
                      const adjH = (bh + 4) % 24
                      const topPct = ((adjH - 11) * 60 + bm) / 540 * 100
                      const [eh, em] = (booking.end.split('T')[1]?.substring(0, 5) ?? '12:00').split(':').map(Number)
                      const adjEh = (eh + 4) % 24
                      const durMins = (adjEh - adjH) * 60 + (em - bm)
                      const heightPct = Math.max(durMins / 540 * 100, 4)
                      return (
                        <div key={bi} className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ top: `${topPct}%`, height: `${heightPct}%`, backgroundColor: color + '33', borderLeft: `3px solid ${color}` }}
                          title={`${booking.summary}\n${booking.description}`}>
                          <p className="text-[9px] font-medium leading-tight truncate" style={{ color }}>{booking.summary}</p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {view === 'day' && (
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Barber columns header */}
            <div className="grid gap-0 mb-1" style={{ gridTemplateColumns: `50px repeat(${visibleBarbers.length}, 1fr)` }}>
              <div />
              {visibleBarbers.map(barber => (
                <div key={barber.id} className="text-center py-2 border-l border-[#1a1a1a]">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: getBarberColor(barber.id) }} />
                  <div className="text-xs text-white font-medium">{barber.name}</div>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid gap-0 border border-[#1a1a1a]" style={{ gridTemplateColumns: `50px repeat(${visibleBarbers.length}, 1fr)` }}>
              {/* Time labels */}
              <div>
                {hours.filter((_, i) => i % 2 === 0).map(h => (
                  <div key={h} className="h-16 flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-gray-700">{h}</span>
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {visibleBarbers.map(barber => {
                const dayBookings = getBookingsForDayAndBarber(selectedDay, barber.id)
                const color = getBarberColor(barber.id)
                return (
                  <div key={barber.id} className="relative border-l border-[#1a1a1a]" style={{ height: `${8 * 32}px` }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="absolute w-full border-t border-[#1a1a1a]" style={{ top: `${(i / 9) * 100}%` }} />
                    ))}
                    {hours.map((slot, si) => (
                      <div key={si} className="absolute w-full hover:bg-white/3 cursor-pointer transition-colors"
                        style={{ top: `${(si / 18) * 100}%`, height: `${100 / 18}%` }}
                        onClick={() => setBlockModal({ barberId: barber.id, date: selectedDay.toISOString().split('T')[0], start: slot })} />
                    ))}
                    {dayBookings.map((booking, bi) => {
                      const timeStr = booking.start.split('T')[1]?.substring(0, 5) ?? '11:00'
                      const [bh, bm] = timeStr.split(':').map(Number)
                      const adjH = (bh + 4) % 24
                      const topPct = ((adjH - 11) * 60 + bm) / 540 * 100
                      const [eh, em] = (booking.end.split('T')[1]?.substring(0, 5) ?? '12:00').split(':').map(Number)
                      const adjEh = (eh + 4) % 24
                      const durMins = (adjEh - adjH) * 60 + (em - bm)
                      const heightPct = Math.max(durMins / 540 * 100, 4)
                      return (
                        <div key={bi} className="absolute left-1 right-1 rounded px-2 py-1 overflow-hidden"
                          style={{ top: `${topPct}%`, height: `${heightPct}%`, backgroundColor: color + '44', borderLeft: `3px solid ${color}` }}>
                          <p className="text-[10px] font-semibold truncate" style={{ color }}>{booking.summary}</p>
                          {booking.description && (
                            <p className="text-[9px] text-gray-400 mt-0.5 leading-tight line-clamp-2 whitespace-pre-line">{booking.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Block modal */}
      {blockModal && (
        <BlockModal
          barberId={blockModal.barberId}
          date={blockModal.date}
          defaultStart={blockModal.start}
          session={session}
          onClose={() => setBlockModal(null)}
          onConfirm={(barberId, date, start, end) => { onBlock(barberId, date, start, end); setBlockModal(null) }}
        />
      )}
    </div>
  )
}

function BlockModal({ barberId, date, defaultStart, session, onClose, onConfirm }: {
  barberId: string; date: string; defaultStart: string; session: Session
  onClose: () => void; onConfirm: (barberId: string, date: string, start: string, end: string) => void
}) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState('')
  const [title, setTitle] = useState('🚫 დაკავებულია')
  const [allDay, setAllDay] = useState(false)
  const barber = BARBERS.find(b => b.id === barberId)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#141414] border border-[#2a2a2a] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-serif text-xl text-white mb-1">დროის დაბლოკვა</h3>
        <p className="text-gray-500 text-xs mb-5">{barber?.name} · {date}</p>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-[10px] tracking-widest uppercase text-gray-600 mb-1 block">სათაური</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="accent-[#C9A84C]" />
            <span className="text-sm text-gray-400">მთელი დღე</span>
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] tracking-widest uppercase text-gray-600 mb-1 block">დასაწყისი</label>
                <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="text-[10px] tracking-widest uppercase text-gray-600 mb-1 block">დასასრული</label>
                <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#2a2a2a] text-gray-400 text-xs tracking-widest uppercase hover:text-white transition-colors">გაუქმება</button>
          <button onClick={() => onConfirm(barberId, date, allDay ? '' : start, allDay ? '' : end)}
            className="flex-1 py-2.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors">
            დაბლოკვა
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ADMIN ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [tab, setTab] = useState<Tab>('calendar')
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [igUrls, setIgUrls] = useState<string[]>([])
  const [igInput, setIgInput] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin_session')
    if (saved) {
      try {
        const s = JSON.parse(saved) as Session
        setSession(s)
      } catch {}
    }
  }, [])

  function getPw() { return session?.role === 'admin' ? session.password : '' }

  const loadData = useCallback(async (s: Session) => {
    const pw = s.password
    const headers = { 'x-admin-password': pw }
    const [dataRes, bookRes, photoRes, igRes] = await Promise.all([
      fetch('/api/admin/data', { headers }),
      fetch('/api/admin/bookings', { headers }),
      fetch('/api/admin/photos', { headers }),
      fetch('/api/admin/instagram', { headers }),
    ])
    if (dataRes.ok) {
      const d = await dataRes.json()
      setServices(d.services); setBarbers(d.barbers); setShopInfo(d.shopInfo)
    }
    if (bookRes.ok) { const d = await bookRes.json(); setBookings(d.bookings ?? []) }
    if (photoRes.ok) { const d = await photoRes.json(); setPhotos(d.photos ?? []) }
    if (igRes.ok) { const d = await igRes.json(); setIgUrls(d.urls ?? []) }
    if (s.role === 'admin') {
      const accRes = await fetch('/api/admin/accounts', { headers })
      if (accRes.ok) { const d = await accRes.json(); setAccounts(d.accounts ?? []) }
    }
  }, [])

  useEffect(() => { if (session) loadData(session) }, [session, loadData])

  async function save(type: string, data: unknown) {
    const pw = getPw()
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ type, data }),
    })
    setSaveMsg(res.ok ? 'შენახულია ✓' : 'შეცდომა')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function blockTime(barberId: string, date: string, start: string, end: string) {
    const pw = getPw()
    const res = await fetch('/api/admin/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ barberId, date, startTime: start || undefined, endTime: end || undefined }),
    })
    setSaveMsg(res.ok ? 'დაბლოკილია ✓' : 'შეცდომა')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function uploadPhoto(file: File, meta: Omit<Photo, 'id' | 'url' | 'createdAt'>) {
    setUploading(true)
    const pw = getPw()
    const form = new FormData(); form.append('file', file)
    const upRes = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': pw }, body: form })
    if (!upRes.ok) { setUploading(false); setSaveMsg('ატვირთვა ვერ მოხერხდა'); setTimeout(() => setSaveMsg(''), 3000); return }
    const { url } = await upRes.json()
    const photo: Photo = { ...meta, id: Date.now().toString(), url, createdAt: Date.now() }
    await fetch('/api/admin/photos', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify(photo) })
    const res = await fetch('/api/admin/photos', { headers: { 'x-admin-password': pw } })
    if (res.ok) { const d = await res.json(); setPhotos(d.photos ?? []) }
    setUploading(false); setSaveMsg('ატვირთულია ✓'); setTimeout(() => setSaveMsg(''), 3000)
  }

  async function deletePhoto(id: string) {
    const pw = getPw()
    await fetch('/api/admin/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ id }) })
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  async function addIgUrl() {
    if (!igInput.trim()) return
    const pw = getPw()
    await fetch('/api/admin/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ url: igInput }) })
    setIgInput(''); const res = await fetch('/api/admin/instagram', { headers: { 'x-admin-password': pw } })
    if (res.ok) { const d = await res.json(); setIgUrls(d.urls ?? []) }
  }

  async function deleteIgUrl(url: string) {
    const pw = getPw()
    await fetch('/api/admin/instagram', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ url }) })
    setIgUrls(prev => prev.filter(u => u !== url))
  }

  async function saveAccount(acc: Account) {
    const pw = getPw()
    await fetch('/api/admin/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify(acc) })
    const res = await fetch('/api/admin/accounts', { headers: { 'x-admin-password': pw } })
    if (res.ok) { const d = await res.json(); setAccounts(d.accounts ?? []) }
  }

  async function deleteAccount(id: string) {
    const pw = getPw()
    await fetch('/api/admin/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ id }) })
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  function handleLogout() { localStorage.removeItem('admin_session'); setSession(null) }

  if (!session) return <LoginScreen onLogin={s => setSession(s)} />

  const isAdmin = session.role === 'admin'

  const today = new Date().toDateString()
  const todayBookings = bookings.filter(b => new Date(b.start).toDateString() === today)
  const myBookings = session.barberId ? bookings.filter(b => BARBERS.find(bar => bar.id === session.barberId && bar.name === b.barber)) : bookings
  const nextBooking = myBookings.find(b => new Date(b.start) > new Date())

  const navItems: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'მთავარი', icon: '◈' },
    { id: 'calendar', label: 'კალენდარი', icon: '▦' },
    { id: 'bookings', label: 'ჯავშნები', icon: '◇' },
    { id: 'services', label: 'სერვისები', icon: '✦', adminOnly: true },
    { id: 'barbers', label: 'ბარბერები', icon: '◆', adminOnly: true },
    { id: 'gallery', label: 'გალერეა', icon: '◻', adminOnly: true },
    { id: 'shop', label: 'სალონი', icon: '◉', adminOnly: true },
    { id: 'accounts', label: 'ანგარიშები', icon: '👤', adminOnly: true },
  ].filter(item => isAdmin || !item.adminOnly)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 py-5 border-b border-[#1a1a1a]">
          <img src="/Logo.jpg" alt="Gentleman" className="h-8 w-auto" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{isAdmin ? 'ადმინი' : 'ბარბერი'}</span>
            <span className="text-[10px] text-gray-600">· {session.name}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm w-full text-left transition-colors rounded-sm ${tab === item.id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
              {item.id === 'bookings' && todayBookings.length > 0 && (
                <span className="ml-auto bg-[#C9A84C] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{todayBookings.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1a1a1a] flex flex-col gap-1">
          {saveMsg && <p className={`text-[10px] text-center tracking-wide px-3 py-1 ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-white transition-colors">↗ საიტი</a>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 transition-colors">→ გასვლა</button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen flex flex-col">
        <div className="md:hidden flex items-center gap-4 px-4 py-4 border-b border-[#1a1a1a]">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">☰</button>
          <span className="text-sm text-gray-400">{navItems.find(n => n.id === tab)?.label}</span>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-6xl w-full">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h1 className="font-serif text-3xl text-white mb-2">გამარჯობა, {session.name} 👋</h1>
              <p className="text-gray-500 text-sm mb-10">Gentleman Barbershop</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'დღეს', value: todayBookings.length, sub: 'ჯავშანი' },
                  { label: 'მომავალი 30 დღე', value: (isAdmin ? bookings : myBookings).length, sub: 'სულ' },
                  { label: 'სერვისები', value: services.length, sub: 'სახეობა' },
                  { label: 'ბარბერები', value: BARBERS.length, sub: 'სტაფი' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#141414] border border-[#1e1e1e] p-5">
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">{stat.label}</p>
                    <p className="font-serif text-4xl text-white font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
              {nextBooking && (
                <div className="mb-6">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-3">შემდეგი ჯავშანი</p>
                  <BookingCard booking={nextBooking} highlight />
                </div>
              )}
              {todayBookings.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-3">დღეს</p>
                  {todayBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          )}

          {/* CALENDAR */}
          {tab === 'calendar' && (
            <CalendarView bookings={bookings} session={session} onBlock={blockTime} />
          )}

          {/* BOOKINGS */}
          {tab === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">ჯავშნები</h1>
                  <p className="text-gray-600 text-sm">მომავალი 30 დღე</p>
                </div>
                <button onClick={() => session && loadData(session)} className="text-xs tracking-widest uppercase text-gray-500 hover:text-white border border-[#1e1e1e] px-4 py-2">განახლება ↺</button>
              </div>
              {(isAdmin ? bookings : myBookings).length === 0 ? (
                <div className="bg-[#141414] border border-[#1e1e1e] p-12 text-center">
                  <p className="text-gray-600">ჯავშანი არ არის</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(isAdmin ? bookings : myBookings).map(b => <BookingCard key={b.id} booking={b} showContact />)}
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {tab === 'services' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div><h1 className="font-serif text-3xl text-white mb-1">სერვისები</h1><p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p></div>
                <button onClick={() => save('services', services)} className="px-5 py-2.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d]">შენახვა</button>
              </div>
              <div className="flex flex-col gap-3">
                {services.map((s, i) => (
                  <div key={s.id} className="bg-[#141414] border border-[#1e1e1e] p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <InlineEdit value={s.name} onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))} className="text-white font-semibold text-lg" />
                      <div className="flex items-center gap-1 shrink-0">
                        <InlineEdit value={String(s.price)} onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, price: Number(v) || x.price } : x))} className="text-[#C9A84C] font-serif text-2xl font-bold w-16 text-right" type="number" />
                        <span className="text-gray-500 text-sm">GEL</span>
                      </div>
                    </div>
                    <InlineEdit value={s.description} onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, description: v } : x))} className="text-gray-500 text-sm leading-relaxed mb-3" />
                    <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-gray-600">
                      <InlineEdit value={String(s.duration)} onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, duration: Number(v) || x.duration } : x))} className="text-gray-600 w-10" type="number" />
                      <span>წუთი</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BARBERS */}
          {tab === 'barbers' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div><h1 className="font-serif text-3xl text-white mb-1">ბარბერები</h1><p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p></div>
                <button onClick={() => save('barbers', barbers)} className="px-5 py-2.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d]">შენახვა</button>
              </div>
              <div className="flex flex-col gap-3">
                {barbers.map((b, i) => (
                  <div key={b.id} className="bg-[#141414] border border-[#1e1e1e] p-6">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 border flex items-center justify-center shrink-0" style={{ borderColor: getBarberColor(b.id) }}>
                        <span className="font-serif text-xl font-bold" style={{ color: getBarberColor(b.id) }}>{b.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <InlineEdit value={b.name} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))} className="text-white font-semibold text-lg" />
                          <InlineEdit value={b.title} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, title: v } : x))} className="text-[#C9A84C] text-[10px] tracking-widest uppercase" />
                        </div>
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <InlineEdit value={b.experience} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, experience: v } : x))} className="text-gray-600 text-xs" />
                          <span className="text-gray-700">·</span>
                          <InlineEdit value={b.speciality} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, speciality: v } : x))} className="text-gray-500 text-xs" />
                        </div>
                        <InlineEdit value={b.bio} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, bio: v } : x))} className="text-gray-600 text-xs leading-relaxed" multiline />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY */}
          {tab === 'gallery' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div><h1 className="font-serif text-3xl text-white mb-1">გალერეა</h1><p className="text-gray-600 text-sm">ფოტოები და Instagram პოსტები</p></div>
              </div>
              <GalleryUpload barbers={barbers} onUpload={uploadPhoto} uploading={uploading} />
              <div className="mt-8 bg-[#141414] border border-[#1e1e1e] p-6">
                <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">Instagram პოსტები</p>
                <div className="flex gap-2 mb-4">
                  <input value={igInput} onChange={e => setIgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIgUrl()} placeholder="https://www.instagram.com/p/..." className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
                  <button onClick={addIgUrl} className="px-4 py-2 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d]">დამატება</button>
                </div>
                {igUrls.map(url => (
                  <div key={url} className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white truncate">{url}</a>
                    <button onClick={() => deleteIgUrl(url)} className="text-red-400 text-xs hover:text-red-300 shrink-0">წაშლა ✕</button>
                  </div>
                ))}
              </div>
              {photos.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">ატვირთული ({photos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map(p => (
                      <div key={p.id} className="relative group aspect-square overflow-hidden bg-[#141414] border border-[#1e1e1e]">
                        <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{p.type}</span>
                          <button onClick={() => deletePhoto(p.id)} className="text-red-400 text-xs hover:text-red-300">წაშლა ✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SHOP */}
          {tab === 'shop' && isAdmin && shopInfo && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div><h1 className="font-serif text-3xl text-white mb-1">სალონის ინფო</h1><p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p></div>
                <button onClick={() => save('shopInfo', shopInfo)} className="px-5 py-2.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d]">შენახვა</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(shopInfo) as [string, string][]).map(([key, val]) => (
                  <div key={key} className="bg-[#141414] border border-[#1e1e1e] p-5">
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">{key}</p>
                    <InlineEdit value={val} onChange={v => setShopInfo(prev => prev ? { ...prev, [key]: v } : prev)} className="text-white text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNTS */}
          {tab === 'accounts' && isAdmin && (
            <AccountsTab accounts={accounts} barbers={barbers} onSave={saveAccount} onDelete={deleteAccount} />
          )}

        </div>
      </main>
    </div>
  )
}

// ─── ACCOUNTS TAB ────────────────────────────────────────────────────────────

function AccountsTab({ accounts, barbers, onSave, onDelete }: {
  accounts: Account[]; barbers: Barber[]
  onSave: (a: Account) => void; onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<Partial<Account>>({ role: 'barber' })
  const [editing, setEditing] = useState<string | null>(null)

  function startEdit(a: Account) { setForm(a); setEditing(a.id) }
  function submit() {
    if (!form.name || !form.password) return
    onSave({ id: editing ?? Date.now().toString(), name: form.name!, role: form.role ?? 'barber', barberId: form.barberId, password: form.password! })
    setForm({ role: 'barber' }); setEditing(null)
  }

  return (
    <div>
      <div className="mb-8"><h1 className="font-serif text-3xl text-white mb-1">ანგარიშები</h1><p className="text-gray-600 text-sm">ბარბერების შესვლის მართვა</p></div>

      {/* Form */}
      <div className="bg-[#141414] border border-[#1e1e1e] p-6 mb-6">
        <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">{editing ? 'რედაქტირება' : 'ახალი ანგარიში'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase text-gray-600 mb-1 block">სახელი</label>
            <input value={form.name ?? ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ბარბერის სახელი" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
          </div>
          <div>
            <label className="text-[10px] tracking-widests uppercase text-gray-600 mb-1 block">პაროლი</label>
            <input type="text" value={form.password ?? ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="პაროლი" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
          </div>
          <div>
            <label className="text-[10px] tracking-widests uppercase text-gray-600 mb-1 block">ბარბერი (კალენდარი)</label>
            <select value={form.barberId ?? ''} onChange={e => setForm(p => ({ ...p, barberId: e.target.value || undefined }))} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
              <option value="">— არ არის მიბმული —</option>
              {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] tracking-widests uppercase text-gray-600 mb-1 block">როლი</label>
            <select value={form.role ?? 'barber'} onChange={e => setForm(p => ({ ...p, role: e.target.value as 'admin' | 'barber' }))} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
              <option value="barber">ბარბერი</option>
              <option value="admin">ადმინი</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {editing && <button onClick={() => { setForm({ role: 'barber' }); setEditing(null) }} className="px-4 py-2 border border-[#2a2a2a] text-gray-400 text-xs tracking-widest uppercase hover:text-white">გაუქმება</button>}
          <button onClick={submit} className="px-5 py-2 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d]">
            {editing ? 'განახლება' : 'დამატება'}
          </button>
        </div>
      </div>

      {/* Account list */}
      <div className="flex flex-col gap-2">
        {accounts.map(a => (
          <div key={a.id} className="bg-[#141414] border border-[#1e1e1e] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#C9A84C]/30 flex items-center justify-center">
                <span className="font-serif text-[#C9A84C] text-sm">{a.name[0]}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{a.name}</p>
                <p className="text-gray-600 text-[10px] tracking-widest uppercase">{a.role} {a.barberId ? `· ${barbers.find(b => b.id === a.barberId)?.name}` : ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(a)} className="px-3 py-1.5 border border-[#2a2a2a] text-gray-400 text-xs hover:text-white transition-colors">რედაქტ.</button>
              <button onClick={() => onDelete(a.id)} className="px-3 py-1.5 border border-red-900/30 text-red-400 text-xs hover:text-red-300 transition-colors">წაშლა</button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">ანგარიში არ არის. დაამატე ბარბერის ანგარიში.</p>
        )}
      </div>
    </div>
  )
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function BookingCard({ booking, highlight = false, showContact = false }: { booking: Booking; highlight?: boolean; showContact?: boolean }) {
  const start = new Date(booking.start)
  const end = new Date(booking.end)
  const isToday = start.toDateString() === new Date().toDateString()
  const barber = BARBERS.find(b => b.name === booking.barber)
  const color = getBarberColor(barber?.id ?? '')

  return (
    <div className={`border p-5 flex flex-col sm:flex-row sm:items-start gap-4 mb-2 ${highlight ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : isToday ? 'border-[#2a2a2a] bg-[#141414]' : 'border-[#1a1a1a] bg-[#111]'}`}>
      <div className="shrink-0 sm:w-28 text-right">
        <p className="text-white font-semibold text-sm">{start.toLocaleDateString('ka-GE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        <p className="text-xs mt-0.5 font-mono" style={{ color }}>
          {start.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {isToday && <span className="inline-block mt-1 text-[10px] tracking-widest uppercase text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5">დღეს</span>}
      </div>
      <div className="hidden sm:block w-px bg-[#1e1e1e] self-stretch" />
      <div className="flex-1">
        <p className="text-white font-medium">{booking.summary}</p>
        <p className="text-[10px] tracking-widests uppercase mt-0.5 mb-2" style={{ color }}>{booking.barber}</p>
        {booking.description && <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{booking.description}</p>}
      </div>
    </div>
  )
}

type BarberMin = { id: string; name: string }

function GalleryUpload({ barbers, onUpload, uploading }: { barbers: BarberMin[]; onUpload: (file: File, meta: any) => void; uploading: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<'gallery' | 'before-after' | 'featured'>('gallery')
  const [barberId, setBarberId] = useState('')
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')

  function handleFile(f: File) { setFile(f); setPreview(URL.createObjectURL(f)) }

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] p-6">
      <p className="text-[10px] tracking-widests uppercase text-gray-600 mb-5">ახალი ფოტო</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] tracking-widests uppercase text-gray-600 mb-2">ტიპი</p>
          <div className="flex gap-2">
            {(['gallery', 'before-after', 'featured'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 text-[10px] tracking-widests uppercase border transition-colors ${type === t ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-[#2a2a2a] text-gray-600 hover:text-white'}`}>
                {t === 'gallery' ? 'გალ.' : t === 'before-after' ? 'Before/After' : 'Featured'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] tracking-widests uppercase text-gray-600 mb-2">ბარბერი</p>
          <select value={barberId} onChange={e => setBarberId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
            <option value="">ყველა</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="წარწერა (სურვილისამებრ)" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
        </div>
      </div>
      <div className="border-2 border-dashed border-[#2a2a2a] hover:border-[#C9A84C]/50 p-8 text-center cursor-pointer mb-4" onClick={() => document.getElementById('photo-upload')?.click()}>
        {preview ? <img src={preview} alt="" className="max-h-48 mx-auto object-contain" /> : <p className="text-gray-500 text-sm">დააჭირე ფოტოს ასატვირთად</p>}
        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
      <button onClick={() => file && onUpload(file, { type, barberId: barberId || undefined, caption: caption || undefined })} disabled={!file || uploading}
        className="w-full py-3 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widests uppercase hover:bg-[#b8953d] disabled:opacity-40">
        {uploading ? 'იტვირთება...' : 'ატვირთვა'}
      </button>
    </div>
  )
}

function InlineEdit({ value, onChange, className = '', type = 'text', multiline = false }: {
  value: string; onChange: (v: string) => void; className?: string; type?: string; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() { setEditing(false); onChange(draft) }

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} className={`cursor-text hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors block ${className}`} title="დასაჭერია შესასწორებლად">
        {value || <span className="text-gray-700 italic text-xs">დააჭირე შესაცვლელად</span>}
      </span>
    )
  }

  const cls = `bg-[#0a0a0a] border border-[#C9A84C]/50 outline-none rounded px-1 -mx-1 py-0.5 w-full ${className}`
  return multiline ? (
    <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Escape' && setEditing(false)} rows={3} className={`${cls} resize-none`} />
  ) : (
    <input ref={ref as React.RefObject<HTMLInputElement>} type={type} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }} className={cls} />
  )
}
