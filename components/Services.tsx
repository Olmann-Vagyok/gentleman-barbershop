import { SERVICES } from '@/lib/data'

const serviceIcons: Record<string, string> = {
  haircut: '✦',
  'beard-trim': '◈',
  'haircut-beard': '✦',
  'royal-shave': '◇',
  'hair-wash': '◈',
  'hair-wax': '◆',
  'kids-haircut': '✦',
}

export default function Services() {
  return (
    <section id="services" className="section-padding bg-ink-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Our Services</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            Crafted for the
            <br />
            <span className="text-gold-gradient">Modern Gentleman</span>
          </h2>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SERVICES.map((service, i) => (
            <a
              key={service.id}
              href="#booking"
              className="card-hover group relative p-6 border border-ink-300 bg-ink flex flex-col gap-4"
            >
              {/* Icon */}
              <span className="text-gold text-xl opacity-60 group-hover:opacity-100 transition-opacity">
                {serviceIcons[service.id] ?? '✦'}
              </span>

              {/* Name & description */}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">{service.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
              </div>

              {/* Price & duration */}
              <div className="flex items-end justify-between pt-4 border-t border-ink-300">
                <span className="font-serif text-2xl text-white font-bold">
                  {service.price}
                  <span className="text-sm font-sans text-gray-400 ml-1">GEL</span>
                </span>
                <span className="text-xs text-gray-500 tracking-wide">{service.duration} min</span>
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </a>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-gray-600 text-xs mt-8 text-center tracking-wide">
          All prices in Georgian Lari (GEL) · Walk-ins welcome · Mon–Sun 11:00–20:00
        </p>
      </div>
    </section>
  )
}
