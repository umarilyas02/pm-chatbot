import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: 'linear-gradient(135deg, #020617 0%, #0F172A 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#F8FAFC',
          padding: 60,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, background: '#22C55E', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            X
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-1px' }}>CreateX</div>
            <div style={{ fontSize: 16, color: '#22C55E', fontWeight: 600, marginTop: 4 }}>AI Project Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', textAlign: 'center', maxWidth: 800, marginBottom: 48 }}>
          <p style={{ fontSize: 28, lineHeight: 1.4, color: '#E2E8F0', fontWeight: 400, display: 'flex' }}>
            AI-powered project management and team collaboration workspace
          </p>
        </div>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8', fontSize: 18 }}>
            <div style={{ width: 24, height: 24, background: '#22C55E', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#020617' }}>+</div>
            AI Task Generation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8', fontSize: 18 }}>
            <div style={{ width: 24, height: 24, background: '#22C55E', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#020617' }}>+</div>
            Real-time Chat
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8', fontSize: 18 }}>
            <div style={{ width: 24, height: 24, background: '#22C55E', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#020617' }}>+</div>
            Video Calls
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}