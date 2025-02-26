"use client"

import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const TooltipContent = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const handleMouseEnter = (event: MouseEvent) => {
      if (tooltipRef.current) {
        const { top, left, width } = (event.target as HTMLElement).getBoundingClientRect()
        setPosition({ top: top - 35, left: left + width / 2 })
        setIsVisible(true)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener("mouseenter", handleMouseEnter, true)
    document.addEventListener("mouseleave", handleMouseLeave, true)

    return () => {
      document.removeEventListener("mouseenter", handleMouseEnter, true)
      document.removeEventListener("mouseleave", handleMouseLeave, true)
    }
  }, [])

  if (!isClient) return null

  return createPortal(
    isVisible ? (
      <div
        ref={tooltipRef}
        style={{ top: position.top, left: position.left }}
        className="fixed z-50 px-2 py-1 text-sm text-white bg-black rounded"
      >
        {content}
      </div>
    ) : null,
    document.body
  )
}

export const Tooltip = ({ children, content }: TooltipProps) => {
  return (
    <TooltipProvider>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent content={content} />
    </TooltipProvider>
  )
}
