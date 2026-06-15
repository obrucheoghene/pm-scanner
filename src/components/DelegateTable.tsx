'use client'

import { useState } from 'react'
import type { Delegate, Ticket, ScanLog } from '@/types'
import { ticketUrl } from '@/lib/qr'
import { deleteDelegate } from '@/app/(organizer)/events/[id]/actions'
import { createClient } from '@/lib/supabase/client'

interface Row {
  delegate: Delegate
  ticket: Ticket
}

interface Props {
  rows: Row[]
  eventId: string
}

export default function DelegateTable({ rows, eventId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, ScanLog[]>>({})

  async function toggleExpand(delegateId: string, ticketId: string) {
    if (expanded === delegateId) {
      setExpanded(null)
      return
    }
    setExpanded(delegateId)
    if (!logs[delegateId]) {
      const supabase = createClient()
      const { data } = await supabase
        .from('scan_logs')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('scanned_at', { ascending: false })
      setLogs(prev => ({ ...prev, [delegateId]: data ?? [] }))
    }
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(ticketUrl(token))
  }

  function qrUrl(token: string, color: string | null, size = 300) {
    const params = new URLSearchParams({ token, size: String(size) })
    if (color) params.set('color', color)
    return `/api/qr?${params}`
  }

  async function downloadQR(token: string, name: string, color: string | null) {
    const res = await fetch(qrUrl(token, color))
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-qr.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportCSV() {
    const lines = [
      ['Name', 'Token', 'Link', 'Status', 'Scan Count', 'Checked In At'],
      ...rows.map(({ delegate, ticket }) => [
        delegate.name,
        ticket.token,
        ticketUrl(ticket.token),
        ticket.status,
        String(ticket.scan_count),
        ticket.checked_in_at ?? '',
      ]),
    ]
    const csv = lines.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'delegates.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPDF() {
    const res = await fetch(`/api/badges?eventId=${encodeURIComponent(eventId)}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'badges.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!rows.length) {
    return <p className="text-sm text-gray-400">No delegates yet.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-end">
        <button
          onClick={exportCSV}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          Export CSV
        </button>
        <button
          onClick={downloadPDF}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          Download badges PDF
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">QR</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Scans</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ delegate, ticket }) => (
              <>
                <tr
                  key={delegate.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpand(delegate.id, ticket.id)}
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {delegate.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: delegate.color }}
                        />
                      )}
                      {delegate.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl(ticket.token, delegate.color, 60)}
                      alt="QR"
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.status === 'checked_in' ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Checked in
                        {ticket.checked_in_at && (
                          <span className="text-gray-400 text-xs ml-1">
                            {new Date(ticket.checked_in_at).toLocaleTimeString()}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not checked in</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {ticket.scan_count}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => copyLink(ticket.token)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Copy link
                      </button>
                      <button
                        onClick={() => downloadQR(ticket.token, delegate.name, delegate.color)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Download QR
                      </button>
                      <form action={deleteDelegate.bind(null, eventId, delegate.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:underline"
                          onClick={e => {
                            if (!confirm(`Remove ${delegate.name}?`)) e.preventDefault()
                          }}
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
                {expanded === delegate.id && (
                  <tr key={`${delegate.id}-logs`} className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">Scan history</div>
                      {logs[delegate.id] === undefined ? (
                        <p className="text-xs text-gray-400">Loading…</p>
                      ) : logs[delegate.id].length === 0 ? (
                        <p className="text-xs text-gray-400">No scans yet.</p>
                      ) : (
                        <table className="text-xs w-full max-w-md">
                          <thead>
                            <tr className="text-gray-400">
                              <th className="text-left py-1">Time</th>
                              <th className="text-left py-1">Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs[delegate.id].map(log => (
                              <tr key={log.id}>
                                <td className="py-0.5 text-gray-500">
                                  {new Date(log.scanned_at).toLocaleString()}
                                </td>
                                <td className={`py-0.5 font-medium ${log.result === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                                  {log.result}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
