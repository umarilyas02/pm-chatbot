import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* X left-to-right stroke */}
        <div
          style={{
            position: 'absolute',
            width: 20,
            height: 112,
            background: '#22C55E',
            borderRadius: 10,
            transform: 'rotate(45deg)',
            top: 34,
            left: 80,
          }}
        />
        {/* X right-to-left stroke */}
        <div
          style={{
            position: 'absolute',
            width: 20,
            height: 112,
            background: '#22C55E',
            borderRadius: 10,
            transform: 'rotate(-45deg)',
            top: 34,
            left: 80,
          }}
        />
        {/* Accent dot */}
        <div
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            background: '#22C55E',
            borderRadius: '50%',
            top: 17,
            right: 17,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
