'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

interface Bee {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  baseX: number;
  baseY: number;
  hoverOffset: number;
  hoverSpeed: number;
  prevX: number;
  prevY: number;
}

interface HoveringBeesProps {
  count?: number;
}

export const HoveringBees: React.FC<HoveringBeesProps> = ({ count = 12 }) => {
  const [bees, setBees] = useState<Bee[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Initialize bees with random positions
  useEffect(() => {
    const initializeBees = () => {
      const newBees: Bee[] = [];
      for (let i = 0; i < count; i++) {
        // Center in top half of container with larger boundary
        const centerX = containerSize.width * 0.5;
        const centerY = containerSize.height * 0.25; // Top quarter instead of center
        const rangeX = containerSize.width * 0.8; // Increased from 0.3 to 0.45
        const rangeY = containerSize.height * 0.35; // Increased from 0.2 to 0.35

        const baseX = centerX + (Math.random() - 0.5) * rangeX;
        const baseY = centerY + (Math.random() - 0.5) * rangeY;

        newBees.push({
          id: i,
          x: baseX,
          y: baseY,
          rotation: Math.random() * 360,
          scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
          baseX,
          baseY,
          hoverOffset: Math.random() * Math.PI * 2,
          hoverSpeed: 0.5 + Math.random() * 1, // 0.5 to 1.5
          prevX: baseX,
          prevY: baseY,
        });
      }
      setBees(newBees);
    };

    if (containerSize.width > 0 && containerSize.height > 0) {
      initializeBees();
    }
  }, [count, containerSize]);

  // Track mouse position relative to container
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (containerRef) {
        const rect = containerRef.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [containerRef],
  );

  // Update container size
  const updateContainerSize = useCallback(() => {
    if (containerRef) {
      setContainerSize({
        width: containerRef.offsetWidth,
        height: containerRef.offsetHeight,
      });
    }
  }, [containerRef]);

  useEffect(() => {
    updateContainerSize();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateContainerSize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateContainerSize);
    };
  }, [handleMouseMove, updateContainerSize]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setBees((prevBees) => {
        const time = Date.now() * 0.001; // Convert to seconds
        const repulsionRadius = 100;

        return prevBees.map((bee) => {
          // Natural hovering motion
          const hoverX = Math.sin(time * bee.hoverSpeed + bee.hoverOffset) * 20;
          const hoverY = Math.cos(time * bee.hoverSpeed * 0.7 + bee.hoverOffset) * 15;

          let newX = bee.baseX + hoverX;
          let newY = bee.baseY + hoverY;

          // Cursor repulsion - smooth gradual force
          const dx = newX - mousePos.x;
          const dy = newY - mousePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < repulsionRadius && distance > 0) {
            const repulsionForce = (repulsionRadius - distance) / repulsionRadius;

            // Calculate direction vector from cursor to bee (normalized)
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Apply smooth repulsion force
            const repulsionStrength = repulsionForce * 30; // Reduced from 80 to 30 for smoother effect
            newX += dirX * repulsionStrength;
            newY += dirY * repulsionStrength;
          }

          // Boundary constraints (soft boundaries) - top half with larger area
          const centerX = containerSize.width * 0.5;
          const centerY = containerSize.height * 0.25;
          const maxRangeX = containerSize.width * 1; // Increased from 0.4 to 0.5
          const maxRangeY = containerSize.height * 0.5; // Increased from 0.25 to 0.4

          if (Math.abs(newX - centerX) > maxRangeX) {
            newX = centerX + Math.sign(newX - centerX) * maxRangeX;
          }
          if (Math.abs(newY - centerY) > maxRangeY) {
            newY = centerY + Math.sign(newY - centerY) * maxRangeY;
          }

          // Calculate flight direction and make bee face that direction
          const velocityX = newX - bee.prevX;
          const velocityY = newY - bee.prevY;
          const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

          let newRotation = bee.rotation;
          if (speed > 0.1) {
            // Only update rotation if bee is moving significantly
            // Calculate angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
            const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
            // Smooth rotation towards flight direction
            const targetRotation = angle;
            const rotationDiff = targetRotation - bee.rotation;

            // Normalize rotation difference to [-180, 180]
            let normalizedDiff = rotationDiff;
            while (normalizedDiff > 180) normalizedDiff -= 360;
            while (normalizedDiff < -180) normalizedDiff += 360;

            // Smooth rotation (adjust speed as needed)
            newRotation = bee.rotation + normalizedDiff * 0.1;
          }

          return {
            ...bee,
            x: newX,
            y: newY,
            rotation: newRotation,
            prevX: bee.x,
            prevY: bee.y,
          };
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    if (bees.length > 0) {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [bees.length, mousePos, containerSize]);

  return (
    <div ref={setContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {bees.map((bee) => (
        <motion.div
          key={bee.id}
          className="absolute"
          style={{
            left: bee.x - 20, // Center the 40px image
            top: bee.y - 20,
          }}
          animate={{
            rotate: bee.rotation,
            scale: bee.scale,
          }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
          }}
        >
          <Image
            src="/logo.png"
            width={40}
            height={40}
            alt="Bee"
            className="opacity-60 hover:opacity-80 transition-opacity"
          />
        </motion.div>
      ))}
    </div>
  );
};
