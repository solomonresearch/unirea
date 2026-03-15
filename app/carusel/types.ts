export type Scope = 'liceu' | 'promotie' | 'clasa'

export const SCOPE_LABELS: Record<Scope, string> = {
  liceu: 'Liceu',
  promotie: 'Promoție',
  clasa: 'Clasă',
}

export const SCOPE_DB_MAP: Record<Scope, string> = {
  liceu: 'school',
  promotie: 'promotion',
  clasa: 'class',
}

export interface CaruselComment {
  id: string
  post_id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string; username: string }
}

export interface CaruselPost {
  id: string
  caption: string | null
  image_url: string
  user_id: string
  profiles: { name: string; username: string }
  likes: number
  liked: boolean
  comments: CaruselComment[]
  created_at: string
  photo_date: string | null
  location_text: string | null
}

export function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3
}
