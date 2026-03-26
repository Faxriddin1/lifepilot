import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for page-level fade + slide-up animation.
 * Respects prefers-reduced-motion via framer-motion's built-in support.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
