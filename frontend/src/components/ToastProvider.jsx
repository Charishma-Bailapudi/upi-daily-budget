import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(toast.id), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [onDismiss, toast.id])

  const Icon = toast.type === 'error' ? XCircle : CheckCircle2

  return (
    <div className={`toast-item ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <Icon size={19} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((type, message) => {
    const id = nextId.current + 1
    nextId.current = id
    setToasts((current) => [...current, { id, type, message }])
  }, [])

  const toast = {
    success: (message) => addToast('success', message),
    error: (message) => addToast('error', message),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return toast
}
