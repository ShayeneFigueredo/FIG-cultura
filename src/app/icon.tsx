import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const size = { width: 256, height: 256 }
export const contentType = 'image/png'

export default function Icon() {
  try {
    const imgData = fs.readFileSync(path.join(process.cwd(), 'public/icone-branco.png'))
    const base64 = imgData.toString('base64')
    const src = `data:image/png;base64,${base64}`

    return new ImageResponse(
      (
        <div
          style={{
            background: 'transparent',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={src} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
        </div>
      ),
      { ...size }
    )
  } catch (e) {
    console.error("Error generating icon", e)
    return new ImageResponse(
      (
        <div
          style={{
            background: 'transparent',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 100,
            fontWeight: 'bold',
          }}
        >
          C
        </div>
      ),
      { ...size }
    )
  }
}
