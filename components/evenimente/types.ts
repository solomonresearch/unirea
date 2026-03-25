export type EvenimentScope = 'class' | 'promotion' | 'school'

export interface EvenimentParticipant {
  id: string
  name: string
  avatar_url: string | null
}

export interface Eveniment {
  id: string
  title: string
  event_date: string
  event_time: string | null
  location: string | null
  scope: EvenimentScope
  image_storage_path: string | null
  image_url: string | null
  participant_count: number
  attending: boolean
  top_participants: EvenimentParticipant[]
  user_id: string
  created_at: string
}

export interface EvenimentComment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string; username: string; avatar_url: string | null }
}

export interface EvenimentDetail extends Eveniment {
  description: string | null
  participants: EvenimentParticipant[]
  comments: EvenimentComment[]
}
