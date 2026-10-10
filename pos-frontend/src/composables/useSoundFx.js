import { ref } from 'vue'

const isMuted = ref(localStorage.getItem('pos_sound_muted') === 'true')

export function useSoundFx() {
  const toggleMute = () => {
    isMuted.value = !isMuted.value
    localStorage.setItem('pos_sound_muted', isMuted.value.toString())
  }

  const getAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      return new AudioCtx()
    } catch (e) {
      return null
    }
  }

  // Beep pendek bernada lembut saat scan / klik tambah menu
  const playBeep = () => {
    if (isMuted.value) return
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.08) // D6

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }

  // Nada sukses / bayar lunas (Major Chord Chime)
  const playSuccess = () => {
    if (isMuted.value) return
    const ctx = getAudioContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + idx * 0.07

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.12, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.25)
    })
  }

  // Nada peringatan / void order / stok habis
  const playWarning = () => {
    if (isMuted.value) return
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  }

  return {
    isMuted,
    toggleMute,
    playBeep,
    playSuccess,
    playWarning
  }
}
