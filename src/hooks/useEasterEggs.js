import { useEffect, useRef, useCallback } from 'react'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA']

export default function useEasterEggs(faceRef, eyeLRef, eyeRRef, mouthRef, onShowHelp) {
  const keyBuffer = useRef('')
  const konamiIdx = useRef(0)

  // Particles effect
  const particles = useCallback((emoji, count, isMatrix = false) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement('div')
        p.className = 'particle'
        p.textContent = emoji
        p.style.cssText = `
          position: fixed;
          pointer-events: none;
          font-size: 24px;
          z-index: 100;
          animation: particle-float 1.5s ease-out forwards;
          left: ${15 + Math.random() * 70}%;
          top: ${25 + Math.random() * 50}%;
          ${isMatrix ? 'color: #0f0; text-shadow: 0 0 8px #0f0; font-family: monospace;' : ''}
        `
        document.body.appendChild(p)
        setTimeout(() => p.remove(), 1500)
      }, i * 80)
    }
  }, [])

  // Easter egg triggers
  const triggerEaster = useCallback((type) => {
    const face = faceRef.current
    const eyeL = eyeLRef.current
    const eyeR = eyeRRef.current
    const mouth = mouthRef.current
    if (!face || !eyeL || !eyeR || !mouth) return

    switch (type) {
      case 'dance':
        particles('🎵', 4)
        let step = 0
        const dance = setInterval(() => {
          if (step > 5) { clearInterval(dance); face.style.transform = ''; return }
          face.style.transform = ['rotate(-5deg)', 'rotate(5deg)', 'translateY(-8px)', 'rotate(-3deg)', 'rotate(3deg)', ''][step]
          step++
        }, 180)
        break

      case 'love':
        particles('❤️', 6)
        break

      case 'hello':
        particles('👋', 3)
        mouth.style.width = '45px'
        mouth.style.height = '16px'
        mouth.style.borderRadius = '4px 4px 20px 20px'
        setTimeout(() => {
          mouth.style.width = ''
          mouth.style.height = ''
          mouth.style.borderRadius = ''
        }, 800)
        break

      case 'dizzy':
        particles('💫', 3)
        let angle = 0
        const dizzy = setInterval(() => {
          if (angle > 720) { clearInterval(dizzy); eyeL.style.transform = eyeR.style.transform = ''; return }
          const x = Math.cos(angle * Math.PI / 180) * 5
          eyeL.style.transform = `translateX(${x}px)`
          eyeR.style.transform = `translateX(${-x}px)`
          angle += 40
        }, 40)
        break

      case 'rainbow':
        document.body.classList.add('rainbow')
        setTimeout(() => document.body.classList.remove('rainbow'), 1500)
        break

      case 'konami':
        particles('⭐', 6)
        triggerEaster('dance')
        break

      case 'matrix':
        for (let i = 0; i < 15; i++) {
          setTimeout(() => particles(Math.random() > 0.5 ? '1' : '0', 1, true), i * 60)
        }
        // Add matrix class to container for black background
        const container = face.parentElement
        container.classList.add('matrix-mode')
        face.style.filter = 'drop-shadow(0 0 8px #0f0)'
        eyeL.style.background = eyeR.style.background = mouth.style.background = '#0f0'
        setTimeout(() => {
          container.classList.remove('matrix-mode')
          face.style.filter = ''
          eyeL.style.background = eyeR.style.background = mouth.style.background = ''
        }, 2500)
        break
    }
  }, [faceRef, eyeLRef, eyeRRef, mouthRef, particles])

  // Click handler for face
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  const handleFaceClick = useCallback(() => {
    clickCount.current++
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => clickCount.current = 0, 1500)

    if (clickCount.current === 3) triggerEaster('dance')
    else if (clickCount.current === 5) triggerEaster('dizzy')
    else if (clickCount.current >= 10) { triggerEaster('rainbow'); clickCount.current = 0 }
  }, [triggerEaster])

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      // Help toggle (Ctrl+H or ?)
      if (e.key === '?' || ((e.ctrlKey || e.metaKey) && e.key === 'h')) {
        e.preventDefault()
        onShowHelp?.()
        return
      }

      // Konami code
      if (e.code === KONAMI[konamiIdx.current]) {
        konamiIdx.current++
        if (konamiIdx.current === KONAMI.length) {
          triggerEaster('konami')
          konamiIdx.current = 0
        }
      } else {
        konamiIdx.current = 0
      }

      // Secret words
      if (e.key.length === 1) {
        keyBuffer.current += e.key.toLowerCase()
        if (keyBuffer.current.length > 10) keyBuffer.current = keyBuffer.current.slice(-10)

        if (keyBuffer.current.endsWith('dance')) { triggerEaster('dance'); keyBuffer.current = '' }
        else if (keyBuffer.current.endsWith('love')) { triggerEaster('love'); keyBuffer.current = '' }
        else if (keyBuffer.current.endsWith('hello')) { triggerEaster('hello'); keyBuffer.current = '' }
        else if (keyBuffer.current.endsWith('matrix')) { triggerEaster('matrix'); keyBuffer.current = '' }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerEaster, onShowHelp])

  return { handleFaceClick, triggerEaster }
}
