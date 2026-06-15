'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDelegate(eventId: string, formData: FormData) {
  const db = createServiceClient()
  const name = (formData.get('name') as string).trim()
  const color = (formData.get('color') as string | null) || null
  if (!name) return

  const { data: delegate, error } = await db
    .from('delegates')
    .insert({ event_id: eventId, name, color })
    .select('id')
    .single()

  if (error || !delegate) throw error

  const token = crypto.randomUUID()
  await db.from('tickets').insert({
    delegate_id: delegate.id,
    event_id: eventId,
    token,
  })

  revalidatePath(`/events/${eventId}`)
}

export async function addDelegatesBulk(
  eventId: string,
  rows: { name: string; color?: string | null }[]
) {
  const db = createServiceClient()
  const trimmed = rows.map(r => ({ ...r, name: r.name.trim() })).filter(r => r.name)
  if (!trimmed.length) return

  const { data: delegates, error } = await db
    .from('delegates')
    .insert(trimmed.map(({ name, color }) => ({ event_id: eventId, name, color: color ?? null })))
    .select('id')

  if (error || !delegates) throw error

  await db.from('tickets').insert(
    delegates.map(d => ({
      delegate_id: d.id,
      event_id: eventId,
      token: crypto.randomUUID(),
    }))
  )

  revalidatePath(`/events/${eventId}`)
}

export async function deleteDelegate(eventId: string, delegateId: string) {
  const db = createServiceClient()
  await db.from('delegates').delete().eq('id', delegateId)
  revalidatePath(`/events/${eventId}`)
}

export async function createScanner(eventId: string, formData: FormData) {
  const db = createServiceClient()
  const name = (formData.get('scanner_name') as string).trim()
  const username = (formData.get('scanner_username') as string).trim().toLowerCase()
  const password = (formData.get('scanner_password') as string)
  if (!name || !username || !password) return

  // Derive a synthetic internal email from the username
  const email = `${username}@scanner.pmscanner`

  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) throw authError

  await db.from('scanners').insert({
    event_id: eventId,
    name,
    username,
    email,
    auth_user_id: authData.user.id,
  })

  revalidatePath(`/events/${eventId}`)
}
