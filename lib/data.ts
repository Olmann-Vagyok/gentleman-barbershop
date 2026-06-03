export type Barber = {
  id: string
  name: string
  title: string
  experience: string
  speciality: string
  bio: string
  calendarEnvKey: string
}

export type Service = {
  id: string
  name: string
  duration: number
  price: number
  description: string
}

export const BARBERS: Barber[] = [
  {
    id: 'mariam',
    name: 'Mariam',
    title: 'მთავარი სტილისტი',
    experience: '9+ წელი',
    speciality: 'კლასიკური და თანამედროვე თმის შეჭრა',
    bio: '9 წელზე მეტი გამოცდილებით, მარიამი ზუსტ თმის შეჭრას და პერსონალიზებულ სტაილინგს გვთავაზობს.',
    calendarEnvKey: 'CALENDAR_ID_MARIAM',
  },
  {
    id: 'george',
    name: 'George',
    title: 'წვერის სპეციალისტი',
    experience: '5+ წელი',
    speciality: 'წვერის მოვლა და ფორმირება',
    bio: 'გიორგი ჩვენი წვერის სპეციალისტია, ყოველ წვერს სტილის გამოხატულებად აქცევს.',
    calendarEnvKey: 'CALENDAR_ID_GEORGE',
  },
  {
    id: 'nabi',
    name: 'Nabi',
    title: 'სტილისტი',
    experience: '4+ წელი',
    speciality: 'თანამედროვე სტაილები',
    bio: 'ნაბი თანამედროვე თმის შეჭრას ახალი ხედვით მიუდგება და უახლეს ტენდენციებში სპეციალიზირდება.',
    calendarEnvKey: 'CALENDAR_ID_NABI',
  },
  {
    id: 'raoul',
    name: 'Raoul',
    title: 'ბარბერი',
    experience: '3+ წელი',
    speciality: 'სუფთა ფეიდები და ტეიპერები',
    bio: 'რაული ზუსტ ფეიდებსა და ტეიპერებს სპეციალიზირდება, ყოველ კლიენტს მეტ თავდაჯერებულობას ანიჭებს.',
    calendarEnvKey: 'CALENDAR_ID_RAOUL',
  },
  {
    id: 'sida',
    name: 'Sida',
    title: 'ბარბერი',
    experience: '3+ წელი',
    speciality: 'სტაილინგი და მოვლა',
    bio: 'სიდა ტექნიკურ სიზუსტეს დეტალებზე ყურადღებასთან აერთიანებს და განსაკუთრებულ გამოცდილებას ქმნის.',
    calendarEnvKey: 'CALENDAR_ID_SIDA',
  },
]

export const SERVICES: Service[] = [
  {
    id: 'haircut',
    name: 'თმის შეჭრა',
    duration: 45,
    price: 35,
    description: 'კლასიკური ან თანამედროვე თმის შეჭრა, მორგებული შენს სტილზე',
  },
  {
    id: 'beard-trim',
    name: 'წვერის შეჭრა',
    duration: 30,
    price: 20,
    description: 'ზუსტი წვერის ფორმირება და შეჭრა',
  },
  {
    id: 'haircut-beard',
    name: 'თმა + წვერი',
    duration: 75,
    price: 50,
    description: 'სრული პაკეტი – თმის შეჭრა და წვერი ერთ სეანსში',
  },
  {
    id: 'royal-shave',
    name: 'სამეფო პარსვა',
    duration: 30,
    price: 25,
    description: 'ცხელი პირსახოცით გაპარსვა პრემიუმ პროდუქტებით',
  },
  {
    id: 'hair-wash',
    name: 'რეცხვა და სტაილი',
    duration: 20,
    price: 15,
    description: 'ღრმა რეცხვა, კონდიცირება და პროფესიული სტაილი',
  },
  {
    id: 'hair-wax',
    name: 'ვაქსი და სტაილი',
    duration: 20,
    price: 15,
    description: 'სრულყოფის ვაქსი და სტაილინგი',
  },
  {
    id: 'kids-haircut',
    name: 'ბავშვის თმის შეჭრა',
    duration: 30,
    price: 25,
    description: 'ლმობიერი თმის შეჭრა ახალგაზრდა ჯენტლმენებისთვის (12 წლამდე)',
  },
]

export const SHOP_INFO = {
  name: 'Gentleman Barbershop',
  tagline: 'სიზუსტე. სტილი. ხასიათი.',
  address: 'St. Bidzina Kvernadzе 13',
  city: 'თბილისი, საქართველო',
  phone: '+995 514 40 00 10',
  email: 'gentlemantbilisi0@gmail.com',
  instagram: 'https://www.instagram.com/gentlemantbilisi/',
  facebook: 'https://www.facebook.com/gentlemantbilisi',
  hours: 'ორშ – კვი  ⏱  11:00 – 20:00',
  metro: 'ტექნიკური უნივერსიტეტის მეტრო',
  mapUrl: 'https://maps.google.com/?q=41.71896,44.78069',
  rating: '4.7',
  reviews: '19+',
  heroEyebrow: 'დაარსდა თბილისში, საქართველო',
  heroDescription: 'პრემიუმ სალონი თბილისში. პროფესიული სტრიჟკები, წვერის მოვლა და სტაილინგი გამოცდილ ოსტატთა გუნდისგან. ყოველ დღე ღიაა.',
  heroCtaPrimary: 'დაჯავშნე ვიზიტი',
  heroCtaSecondary: 'სერვისები',
}

export const WORKING_HOURS = {
  startHour: 11,
  endHour: 20,
}
