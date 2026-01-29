import { useState, useEffect, useRef, useCallback } from 'react';
import { useFaceState } from './hooks/useFaceState';
import { Face } from './components/Face';
import { Zzz } from './components/Zzz';
import { HelpPanel } from './components/HelpPanel';
import { Particles, useParticles } from './components/Particles';
import styles from './App.module.css';

const BACKGROUNDS = {
  idle: '#E8927C',
  thinking: '#7C9FE8',
  talking: '#7CE8A3',
  sleeping: '#1a1a24',
  happy: '#E8D77C',
  curious: '#C77CE8',
  excited: '#E87CA3',
  focused: '#4A6FA5',
  confused: '#E8B07C',
  proud: '#7CE8D4',
  bored: '#9E9E9E',
  surprised: '#E87C7C',
  working: '#5C7C5C',
  listening: '#A3E87C',
  processing: '#7C8BE8',
};

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export default function App() {
  const { state, activity, isInternalSleep, resetIdleTimer, wake, sleep } = useFaceState();
  const { particles, spawn } = useParticles();
  
  const [showHelp, setShowHelp] = useState(false);
  const [eyeTransform, setEyeTransform] = useState('');
  const [mouthStyle, setMouthStyle] = useState({});
  const [faceTransform, setFaceTransform] = useState('');
  const [rainbow, setRainbow] = useState(false);
  const [matrix, setMatrix] = useState(false);
  
  const faceRef = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const eyePosRef = useRef({ x: 0, y: 0 });
  const idleActionActiveRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const keyBufferRef = useRef('');
  const konamiIdxRef = useRef(0);

  // Background color
  const bgColor = matrix ? '#000' : BACKGROUNDS[state] || BACKGROUNDS.idle;

  // === IDLE ACTIONS ===
  const idleAction = useCallback((duration, action) => {
    if (idleActionActiveRef.current) return;
    idleActionActiveRef.current = true;
    action();
    setTimeout(() => { idleActionActiveRef.current = false; }, duration);
  }, []);

  const idleActions = {
    blink: () => idleAction(200, () => {
      setEyeTransform('scaleY(0.1)');
      setTimeout(() => setEyeTransform(''), 150);
    }),
    winkL: () => idleAction(300, () => {
      setEyeTransform('scaleY(0.1)');
      setTimeout(() => setEyeTransform(''), 250);
    }),
    lookL: () => idleAction(650, () => {
      setEyeTransform('translateX(-6px)');
      setFaceTransform('rotate(-2deg)');
      setTimeout(() => { setEyeTransform(''); setFaceTransform(''); }, 600);
    }),
    lookR: () => idleAction(650, () => {
      setEyeTransform('translateX(6px)');
      setFaceTransform('rotate(2deg)');
      setTimeout(() => { setEyeTransform(''); setFaceTransform(''); }, 600);
    }),
    squint: () => idleAction(450, () => {
      setEyeTransform('scaleY(0.5)');
      setTimeout(() => setEyeTransform(''), 400);
    }),
    smile: () => idleAction(850, () => {
      setMouthStyle({ width: 45, height: 16, borderRadius: '4px 4px 20px 20px' });
      setTimeout(() => setMouthStyle({}), 800);
    }),
    tilt: () => idleAction(750, () => {
      const d = Math.random() > 0.5 ? 1 : -1;
      setFaceTransform(`rotate(${d * 4}deg)`);
      setTimeout(() => setFaceTransform(''), 700);
    }),
    yawn: () => idleAction(1050, () => {
      setMouthStyle({ width: 25, height: 35, borderRadius: '50%' });
      setEyeTransform('scaleY(0.3)');
      setTimeout(() => { setMouthStyle({}); setEyeTransform(''); }, 1000);
    }),
    sigh: () => idleAction(850, () => {
      setFaceTransform('translateY(5px) scale(0.98)');
      setEyeTransform('scaleY(0.6)');
      setTimeout(() => { setFaceTransform(''); setEyeTransform(''); }, 800);
    }),
  };

  // Random idle action
  useEffect(() => {
    if (state !== 'idle' || isInternalSleep) return;

    const doRandom = () => {
      const actions = Object.values(idleActions);
      const action = actions[Math.floor(Math.random() * actions.length)];
      action();
    };

    const interval = setInterval(doRandom, 1200);
    const timeout = setTimeout(doRandom, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [state, isInternalSleep]);

  // === EYE TRACKING ===
  useEffect(() => {
    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      resetIdleTimer();
      if (isInternalSleep) wake();
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [resetIdleTimer, wake, isInternalSleep]);

  useEffect(() => {
    const track = () => {
      if (state !== 'idle' || isInternalSleep || idleActionActiveRef.current) return;
      if (!faceRef.current) return;

      const rect = faceRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mouseRef.current.x - cx;
      const dy = mouseRef.current.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const norm = Math.min(dist / 300, 1);

      const tx = (dx / dist) * 6 * norm;
      const ty = (dy / dist) * 4 * norm;

      eyePosRef.current.x += (tx - eyePosRef.current.x) * 0.1;
      eyePosRef.current.y += (ty - eyePosRef.current.y) * 0.1;

      setEyeTransform(`translate(${eyePosRef.current.x}px, ${eyePosRef.current.y}px)`);
    };

    const interval = setInterval(track, 16);
    return () => clearInterval(interval);
  }, [state, isInternalSleep]);

  // === EASTER EGGS ===
  const triggerEaster = useCallback((type) => {
    switch (type) {
      case 'dance':
        spawn('🎵', 4);
        let step = 0;
        const danceInt = setInterval(() => {
          if (step > 5) { clearInterval(danceInt); setFaceTransform(''); return; }
          const moves = ['rotate(-5deg)', 'rotate(5deg)', 'translateY(-8px)', 'rotate(-3deg)', 'rotate(3deg)', ''];
          setFaceTransform(moves[step]);
          step++;
        }, 180);
        break;
      case 'love':
        spawn('❤️', 6);
        break;
      case 'sleep':
        sleep();
        break;
      case 'hello':
        spawn('👋', 3);
        idleActions.smile();
        break;
      case 'dizzy':
        spawn('💫', 3);
        break;
      case 'rainbow':
        setRainbow(true);
        setTimeout(() => setRainbow(false), 1500);
        break;
      case 'konami':
        spawn('⭐', 6);
        triggerEaster('dance');
        break;
      case 'matrix':
        setMatrix(true);
        for (let i = 0; i < 15; i++) {
          setTimeout(() => spawn(Math.random() > 0.5 ? '1' : '0', 1, true), i * 60);
        }
        setTimeout(() => setMatrix(false), 2500);
        break;
    }
  }, [spawn, sleep]);

  // Face click handler
  const handleFaceClick = () => {
    if (wake()) return;
    if (state !== 'idle') return;

    clickCountRef.current++;
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 1500);

    if (clickCountRef.current === 1) idleActions.blink();
    else if (clickCountRef.current === 3) triggerEaster('dance');
    else if (clickCountRef.current === 5) triggerEaster('dizzy');
    else if (clickCountRef.current >= 10) {
      triggerEaster('rainbow');
      clickCountRef.current = 0;
    }
  };

  // Keyboard handler
  useEffect(() => {
    const onKeyDown = (e) => {
      // Help toggle
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setShowHelp(v => !v);
        return;
      }
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // Konami code
      if (e.code === KONAMI[konamiIdxRef.current]) {
        konamiIdxRef.current++;
        if (konamiIdxRef.current === KONAMI.length) {
          triggerEaster('konami');
          konamiIdxRef.current = 0;
        }
      } else {
        konamiIdxRef.current = 0;
      }

      // Secret words
      if (e.key.length === 1) {
        keyBufferRef.current += e.key.toLowerCase();
        if (keyBufferRef.current.length > 10) {
          keyBufferRef.current = keyBufferRef.current.slice(-10);
        }

        const words = ['dance', 'love', 'sleep', 'hello', 'matrix'];
        for (const word of words) {
          if (keyBufferRef.current.endsWith(word)) {
            triggerEaster(word);
            keyBufferRef.current = '';
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerEaster]);

  return (
    <div 
      className={`${styles.container} ${rainbow ? styles.rainbow : ''}`}
      style={{ background: bgColor }}
    >
      <div onClick={handleFaceClick}>
        <Face
          ref={faceRef}
          state={state}
          eyeTransform={eyeTransform}
          mouthStyle={mouthStyle}
          faceTransform={faceTransform}
        />
      </div>

      <div className={styles.activity}>{activity}</div>
      <div className={styles.status}>{state}</div>

      <Zzz visible={state === 'sleeping'} />
      <Particles particles={particles} />
      <HelpPanel visible={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
