import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { ticketUrl } from '@/lib/qr'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const size = parseInt(searchParams.get('size') ?? '300', 10)
  const color = searchParams.get('color') ?? '#000000'

  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const buffer = await QRCode.toBuffer(ticketUrl(token), {
    width: Math.min(size, 600),
    margin: 1,
    color: { dark: color, light: '#ffffff' },
  })

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
