'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function ScannerLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const email = `${username.trim().toLowerCase()}@scanner.pmscanner`
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid username or password')
      setLoading(false)
      return
    }
    router.push('/scan')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/10">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Prime Scanner" width={32} height={32} className="rounded-lg" />
          <span className="text-white font-semibold text-lg tracking-tight">Prime Scanner</span>
        </div>

        <div>
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Prime Scanner" width={80} height={80} className="rounded-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Ready to<br />scan tickets.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Sign in with your scanner credentials to start checking in delegates at the door.
          </p>
        </div>

        <p className="text-gray-600 text-xs">Staff access only · Prime Scanner</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Prime Scanner" width={32} height={32} className="rounded-lg" />
            <span className="text-white font-semibold text-lg tracking-tight">Prime Scanner</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Scanner login</h2>
          <p className="text-sm text-gray-400 mb-8">Staff check-in app</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="yourname"
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
