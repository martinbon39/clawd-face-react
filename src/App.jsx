import { useState, useEffect } from 'react'
import ClawdFace, { STATES } from './components/ClawdFace'
import './App.css'

function App() {
  const [state, setState] = useState('idle')
  const [activity, setActivity] = useState('')
  const [showDebug, setShowDebug] = useState(false)

  // Poll state.json from server
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch('/state.json?' + Date.now())
        if (r.ok) {
          const d = await r.json()
          setState(d.state || 'idle')
          setActivity(d.activity || '')
        }
      } catch (e) {}
    }
    
    poll()
    const interval = setInterval(poll, 50)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts (Ctrl+D for debug)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setShowDebug(prev => !prev)
      }
      // Number keys for debug state switching
      if (showDebug && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1
        if (STATES[idx]) setState(STATES[idx])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showDebug])

  return (
    <div className="app">
      <ClawdFace state={state} activity={activity} />
      
      {showDebug && (
        <div className="debug-panel">
          <div className="debug-title">Debug (Ctrl+D to hide)</div>
          <div className="debug-state">State: {state}</div>
          <div className="debug-buttons">
            {STATES.map((s, i) => (
              <button 
                key={s}
                onClick={() => setState(s)}
                className={state === s ? 'active' : ''}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
