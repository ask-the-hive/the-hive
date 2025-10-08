'use client'

import React from 'react'
import { motion } from 'framer-motion'

function formatTime(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const days = Math.floor(totalSeconds / (24 * 3600))
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function getOrSetDeadline(): number {
  const key = 'the-hive-v2-deadline'
  if (typeof window === 'undefined') return Date.now() + 14 * 24 * 60 * 60 * 1000
  const stored = window.localStorage.getItem(key)
  if (stored) {
    const parsed = Number(stored)
    if (!Number.isNaN(parsed)) return parsed
  }
  const deadline = Date.now() + 14 * 24 * 60 * 60 * 1000
  window.localStorage.setItem(key, String(deadline))
  return deadline
}

export default function CountdownTimer() {
  const [deadline, setDeadline] = React.useState<number>(() => getOrSetDeadline())
  const [now, setNow] = React.useState<number>(() => Date.now())

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Ensure deadline persists if localStorage was empty initially
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const key = 'the-hive-v2-deadline'
    const stored = window.localStorage.getItem(key)
    if (!stored) window.localStorage.setItem(key, String(deadline))
  }, [deadline])

  const msRemaining = Math.max(0, deadline - now)
  const totalDuration = 14 * 24 * 60 * 60 * 1000
  const pct = 1 - msRemaining / totalDuration
  const { days, hours, minutes, seconds } = formatTime(msRemaining)

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-40 bg-[radial-gradient(circle_at_center,rgba(255,224,13,0.12),transparent_60%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest text-neutral-500">Countdown to</p>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-600">The Hive V2</h2>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, pct * 100)).toFixed(2)}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            />
          </div>

          {/* Time Boxes */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {[{label:'Days', value: days}, {label:'Hours', value: hours}, {label:'Minutes', value: minutes}, {label:'Seconds', value: seconds}].map((t) => (
              <div key={t.label} className="flex flex-col items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 py-4">
                <motion.div key={t.value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="text-3xl md:text-4xl font-extrabold tabular-nums">
                  {String(t.value).padStart(2, '0')}
                </motion.div>
                <div className="text-xs uppercase tracking-widest text-neutral-500">{t.label}</div>
              </div>
            ))}
          </div>

          <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
            Exact two-week timer stored locally. Returning users keep the same deadline.
          </div>
        </div>
      </div>
    </div>
  )
}


