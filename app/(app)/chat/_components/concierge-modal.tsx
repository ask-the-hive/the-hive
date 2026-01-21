'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, Coins, BookOpen, X } from 'lucide-react';

interface ConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: 'stake' | 'lend' | 'explore') => void;
}

// Golden firefly with soft amber glow - slow drift, then scatter on exit
const BackgroundFirefly: React.FC<{ 
  delay: number; 
  duration: number; 
  x: number; 
  y: number; 
  initialX: number; 
  initialY: number; 
  size: number;
  isExiting: boolean;
  exitDirection: { x: number; y: number };
}> = ({
  delay,
  duration,
  x,
  y,
  initialX,
  initialY,
  size,
  isExiting,
  exitDirection,
}) => {
  return (
    <motion.div
      className="absolute rounded-full bg-amber-400/90"
      initial={{ opacity: 0, x: initialX, y: initialY, scale: 1 }}
      animate={isExiting ? {
        // Shrink and fade out in place - don't move x/y
        opacity: [0.7, 0.4, 0.2, 0],
        scale: [1, 0.5, 0.2, 0],
      } : {
        // Slow drift with subtle flicker
        opacity: [0.5, 0.9, 0.6, 0.8, 0.55, 0.75],
        x: [initialX, initialX + x, initialX + x * 1.05],
        y: [initialY, initialY + y, initialY + y * 1.05],
        scale: 1,
      }}
      transition={isExiting ? {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        opacity: {
          duration: 0.6,
          ease: 'easeOut',
        },
        scale: {
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        },
      } : {
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
        opacity: {
          duration: 2.5 + Math.random() * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: '0 0 12px 4px rgba(251, 191, 36, 0.7), 0 0 20px 6px rgba(245, 158, 11, 0.5), 0 0 30px 8px rgba(217, 119, 6, 0.3)',
        filter: 'blur(0.5px)',
      }}
    />
  );
};

const ConciergeModal: React.FC<ConciergeModalProps> = ({ isOpen, onClose, onActionSelect }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [backgroundFireflies, setBackgroundFireflies] = useState<Array<{ 
    delay: number; 
    duration: number; 
    x: number; 
    y: number; 
    initialX: number; 
    initialY: number; 
    size: number;
    exitDirection: { x: number; y: number };
  }>>([]);

  // Generate golden fireflies globally positioned across entire screen with varied sizes
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const count = 30;
      const newFireflies = Array.from({ length: count }, () => {
        // Scatter across the entire viewport
        const initialX = Math.random() * window.innerWidth;
        const initialY = Math.random() * window.innerHeight;
        const size = 2 + Math.random() * 4; // Varied sizes: 2-6px
        
        // Calculate exit direction to nearest screen edge
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dx = initialX - centerX;
        const dy = initialY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Extend beyond screen edge
        const exitDistance = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        const exitX = initialX + normalizedDx * exitDistance;
        const exitY = initialY + normalizedDy * exitDistance;
        
        return {
          delay: Math.random() * 3,
          duration: 40 + Math.random() * 25, // Extremely slow: 40-65 seconds
          x: (Math.random() - 0.5) * 400, // Larger movement distance for slow drift
          y: (Math.random() - 0.5) * 400,
          initialX,
          initialY,
          size,
          exitDirection: { x: exitX, y: exitY },
        };
      });
      setBackgroundFireflies(newFireflies);
    }
  }, [isOpen]);

  const handleActionClick = (action: 'stake' | 'lend' | 'explore') => {
    setIsExiting(true);
    setTimeout(() => {
      onActionSelect(action);
      onClose();
    }, 600);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fireflies Layer - Behind modal, in front of grid */}
          <div className="fixed inset-0 z-[99] pointer-events-none">
            {backgroundFireflies.map((firefly, index) => (
              <BackgroundFirefly 
                key={index} 
                {...firefly} 
                isExiting={isExiting}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)', // Slight dim for firefly contrast
            }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ 
                scale: isExiting ? 0.95 : 1, 
                opacity: isExiting ? 0 : 1, 
                y: isExiting ? 0 : 0 
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1] // Premium cubic-bezier easing
              }}
              className="w-full max-w-xl relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Very subtle until hovered */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className={cn(
                  'absolute -top-2 -right-2 z-20',
                  'w-7 h-7 rounded-full',
                  'bg-white/5 backdrop-blur-md',
                  'border border-white/10',
                  'flex items-center justify-center',
                  'text-neutral-500',
                  'transition-all duration-300',
                  'hover:bg-white/20 hover:border-white/30 hover:text-white',
                  'hover:shadow-xl',
                )}
                style={{
                  opacity: 0.3,
                }}
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </motion.button>

              {/* Main Modal Container - Compact */}
              <div
                className={cn(
                  'relative rounded-2xl',
                  'bg-black/25 backdrop-blur-[60px]',
                  'shadow-2xl',
                  'p-4 md:p-5',
                  'overflow-hidden',
                )}
                style={{
                  backdropFilter: 'blur(60px)',
                  WebkitBackdropFilter: 'blur(60px)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                  border: '1px solid',
                  borderImage: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%) 1',
                }}
              >
                {/* Title - Golden gradient, smaller */}
                <h1
                  className={cn(
                    'relative z-10',
                    'text-2xl md:text-3xl',
                    'font-light tracking-tight',
                    'text-center mb-4 md:mb-5',
                    'bg-clip-text text-transparent',
                    'leading-tight',
                  )}
                  style={{
                    letterSpacing: '-0.02em',
                    fontWeight: 300,
                    backgroundImage: 'linear-gradient(to bottom, #E8D5B5, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Put your assets to work
                </h1>

                {/* Cards Grid - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative z-10">
                  {/* Earn on SOL Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActionClick('stake')}
                    className={cn(
                      'group relative',
                      'flex flex-col items-center justify-center',
                      'p-4 md:p-5',
                      'rounded-xl',
                      'bg-white/5 backdrop-blur-sm',
                      'border border-white/10',
                      'transition-all duration-500 ease-out',
                      'overflow-visible',
                      'hover:border-white/20',
                      'hover:bg-white/8',
                    )}
                    style={{
                      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    }}
                  >
                    {/* Soft Color Glow Behind Icon */}
                    <div
                      className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-20 h-20 rounded-full',
                        'bg-emerald-500/20',
                        'group-hover:bg-emerald-500/30',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-0',
                      )}
                      style={{
                        top: 'calc(50% - 2.5rem)',
                        filter: 'blur(48px)',
                      }}
                    />

                    {/* Hover Glow Effect */}
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl',
                        'bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0',
                        'group-hover:from-emerald-500/10 group-hover:via-emerald-500/5 group-hover:to-transparent',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-[1]',
                      )}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl',
                          'bg-emerald-500/10 backdrop-blur-sm',
                          'border border-emerald-500/20',
                          'flex items-center justify-center',
                          'group-hover:bg-emerald-500/15',
                          'group-hover:border-emerald-500/30',
                          'transition-all duration-500',
                          'shadow-lg group-hover:shadow-emerald-500/20',
                          'relative z-10',
                        )}
                      >
                        <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <h2
                        className={cn(
                          'text-base md:text-lg',
                          'font-light text-white',
                          'text-center',
                        )}
                        style={{
                          letterSpacing: '-0.01em',
                          fontWeight: 300,
                        }}
                      >
                        Earn on SOL
                      </h2>
                    </div>
                  </motion.button>

                  {/* Earn on Stablecoins Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActionClick('lend')}
                    className={cn(
                      'group relative',
                      'flex flex-col items-center justify-center',
                      'p-4 md:p-5',
                      'rounded-xl',
                      'bg-white/5 backdrop-blur-sm',
                      'border border-white/10',
                      'transition-all duration-500 ease-out',
                      'overflow-visible',
                      'hover:border-white/20',
                      'hover:bg-white/8',
                    )}
                    style={{
                      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    }}
                  >
                    {/* Soft Color Glow Behind Icon */}
                    <div
                      className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-20 h-20 rounded-full',
                        'bg-blue-500/20',
                        'group-hover:bg-blue-500/30',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-0',
                      )}
                      style={{
                        top: 'calc(50% - 2.5rem)',
                        filter: 'blur(48px)',
                      }}
                    />

                    {/* Hover Glow Effect */}
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl',
                        'bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0',
                        'group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-transparent',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-[1]',
                      )}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl',
                          'bg-blue-500/10 backdrop-blur-sm',
                          'border border-blue-500/20',
                          'flex items-center justify-center',
                          'group-hover:bg-blue-500/15',
                          'group-hover:border-blue-500/30',
                          'transition-all duration-500',
                          'shadow-lg group-hover:shadow-blue-500/20',
                          'relative z-10',
                        )}
                      >
                        <Coins className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <h2
                        className={cn(
                          'text-base md:text-lg',
                          'font-light text-white',
                          'text-center',
                        )}
                        style={{
                          letterSpacing: '-0.01em',
                          fontWeight: 300,
                        }}
                      >
                        Earn on Stablecoins
                      </h2>
                    </div>
                  </motion.button>

                  {/* Explore & Learn Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActionClick('explore')}
                    className={cn(
                      'group relative',
                      'flex flex-col items-center justify-center',
                      'p-4 md:p-5',
                      'rounded-xl',
                      'bg-white/5 backdrop-blur-sm',
                      'border border-white/10',
                      'transition-all duration-500 ease-out',
                      'overflow-visible',
                      'hover:border-white/20',
                      'hover:bg-white/8',
                    )}
                    style={{
                      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    }}
                  >
                    {/* Soft Color Glow Behind Icon */}
                    <div
                      className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-20 h-20 rounded-full',
                        'bg-neutral-400/20',
                        'group-hover:bg-neutral-400/30',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-0',
                      )}
                      style={{
                        top: 'calc(50% - 2.5rem)',
                        filter: 'blur(48px)',
                      }}
                    />

                    {/* Hover Glow Effect */}
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl',
                        'bg-gradient-to-br from-neutral-400/0 via-neutral-400/0 to-neutral-400/0',
                        'group-hover:from-neutral-400/10 group-hover:via-neutral-400/5 group-hover:to-transparent',
                        'transition-all duration-500',
                        'pointer-events-none',
                        'z-[1]',
                      )}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl',
                          'bg-neutral-500/10 backdrop-blur-sm',
                          'border border-neutral-500/20',
                          'flex items-center justify-center',
                          'group-hover:bg-neutral-500/15',
                          'group-hover:border-neutral-500/30',
                          'transition-all duration-500',
                          'shadow-lg group-hover:shadow-neutral-500/20',
                          'relative z-10',
                        )}
                      >
                        <BookOpen className="w-6 h-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <h2
                        className={cn(
                          'text-base md:text-lg',
                          'font-light text-white',
                          'text-center',
                        )}
                        style={{
                          letterSpacing: '-0.01em',
                          fontWeight: 300,
                        }}
                      >
                        Explore & Learn
                      </h2>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConciergeModal;
