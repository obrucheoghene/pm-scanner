import QRCode from 'qrcode'

export function ticketUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/ticket/${token}`
}

export async function generateQRDataURL(token: string): Promise<string> {
  return QRCode.toDataURL(ticketUrl(token), {
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

export async function generateQRBuffer(token: string, darkColor = '#000000'): Promise<Buffer> {
  return QRCode.toBuffer(ticketUrl(token), {
    width: 300,
    margin: 1,
    color: { dark: darkColor, light: '#ffffff' },
  })
}
