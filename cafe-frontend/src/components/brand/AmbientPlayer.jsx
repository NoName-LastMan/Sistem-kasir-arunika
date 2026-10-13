import React, { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Sparkles, Music } from 'lucide-react'

export function AmbientPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const intervalRef = useRef(null)

  const stopAmbient = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close()
      } catch {}
      audioCtxRef.current = null
    }
    setIsPlaying(false)
  }

  const startAmbient = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      audioCtxRef.current = ctx

      // Synthesize periodic calm slow-bar chime & breeze harmonics (E major pentatonic)
      const calmFrequencies = [329.63, 392.00, 493.88, 587.33, 659.25] // E4, G4, B4, D5, E5

      const playRandomChime = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return

        const freq = calmFrequencies[Math.floor(Math.random() * calmFrequencies.length)]
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.15)
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 3.2)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 3.2)
      }

      playRandomChime()
      intervalRef.current = setInterval(playRandomChime, 3800)
      setIsPlaying(true)
    } catch (e) {
      console.warn('AudioContext not allowed without gesture:', e)
    }
  }

  const toggle = () => {
    if (isPlaying) {
      stopAmbient()
    } else {
      startAmbient()
    }
  }

  useEffect(() => {
    return () => stopAmbient()
  }, [])

  return (
    <button
      onClick={toggle}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs touch-target ${
        isPlaying
          ? 'bg-sun-400 text-forest-950 font-bold border border-sun-400 shadow-warm-sm'
          : 'bg-white text-forest-950 font-semibold hover:bg-mint-100 border-2 border-pine-200 shadow-2xs'
      }`}
      aria-label={isPlaying ? 'Hentikan suasana suara taman fajar' : 'Putar suasana suara taman fajar'}
      title="Suasana Akustik Fajar Arunika"
    >
      {isPlaying ? (
        <>
          <span className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-3 bg-forest-900 animate-[pulse_0.6s_ease-in-out_infinite]" />
            <span className="w-0.5 h-2 bg-forest-900 animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 h-2.5 bg-forest-900 animate-[pulse_0.7s_ease-in-out_infinite]" />
          </span>
          <span>Suasana Fajar: Aktif</span>
        </>
      ) : (
        <>
          <Music className="w-3.5 h-3.5 text-emerald-600" />
          <span>Suasana Kafe</span>
        </>
      )}
    </button>
  )
}
