export type CircleKey = 'highschool' | 'location' | 'hobbies' | 'interests' | 'profession' | 'background'

export interface CircleConfig {
  label: string
  emoji: string
  color: string
  getDescription: (info: UserInfo) => string
}

export interface UserInfo {
  highschool: string
  graduation_year: number
  city: string
  country: string
  hobbies: string[]
  profession: string[]
  domain: string[]
  company: string | null
}

export interface CirclePosition {
  x: number
  y: number
  r: number
}

export interface IntersectionDot {
  x: number
  y: number
  circles: CircleKey[]
  color: string
  label: string
  key: string
}

export const CIRCLE_COLORS: Record<CircleKey, string> = {
  highschool: '#FF6B4A',
  location: '#4A9CFF',
  hobbies: '#2ECDA7',
  interests: '#E86BFF',
  profession: '#7B61FF',
  background: '#FFB84A',
}

export const CIRCLE_CONFIG: Record<CircleKey, CircleConfig> = {
  highschool: {
    label: 'Liceu',
    emoji: '🎓',
    color: '#FF6B4A',
    getDescription: (u) => `${u.highschool} '${String(u.graduation_year).slice(-2)}`,
  },
  location: {
    label: 'Oras (unde stai)',
    emoji: '📍',
    color: '#4A9CFF',
    getDescription: (u) => [u.city, u.country].filter(Boolean).join(', '),
  },
  hobbies: {
    label: 'Hobby-uri',
    emoji: '🧗',
    color: '#2ECDA7',
    getDescription: (u) => u.hobbies?.slice(0, 3).join(', ') || 'Adauga hobby-uri',
  },
  interests: {
    label: 'Interese',
    emoji: '🎵',
    color: '#E86BFF',
    getDescription: (u) => u.domain?.slice(0, 3).join(', ') || 'Adauga interese',
  },
  profession: {
    label: 'Profesie',
    emoji: '💼',
    color: '#7B61FF',
    getDescription: (u) => u.profession?.slice(0, 3).join(', ') || 'Adauga profesii',
  },
  background: {
    label: 'Domeniu',
    emoji: '🏛️',
    color: '#FFB84A',
    getDescription: (u) => [u.company, ...(u.domain || [])].filter(Boolean).slice(0, 3).join(', ') || 'Adauga background',
  },
}

export const ALL_CIRCLES: CircleKey[] = ['highschool', 'location', 'hobbies', 'profession', 'background']

export const ALL_POSITIONS: CirclePosition[] = [
  { x: 0.50, y: 0.22, r: 0.22 },   // highschool  — top
  { x: 0.77, y: 0.37, r: 0.22 },   // location    — top-right
  { x: 0.67, y: 0.72, r: 0.22 },   // hobbies     — bottom-right
  { x: 0.33, y: 0.72, r: 0.22 },   // profession  — bottom-left
  { x: 0.23, y: 0.37, r: 0.22 },   // background  — top-left
]

export const ALL_DOTS: IntersectionDot[] = [
  // Adjacent pairs (edges of pentagon), pulled toward center
  { x: 0.60, y: 0.27, circles: ['highschool', 'location'], color: '#FF8F4A', label: 'Colegi din oras', key: 'hs_location' },
  { x: 0.70, y: 0.50, circles: ['location', 'hobbies'], color: '#2ECDA7', label: 'Vecini cu hobby-uri', key: 'location_hobbies' },
  { x: 0.50, y: 0.70, circles: ['hobbies', 'profession'], color: '#5C94D4', label: 'Hobby-uri & profesie', key: 'hobbies_profession' },
  { x: 0.30, y: 0.50, circles: ['profession', 'background'], color: '#9B7BFF', label: 'Aceeasi cariera', key: 'profession_background' },
  { x: 0.40, y: 0.27, circles: ['background', 'highschool'], color: '#FFB84A', label: 'Colegi din domeniu', key: 'background_hs' },
  // Multi-circle intersections near center
  { x: 0.55, y: 0.40, circles: ['highschool', 'location', 'hobbies'], color: '#FFD700', label: 'Cercul interior', key: 'hs_location_hobbies' },
  { x: 0.45, y: 0.40, circles: ['highschool', 'background', 'profession'], color: '#FFD700', label: 'Retea puternica', key: 'hs_background_profession' },
]
