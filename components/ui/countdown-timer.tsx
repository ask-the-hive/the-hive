'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BorderBeam } from '@/components/ui'

function formatTime(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const days = Math.floor(totalSeconds / (24 * 3600))
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  return { days, hours }
}

// Global, fixed launch deadline so everyone sees the same timer.
const LAUNCH_DEADLINE_UTC_MS = Date.parse('2025-10-23T00:00:00Z')

export default function CountdownTimer() {
  const [now, setNow] = React.useState<number>(() => Date.now())

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const msRemaining = Math.max(0, LAUNCH_DEADLINE_UTC_MS - now)
  const { days, hours } = formatTime(msRemaining)

  if (msRemaining <= 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
      >
        <BorderBeam size={140} duration={10} borderWidth={1.5} />
        <span className="text-xs uppercase tracking-widest text-brand-600">The Hive V2</span>
        <span className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tabular-nums">{String(days).padStart(2, '0')}</span>
            <span className="text-xs text-neutral-500">days</span>
          </div>
          <span className="text-neutral-400">·</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tabular-nums">{String(hours).padStart(2, '0')}</span>
            <span className="text-xs text-neutral-500">hours</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


