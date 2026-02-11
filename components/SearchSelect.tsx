'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface SearchSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  icon: React.ReactNode
  required?: boolean
}

export function SearchSelect({ options, value, onChange, placeholder, disabled, icon, required }: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

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

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Hidden input for form validation */}
      {required && <input type="text" required value={value} className="sr-only" tabIndex={-1} onChange={() => {}} />}

      <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10">
        {icon}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(!open) }}
        className={`w-full rounded-lg border border-gray-300 pl-9 pr-8 py-2.5 text-sm text-left focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white ${disabled ? 'opacity-50' : ''} ${!value ? 'text-gray-400' : 'text-gray-900'}`}
      >
        {value || placeholder}
      </button>
      <ChevronDown size={14} className={`absolute right-3 top-3 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.length > 8 && (
            <div className="relative border-b border-gray-100 p-2">
              <Search size={14} className="absolute left-4 top-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cauta..."
                className="w-full rounded-md border border-gray-200 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary-500"
              />
            </div>
          )}
          <ul className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">Niciun rezultat</li>
            )}
            {filtered.map(option => (
              <li
                key={option}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                  setSearch('')
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${option === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
