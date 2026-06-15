import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ORGANIZER_EMAIL) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 group">
            <Image src="/logo.svg" alt="Prime Scanner" width={30} height={30} className="rounded-lg" />
            <span className="font-bold text-base tracking-tight">
              Prime <span className="text-indigo-600">Scanner</span>
            </span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
