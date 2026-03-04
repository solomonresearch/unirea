export type SkinId = 'clasic' | 'campus'

export interface Skin {
  id: SkinId
  name: string
  description: string
  swatchBg: string
  swatchAccent: string
}

export const SKINS: Skin[] = [
  {
    id: 'clasic',
    name: 'Clasic',
    description: 'Design-ul original',
    swatchBg: '#ffffff',
    swatchAccent: '#7E191B',
  },
  {
    id: 'campus',
    name: 'Campus',
    description: 'Cald, modern, auriu',
    swatchBg: '#F7F3EC',
    swatchAccent: '#E8963A',
  },
]

export const DEFAULT_SKIN: SkinId = 'campus'

export function isSkinId(value: string | null | undefined): value is SkinId {
  return SKINS.some(s => s.id === value)
}
