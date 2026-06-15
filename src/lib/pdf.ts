import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { generateQRBuffer } from './qr'

interface BadgeData {
  name: string
  token: string
  color?: string | null
}

const BADGES_PER_ROW = 2
const BADGES_PER_PAGE = 6
const A4_WIDTH = 595
const A4_HEIGHT = 842
const BADGE_WIDTH = 240
const BADGE_HEIGHT = 300
const QR_SIZE = 180
const MARGIN_X = (A4_WIDTH - BADGES_PER_ROW * BADGE_WIDTH) / 2
const MARGIN_Y = 40

export async function generateBadgePDF(badges: BadgeData[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.HelveticaBold)

  for (let pageStart = 0; pageStart < badges.length; pageStart += BADGES_PER_PAGE) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT])
    const pageBadges = badges.slice(pageStart, pageStart + BADGES_PER_PAGE)

    for (let i = 0; i < pageBadges.length; i++) {
      const { name, token, color } = pageBadges[i]
      const col = i % BADGES_PER_ROW
      const row = Math.floor(i / BADGES_PER_ROW)

      const x = MARGIN_X + col * BADGE_WIDTH
      const y = A4_HEIGHT - MARGIN_Y - (row + 1) * BADGE_HEIGHT

      // Badge border
      page.drawRectangle({
        x: x + 5,
        y: y + 5,
        width: BADGE_WIDTH - 10,
        height: BADGE_HEIGHT - 10,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      })

      // QR code
      const qrBuffer = await generateQRBuffer(token, color ?? '#000000')
      const qrImage = await doc.embedPng(qrBuffer)
      const qrX = x + (BADGE_WIDTH - QR_SIZE) / 2
      const qrY = y + BADGE_HEIGHT - QR_SIZE - 20
      page.drawImage(qrImage, { x: qrX, y: qrY, width: QR_SIZE, height: QR_SIZE })

      // Delegate name — truncate if too long
      const displayName = name.length > 22 ? name.slice(0, 22) + '…' : name
      const textWidth = font.widthOfTextAtSize(displayName, 13)
      page.drawText(displayName, {
        x: x + (BADGE_WIDTH - textWidth) / 2,
        y: qrY - 24,
        size: 13,
        font,
        color: rgb(0, 0, 0),
      })
    }
  }

  return doc.save()
}
