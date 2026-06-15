'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EventStatus } from '@/types'

export async function createEvent(formData: FormData) {
  const db = createServiceClient()
  const name = formData.get('name') as string
  const date = (formData.get('date') as string) || null
  const venue = (formData.get('venue') as string) || null

  let image_url: string | null = null
  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    const bytes = Buffer.from(await imageFile.arrayBuffer())
    const ext = (imageFile.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${crypto.randomUUID()}.${ext}`
    await db.storage.from('event-images').upload(path, bytes, { contentType: imageFile.type })
    image_url = db.storage.from('event-images').getPublicUrl(path).data.publicUrl
  }

  await db.from('events').insert({ name, date, venue, image_url })
  revalidatePath('/events')
}

export async function updateEventStatus(id: string, status: EventStatus) {
  const db = createServiceClient()
  await db.from('events').update({ status }).eq('id', id)
  revalidatePath('/events')
}

export async function updateEvent(id: string, formData: FormData) {
  const db = createServiceClient()
  const name = formData.get('name') as string
  const date = (formData.get('date') as string) || null
  const venue = (formData.get('venue') as string) || null

  const removeImage = formData.get('remove_image') === '1'
  const imageFile = formData.get('image') as File | null

  const patch: Record<string, unknown> = { name, date, venue }
  if (removeImage) {
    patch.image_url = null
  } else if (imageFile && imageFile.size > 0) {
    const bytes = Buffer.from(await imageFile.arrayBuffer())
    const ext = (imageFile.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${crypto.randomUUID()}.${ext}`
    await db.storage.from('event-images').upload(path, bytes, { contentType: imageFile.type })
    patch.image_url = db.storage.from('event-images').getPublicUrl(path).data.publicUrl
  }

  await db.from('events').update(patch).eq('id', id)
  revalidatePath(`/events/${id}`)
  revalidatePath('/events')
}

export async function deleteEvent(id: string) {
  const db = createServiceClient()
  await db.from('events').delete().eq('id', id)
  revalidatePath('/events')
}
