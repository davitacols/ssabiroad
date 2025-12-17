"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((title: string, description: string | undefined, type: ToastType, duration = 5000) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, title, description, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const success = useCallback((title: string, description?: string) => addToast(title, description, 'success'), [addToast])
  const error = useCallback((title: string, description?: string) => addToast(title, description, 'error', 7000), [addToast])
  const warning = useCallback((title: string, description?: string) => addToast(title, description, 'warning'), [addToast])
  const info = useCallback((title: string, description?: string) => addToast(title, description, 'info'), [addToast])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  }

  const styles = {
    success: 'border-green-500 bg-green-50 dark:bg-green-950',
    error: 'border-red-500 bg-red-50 dark:bg-red-950',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950'
  }

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map(({ id, title, description, type }) => (
          <div key={id} className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[type]} animate-in slide-in-from-top`}>
            {icons[type]}
            <div className="flex-1">
              <p className="font-semibold text-sm">{title}</p>
              {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== id))} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToastContext must be used within ToastContextProvider')
  return context
}
