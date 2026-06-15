'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EventStatus } from '@/types'

export async function createEvent(formData: FormData) {
  const db = createServiceClient()
  const name = formData.get('name') as string
  const date = (formData.get('date') as string) || null
  const venue = (formData.get('venue') as string) || null

  await db.from('events').insert({ name, date, venue })
  revalidatePath('/events')
}

export async function updateEventStatus(id: string, status: EventStatus) {
  const db = createServiceClient()
  await db.from('events').update({ status }).eq('id', id)
  revalidatePath('/events')
}

export async function deleteEvent(id: string) {
  const db = createServiceClient()
  await db.from('events').delete().eq('id', id)
  revalidatePath('/events')
}
