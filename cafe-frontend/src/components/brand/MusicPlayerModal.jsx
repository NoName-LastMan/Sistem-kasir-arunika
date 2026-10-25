import React from 'react'
import {
  X, Play, Pause, SkipForward, SkipBack,
  Volume2, Volume1, VolumeX, Music, Coffee,
  CloudRain, Wind, Sparkles, Check
} from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { useAudioStore } from '../../store/audioStore'

export function MusicPlayerModal({ isOpen, onClose }) {
  const {
    tracks,
    currentTrackId,
    isPlaying,
    volume,
    play,
    pause,
    toggle,
    setTrack,
    nextTrack,
    prevTrack,
    setVolume
  } = useAudioStore()

  const currentTrack = tracks.find(t => t.id === currentTrackId) || tracks[0]

  const getTrackIcon = (id) => {
    switch (id) {
      case 'akustik':
        return <Coffee className="w-5 h-5 text-amber-600" />
      case 'lofi':
        return <Music className="w-5 h-5 text-emerald-600" />
      case 'hujan':
        return <CloudRain className="w-5 h-5 text-sky-600" />
      case 'alam':
        return <Wind className="w-5 h-5 text-teal-600" />
      default:
        return <Music className="w-5 h-5 text-forest-700" />
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Suasana Musik & Audio Kafe"
      maxWidth="max-w-xl"
    >
      <div className="p-5 sm:p-6 space-y-6">
        {/* Banner Pemutar Musik yang Sedang Aktif */}
        <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 rounded-2xl p-5 text-white shadow-warm-md border border-sun-400/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sun-400 text-forest-950 flex items-center justify-center shrink-0 shadow-warm-sm font-bold">
                {getTrackIcon(currentTrack.id)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-800 text-sun-300 border border-sun-400/20">
                    {currentTrack.mood}
                  </span>
                  {isPlaying && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-mint-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Memutar
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-lg sm:text-xl text-white leading-tight">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-mint-100 font-normal">
                  {currentTrack.subtitle}
                </p>
              </div>
            </div>

            {/* Tombol Kontrol Utama */}
            <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={prevTrack}
                aria-label="Lagu sebelumnya"
                className="w-9 h-9 rounded-full bg-forest-800 hover:bg-forest-700 text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? 'Jeda musik' : 'Putar musik'}
                className="w-12 h-12 rounded-full bg-sun-400 hover:bg-sun-300 text-forest-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-warm-sm"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                aria-label="Lagu berikutnya"
                className="w-9 h-9 rounded-full bg-forest-800 hover:bg-forest-700 text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Equalizer Visualizer Bars */}
          <div className="mt-4 pt-3 border-t border-forest-800 flex items-center justify-between text-xs text-pine-300">
            <span className="text-[11px] font-medium text-mint-200">Sintesis Audio Ambience</span>
            <div className="flex items-end gap-1 h-4">
              {[0.4, 0.9, 0.6, 0.8, 0.3, 0.7, 1.0, 0.5, 0.7, 0.4].map((scale, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-sun-400 transition-all ${
                    isPlaying ? 'animate-pulse' : 'h-1 opacity-40'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(4, scale * 16)}px` : '4px',
                    animationDuration: `${0.4 + (i % 4) * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pengatur Volume */}
        <div className="bg-paper-100 rounded-2xl p-4 border border-pine-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-pine-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>Volume Suara</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.65)}
              className="text-xs font-semibold text-pine-600 hover:text-forest-900 transition-colors"
            >
              {volume === 0 ? 'Bunyikan' : 'Senyap'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-pine-200 rounded-lg cursor-pointer"
              aria-label="Atur volume latar kafe"
            />
          </div>
        </div>

        {/* Daftar Pilihan Musik (Soundscape Tracks) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-serif font-bold text-base text-forest-950">
              Pilih Suasana Kafe
            </h5>
            <span className="text-xs text-pine-600 font-medium">
              4 Pilihan Suasana
            </span>
          </div>

          <div className="space-y-2.5">
            {tracks.map((track) => {
              const isSelected = track.id === currentTrackId
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    setTrack(track.id)
                    if (!isPlaying) play(track.id)
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-mint-50/80 border-emerald-600 shadow-warm-xs ring-1 ring-emerald-600'
                      : 'bg-white border-pine-200 hover:border-pine-300 hover:bg-paper-50 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-paper-100 text-forest-900'
                    }`}
                  >
                    {getTrackIcon(track.id)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-forest-950 truncate">
                          {track.title}
                        </span>
                        {isSelected && isPlaying && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-pine-600 shrink-0">
                        {track.mood}
                      </span>
                    </div>

                    <p className="text-xs text-pine-700 leading-relaxed font-normal">
                      {track.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isSelected && isPlaying) {
                        pause()
                      } else {
                        setTrack(track.id)
                        play(track.id)
                      }
                    }}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-center transition-transform hover:scale-105 active:scale-95 ${
                      isSelected && isPlaying
                        ? 'bg-emerald-600 text-white'
                        : 'bg-paper-100 text-forest-900 hover:bg-pine-200'
                    }`}
                    aria-label={isSelected && isPlaying ? `Jeda ${track.title}` : `Putar ${track.title}`}
                  >
                    {isSelected && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Tombol Tutup */}
        <div className="pt-2 border-t border-pine-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-forest-900 text-white hover:bg-forest-800 font-bold text-xs shadow-warm-xs transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </Dialog>
  )
}
