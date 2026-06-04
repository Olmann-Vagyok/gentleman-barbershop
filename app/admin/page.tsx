'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isToday, startOfDay, isBefore,
} from 'date-fns'

type Service  = { id: string; name: string; duration: number; price: number; description: string }
type Barber   = { id: string; name: string; title: string; experience: string; speciality: string; bio: string; calendarEnvKey: string }
type ShopInfo = Record<string, string>
type Booking  = { id: string; barberId: string; barber: string; summary: string; start: string; end: string; description: string }
type Photo    = { id: string; url: string; type: 'gallery' | 'before-after' | 'featured'; barberId?: string; caption?: string; createdAt: number }
type Session  = { username: string; password: string; role: 'admin' | 'barber'; barberId?: string; barberName?: string }
type Tab      = 'dashboard' | 'calendar' | 'bookings' | 'services' | 'barbers' | 'gallery' | 'shop' | 'users'
type UserRecord = { id: string; username: string; role: 'admin' | 'barber'; barberId?: string; displayName: string }

const BARBER_COLORS: Record<string, string> = {
  mariam: '#C9A84C',
  george: '#5B8AF0',
  nabi:   '#4ECDC4',
  raoul:  '#9B5DE5',
  sida:   '#F7931E',
}

const HOUR_PX = 90   // pixels per hour
const START_H = 11
const END_H   = 20

function minutesFromStart(date: Date) {
  return (date.getHours() - START_H) * 60 + date.getMinutes()
}

// ─── Auth helpers ────────────────────────────────────────────────────────────

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem('admin_session')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function authHeaders(session: Session) {
  return {
    'x-admin-username': session.username,
    'x-admin-password': session.password,
  }
}

