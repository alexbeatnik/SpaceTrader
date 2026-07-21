import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function Toast(): React.JSX.Element | null {
  const toast = useGameStore((s) => s.toast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast || !visible) return null
  return <div className={`toast ${toast.type}`}>{toast.text}</div>
}
