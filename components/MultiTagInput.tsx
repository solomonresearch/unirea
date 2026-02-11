'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'

interface MultiTagInputProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  icon: React.ReactNode
}

export function MultiTagInput({ options, selected, onChange, placeholder, icon }: MultiTagInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(
    o => !selected.includes(o) && o.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addTag(tag: string) {
    onChange([...selected, tag])
    setSearch('')
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(selected.filter(t => t !== tag))
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
        className={`flex flex-wrap items-center gap-1.5 w-full rounded-lg border px-2 py-1.5 min-h-[42px] cursor-text transition-colors ${
          open ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-300'
        }`}
      >
        <div className="flex-shrink-0 text-gray-400 pl-0.5">
          {icon}
        </div>

        {selected.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-xs font-medium text-primary-700"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag) }}
              className="hover:text-primary-900 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent py-0.5"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">
                {search ? 'Niciun rezultat' : 'Toate selectate'}
              </li>
            )}
            {filtered.slice(0, 50).map(option => (
              <li
                key={option}
                onClick={() => addTag(option)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 text-gray-700"
              >
                {option}
              </li>
            ))}
            {filtered.length > 50 && (
              <li className="px-3 py-2 text-xs text-gray-400 text-center">
                Scrie pentru a filtra mai multe...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
