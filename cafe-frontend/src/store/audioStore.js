import { create } from 'zustand'

export const TRACKS = [
  {
    id: 'akustik',
    title: 'Akustik Fajar Arunika',
    subtitle: 'Petikan Gitar & Chimes Hangat',
    mood: 'Santai & Tenang',
    icon: 'coffee',
    description: 'Harmoni pentatonik nada E-Mayor lembut berpadu dengan petikan senar akustik menyambut hangat fajar Semarang.'
  },
  {
    id: 'lofi',
    title: 'Slow-Bar Lo-Fi Jazz',
    subtitle: 'Rhodes Piano & Vinyl Warmth',
    mood: 'Fokus & Inspiratif',
    icon: 'music',
    description: 'Sentuhan tuts electric piano vintage dengan progresi akord minor 7th jazz santai, pas untuk bekerja atau membaca.'
  },
  {
    id: 'hujan',
    title: 'Hujan Rintik Kedungmundu',
    subtitle: 'Gerimis Syahdu & Air Menetes',
    mood: 'Nostalgik & Rileks',
    icon: 'rain',
    description: 'Suasana rintik hujan menyejukkan di luar beranda kafe dengan tetesan air berirama lembut menenangkan pikiran.'
  },
  {
    id: 'alam',
    title: 'Semilir Angin & Alam Terbuka',
    subtitle: 'Desau Angin & Lonceng Bambu Zen',
    mood: 'Alami & Segar',
    icon: 'wind',
    description: 'Desau semilir angin sepoi-sepoi outdoor terrace berpadu dengan denting lonceng bambu zen alami.'
  }
]

// Singleton Web Audio Engine
class WebAudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.currentTrackId = null
    this.intervalId = null
    this.noiseNode = null
    this.filterNode = null
    this.volume = 0.65
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  stopCurrent() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
        this.noiseNode.disconnect()
      } catch {}
      this.noiseNode = null
    }
    this.currentTrackId = null
  }

  playTrack(trackId) {
    this.initContext()
    if (!this.ctx) return

    this.stopCurrent()
    this.currentTrackId = trackId

    switch (trackId) {
      case 'akustik':
        this.startAkustik()
        break
      case 'lofi':
        this.startLofi()
        break
      case 'hujan':
        this.startHujan()
        break
      case 'alam':
        this.startAlam()
        break
      default:
        this.startAkustik()
    }
  }

  // --- Track 1: Akustik Fajar ---
  startAkustik() {
    const freqs = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99] // E4, G4, B4, D5, E5, G5
    const playChime = () => {
      if (!this.ctx || this.currentTrackId !== 'akustik') return
      const t = this.ctx.currentTime
      const chordCount = 2 + Math.floor(Math.random() * 2)

      for (let i = 0; i < chordCount; i++) {
        const freq = freqs[Math.floor(Math.random() * freqs.length)]
        const osc = this.ctx.createOscillator()
        const noteGain = this.ctx.createGain()

        osc.type = i === 0 ? 'sine' : 'triangle'
        osc.frequency.setValueAtTime(freq, t + i * 0.12)

        noteGain.gain.setValueAtTime(0.0001, t + i * 0.12)
        noteGain.gain.exponentialRampToValueAtTime(0.05, t + i * 0.12 + 0.1)
        noteGain.gain.exponentialRampToValueAtTime(0.00001, t + i * 0.12 + 3.0)

        osc.connect(noteGain)
        noteGain.connect(this.masterGain)

        osc.start(t + i * 0.12)
        osc.stop(t + i * 0.12 + 3.1)
      }
    }

    playChime()
    this.intervalId = setInterval(playChime, 3400)
  }

  // --- Track 2: Slow-Bar Lo-Fi Jazz Chords ---
  startLofi() {
    const jazzChords = [
      [146.83, 220.00, 261.63, 329.63], // Dm9
      [98.00, 174.61, 246.94, 329.63],  // G13
      [130.81, 196.00, 246.94, 293.66], // Cmaj9
      [110.00, 164.81, 220.00, 261.63]  // Am9
    ]
    let chordIndex = 0

    const playJazzBar = () => {
      if (!this.ctx || this.currentTrackId !== 'lofi') return
      const t = this.ctx.currentTime
      const notes = jazzChords[chordIndex % jazzChords.length]
      chordIndex++

      // Create warm lowpass filter for vintage lo-fi feeling
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(750, t)

      const chordGain = this.ctx.createGain()
      chordGain.gain.setValueAtTime(0.0001, t)
      chordGain.gain.linearRampToValueAtTime(0.04, t + 0.3)
      chordGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.8)

      filter.connect(chordGain)
      chordGain.connect(this.masterGain)

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, t + idx * 0.04)

        // Subtle warm vibrato LFO
        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()
        lfo.frequency.setValueAtTime(4.5, t)
        lfoGain.gain.setValueAtTime(1.8, t)
        lfo.connect(lfoGain)
        lfoGain.connect(osc.frequency)

        lfo.start(t)
        lfo.stop(t + 3.8)

        osc.connect(filter)
        osc.start(t + idx * 0.04)
        osc.stop(t + 3.8)
      })
    }

    playJazzBar()
    this.intervalId = setInterval(playJazzBar, 3900)
  }

  // --- Track 3: Hujan Rintik Kedungmundu ---
  startHujan() {
    if (!this.ctx) return
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4
    }

    const whiteNoise = this.ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    // Lowpass filter for soothing rain sound
    const rainFilter = this.ctx.createBiquadFilter()
    rainFilter.type = 'lowpass'
    rainFilter.frequency.setValueAtTime(850, this.ctx.currentTime)

    const rainGain = this.ctx.createGain()
    rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime)

    whiteNoise.connect(rainFilter)
    rainFilter.connect(rainGain)
    rainGain.connect(this.masterGain)

    whiteNoise.start()
    this.noiseNode = whiteNoise

    // Periodic raindrop tones
    const playRainDrop = () => {
      if (!this.ctx || this.currentTrackId !== 'hujan') return
      const t = this.ctx.currentTime
      const dropOsc = this.ctx.createOscillator()
      const dropGain = this.ctx.createGain()

      const baseFreq = 800 + Math.random() * 600
      dropOsc.type = 'sine'
      dropOsc.frequency.setValueAtTime(baseFreq, t)
      dropOsc.frequency.exponentialRampToValueAtTime(300, t + 0.12)

      dropGain.gain.setValueAtTime(0.02, t)
      dropGain.gain.exponentialRampToValueAtTime(0.00001, t + 0.14)

      dropOsc.connect(dropGain)
      dropGain.connect(this.masterGain)

      dropOsc.start(t)
      dropOsc.stop(t + 0.15)
    }

    this.intervalId = setInterval(playRainDrop, 700)
  }

  // --- Track 4: Semilir Angin & Alam Terbuka ---
  startAlam() {
    if (!this.ctx) return
    const bufferSize = this.ctx.sampleRate * 3
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.35
    }

    const windSource = this.ctx.createBufferSource()
    windSource.buffer = noiseBuffer
    windSource.loop = true

    const bandpass = this.ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(320, this.ctx.currentTime)
    bandpass.Q.setValueAtTime(2.5, this.ctx.currentTime)

    const windGain = this.ctx.createGain()
    windGain.gain.setValueAtTime(0.035, this.ctx.currentTime)

    windSource.connect(bandpass)
    bandpass.connect(windGain)
    windGain.connect(this.masterGain)

    windSource.start()
    this.noiseNode = windSource

    // Modulate wind frequency slowly
    const chimeFreqs = [523.25, 587.33, 659.25, 783.99, 880.00]
    const playZenBell = () => {
      if (!this.ctx || this.currentTrackId !== 'alam') return
      const t = this.ctx.currentTime
      const bellFreq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)]
      const bellOsc = this.ctx.createOscillator()
      const bellGain = this.ctx.createGain()

      bellOsc.type = 'sine'
      bellOsc.frequency.setValueAtTime(bellFreq, t)

      bellGain.gain.setValueAtTime(0.0001, t)
      bellGain.gain.exponentialRampToValueAtTime(0.025, t + 0.05)
      bellGain.gain.exponentialRampToValueAtTime(0.00001, t + 4.2)

      bellOsc.connect(bellGain)
      bellGain.connect(this.masterGain)

      bellOsc.start(t)
      bellOsc.stop(t + 4.3)
    }

    this.intervalId = setInterval(playZenBell, 4200)
  }

  stop() {
    this.stopCurrent()
    if (this.ctx) {
      try {
        this.ctx.suspend()
      } catch {}
    }
  }
}

