'use client'

import { useState, useEffect } from 'react'
import { BARBERS } from '@/lib/data'

type Photo = {
  id: string
  url: string
  type: 'gallery' | 'before-after' | 'featured'
  barberId?: string
  caption?: string
  beforeUrl?: string
  afterUrl?: string
  createdAt: number
}

export default function Portfolio() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  useEffect(() => {
    fetch('/api/photos').then(r => r.json()).then(d => setPhotos(d.photos ?? []))
  }, [])

  if (photos.length === 0) return null

  const featured = photos.filter(p => p.type === 'featured')
  const beforeAfter = photos.filter(p => p.type === 'before-after')
  const barbers = [...new Set(photos.map(p => p.barberId).filter(Boolean))]

  const galleryPhotos = photos.filter(p => {
    if (filter === 'all') return p.type === 'gallery' || p.type === 'featured'
    return p.barberId === filter
  })

  return (
    <section id="portfolio" className="section-padding bg-ink">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">პორტფოლიო</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            ჩვენი
            <br />
            <span className="text-gold-gradient">ნამუშევრები</span>
          </h2>
        </div>

        {/* Featured photos */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            {featured.slice(0, 2).map(photo => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {photo.caption && (
                  <p className="absolute bottom-4 left-4 text-white text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {photo.caption}
                  </p>
                )}
                <div className="absolute top-3 right-3 border border-gold/50 px-2 py-0.5 text-[10px] tracking-widest uppercase text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  Featured
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Before & After */}
        {beforeAfter.length > 0 && (
          <div className="mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-gray-600 mb-8">Before & After</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {beforeAfter.map(photo => (
                <div key={photo.id} className="border border-ink-300 overflow-hidden">
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <img src={photo.beforeUrl ?? photo.url} alt="Before" className="w-full aspect-square object-cover" />
                      <span className="absolute bottom-2 left-2 bg-ink/80 text-[10px] tracking-widest uppercase text-gray-400 px-2 py-0.5">Before</span>
                    </div>
                    <div className="relative border-l border-ink-300">
                      <img src={photo.afterUrl ?? photo.url} alt="After" className="w-full aspect-square object-cover" />
                      <span className="absolute bottom-2 right-2 bg-gold/90 text-[10px] tracking-widest uppercase text-ink px-2 py-0.5">After</span>
                    </div>
                  </div>
                  {photo.caption && (
                    <p className="px-4 py-3 text-gray-500 text-xs border-t border-ink-300">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery with barber filter */}
        {galleryPhotos.length > 0 && (
          <div>
            {/* Filter tabs */}
            <div className="flex items-center gap-0 mb-8 border-b border-ink-300 overflow-x-auto">
              {[{ id: 'all', name: 'ყველა' }, ...BARBERS.filter(b => barbers.includes(b.id)).map(b => ({ id: b.id, name: b.name }))].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-5 py-3 text-xs tracking-widest uppercase whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    filter === f.id
                      ? 'border-gold text-gold'
                      : 'border-transparent text-gray-600 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden cursor-pointer group"
                  onClick={() => setLightbox(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-2xl">+</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instagram CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://www.instagram.com/gentlemantbilisi/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex items-center gap-3"
          >
            <span>IG</span>
            <span>მეტი სამუშაო Instagram-ზე</span>
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white text-2xl opacity-60 hover:opacity-100">✕</button>
          <img
            src={lightbox.url}
            alt={lightbox.caption ?? ''}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-8 text-gray-400 text-sm tracking-wide">{lightbox.caption}</p>
          )}
        </div>
      )}
    </section>
  )
}
