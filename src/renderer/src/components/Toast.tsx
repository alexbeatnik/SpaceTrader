import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function Toast(): React.JSX.Element | null {
  const toast = useGameStore((s) => s.toast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    // An error is the one the player has to act on, so it stays up longer than
    // a confirmation of something they just did themselves.
    const timer = setTimeout(() => setVisible(false), toast.type === 'error' ? 4200 : 2600)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast || !visible) return null
  return (
    <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      {toast.text}
    </div>
  )
}
