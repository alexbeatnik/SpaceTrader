import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { initPlatform } from './platform'
import './styles/global.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

function render(): void {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Mobile needs its lifecycle hooks in place before the player can touch
// anything — the listener that drains queued saves on the way to the background
// is no use if it registers after they have already switched away. It is a
// couple of plugin calls behind the splash screen, and a host that fails to
// initialise must still get a playable game rather than a blank screen.
initPlatform().then(render, render)
