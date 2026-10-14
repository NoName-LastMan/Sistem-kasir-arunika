import { useCallback } from 'react'

export function useChime() {
  const playBeep = useCallback((freq = 880, type = 'sine', duration = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // AudioContext policy
    }
  }, [])

  const playSuccessChime = useCallback(() => {
    playBeep(523.25, 'triangle', 0.1) // C5
    setTimeout(() => playBeep(659.25, 'triangle', 0.1), 100) // E5
    setTimeout(() => playBeep(783.99, 'triangle', 0.25), 200) // G5
  }, [playBeep])

  const playScanBeep = useCallback(() => {
    playBeep(1200, 'square', 0.08)
  }, [playBeep])

  const playAlertBeep = useCallback(() => {
    playBeep(350, 'sawtooth', 0.2)
  }, [playBeep])

  return { playSuccessChime, playScanBeep, playAlertBeep }
}
