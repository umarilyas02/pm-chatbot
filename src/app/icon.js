import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0F172A',
          borderRadius: 7,
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
            width: 3.5,
            height: 20,
            background: '#22C55E',
            borderRadius: 2,
            transform: 'rotate(45deg)',
            top: 6,
            left: 14.25,
          }}
        />
        {/* X right-to-left stroke */}
        <div
          style={{
            position: 'absolute',
            width: 3.5,
            height: 20,
            background: '#22C55E',
            borderRadius: 2,
            transform: 'rotate(-45deg)',
            top: 6,
            left: 14.25,
          }}
        />
        {/* Accent dot */}
        <div
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            background: '#22C55E',
            borderRadius: '50%',
            top: 3,
            right: 3,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
