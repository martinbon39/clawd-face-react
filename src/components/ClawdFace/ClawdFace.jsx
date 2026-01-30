import { useEffect, useRef, useState, useCallback } from 'react'
import useEasterEggs from '../../hooks/useEasterEggs'
import styles from './ClawdFace.module.css'

export const STATES = [
  'idle', 'thinking', 'talking', 'sleeping', 'happy', 'curious',
  'excited', 'focused', 'confused', 'proud', 'bored', 'surprised',
  'working', 'listening', 'processing'
]

export default function ClawdFace({ state = 'idle', activity = '' }) {
  const faceRef = useRef(null)
  const eyeLRef = useRef(null)
  const eyeRRef = useRef(null)
  const mouthRef = useRef(null)
  const [showHelp, setShowHelp] = useState(false)
  const [idleAction, setIdleAction] = useState(null)
  const [internalSleep, setInternalSleep] = useState(false)
  const idleStartRef = useRef(Date.now())
  const lastActiveRef = useRef(Date.now())
  const animFrameRef = useRef(null)
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const eyePosRef = useRef({ x: 0, y: 0 })

  // Easter eggs
  const { handleFaceClick } = useEasterEggs(
    faceRef, eyeLRef, eyeRRef, mouthRef,
    () => setShowHelp(prev => !prev)
  )

  // Idle actions
  const idleActions = {
    blink: () => {
      if (eyeLRef.current && eyeRRef.current) {
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 'scaleY(0.1)'
        setTimeout(() => {
          if (state === 'idle') {
            eyeLRef.current.style.transform = eyeRRef.current.style.transform = ''
          }
        }, 150)
      }
    },
    winkL: () => {
      if (eyeLRef.current) {
        eyeLRef.current.style.transform = 'scaleY(0.1)'
        setTimeout(() => { if (state === 'idle') eyeLRef.current.style.transform = '' }, 250)
      }
    },
    winkR: () => {
      if (eyeRRef.current) {
        eyeRRef.current.style.transform = 'scaleY(0.1)'
        setTimeout(() => { if (state === 'idle') eyeRRef.current.style.transform = '' }, 250)
      }
    },
    lookL: () => {
      if (eyeLRef.current && eyeRRef.current && faceRef.current) {
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 'translateX(-6px)'
        faceRef.current.style.transform = 'rotate(-2deg)'
        setTimeout(() => {
          if (state === 'idle') {
            eyeLRef.current.style.transform = eyeRRef.current.style.transform = ''
            faceRef.current.style.transform = ''
          }
        }, 600)
      }
    },
    lookR: () => {
      if (eyeLRef.current && eyeRRef.current && faceRef.current) {
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 'translateX(6px)'
        faceRef.current.style.transform = 'rotate(2deg)'
        setTimeout(() => {
          if (state === 'idle') {
            eyeLRef.current.style.transform = eyeRRef.current.style.transform = ''
            faceRef.current.style.transform = ''
          }
        }, 600)
      }
    },
    squint: () => {
      if (eyeLRef.current && eyeRRef.current) {
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 'scaleY(0.5)'
        setTimeout(() => {
          if (state === 'idle') eyeLRef.current.style.transform = eyeRRef.current.style.transform = ''
        }, 400)
      }
    },
    smile: () => {
      if (mouthRef.current) {
        mouthRef.current.style.width = '45px'
        mouthRef.current.style.height = '16px'
        mouthRef.current.style.borderRadius = '4px 4px 20px 20px'
        setTimeout(() => {
          if (state === 'idle') {
            mouthRef.current.style.width = ''
            mouthRef.current.style.height = ''
            mouthRef.current.style.borderRadius = ''
          }
        }, 800)
      }
    },
    yawn: () => {
      if (mouthRef.current && eyeLRef.current && eyeRRef.current) {
        mouthRef.current.style.width = '25px'
        mouthRef.current.style.height = '35px'
        mouthRef.current.style.borderRadius = '50%'
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 'scaleY(0.3)'
        setTimeout(() => {
          if (state === 'idle') {
            mouthRef.current.style.width = ''
            mouthRef.current.style.height = ''
            mouthRef.current.style.borderRadius = ''
            eyeLRef.current.style.transform = eyeRRef.current.style.transform = ''
          }
        }, 1000)
      }
    }
  }

  // Random idle animation
  const doRandomIdle = useCallback(() => {
    if (state !== 'idle' || idleAction) return
    
    const actions = Object.keys(idleActions)
    const elapsed = Date.now() - idleStartRef.current
    
    let pick
    if (elapsed > 40000 && Math.random() < 0.4) {
      pick = 'yawn'
    } else {
      pick = actions[Math.floor(Math.random() * actions.length)]
    }
    
    setIdleAction(pick)
    idleActions[pick]()
    setTimeout(() => setIdleAction(null), 1000)
  }, [state, idleAction])

  // Mouse tracking for eyes (doesn't reset idle timer)
  useEffect(() => {
    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      // Don't reset idle timer on mouse move
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // Eye tracking animation loop
  useEffect(() => {
    const trackEyes = () => {
      if (state === 'idle' && !idleAction && faceRef.current && eyeLRef.current && eyeRRef.current) {
        const rect = faceRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = mouseRef.current.x - cx
        const dy = mouseRef.current.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const norm = Math.min(dist / 300, 1)
        
        const tx = (dx / dist) * 6 * norm
        const ty = (dy / dist) * 4 * norm
        
        eyePosRef.current.x += (tx - eyePosRef.current.x) * 0.1
        eyePosRef.current.y += (ty - eyePosRef.current.y) * 0.1
        
        eyeLRef.current.style.transform = eyeRRef.current.style.transform = 
          `translate(${eyePosRef.current.x}px, ${eyePosRef.current.y}px)`
      }
      animFrameRef.current = requestAnimationFrame(trackEyes)
    }
    
    animFrameRef.current = requestAnimationFrame(trackEyes)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [state, idleAction])

  // Idle animation interval
  useEffect(() => {
    if (state !== 'idle') return
    
    idleStartRef.current = Date.now()
    const interval = setInterval(doRandomIdle, 1200)
    setTimeout(doRandomIdle, 500)
    
    return () => clearInterval(interval)
  }, [state, doRandomIdle])

  // Escape to close help
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setShowHelp(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Track activity from server state
  useEffect(() => {
    if (state !== 'idle') {
      lastActiveRef.current = Date.now()
      setInternalSleep(false)
    }
  }, [state])

  // Auto-sleep after 60s of idle
  useEffect(() => {
    const checkSleep = setInterval(() => {
      if (state === 'idle' && !internalSleep) {
        if (Date.now() - lastActiveRef.current > 300000) { // 5 min
          setInternalSleep(true)
        }
      }
    }, 5000)
    return () => clearInterval(checkSleep)
  }, [state, internalSleep])

  // Wake on click (anywhere)
  const handleContainerClick = useCallback(() => {
    if (internalSleep) {
      setInternalSleep(false)
      lastActiveRef.current = Date.now()
    }
  }, [internalSleep])

  // Face click for easter eggs (only when awake)
  const handleFaceClickWrapper = useCallback((e) => {
    e.stopPropagation()
    if (internalSleep) {
      setInternalSleep(false)
      lastActiveRef.current = Date.now()
      return
    }
    handleFaceClick()
  }, [internalSleep, handleFaceClick])

  const effectiveState = internalSleep ? 'sleeping' : state

  return (
    <div className={`${styles.container} ${styles[effectiveState]}`} onClick={handleContainerClick}>
      <div className={styles.face} ref={faceRef} onClick={handleFaceClickWrapper}>
        <div className={styles.eyes}>
          <div className={`${styles.eye} ${styles.left}`} ref={eyeLRef} />
          <div className={`${styles.eye} ${styles.right}`} ref={eyeRRef} />
        </div>
        <div className={styles.mouth} ref={mouthRef} />
      </div>
      
      {activity && !internalSleep && <div className={styles.activity}>{activity}</div>}
      
      {effectiveState === 'sleeping' && (
        <div className={styles.zzzContainer}>
          <span className={styles.zzz}>z</span>
          <span className={styles.zzz}>z</span>
          <span className={styles.zzz}>z</span>
        </div>
      )}

      {/* Help Panel */}
      <div className={`${styles.helpPanel} ${showHelp ? styles.visible : ''}`}>
        <h2>🎭 Easter Eggs</h2>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>⌨️ Mots secrets</div>
          <kbd>dance</kbd> <kbd>love</kbd> <kbd>hello</kbd> <kbd>matrix</kbd>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🖱️ Clics sur le visage</div>
          3× danse · 5× vertige · 10× rainbow
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🎮 Konami</div>
          <kbd>↑↑↓↓←→←→BA</kbd>
        </div>
        <div className={styles.hint}>Appuie <kbd>?</kbd> ou <kbd>Esc</kbd> pour fermer</div>
      </div>
    </div>
  )
}
