import { useEffect, useRef, useState, useCallback } from 'react'
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
  const [internalSleep, setInternalSleep] = useState(false)
  const [idleAction, setIdleAction] = useState(null)
  const idleStartRef = useRef(Date.now())
  const animFrameRef = useRef(null)
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const eyePosRef = useRef({ x: 0, y: 0 })

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
    if (state !== 'idle' || internalSleep || idleAction) return
    
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
  }, [state, internalSleep, idleAction])

  // Mouse tracking for eyes
  useEffect(() => {
    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      idleStartRef.current = Date.now() // Reset sleep timer
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // Eye tracking animation loop
  useEffect(() => {
    const trackEyes = () => {
      if (state === 'idle' && !internalSleep && !idleAction && faceRef.current && eyeLRef.current && eyeRRef.current) {
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
  }, [state, internalSleep, idleAction])

  // Idle animation interval
  useEffect(() => {
    if (state !== 'idle') return
    
    idleStartRef.current = Date.now()
    const interval = setInterval(doRandomIdle, 1200)
    setTimeout(doRandomIdle, 500)
    
    return () => clearInterval(interval)
  }, [state, doRandomIdle])

  // Auto-sleep after 60s idle
  useEffect(() => {
    if (state !== 'idle') return
    
    const checkSleep = setInterval(() => {
      if (Date.now() - idleStartRef.current > 60000) {
        setInternalSleep(true)
      }
    }, 10000)
    
    return () => clearInterval(checkSleep)
  }, [state])

  const effectiveState = internalSleep ? 'sleeping' : state

  return (
    <div className={`${styles.container} ${styles[effectiveState]}`}>
      <div className={styles.face} ref={faceRef}>
        <div className={styles.eyes}>
          <div className={`${styles.eye} ${styles.left}`} ref={eyeLRef} />
          <div className={`${styles.eye} ${styles.right}`} ref={eyeRRef} />
        </div>
        <div className={styles.mouth} ref={mouthRef} />
      </div>
      
      {activity && <div className={styles.activity}>{activity}</div>}
      <div className={styles.status}>{effectiveState}</div>
      
      {effectiveState === 'sleeping' && (
        <div className={styles.zzzContainer}>
          <span className={styles.zzz}>z</span>
          <span className={styles.zzz}>z</span>
          <span className={styles.zzz}>z</span>
        </div>
      )}
    </div>
  )
}
