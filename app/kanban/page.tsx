'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BottomNav } from '@/components/BottomNav'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanCard, type KanbanCardData } from '@/components/kanban/KanbanCard'

const STATUSES = ['todo', 'in_progress', 'done'] as const
type Status = typeof STATUSES[number]

const STATUS_LABELS: Record<Status, string> = {
  todo: 'De Facut',
  in_progress: 'In Progres',
  done: 'Finalizat',
}

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

export default function KanbanPage() {
  const supabase = getSupabase()

  const [cards, setCards] = useState<KanbanCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCard, setNewCard] = useState({ title: '', description: '', status: 'todo' as Status })
  const [editCard, setEditCard] = useState<KanbanCardData | null>(null)
  const [editFields, setEditFields] = useState({ title: '', description: '' })
  const [filters, setFilters] = useState<Record<Status, string>>({
    todo: '',
    in_progress: '',
    done: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadCards = useCallback(async () => {
    const res = await fetch('/api/kanban')
    if (!res.ok) {
      console.error('Error loading cards')
      setLoading(false)
      return
    }
    const data: KanbanCardData[] = await res.json()
    setCards(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards' },
        () => { loadCards() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadCards])

  const getColumnCards = useCallback(
    (status: Status) => cards.filter(c => c.status === status),
    [cards]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeCard = cards.find(c => c.id === activeId)
    if (!activeCard) return

    let targetStatus: Status
    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status
    } else {
      const overCard = cards.find(c => c.id === overId)
      if (!overCard) return
      targetStatus = overCard.status
    }

    if (activeCard.status === targetStatus) return

    setCards(prev =>
      prev.map(c => c.id === activeId ? { ...c, status: targetStatus } : c)
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const card = cards.find(c => c.id === activeId)
    if (!card) return

    let targetStatus: Status = card.status
    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status
    } else {
      const overCard = cards.find(c => c.id === overId)
      if (overCard) targetStatus = overCard.status
    }

    const columnCards = cards.filter(c => c.status === targetStatus)
    const oldIndex = columnCards.findIndex(c => c.id === activeId)
    const newIndex = columnCards.findIndex(c => c.id === overId)

    let reordered = columnCards
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(columnCards, oldIndex, newIndex)
    }

    setCards(prev => {
      const others = prev.filter(c => c.status !== targetStatus)
      const updated = reordered.map((c, i) => ({
        ...c,
        status: targetStatus,
        position: i,
      }))
      return [...others, ...updated]
    })

    const res = await fetch(`/api/kanban/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: targetStatus,
        position: reordered.findIndex(c => c.id === activeId),
      }),
    })

    if (!res.ok) {
      console.error('Error updating card')
      loadCards()
    }
  }

  const createCard = async () => {
    if (!newCard.title.trim()) return

    const res = await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newCard.title.trim(),
        description: newCard.description.trim() || null,
        status: newCard.status,
      }),
    })

    if (!res.ok) {
      console.error('Error creating card')
      return
    }

    setNewCard({ title: '', description: '', status: 'todo' })
    setIsDialogOpen(false)
    loadCards()
  }

  const deleteCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))

    const res = await fetch(`/api/kanban/${cardId}`, { method: 'DELETE' })
    if (!res.ok) {
      console.error('Error deleting card')
      loadCards()
    }
  }

  const openEditDialog = (card: KanbanCardData) => {
    setEditCard(card)
    setEditFields({ title: card.title, description: card.description || '' })
  }

  const saveEdit = async () => {
    if (!editCard || !editFields.title.trim()) return

    const updates = {
      title: editFields.title.trim(),
      description: editFields.description.trim() || null,
    }

    setCards(prev =>
      prev.map(c => c.id === editCard.id ? { ...c, ...updates } : c)
    )
    setEditCard(null)

    const res = await fetch(`/api/kanban/${editCard.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      console.error('Error updating card')
      loadCards()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Se incarca...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kanban</h1>
            <p className="text-xs text-gray-500 mt-0.5">Gestioneaza taskurile echipei</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-1" />
                Card nou
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Card nou</DialogTitle>
                <DialogDescription>Adauga un task nou pe tabla Kanban.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Titlu *
                  </label>
                  <Input
                    placeholder="Introdu titlul"
                    value={newCard.title}
                    onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Descriere
                  </label>
                  <Textarea
                    placeholder="Descriere optionala"
                    value={newCard.description}
                    onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Coloana
                  </label>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                    value={newCard.status}
                    onChange={(e) => setNewCard(prev => ({ ...prev, status: e.target.value as Status }))}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={createCard} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Creeaza
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Anuleaza
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                cards={getColumnCards(status)}
                filter={filters[status]}
                onFilterChange={(val) => setFilters(prev => ({ ...prev, [status]: val }))}
                onDeleteCard={deleteCard}
                onEditCard={openEditDialog}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCard} onOpenChange={(open) => { if (!open) setEditCard(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editeaza card{editCard?.card_number ? ` #${editCard.card_number}` : ''}
            </DialogTitle>
            <DialogDescription>Modifica titlul sau descrierea cardului.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Titlu *
              </label>
              <Input
                placeholder="Introdu titlul"
                value={editFields.title}
                onChange={(e) => setEditFields(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Descriere
              </label>
              <Textarea
                placeholder="Descriere optionala"
                value={editFields.description}
                onChange={(e) => setEditFields(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveEdit} disabled={!editFields.title.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salveaza
              </Button>
              <Button variant="outline" onClick={() => setEditCard(null)} className="flex-1">
                Anuleaza
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}
