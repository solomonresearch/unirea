'use client'

import { useState } from 'react'
import { Camera, Heart, MessageCircle, Send, X, ChevronLeft, Plus, Image as ImageIcon } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'

interface MockPhoto {
  id: string
  imageUrl: string
  caption: string
  author: string
  authorAvatar: string
  likes: number
  liked: boolean
  comments: { author: string; text: string }[]
  date: string
  rotation: number
}

const MOCK_PHOTOS: MockPhoto[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=400&fit=crop',
    caption: 'Ultimul nostru bal de absolvire. Ce vremuri!',
    author: 'Maria Popescu',
    authorAvatar: 'MP',
    likes: 24,
    liked: false,
    comments: [
      { author: 'Andrei Ion', text: 'Ce frumos era!' },
      { author: 'Elena Radu', text: 'Imi lipsesc acele zile...' },
    ],
    date: 'Dec 2019',
    rotation: -3,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=400&fit=crop',
    caption: 'Excursia la munte cu toata clasa',
    author: 'Andrei Ion',
    authorAvatar: 'AI',
    likes: 18,
    liked: true,
    comments: [
      { author: 'Maria Popescu', text: 'Cel mai fain drum!' },
    ],
    date: 'Mai 2018',
    rotation: 2,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=400&fit=crop',
    caption: 'Prima zi de liceu. Eram asa de mici!',
    author: 'Elena Radu',
    authorAvatar: 'ER',
    likes: 31,
    liked: false,
    comments: [
      { author: 'Andrei Ion', text: 'Haha, uite ce fete aveam!' },
      { author: 'Maria Popescu', text: 'Nostalgie maxima' },
      { author: 'Dan Mihai', text: 'Pe bune, pare ca a fost ieri' },
    ],
    date: 'Sep 2015',
    rotation: -1,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop',
    caption: 'Ora de sport. Mereu era haos total.',
    author: 'Dan Mihai',
    authorAvatar: 'DM',
    likes: 15,
    liked: false,
    comments: [
      { author: 'Elena Radu', text: 'Imi amintesc ca mereu fugea mingea pe geam' },
    ],
    date: 'Oct 2017',
    rotation: 3,
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=400&fit=crop',
    caption: 'Serbarea de Craciun din clasa a 10-a',
    author: 'Maria Popescu',
    authorAvatar: 'MP',
    likes: 42,
    liked: true,
    comments: [
      { author: 'Dan Mihai', text: 'Cel mai bun Craciun ever' },
      { author: 'Andrei Ion', text: 'Cine a facut tortul ala?' },
    ],
    date: 'Dec 2016',
    rotation: -2,
  },
]

export default function CaruselPage() {
  const [photos, setPhotos] = useState(MOCK_PHOTOS)
  const [selectedPhoto, setSelectedPhoto] = useState<MockPhoto | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [commentText, setCommentText] = useState('')

  function toggleLike(photoId: string) {
    setPhotos(prev =>
      prev.map(p =>
        p.id === photoId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev =>
        prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev
      )
    }
  }

  function addComment(photoId: string) {
    if (!commentText.trim()) return
    const newComment = { author: 'Tu', text: commentText.trim() }
    setPhotos(prev =>
      prev.map(p =>
        p.id === photoId
          ? { ...p, comments: [...p.comments, newComment] }
          : p
      )
    )
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
      )
    }
    setCommentText('')
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Carusel</h1>
            <p className="text-xs text-gray-400">Amintiri din liceu</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            <Plus size={14} />
            Adauga
          </button>
        </div>

        {/* Polaroid Carousel */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Amintiri recente
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="snap-center flex-shrink-0 w-44 bg-white rounded-sm p-2 pb-8 shadow-md border border-gray-100 transition-transform hover:scale-105"
                style={{ transform: `rotate(${photo.rotation}deg)` }}
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="h-full w-full object-cover sepia-[.3]"
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-600 truncate text-left">
                  {photo.caption}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 text-left">{photo.date}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Activitate
          </h2>
          <div className="space-y-3">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <button
                  onClick={() => setSelectedPhoto(photo)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="h-full w-full object-cover sepia-[.2]"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[8px] font-bold text-primary-700">
                      {photo.authorAvatar}
                    </div>
                    <span className="text-xs font-medium text-gray-900">{photo.author}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{photo.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{photo.caption}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(photo.id)}
                      className="flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <Heart
                        size={13}
                        className={photo.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                      />
                      <span className={photo.liked ? 'text-red-500' : 'text-gray-400'}>
                        {photo.likes}
                      </span>
                    </button>
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="flex items-center gap-1 text-[11px] text-gray-400"
                    >
                      <MessageCircle size={13} />
                      <span>{photo.comments.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add memory prompt */}
        <button
          onClick={() => setShowUpload(true)}
          className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Camera size={24} className="text-primary-700" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Distribuie o amintire</p>
            <p className="text-xs text-gray-400 mt-1">
              Incarca o fotografie din anii de liceu
            </p>
          </div>
        </button>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col">
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => { setSelectedPhoto(null); setCommentText('') }}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={18} />
                Inapoi
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                  {selectedPhoto.authorAvatar}
                </div>
                <span className="text-xs font-medium text-gray-900">{selectedPhoto.author}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-sm px-4 py-4">
                <div className="w-full overflow-hidden rounded-lg">
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.caption}
                    className="w-full object-cover sepia-[.2]"
                  />
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(selectedPhoto.id)}
                    className="flex items-center gap-1.5 transition-colors"
                  >
                    <Heart
                      size={20}
                      className={selectedPhoto.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                    />
                    <span className={`text-sm ${selectedPhoto.liked ? 'text-red-500' : 'text-gray-500'}`}>
                      {selectedPhoto.likes}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageCircle size={20} />
                    <span className="text-sm">{selectedPhoto.comments.length}</span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-900">{selectedPhoto.caption}</p>
                <p className="mt-1 text-xs text-gray-400">{selectedPhoto.date}</p>

                {/* Comments */}
                <div className="mt-4 space-y-3 pb-4">
                  {selectedPhoto.comments.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-500">
                        {c.author.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-900">{c.author}</span>
                        <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="mx-auto max-w-sm flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addComment(selectedPhoto.id) }}
                  placeholder="Scrie un comentariu..."
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <button
                  onClick={() => addComment(selectedPhoto.id)}
                  disabled={!commentText.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Amintire noua</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <button className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
              <ImageIcon size={32} className="text-gray-400" />
              <p className="text-sm text-gray-500">Alege o fotografie</p>
            </button>

            <div className="mt-4">
              <textarea
                placeholder="Povesteste despre aceasta amintire..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <button
              onClick={() => setShowUpload(false)}
              className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Distribuie amintirea
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
