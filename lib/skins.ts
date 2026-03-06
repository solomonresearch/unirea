export type SkinId = 'clasic' | 'campus' | 'indigo' | 'terracotta' | 'forest'

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
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Rece, modern, albastru',
    swatchBg: '#F0F2F5',
    swatchAccent: '#5B6ABF',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    description: 'Cald, argilos, rustic',
    swatchBg: '#F5F0EA',
    swatchAccent: '#C8694A',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Verde, natural, proaspăt',
    swatchBg: '#F2F5F0',
    swatchAccent: '#4A8E5A',
  },
]

export const DEFAULT_SKIN: SkinId = 'campus'

export function isSkinId(value: string | null | undefined): value is SkinId {
  return SKINS.some(s => s.id === value)
}
