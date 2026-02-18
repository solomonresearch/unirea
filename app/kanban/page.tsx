'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  position: number;
  created_at: string;
  updated_at: string;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-50' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'done', title: 'Done', color: 'bg-green-50' }
] as const;

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCard, setNewCard] = useState({ title: '', description: '', status: 'todo' as const });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const supabase = getSupabase();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async () => {
    if (!newCard.title.trim()) return;

    try {
      const maxPosition = Math.max(
        ...cards
          .filter(card => card.status === newCard.status)
          .map(card => card.position),
        0
      );

      const { error } = await supabase
        .from('kanban_cards')
        .insert({
          title: newCard.title.trim(),
          description: newCard.description.trim() || null,
          status: newCard.status,
          position: maxPosition + 1
        });

      if (error) throw error;

      setNewCard({ title: '', description: '', status: 'todo' });
      setIsDialogOpen(false);
      loadCards();
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const moveCard = async (cardId: string, direction: 'left' | 'right') => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const currentIndex = COLUMNS.findIndex(col => col.id === card.status);
    let newStatus: typeof card.status;

    if (direction === 'left' && currentIndex > 0) {
      newStatus = COLUMNS[currentIndex - 1].id;
    } else if (direction === 'right' && currentIndex < COLUMNS.length - 1) {
      newStatus = COLUMNS[currentIndex + 1].id;
    } else {
      return; // Can't move further
    }

    try {
      const maxPosition = Math.max(
        ...cards
          .filter(c => c.status === newStatus)
          .map(c => c.position),
        0
      );

      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          status: newStatus,
          position: maxPosition + 1
        })
        .eq('id', cardId);

      if (error) throw error;
      loadCards();
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const getCardsForColumn = (status: string) => {
    return cards.filter(card => card.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600 mt-2">Simple project management</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Card</DialogTitle>
                <DialogDescription>
                  Add a new task to the kanban board.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Title *
                  </label>
                  <Input
                    placeholder="Enter card title"
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Description
                  </label>
                  <Textarea
                    placeholder="Enter card description (optional)"
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Column
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newCard.status}
                    onChange={(e) => setNewCard({ ...newCard, status: e.target.value as any })}
                  >
                    {COLUMNS.map(column => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={createCard} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Create Card
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map(column => (
            <div key={column.id} className={`${column.color} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{column.title}</h2>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                  {getCardsForColumn(column.id).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {getCardsForColumn(column.id).map(card => (
                  <Card key={card.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      {card.description && (
                        <CardDescription className="text-xs text-gray-600 line-clamp-2">
                          {card.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {column.id !== 'todo' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveCard(card.id, 'left')}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </Button>
                          )}
                          {column.id !== 'done' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveCard(card.id, 'right')}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCard(card.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {getCardsForColumn(column.id).length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No cards in this column
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}