// ─── Login screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase().trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'შეცდომა'); return }
      const session: Session = {
        username: username.toLowerCase().trim(),
        password,
        role: data.role,
        barberId: data.barberId,
        barberName: data.barberName,
      }
      localStorage.setItem('admin_session', JSON.stringify(session))
      onLogin(session)
    } catch {
      setError('კავშირის შეცდომა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3 mb-12 justify-center">
          <span className="w-9 h-9 border border-[#C9A84C] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="font-serif text-white text-xl tracking-widest uppercase">Gentleman</span>
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-6 text-center">ადმინ პანელი</p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="მომხმარებელი"
            autoFocus
            autoComplete="username"
            className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3.5 text-sm outline-none focus:border-[#C9A84C] transition-colors tracking-wide"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="პაროლი"
            autoComplete="current-password"
            className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3.5 text-sm outline-none focus:border-[#C9A84C] transition-colors tracking-wide"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="w-full py-3.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? '...' : 'შესვლა'}
          </button>
        </div>
        <p className="text-gray-700 text-[10px] text-center mt-6">
          Admin: username <span className="text-gray-500">admin</span> · Barbers: their name (e.g. <span className="text-gray-500">mariam</span>)
        </p>
      </div>
    </div>
  )
}

// ─── Calendar view ───────────────────────────────────────────────────────────

function CalendarView({ bookings, session }: { bookings: Booking[]; session: Session }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selected, setSelected]   = useState<Booking | null>(null)

  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours     = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const gridH     = (END_H - START_H) * HOUR_PX

  function bookingsForDay(day: Date) {
    return bookings.filter(b => isSameDay(new Date(b.start), day))
  }

  function bookingStyle(b: Booking) {
    const s   = new Date(b.start)
    const e   = new Date(b.end)
    const top = (minutesFromStart(s) / 60) * HOUR_PX
    const h   = Math.max(((e.getTime() - s.getTime()) / 60000 / 60) * HOUR_PX, 28)
    return { top, height: h }
  }

  const color = (barberId: string) => BARBER_COLORS[barberId] ?? '#C9A84C'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">კალენდარი</h1>
          <p className="text-gray-600 text-sm">
            {format(weekStart, 'd MMM')} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
            className="border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors w-9 h-9 flex items-center justify-center text-sm">
            ←
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="border border-[#2a2a2a] text-gray-400 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors px-3 h-9 text-[10px] tracking-widest uppercase">
            დღეს
          </button>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors w-9 h-9 flex items-center justify-center text-sm">
            →
          </button>
        </div>
      </div>

      {/* Barber legend (admin only) */}
      {session.role === 'admin' && (
        <div className="flex flex-wrap gap-3 mb-5">
          {Object.entries(BARBER_COLORS).map(([id, col]) => (
            <div key={id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: col }} />
              <span className="text-[10px] text-gray-500 capitalize">{id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 640 }}>
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-[#1e1e1e] mb-0">
            <div className="text-[10px] text-gray-700 px-2 py-2" /> {/* time gutter */}
            {days.map(day => (
              <div key={day.toISOString()}
                className={`px-2 py-2 text-center border-l border-[#1a1a1a] ${isToday(day) ? 'bg-[#C9A84C]/5' : ''}`}>
                <div className="text-[10px] tracking-widest uppercase text-gray-600">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold mt-0.5 ${
                  isToday(day) ? 'text-[#C9A84C]' : isBefore(startOfDay(day), startOfDay(new Date())) ? 'text-gray-700' : 'text-white'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-8" style={{ height: gridH + 'px', position: 'relative' }}>
            {/* Hour labels */}
            <div className="relative border-r border-[#1a1a1a]">
              {hours.map(h => (
                <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_PX - 8, right: 8 }}
                  className="text-[10px] text-gray-700 tabular-nums">
                  {h}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map(day => (
              <div key={day.toISOString()}
                className={`relative border-l border-[#1a1a1a] ${isToday(day) ? 'bg-[#C9A84C]/[0.02]' : ''}`}
                style={{ height: gridH }}>
                {/* Hour lines */}
                {hours.map(h => (
                  <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_PX, left: 0, right: 0 }}
                    className="border-t border-[#1a1a1a]" />
                ))}
                {/* Half-hour lines */}
                {hours.map(h => (
                  <div key={`h${h}`} style={{ position: 'absolute', top: (h - START_H) * HOUR_PX + HOUR_PX / 2, left: 0, right: 0 }}
                    className="border-t border-[#151515]" />
                ))}

                {/* Bookings */}
                {bookingsForDay(day).map(b => {
                  const { top, height } = bookingStyle(b)
                  const col = color(b.barberId)
                  const startTime = format(new Date(b.start), 'HH:mm')
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b)}
                      style={{
                        position: 'absolute',
                        top: top,
                        height: height,
                        left: 2,
                        right: 2,
                        background: col + '18',
                        borderLeft: `3px solid ${col}`,
                        borderTop: `1px solid ${col}30`,
                      }}
                      className="text-left px-1.5 py-1 overflow-hidden hover:brightness-110 transition-all group"
                    >
                      <p className="text-[10px] font-bold leading-none mb-0.5" style={{ color: col }}>
                        {startTime}
                      </p>
                      <p className="text-[10px] text-white leading-tight truncate">
                        {b.summary}
                      </p>
                      {session.role === 'admin' && height > 45 && (
                        <p className="text-[9px] mt-0.5 truncate" style={{ color: col + 'aa' }}>
                          {b.barber}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-[#141414] border border-[#2a2a2a] p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="w-3 h-3 rounded-full mb-2" style={{ background: color(selected.barberId) }} />
                <h3 className="text-white font-semibold text-lg leading-tight">{selected.summary}</h3>
                <p className="text-[10px] tracking-widest uppercase mt-1" style={{ color: color(selected.barberId) }}>
                  {selected.barber}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between py-2 border-b border-[#1e1e1e]">
                <span className="text-gray-600">თარიღი</span>
                <span className="text-white">{format(new Date(selected.start), 'EEEE, d MMMM yyyy')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e1e1e]">
                <span className="text-gray-600">დრო</span>
                <span className="text-white">
                  {format(new Date(selected.start), 'HH:mm')} – {format(new Date(selected.end), 'HH:mm')}
                </span>
              </div>
              {selected.description && (
                <div className="py-2">
                  <p className="text-gray-600 text-xs mb-1">შენიშვნა</p>
                  <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Booking card ────────────────────────────────────────────────────────────

function BookingCard({ booking, highlight = false }: { booking: Booking; highlight?: boolean }) {
  const start  = new Date(booking.start)
  const end    = new Date(booking.end)
  const today_ = isToday(start)
  const color  = BARBER_COLORS[booking.barberId] ?? '#C9A84C'

  return (
    <div className={`border p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${
      highlight ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : today_ ? 'border-[#2a2a2a] bg-[#141414]' : 'border-[#1a1a1a] bg-[#111]'
    }`}>
      <div className="shrink-0 sm:w-28">
        <p className="text-white font-semibold text-sm">
          {start.toLocaleDateString('ka-GE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <p className="text-xs mt-0.5 font-mono" style={{ color }}>
          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
        </p>
        {today_ && (
          <span className="inline-block mt-1 text-[10px] tracking-widest uppercase px-2 py-0.5" style={{ color, background: color + '18' }}>
            დღეს
          </span>
        )}
      </div>
      <div className="hidden sm:block w-px bg-[#1e1e1e] self-stretch" />
      <div className="flex-1">
        <p className="text-white font-medium">{booking.summary}</p>
        <p className="text-[10px] tracking-widest uppercase mt-0.5 mb-2" style={{ color }}>{booking.barber}</p>
        {booking.description && (
          <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{booking.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Inline edit ─────────────────────────────────────────────────────────────

function InlineEdit({ value, onChange, className = '', type = 'text', multiline = false }: {
  value: string; onChange: (v: string) => void; className?: string; type?: string; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() { setEditing(false); onChange(draft) }

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)}
        className={`cursor-text hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors block ${className}`}
        title="დასაჭერია შესასწორებლად">
        {value || <span className="text-gray-700 italic text-xs">დააჭირე შესაცვლელად</span>}
      </span>
    )
  }

  const cls = `bg-[#0a0a0a] border border-[#C9A84C]/50 outline-none rounded px-1 -mx-1 py-0.5 w-full ${className}`
  return multiline ? (
    <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => e.key === 'Escape' && setEditing(false)} rows={3} className={`${cls} resize-none`} />
  ) : (
    <input ref={ref as React.RefObject<HTMLInputElement>} type={type} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      className={cls} />
  )
}

// ─── Gallery upload ───────────────────────────────────────────────────────────

function GalleryUpload({ barbers, onUpload, uploading }: {
  barbers: { id: string; name: string }[]
  onUpload: (file: File, meta: Omit<Photo, 'id' | 'url' | 'createdAt'>) => void
  uploading: boolean
}) {
  const [file, setFile]       = useState<File | null>(null)
  const [type, setType]       = useState<Photo['type']>('gallery')
  const [barberId, setBarberId] = useState('')
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')

  function handleFile(f: File) { setFile(f); setPreview(URL.createObjectURL(f)) }

  function handleSubmit() {
    if (!file) return
    onUpload(file, { type, barberId: barberId || undefined, caption: caption || undefined })
    setFile(null); setPreview(''); setCaption('')
  }

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] p-6">
      <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-5">ახალი ფოტო</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">ტიპი</p>
          <div className="flex gap-2 flex-wrap">
            {(['gallery', 'before-after', 'featured'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 text-[10px] tracking-widest uppercase transition-colors border ${type === t ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-[#2a2a2a] text-gray-600 hover:text-white'}`}>
                {t === 'gallery' ? 'გალერეა' : t === 'before-after' ? 'Before/After' : 'Featured'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">ბარბერი</p>
          <select value={barberId} onChange={e => setBarberId(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
            <option value="">ყველა</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">წარწერა</p>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="სტილის აღწერა..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
        </div>
      </div>
      <div className="border-2 border-dashed border-[#2a2a2a] hover:border-[#C9A84C]/50 transition-colors p-8 text-center cursor-pointer mb-4"
        onClick={() => document.getElementById('photo-upload')?.click()}>
        {preview
          ? <img src={preview} alt="" className="max-h-48 mx-auto object-contain" />
          : <p className="text-gray-500 text-sm">დააჭირე ფოტოს ასატვირთად</p>
        }
        <input id="photo-upload" type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
      <button onClick={handleSubmit} disabled={!file || uploading}
        className="w-full py-3 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-40">
        {uploading ? 'იტვირთება...' : 'ატვირთვა'}
      </button>
    </div>
  )
}

// ─── Change password modal ───────────────────────────────────────────────────

function ChangePasswordModal({ session, onClose, onSuccess }: {
  session: Session
  onClose: () => void
  onSuccess: (newUsername: string, newPassword: string) => void
}) {
  const [newUsername, setNewUsername] = useState(session.username)
  const [newPassword, setNewPassword] = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(false)

  async function handleSave() {
    setError('')
    if (newPassword && newPassword !== confirm) { setError('Passwords do not match'); return }
    if (newPassword && newPassword.length < 6)  { setError('Password must be at least 6 characters'); return }
    if (!newPassword && newUsername === session.username) { setError('No changes made'); return }

    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (newUsername !== session.username) body.newUsername = newUsername
      if (newPassword) body.newPassword = newPassword

      const res  = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-username': session.username, 'x-admin-password': session.password },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setDone(true)
      setTimeout(() => { onSuccess(data.username ?? newUsername, newPassword || session.password) }, 1200)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#141414] border border-[#2a2a2a] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">Account Settings</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-lg leading-none">✕</button>
        </div>

        {done ? (
          <p className="text-green-400 text-sm text-center py-4">შენახულია ✓</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-2">Username</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-2">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
            </div>
            {newPassword && (
              <div>
                <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
              </div>
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50 mt-1">
              {saving ? '...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main admin page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession]   = useState<Session | null>(null)
  const [tab, setTab]           = useState<Tab>('calendar')
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers]   = useState<Barber[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsError, setBookingsError] = useState('')
  const [calendarNotConfigured, setCalendarNotConfigured] = useState(false)
  const [photos, setPhotos]     = useState<Photo[]>([])
  const [igUrls, setIgUrls]     = useState<string[]>([])
  const [igInput, setIgInput]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg]   = useState('')
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [showChangePw, setShowChangePw]     = useState(false)
  const [users, setUsers]                   = useState<UserRecord[]>([])

  // Restore session from localStorage on mount
  useEffect(() => {
    const s = getSession()
    if (s) {
      setSession(s)
      loadData(s)
    }
  }, [])

  async function loadData(s: Session) {
    const headers = authHeaders(s)
    // Load services/barbers/shopInfo (admin only for edit; barbers can still read)
    const res = await fetch('/api/admin/data', { headers })
    if (res.ok) {
      const d = await res.json()
      setServices(d.services)
      setBarbers(d.barbers)
      setShopInfo(d.shopInfo)
    }
    loadBookings(s)
    loadPhotos(s)
    loadIgUrls(s)
    if (s.role === 'admin') loadUsers(s)
  }

  const loadBookings = useCallback(async (s?: Session) => {
    const sess = s ?? session
    if (!sess) return
    const res  = await fetch('/api/admin/bookings', { headers: authHeaders(sess) })
    const data = await res.json()
    if (data.error === 'Google Calendar not configured') setCalendarNotConfigured(true)
    else if (data.error) setBookingsError(data.error)
    setBookings(data.bookings ?? [])
  }, [session])

  const loadPhotos = useCallback(async (s?: Session) => {
    const sess = s ?? session
    if (!sess) return
    const res  = await fetch('/api/admin/photos', { headers: authHeaders(sess) })
    const data = await res.json()
    setPhotos(data.photos ?? [])
  }, [session])

  const loadIgUrls = useCallback(async (s?: Session) => {
    const sess = s ?? session
    if (!sess) return
    const res  = await fetch('/api/admin/instagram', { headers: authHeaders(sess) })
    const data = await res.json()
    setIgUrls(data.urls ?? [])
  }, [session])

  const loadUsers = useCallback(async (s?: Session) => {
    const sess = s ?? session
    if (!sess) return
    const res  = await fetch('/api/admin/users', { headers: authHeaders(sess) })
    if (res.ok) { const d = await res.json(); setUsers(d.users ?? []) }
  }, [session])

  async function adminSetUser(userId: string, username?: string, password?: string) {
    if (!session) return
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify({ userId, username, password }),
    })
    const data = await res.json()
    if (res.ok) { setSaveMsg('შენახულია ✓'); loadUsers(); setTimeout(() => setSaveMsg(''), 3000) }
    else        { setSaveMsg(data.error ?? 'შეცდომა');    setTimeout(() => setSaveMsg(''), 3000) }
  }

  async function addIgUrl() {
    if (!session || !igInput.trim()) return
    await fetch('/api/admin/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify({ url: igInput }),
    })
    setIgInput('')
    loadIgUrls()
  }

  async function deleteIgUrl(url: string) {
    if (!session) return
    await fetch('/api/admin/instagram', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify({ url }),
    })
    setIgUrls(prev => prev.filter(u => u !== url))
  }

  async function uploadPhoto(file: File, meta: Omit<Photo, 'id' | 'url' | 'createdAt'>) {
    if (!session) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const upRes = await fetch('/api/admin/upload', { method: 'POST', headers: authHeaders(session), body: form })
    if (!upRes.ok) { setUploading(false); setSaveMsg('ატვირთვა ვერ მოხერხდა'); setTimeout(() => setSaveMsg(''), 3000); return }
    const { url } = await upRes.json()
    const photo: Photo = { ...meta, id: Date.now().toString(), url, createdAt: Date.now() }
    await fetch('/api/admin/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify(photo),
    })
    loadPhotos()
    setUploading(false)
    setSaveMsg('ატვირთულია ✓')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function deletePhoto(id: string) {
    if (!session) return
    await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify({ id }),
    })
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  async function save(type: string, data: unknown) {
    if (!session) return
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
      body: JSON.stringify({ type, data }),
    })
    setSaveMsg(res.ok ? 'შენახულია ✓' : 'შეცდომა შენახვისას')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function handleLogin(s: Session) {
    setSession(s)
    setTab('calendar')
    loadData(s)
  }

  function logout() {
    localStorage.removeItem('admin_session')
    setSession(null)
    setBookings([])
    setServices([])
    setBarbers([])
    setShopInfo(null)
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />

  function handlePasswordChanged(newUsername: string, newPw: string) {
    const updated = { ...session!, username: newUsername, password: newPw }
    localStorage.setItem('admin_session', JSON.stringify(updated))
    setSession(updated)
    setShowChangePw(false)
  }

  const isAdmin = session.role === 'admin'

  const todayBookings = bookings.filter(b => isToday(new Date(b.start)))
  const weekBookings  = bookings.filter(b => {
    const d = new Date(b.start); const now = new Date()
    return d >= now && d <= addDays(now, 7)
  })
  const nextBooking = bookings.find(b => new Date(b.start) > new Date())

  // Tabs shown depend on role
  const navItems: { id: Tab; label: string; icon: string }[] = [
    ...(isAdmin ? [{ id: 'dashboard' as Tab, label: 'მთავარი', icon: '◈' }] : []),
    { id: 'calendar',  label: 'კალენდარი', icon: '▦' },
    { id: 'bookings',  label: 'ჯავშნები',  icon: '◇' },
    ...(isAdmin ? [
      { id: 'services' as Tab, label: 'სერვისები', icon: '✦' },
      { id: 'barbers'  as Tab, label: 'ბარბერები', icon: '◆' },
      { id: 'gallery'  as Tab, label: 'გალერეა',   icon: '◻' },
      { id: 'shop'     as Tab, label: 'სალონი',    icon: '◉' },
      { id: 'users'    as Tab, label: 'მომხ.',     icon: '⊕' },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-7 border border-[#C9A84C] flex items-center justify-center shrink-0">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="font-serif text-white tracking-widest uppercase text-sm">Admin</span>
          </div>
          {/* Logged in as */}
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <div className="w-2 h-2 rounded-full" style={{ background: BARBER_COLORS[session.barberId ?? ''] ?? '#C9A84C' }} />
            )}
            <span className="text-[10px] text-gray-600">
              {isAdmin ? '👑 admin' : session.barberName ?? session.username}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm w-full text-left transition-colors rounded-sm ${
                tab === item.id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
              {item.id === 'bookings' && todayBookings.length > 0 && (
                <span className="ml-auto bg-[#C9A84C] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {todayBookings.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1a1a1a] flex flex-col gap-1">
          {saveMsg && (
            <p className={`text-[10px] text-center tracking-wide px-3 py-1 ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </p>
          )}
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-white transition-colors">
            <span>↗</span> საიტი
          </a>
          <button onClick={() => setShowChangePw(true)} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-[#C9A84C] transition-colors">
            <span>⚙</span> პაროლის შეცვლა
          </button>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 transition-colors">
            <span>→</span> გასვლა
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
        <div className="md:hidden flex items-center gap-4 px-4 py-4 border-b border-[#1a1a1a]">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">☰</button>
          <span className="text-sm text-gray-400">{navItems.find(n => n.id === tab)?.label}</span>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-6xl w-full">

          {/* DASHBOARD */}
          {tab === 'dashboard' && isAdmin && (
            <div>
              <h1 className="font-serif text-3xl text-white mb-2">გამარჯობა 👋</h1>
              <p className="text-gray-500 text-sm mb-10">Gentleman Barbershop — ადმინ პანელი</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'დღეს',          value: todayBookings.length, sub: 'ჯავშანი' },
                  { label: 'ამ კვირაში',    value: weekBookings.length,  sub: 'ჯავშანი' },
                  { label: 'სულ (60 დღე)',  value: bookings.length,      sub: 'ჯავშანი' },
                  { label: 'სერვისები',     value: services.length,      sub: 'სახეობა' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#141414] border border-[#1e1e1e] p-5">
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">{stat.label}</p>
                    <p className="font-serif text-4xl text-white font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
              {nextBooking && (
                <div className="mb-8">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">შემდეგი ჯავშანი</p>
                  <BookingCard booking={nextBooking} highlight />
                </div>
              )}
              {todayBookings.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">დღეს</p>
                  <div className="flex flex-col gap-3">
                    {todayBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </div>
              )}
              {todayBookings.length === 0 && !nextBooking && (
                <div className="bg-[#141414] border border-[#1e1e1e] p-8 text-center">
                  <p className="text-gray-600 text-sm">ახლო მომავალში ჯავშანი არ არის</p>
                </div>
              )}
            </div>
          )}

          {/* CALENDAR */}
          {tab === 'calendar' && (
            <div>
              {calendarNotConfigured ? (
                <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6 text-center">
                  <p className="text-[#C9A84C] text-sm">Google Calendar არ არის დაკავშირებული</p>
                  <p className="text-gray-600 text-xs mt-1">დააყენე env ცვლადები Vercel-ში</p>
                </div>
              ) : (
                <CalendarView bookings={bookings} session={session} />
              )}
            </div>
          )}

          {/* BOOKINGS LIST */}
          {tab === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">ჯავშნები</h1>
                  <p className="text-gray-600 text-sm">მომავალი 60 დღე</p>
                </div>
                <button onClick={() => loadBookings()}
                  className="text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors border border-[#1e1e1e] px-4 py-2">
                  განახლება ↺
                </button>
              </div>
              {bookingsError && (
                <div className="border border-red-900/30 bg-red-950/10 p-4 text-red-400 text-sm mb-6">{bookingsError}</div>
              )}
              {calendarNotConfigured && (
                <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6 text-center mb-6">
                  <p className="text-[#C9A84C] text-sm">Google Calendar არ არის დაკავშირებული</p>
                </div>
              )}
              {bookings.length === 0 && !calendarNotConfigured ? (
                <div className="bg-[#141414] border border-[#1e1e1e] p-12 text-center">
                  <p className="text-gray-600">მომდევნო 60 დღეში ჯავშანი არ არის</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {tab === 'services' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">სერვისები</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button onClick={() => save('services', services)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold">
                  შენახვა
                </button>
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
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">ბარბერები</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button onClick={() => save('barbers', barbers)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold">
                  შენახვა
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {barbers.map((b, i) => (
                  <div key={b.id} className="bg-[#141414] border border-[#1e1e1e] p-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 flex items-center justify-center shrink-0 bg-[#1a1a1a]"
                        style={{ border: `1px solid ${BARBER_COLORS[b.id] ?? '#C9A84C'}40` }}>
                        <span className="font-serif text-2xl font-bold" style={{ color: (BARBER_COLORS[b.id] ?? '#C9A84C') + '99' }}>{b.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <InlineEdit value={b.name} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))} className="text-white font-semibold text-lg" />
                          <InlineEdit value={b.title} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, title: v } : x))} className="text-[#C9A84C] text-[10px] tracking-widest uppercase" />
                        </div>
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <InlineEdit value={b.experience} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, experience: v } : x))} className="text-gray-600 text-xs" />
                          <span className="text-gray-700 text-xs">·</span>
                          <InlineEdit value={b.speciality} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, speciality: v } : x))} className="text-gray-500 text-xs" />
                        </div>
                        <InlineEdit value={b.bio} onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, bio: v } : x))} className="text-gray-600 text-xs leading-relaxed" multiline />
                        <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
                          <p className="text-[10px] text-gray-700">Login: <span className="text-gray-500 font-mono">{b.id}</span> · Env: <span className="text-gray-500 font-mono">BARBER_LOGIN_{b.id.toUpperCase()}</span></p>
                        </div>
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
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">გალერეა</h1>
                  <p className="text-gray-600 text-sm">ატვირთე ფოტოები პორტფოლიოში</p>
                </div>
              </div>
              <GalleryUpload barbers={barbers} onUpload={uploadPhoto} uploading={uploading} />
              <div className="mt-8 bg-[#141414] border border-[#1e1e1e] p-6">
                <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">Instagram პოსტები</p>
                <div className="flex gap-2 mb-4">
                  <input value={igInput} onChange={e => setIgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIgUrl()}
                    placeholder="https://www.instagram.com/p/..."
                    className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
                  <button onClick={addIgUrl} className="px-4 py-2 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors">
                    დამატება
                  </button>
                </div>
                {igUrls.map(url => (
                  <div key={url} className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white truncate">{url}</a>
                    <button onClick={() => deleteIgUrl(url)} className="text-red-400 text-xs hover:text-red-300 shrink-0">✕</button>
                  </div>
                ))}
              </div>
              {photos.length > 0 && (
                <div className="mt-10">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">ატვირთული ({photos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map(p => (
                      <div key={p.id} className="relative group aspect-square overflow-hidden bg-[#141414] border border-[#1e1e1e]">
                        <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{p.type}</span>
                          {p.caption && <span className="text-[10px] text-white text-center">{p.caption}</span>}
                          <button onClick={() => deletePhoto(p.id)} className="text-red-400 text-xs hover:text-red-300 mt-1">წაშლა ✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && isAdmin && (
            <UsersTab users={users} session={session} onSave={adminSetUser} onReload={loadUsers} />
          )}

          {/* SHOP */}
          {tab === 'shop' && isAdmin && shopInfo && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">სალონის ინფო</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button onClick={() => save('shopInfo', shopInfo)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold">
                  შენახვა
                </button>
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

        </div>
      </main>

      {showChangePw && (
        <ChangePasswordModal
          session={session}
          onClose={() => setShowChangePw(false)}
          onSuccess={handlePasswordChanged}
        />
      )}
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, session, onSave, onReload }: {
  users: UserRecord[]
  session: Session
  onSave: (userId: string, username?: string, password?: string) => void
  onReload: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draftUsername, setDraftUsername] = useState('')
  const [draftPassword, setDraftPassword] = useState('')
  const [confirm,        setConfirm]       = useState('')
  const [error,          setError]         = useState('')

  function startEdit(user: UserRecord) {
    setEditing(user.id)
    setDraftUsername(user.username)
    setDraftPassword('')
    setConfirm('')
    setError('')
  }

  function handleSave(userId: string) {
    setError('')
    if (draftPassword && draftPassword !== confirm) { setError('Passwords do not match'); return }
    if (draftPassword && draftPassword.length < 6)  { setError('Min 6 characters'); return }
    onSave(userId, draftUsername || undefined, draftPassword || undefined)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">მომხმარებლები</h1>
          <p className="text-gray-600 text-sm">შეცვალე username ან reset გააკეთე პაროლი</p>
        </div>
        <button onClick={onReload} className="text-xs tracking-widest uppercase text-gray-500 hover:text-white border border-[#1e1e1e] px-4 py-2 transition-colors">
          განახლება ↺
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {users.map(user => (
          <div key={user.id} className="bg-[#141414] border border-[#1e1e1e] p-5">
            {editing === user.id ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: user.barberId ? (BARBER_COLORS[user.barberId] ?? '#C9A84C') : '#C9A84C' }} />
                  <span className="text-white font-medium">{user.displayName}</span>
                  <span className="text-[10px] tracking-widest uppercase text-gray-600">{user.role}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-1.5">Username</label>
                    <input value={draftUsername} onChange={e => setDraftUsername(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-1.5">New Password</label>
                    <input type="password" value={draftPassword} onChange={e => setDraftPassword(e.target.value)}
                      placeholder="Leave blank to keep"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
                  </div>
                  {draftPassword && (
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-widest uppercase text-gray-600 block mb-1.5">Confirm Password</label>
                      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
                    </div>
                  )}
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2 mt-1">
                  <button onClick={() => handleSave(user.id)}
                    className="px-5 py-2 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors">
                    შენახვა
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-5 py-2 border border-[#2a2a2a] text-gray-500 hover:text-white text-xs tracking-widest uppercase transition-colors">
                    გაუქმება
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center border"
                    style={{ borderColor: (user.barberId ? BARBER_COLORS[user.barberId] : '#C9A84C') + '40' }}>
                    <span className="font-serif font-bold text-sm" style={{ color: (user.barberId ? BARBER_COLORS[user.barberId] : '#C9A84C') + '99' }}>
                      {user.displayName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{user.displayName}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      <span className="font-mono text-gray-400">{user.username}</span>
                      <span className="mx-2 text-gray-700">·</span>
                      <span className="tracking-widest uppercase">{user.role}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => startEdit(user)}
                  className="text-xs tracking-widest uppercase text-gray-600 hover:text-[#C9A84C] border border-[#1e1e1e] hover:border-[#C9A84C]/30 px-3 py-1.5 transition-colors shrink-0">
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
