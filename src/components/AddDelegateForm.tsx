'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { addDelegate, addDelegatesBulk } from '@/app/(organizer)/events/[id]/actions'

const PALETTE = [
  { label: 'Default', hex: '' },
  { label: 'Red', hex: '#e11d48' },
  { label: 'Rose', hex: '#f43f5e' },
  { label: 'Pink', hex: '#ec4899' },
  { label: 'Orange', hex: '#ea580c' },
  { label: 'Amber', hex: '#d97706' },
  { label: 'Yellow', hex: '#ca8a04' },
  { label: 'Lime', hex: '#65a30d' },
  { label: 'Green', hex: '#16a34a' },
  { label: 'Teal', hex: '#0d9488' },
  { label: 'Cyan', hex: '#0891b2' },
  { label: 'Blue', hex: '#2563eb' },
  { label: 'Indigo', hex: '#4f46e5' },
  { label: 'Purple', hex: '#9333ea' },
  { label: 'Fuchsia', hex: '#c026d3' },
]

export default function AddDelegateForm({ eventId }: { eventId: string }) {
  const [pending, setPending] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function downloadTemplate() {
    const colors = PALETTE.filter(p => p.hex).map(p => p.label)
    const csv = [
      'name,color',
      'Alice Smith,Red',
      'Bob Jones,Blue',
      `Carol White,${colors[3] ?? 'Green'}`,
      'David Lee,',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'delegates-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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
        const rows = result.data
          .map(row => {
            const name = (row.name ?? row.Name ?? Object.values(row)[0] ?? '').trim()
            const rawColor = (row.color ?? row.Color ?? '').trim()
            const color = rawColor
              ? (PALETTE.find(p => p.label.toLowerCase() === rawColor.toLowerCase())?.hex
                  ?? (/^#[0-9a-f]{3,6}$/i.test(rawColor) ? rawColor : null))
              : null
            return { name, color: color ?? null }
          })
          .filter(r => r.name)
        await addDelegatesBulk(eventId, rows)
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
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
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

      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <span>or</span>
        <label className="cursor-pointer text-black underline underline-offset-2 hover:text-gray-700">
          Upload CSV
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        </label>
        <span className="text-gray-400">(columns: name, color — color optional)</span>
        <span className="text-gray-300">·</span>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          Download template
        </button>
      </div>
    </div>
  )
}