const audioEngine = new WebAudioEngine()

export const useAudioStore = create((set, get) => ({
  tracks: TRACKS,
  currentTrackId: 'akustik',
  isPlaying: false,
  volume: 0.65,
  isModalOpen: false,

  setModalOpen: (isOpen) => set({ isModalOpen: Boolean(isOpen) }),
  toggleModal: () => set(state => ({ isModalOpen: !state.isModalOpen })),

  play: (trackId) => {
    const targetId = trackId || get().currentTrackId || 'akustik'
    audioEngine.playTrack(targetId)
    set({ isPlaying: true, currentTrackId: targetId })
  },

  pause: () => {
    audioEngine.stop()
    set({ isPlaying: false })
  },

  toggle: () => {
    if (get().isPlaying) {
      get().pause()
    } else {
      get().play()
    }
  },

  setTrack: (trackId) => {
    set({ currentTrackId: trackId })
    if (get().isPlaying) {
      audioEngine.playTrack(trackId)
    }
  },

  nextTrack: () => {
    const { tracks, currentTrackId, isPlaying } = get()
    const currentIndex = tracks.findIndex(t => t.id === currentTrackId)
    const nextIndex = (currentIndex + 1) % tracks.length
    const nextId = tracks[nextIndex].id
    set({ currentTrackId: nextId })
    if (isPlaying) {
      audioEngine.playTrack(nextId)
    }
  },

  prevTrack: () => {
    const { tracks, currentTrackId, isPlaying } = get()
    const currentIndex = tracks.findIndex(t => t.id === currentTrackId)
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length
    const prevId = tracks[prevIndex].id
    set({ currentTrackId: prevId })
    if (isPlaying) {
      audioEngine.playTrack(prevId)
    }
  },

  setVolume: (val) => {
    const clamped = Math.max(0, Math.min(1, val))
    audioEngine.setVolume(clamped)
    set({ volume: clamped })
  }
}))
