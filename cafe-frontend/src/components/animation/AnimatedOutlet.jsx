import React from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition } from '../../lib/motion'

export function AnimatedOutlet() {
  const location = useLocation()
  const element = useOutlet()

  return (
    <AnimatePresence mode="wait" initial={false}>
      {element && (
        <motion.div
          key={location.pathname}
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col w-full min-h-0"
        >
          {element}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

