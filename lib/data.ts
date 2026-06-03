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
    title: 'Senior Stylist',
    experience: '9+ Years',
    speciality: 'Classic & Modern Cuts',
    bio: 'With over 9 years of experience, Mariam delivers precision cuts and personalized styling that keeps clients coming back.',
    calendarEnvKey: 'CALENDAR_ID_MARIAM',
  },
  {
    id: 'george',
    name: 'George',
    title: 'Beard Specialist',
    experience: '5+ Years',
    speciality: 'Beard Grooming & Shaping',
    bio: 'George is our resident beard specialist, transforming every beard into a sharp statement of style.',
    calendarEnvKey: 'CALENDAR_ID_GEORGE',
  },
  {
    id: 'nabi',
    name: 'Nabi',
    title: 'Stylist',
    experience: '4+ Years',
    speciality: 'Contemporary Styles',
    bio: 'Nabi brings a fresh perspective to modern barbering with expertise in the latest cuts and trends.',
    calendarEnvKey: 'CALENDAR_ID_NABI',
  },
  {
    id: 'raoul',
    name: 'Raoul',
    title: 'Barber',
    experience: '3+ Years',
    speciality: 'Clean Fades & Tapers',
    bio: 'Raoul specializes in precise fades and tapers that give every client a clean, confident look.',
    calendarEnvKey: 'CALENDAR_ID_RAOUL',
  },
  {
    id: 'sida',
    name: 'Sida',
    title: 'Barber',
    experience: '3+ Years',
    speciality: 'Styling & Grooming',
    bio: 'Sida combines technical precision with an eye for detail to deliver exceptional grooming experiences.',
    calendarEnvKey: 'CALENDAR_ID_SIDA',
  },
]

export const SERVICES: Service[] = [
  {
    id: 'haircut',
    name: 'Haircut',
    duration: 45,
    price: 35,
    description: 'Classic or modern haircut tailored to your style',
  },
  {
    id: 'beard-trim',
    name: 'Beard Trim',
    duration: 30,
    price: 20,
    description: 'Precision beard shaping and trimming',
  },
  {
    id: 'haircut-beard',
    name: 'Haircut + Beard',
    duration: 75,
    price: 50,
    description: 'Full grooming package — haircut and beard in one session',
  },
  {
    id: 'royal-shave',
    name: 'Royal Shave',
    duration: 30,
    price: 25,
    description: 'Hot towel straight razor shave with premium products',
  },
  {
    id: 'hair-wash',
    name: 'Wash & Style',
    duration: 20,
    price: 15,
    description: 'Deep wash, condition, and professional styling',
  },
  {
    id: 'hair-wax',
    name: 'Wax & Styling',
    duration: 20,
    price: 15,
    description: 'Finishing wax and styling treatment',
  },
  {
    id: 'kids-haircut',
    name: 'Kids Haircut',
    duration: 30,
    price: 25,
    description: 'Gentle haircut for the young gentlemen (under 12)',
  },
]

export const SHOP_INFO = {
  name: 'Gentleman Barbershop',
  tagline: 'Precision. Style. Character.',
  address: 'St. Bidzina Kvernadze 13',
  city: 'Tbilisi, Georgia',
  phone: '+995 514 40 00 10',
  email: 'gentlemantbilisi0@gmail.com',
  instagram: 'https://www.instagram.com/gentlemantbilisi/',
  facebook: 'https://www.facebook.com/gentlemantbilisi',
  hours: 'Mon – Sun  ·  11:00 – 20:00',
  metro: 'Technical University Metro',
  mapUrl: 'https://maps.google.com/?q=41.71896,44.78069',
  rating: '4.7',
  reviews: '19+',
}

export const WORKING_HOURS = {
  startHour: 11,
  endHour: 20,
}
