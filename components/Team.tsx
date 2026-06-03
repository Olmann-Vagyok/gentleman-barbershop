import { BARBERS } from '@/lib/data'

const accentColors = [
  'from-[#C9A84C]/20 to-transparent',
  'from-[#8A6E2F]/20 to-transparent',
  'from-[#C9A84C]/15 to-transparent',
  'from-[#E8C96D]/15 to-transparent',
  'from-[#C9A84C]/20 to-transparent',
]

export default function Team() {
  return (
    <section id="team" className="section-padding bg-ink">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">გუნდი</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            გაიცანი შენი
            <br />
            <span className="text-gold-gradient">ბარბერები</span>
          </h2>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {BARBERS.map((barber, i) => (
            <div
              key={barber.id}
              className="card-hover group relative border border-ink-300 bg-ink-100 overflow-hidden"
            >
              {/* Avatar area */}
              <div
                className={`relative h-48 bg-gradient-to-b ${accentColors[i % accentColors.length]} bg-ink-200 flex items-center justify-center`}
              >
                {/* Large initial */}
                <span className="font-serif text-7xl font-bold text-white opacity-10 select-none">
                  {barber.name[0]}
                </span>
                {/* Centered monogram */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-colors">
                    <span className="font-serif text-3xl font-bold text-gold/70 group-hover:text-gold transition-colors">
                      {barber.name[0]}
                    </span>
                  </div>
                </div>
                {/* Experience badge */}
                <div className="absolute top-3 right-3 text-[10px] tracking-widest uppercase text-gold/60 border border-gold/20 px-2 py-1">
                  {barber.experience}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-white font-semibold text-lg">{barber.name}</h3>
                <p className="text-gold text-xs tracking-widest uppercase mt-0.5 mb-3">
                  {barber.title}
                </p>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{barber.bio}</p>
                <div className="text-[10px] tracking-widest uppercase text-gray-600 border-t border-ink-300 pt-3">
                  {barber.speciality}
                </div>
              </div>

              {/* Book with this barber */}
              <a
                href="#booking"
                className="block w-full py-3 text-center text-xs tracking-widest uppercase text-gray-500 hover:text-gold hover:bg-ink-200 transition-all border-t border-ink-300"
              >
                დაჯავშნე {barber.name}-თან
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
