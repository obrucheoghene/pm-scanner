'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, X, ImagePlus } from 'lucide-react'
import { updateEvent } from '@/app/(organizer)/events/actions'
import type { Event } from '@/types'

interface Props {
  event: Event
}

export default function EditEventForm({ event }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<string | null>(event.image_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  function handleRemoveImage() {
    setPreview(null)
    setImageFile(null)
    setRemoveImage(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    setOpen(false)
    setPreview(event.image_url ?? null)
    setImageFile(null)
    setRemoveImage(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    if (imageFile) fd.set('image', imageFile)
    if (removeImage) fd.set('remove_image', '1')
    await updateEvent(event.id, fd)
    setPending(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition"
        title="Edit event"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-base">Edit event</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update event details</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event name *</label>
                <input
                  name="name"
                  required
                  defaultValue={event.name}
                  placeholder="e.g. Tech Summit 2026"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={event.date ?? ''}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue</label>
                  <input
                    name="venue"
                    defaultValue={event.venue ?? ''}
                    placeholder="e.g. City Hall"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event image <span className="text-gray-400 font-normal">(optional · used as invitation preview)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImage}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-indigo-400 transition-colors focus:outline-none focus:border-indigo-500"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Event preview" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-xs font-medium">Click to upload image</span>
                      <span className="text-xs text-gray-300">JPG, PNG, WebP · max 5 MB</span>
                    </div>
                  )}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {pending ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
