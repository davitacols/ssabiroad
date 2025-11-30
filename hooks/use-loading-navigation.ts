'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useLoadingNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleStart = () => {
      document.body.style.cursor = 'wait'
    }

    const handleComplete = () => {
      document.body.style.cursor = 'default'
    }

    handleComplete()

    return () => {
      handleComplete()
    }
  }, [pathname, searchParams])
}
