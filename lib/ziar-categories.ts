export const ZIAR_CATEGORIES = [
  { value: 'stiri', label: 'Stiri', color: 'bg-blue-100 text-blue-700' },
  { value: 'anunt', label: 'Anunt', color: 'bg-amber-100 text-amber-700' },
  { value: 'apel', label: 'Apel', color: 'bg-red-100 text-red-700' },
  { value: 'vand', label: 'Vand', color: 'bg-green-100 text-green-700' },
  { value: 'cumpar', label: 'Cumpar', color: 'bg-purple-100 text-purple-700' },
] as const

export type ZiarCategory = typeof ZIAR_CATEGORIES[number]['value']

export const VALID_CATEGORIES: string[] = ZIAR_CATEGORIES.map(c => c.value)
