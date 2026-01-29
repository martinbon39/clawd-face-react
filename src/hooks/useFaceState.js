import { useState, useEffect, useCallback, useRef } from 'react';

const STATES = [
  'idle', 'thinking', 'talking', 'sleeping', 'happy', 'curious',
  'excited', 'focused', 'confused', 'proud', 'bored', 'surprised',
  'working', 'listening', 'processing'
];

export function useFaceState() {
  const [state, setState] = useState('idle');
  const [activity, setActivity] = useState('');
  const [isInternalSleep, setIsInternalSleep] = useState(false);
  const idleStartRef = useRef(Date.now());
  const lastInteractionRef = useRef(Date.now());

  // Poll server for state
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/state.json?' + Date.now());
        if (res.ok) {
          const data = await res.json();
          const newState = STATES.includes(data.state) ? data.state : 'idle';
          
          // Don't override internal sleep with server idle
          if (isInternalSleep && newState === 'idle') return;
          
          setState(newState);
          setActivity(data.activity || '');
        }
      } catch (e) {}
    };

    poll();
    const interval = setInterval(poll, 200);
    return () => clearInterval(interval);
  }, [isInternalSleep]);

  // Reset idle timer on state change to idle
  useEffect(() => {
    if (state === 'idle') {
      idleStartRef.current = Date.now();
    }
  }, [state]);

  // Check for auto-sleep
  useEffect(() => {
    const check = () => {
      if (state !== 'idle' || isInternalSleep) return;
      if (Date.now() - idleStartRef.current > 60000) {
        setIsInternalSleep(true);
        setState('sleeping');
      }
    };

    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [state, isInternalSleep]);

  const resetIdleTimer = useCallback(() => {
    idleStartRef.current = Date.now();
    lastInteractionRef.current = Date.now();
  }, []);

  const wake = useCallback(() => {
    if (isInternalSleep || state === 'sleeping') {
      setIsInternalSleep(false);
      setState('idle');
      idleStartRef.current = Date.now();
      return true;
    }
    return false;
  }, [isInternalSleep, state]);

  const sleep = useCallback(() => {
    if (!isInternalSleep) {
      setIsInternalSleep(true);
      setState('sleeping');
    }
  }, [isInternalSleep]);

  return {
    state,
    activity,
    isInternalSleep,
    idleStart: idleStartRef.current,
    resetIdleTimer,
    wake,
    sleep,
    setState
  };
}
