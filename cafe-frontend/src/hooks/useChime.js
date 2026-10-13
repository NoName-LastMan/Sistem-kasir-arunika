import { useState, useCallback } from 'react'

const SOUND_STORAGE_KEY = 'arunika_chime_muted'

export function useChime() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  const playReadyChime = useCallback(() => {
    if (isMuted) return

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Mainkan akor fajar hangat: C5 (523.25Hz) lalu E5 (659.25Hz) dan G5 (783.99Hz)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.4 },
        { freq: 659.25, time: 0.12, dur: 0.5 },
        { freq: 783.99, time: 0.24, dur: 0.7 }
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time)

        gain.gain.setValueAtTime(0.001, ctx.currentTime + time)
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + time + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(ctx.currentTime + time)
        osc.stop(ctx.currentTime + time + dur)
      })
    } catch (e) {
      console.warn('Web Audio API not supported or autoplay blocked:', e)
    }
  }, [isMuted])

  return { isMuted, toggleMute, playReadyChime }
}
