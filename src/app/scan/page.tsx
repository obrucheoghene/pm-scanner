import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRScanner from '@/components/QRScanner'
import type { Scanner } from '@/types'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/scanner-login')

  const db = createServiceClient()
  const { data: scanner } = await db
    .from('scanners')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!scanner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-center px-6">
        <div>
          <p className="text-xl font-bold mb-2">Not authorized</p>
          <p className="text-gray-400 text-sm">Your account is not linked to any event.</p>
        </div>
      </div>
    )
  }

  return <QRScanner scannerId={(scanner as Scanner).id} />
}
