import React, { useState } from 'react'
import { Music, Play, Pause, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useAudioStore } from '../../store/audioStore'
import { MusicPlayerModal } from './MusicPlayerModal'

export function AmbientPlayer() {
  const {
    isPlaying,
    currentTrackId,
    tracks,
    toggle,
    isModalOpen,
    setModalOpen
  } = useAudioStore()

  const currentTrack = tracks.find(t => t.id === currentTrackId) || tracks[0]

  return (
    <>
      <div className="inline-flex items-center gap-1 bg-white p-1 rounded-full border-2 border-pine-200 shadow-2xs">
        {/* Tombol Play / Pause Utama */}
        <button
          onClick={toggle}
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all touch-target ${
            isPlaying
              ? 'bg-sun-400 text-forest-950 font-bold border border-sun-400 shadow-warm-xs'
              : 'bg-paper-100 text-forest-900 hover:bg-mint-100 border border-transparent'
          }`}
          aria-label={isPlaying ? 'Jeda suasana kafe' : 'Putar suasana kafe'}
          title={`Suasana Kafe: ${currentTrack.title}`}
        >
          {isPlaying ? (
            <>
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-forest-900 animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-0.5 h-2 bg-forest-900 animate-[pulse_0.8s_ease-in-out_infinite]" />
                <span className="w-0.5 h-2.5 bg-forest-900 animate-[pulse_0.7s_ease-in-out_infinite]" />
              </span>
              <span className="max-w-[85px] sm:max-w-[120px] truncate">
                {currentTrack.title.split(' ')[0]}...
              </span>
            </>
          ) : (
            <>
              <Music className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Suasana</span>
              <span className="sm:hidden">Musik</span>
            </>
          )}
        </button>

        {/* Tombol Ganti Musik / Buka Modal Audio Lounge */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="p-1 rounded-full text-pine-600 hover:text-forest-950 hover:bg-mint-100 transition-colors"
          title="Pilih Suasana & Ganti Musik"
          aria-label="Pilih lagu dan ganti suasana musik kafe"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal Dialog Ganti Musik */}
      <MusicPlayerModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
