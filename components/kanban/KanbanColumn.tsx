'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Search } from 'lucide-react'
import { KanbanCard, type KanbanCardData } from './KanbanCard'

const COLUMN_CONFIG = {
  todo: {
    label: 'De Facut',
    headerBg: 'bg-gray-100',
    headerText: 'text-gray-700',
    bodyBg: 'bg-gray-50/50',
    empty: 'Niciun card in aceasta coloana',
  },
  in_progress: {
    label: 'In Progres',
    headerBg: 'bg-blue-100',
    headerText: 'text-blue-700',
    bodyBg: 'bg-blue-50/30',
    empty: 'Niciun card in progres',
  },
  done: {
    label: 'Finalizat',
    headerBg: 'bg-green-100',
    headerText: 'text-green-700',
    bodyBg: 'bg-green-50/30',
    empty: 'Niciun card finalizat',
  },
} as const

interface KanbanColumnProps {
  status: 'todo' | 'in_progress' | 'done'
  cards: KanbanCardData[]
  filter: string
  onFilterChange: (value: string) => void
  onDeleteCard: (id: string) => void
}

export function KanbanColumn({ status, cards, filter, onFilterChange, onDeleteCard }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status })
  const config = COLUMN_CONFIG[status]
  const isCompact = status === 'done'

  const filteredCards = cards.filter(card => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      card.title.toLowerCase().includes(q) ||
      (card.description?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className={`rounded-xl ${config.bodyBg} flex flex-col min-h-[200px]`}>
      <div className={`${config.headerBg} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
        <h2 className={`text-sm font-semibold ${config.headerText}`}>{config.label}</h2>
        <span className={`text-xs font-medium ${config.headerText} bg-white/60 px-2 py-0.5 rounded-full`}>
          {filteredCards.length}
        </span>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filtreaza..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 px-3 pb-3 pt-2">
        <SortableContext items={filteredCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredCards.map(card => (
              <KanbanCard
                key={card.id}
                card={card}
                compact={isCompact}
                onDelete={onDeleteCard}
              />
            ))}
          </div>
        </SortableContext>

        {filteredCards.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">{config.empty}</p>
        )}
      </div>
    </div>
  )
}
