import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <svg width="28" height="28" viewBox="0 0 64 64">
          <rect x="18" y="28" width="16" height="24" fill="#fff" rx="1"/>
          <rect x="20" y="32" width="3" height="3" fill="#3b82f6"/>
          <rect x="27" y="32" width="3" height="3" fill="#3b82f6"/>
          <rect x="20" y="38" width="3" height="3" fill="#3b82f6"/>
          <rect x="27" y="38" width="3" height="3" fill="#3b82f6"/>
          <path d="M 44 16 C 40 16 37 19 37 23 C 37 28 44 34 44 34 C 44 34 51 28 51 23 C 51 19 48 16 44 16 Z" fill="#ef4444"/>
          <circle cx="44" cy="23" r="2.5" fill="#fff"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
