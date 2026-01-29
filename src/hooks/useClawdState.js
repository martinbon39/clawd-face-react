import { useState, useEffect, useCallback, useRef } from 'react'
import { STATES } from '../components/ClawdFace'

const DEFAULT_WS_URL = 'ws://localhost:3001/face'

export default function useClawdState(wsUrl = DEFAULT_WS_URL) {
  const [state, setState] = useState(STATES.idle)
  const [amplitude, setAmplitude] = useState(0)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('[ClawdFace] Connected to', wsUrl)
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle state changes
          if (data.state && Object.values(STATES).includes(data.state)) {
            setState(data.state)
          }
          
          // Handle audio amplitude for speaking animation
          if (typeof data.amplitude === 'number') {
            setAmplitude(data.amplitude)
          }
          
          // Handle specific events
          if (data.event) {
            switch (data.event) {
              case 'listening_start':
                setState(STATES.listening)
                break
              case 'listening_stop':
                setState(STATES.idle)
                break
              case 'thinking_start':
                setState(STATES.thinking)
                break
              case 'speaking_start':
                setState(STATES.speaking)
                break
              case 'speaking_stop':
                setState(STATES.idle)
                setAmplitude(0)
                break
            }
          }
        } catch (e) {
          console.warn('[ClawdFace] Invalid message:', event.data)
        }
      }
      
      wsRef.current.onclose = (event) => {
        console.log('[ClawdFace] Disconnected', event.code)
        setConnected(false)
        wsRef.current = null
        
        // Exponential backoff reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
          reconnectAttempts.current++
          console.log(`[ClawdFace] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          setError('Max reconnection attempts reached')
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('[ClawdFace] WebSocket error:', error)
        setError('Connection error')
      }
    } catch (e) {
      console.error('[ClawdFace] Failed to connect:', e)
      setError(e.message)
    }
  }, [wsUrl])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  // Manual state override (for testing)
  const setManualState = useCallback((newState) => {
    if (Object.values(STATES).includes(newState)) {
      setState(newState)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    state,
    amplitude,
    connected,
    error,
    connect,
    disconnect,
    setManualState
  }
}
