import { useMemo } from 'react'

/**
 * Menghitung status buka/tutup dinamis dari data settings toko
 */
export function useOpenStatus(settings) {
  return useMemo(() => {
    if (!settings || !settings.openingHours) {
      return {
        isOpen: true,
        statusLabel: 'Buka Sekarang',
        scheduleText: '08:00 - 22:00 WIB',
        isLateNight: false
      }
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTimeVal = currentHour + currentMinutes / 60

    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    const scheduleText = isWeekend
      ? `${settings.openingHours.weekends} WIB`
      : `${settings.openingHours.weekdays} WIB`

    const openHour = isWeekend ? 7 : settings.openingHours.openHour || 8
    const closeHour = isWeekend ? 23 : settings.openingHours.closeHour || 22

    const isOpen = currentTimeVal >= openHour && currentTimeVal < closeHour

    return {
      isOpen,
      statusLabel: isOpen ? 'Buka Sekarang' : 'Sedang Tutup',
      scheduleText,
      openHour,
      closeHour
    }
  }, [settings])
}
