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
    label: 'Locatie',
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
    label: 'Background',
    emoji: '🏛️',
    color: '#FFB84A',
    getDescription: (u) => [u.company, ...(u.domain || [])].filter(Boolean).slice(0, 3).join(', ') || 'Adauga background',
  },
}

export const ALL_CIRCLES: CircleKey[] = ['highschool', 'location', 'hobbies', 'interests', 'profession', 'background']

export const ALL_POSITIONS: CirclePosition[] = [
  { x: 0.22, y: 0.32, r: 0.30 },
  { x: 0.46, y: 0.28, r: 0.30 },
  { x: 0.72, y: 0.34, r: 0.26 },
  { x: 0.28, y: 0.66, r: 0.26 },
  { x: 0.54, y: 0.70, r: 0.30 },
  { x: 0.78, y: 0.64, r: 0.26 },
]

export const ALL_DOTS: IntersectionDot[] = [
  { x: 0.34, y: 0.30, circles: ['highschool', 'location'], color: '#FF8F4A', label: 'Colegi din oras', key: 'hs_location' },
  { x: 0.47, y: 0.33, circles: ['highschool', 'hobbies'], color: '#FF6B4A', label: 'Colegi cu hobby-uri', key: 'hs_hobbies' },
  { x: 0.59, y: 0.31, circles: ['location', 'hobbies'], color: '#2ECDA7', label: 'Vecini cu hobby-uri', key: 'location_hobbies' },
  { x: 0.37, y: 0.47, circles: ['location', 'interests'], color: '#E86BFF', label: 'Vecini cu interese', key: 'location_interests' },
  { x: 0.50, y: 0.50, circles: ['hobbies', 'interests'], color: '#6BE8CC', label: 'Hobby-uri + Interese', key: 'hobbies_interests' },
  { x: 0.38, y: 0.42, circles: ['highschool', 'location', 'hobbies'], color: '#FFD700', label: 'Cercul interior', key: 'hs_location_hobbies' },
  { x: 0.38, y: 0.51, circles: ['highschool', 'profession'], color: '#7B61FF', label: 'Colegi in acelasi domeniu', key: 'hs_profession' },
  { x: 0.50, y: 0.49, circles: ['location', 'profession'], color: '#4A9CFF', label: 'Colegi locali', key: 'location_profession' },
  { x: 0.63, y: 0.49, circles: ['location', 'background'], color: '#FFB84A', label: 'Vecini cu background', key: 'location_background' },
  { x: 0.66, y: 0.67, circles: ['profession', 'background'], color: '#9B7BFF', label: 'Aceeasi cariera', key: 'profession_background' },
  { x: 0.41, y: 0.43, circles: ['highschool', 'location', 'profession'], color: '#FFD700', label: 'Retea puternica', key: 'hs_location_profession' },
]
