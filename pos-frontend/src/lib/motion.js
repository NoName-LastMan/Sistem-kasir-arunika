/**
 * Arunika POS Suite — Motion & Animation Design Tokens
 * Powered by Framer Motion for high-performance, natural spring physics.
 */

export const springGentle = {
  type: 'spring',
  stiffness: 200,
  damping: 22,
}

export const springSnappy = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
}

export const springBouncy = {
  type: 'spring',
  stiffness: 450,
  damping: 18,
}

export const springModal = {
  type: 'spring',
  stiffness: 320,
  damping: 26,
  mass: 0.85,
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.93, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springModal },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } }
}
export const modalPop = modalContent

export const drawerRight = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', damping: 28, stiffness: 280 } },
  exit: { x: '100%', transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] } }
}

export const cartItemVariant = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springSnappy },
  exit: { opacity: 0, x: -24, scale: 0.9, transition: { duration: 0.18 } }
}

export const badgePop = {
  initial: { scale: 0.6, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: springBouncy },
  exit: { scale: 0.6, opacity: 0, transition: { duration: 0.12 } }
}

export const toastVariant = {
  initial: { opacity: 0, y: -24, scale: 0.92 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springBouncy },
  exit: { opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.15 } }
}

export const staggerContainer = (staggerDelay = 0.04, delayChildren = 0.02) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren
    }
  }
})

export const tapScale = { scale: 0.97 }
export const hoverLift = { y: -3, transition: { duration: 0.18, ease: 'easeOut' } }

