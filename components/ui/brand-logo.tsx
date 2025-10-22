import React from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11', 
    lg: 'h-16 w-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background circle with gradient */}
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="url(#gradient)"
          className="drop-shadow-lg"
        />
        
        {/* Camera lens outer ring */}
        <circle
          cx="22"
          cy="18"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.9"
        />
        
        {/* Camera lens inner circle */}
        <circle
          cx="22"
          cy="18"
          r="5"
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Camera lens center dot */}
        <circle
          cx="22"
          cy="18"
          r="2"
          fill="white"
          opacity="0.8"
        />
        
        {/* Navigation compass needle */}
        <path
          d="M22 30 L24 32 L22 34 L20 32 Z"
          fill="white"
          opacity="0.9"
        />
        
        {/* Compass direction markers */}
        <circle cx="22" cy="28" r="0.5" fill="white" opacity="0.6" />
        <circle cx="24" cy="30" r="0.5" fill="white" opacity="0.6" />
        <circle cx="20" cy="30" r="0.5" fill="white" opacity="0.6" />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}