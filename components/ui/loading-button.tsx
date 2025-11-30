'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  href?: string
}

export function LoadingButton({ href, onClick, children, ...props }: LoadingButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (href) {
      e.preventDefault()
      setLoading(true)
      router.push(href)
    } else if (onClick) {
      setLoading(true)
      await onClick(e)
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
