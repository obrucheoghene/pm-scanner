'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { addDelegate, addDelegatesBulk } from '@/app/(organizer)/events/[id]/actions'

const PALETTE = [
  { label: 'Default', hex: '' },
  { label: 'Red', hex: '#e11d48' },
  { label: 'Blue', hex: '#2563eb' },
  { label: 'Green', hex: '#16a34a' },
  { label: 'Purple', hex: '#9333ea' },
  { label: 'Orange', hex: '#ea580c' },
  { label: 'Teal', hex: '#0d9488' },
]

export default function AddDelegateForm({ eventId }: { eventId: string }) {
  const [pending, setPending] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSingle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    await addDelegate(eventId, new FormData(e.currentTarget))
    formRef.current?.reset()
    setSelectedColor('')
    setPending(false)
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPending(true)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async result => {
        const names = result.data
          .map(row => row.name ?? row.Name ?? Object.values(row)[0] ?? '')
          .filter(Boolean)
        await addDelegatesBulk(eventId, names)
        setPending(false)
        if (fileRef.current) fileRef.current.value = ''
      },
    })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-sm">Add delegates</h3>
      <form ref={formRef} onSubmit={handleSingle} className="space-y-2">
        <div className="flex gap-2">
          <input
            name="name"
            required
            placeholder="Delegate name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? '…' : 'Add'}
          </button>
        </div>

        {/* Color swatch picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Group color:</span>
          {PALETTE.map(({ label, hex }) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => setSelectedColor(hex)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                selectedColor === hex
                  ? 'border-black scale-125'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: hex || '#111111' }}
            />
          ))}
        </div>

        {/* Hidden color input submitted with the form */}
        <input type="hidden" name="color" value={selectedColor} />
      </form>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>or</span>
        <label className="cursor-pointer text-black underline underline-offset-2 hover:text-gray-700">
          Upload CSV
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        </label>
        <span className="text-gray-400">(must have a "name" column)</span>
      </div>
    </div>
  )
}
