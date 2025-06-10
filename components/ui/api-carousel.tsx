"use client"

import React, { useRef, useEffect } from "react";
import Image from "next/image";

const apiServices = [
  { name: 'Birdeye', logo: '/logos/birdeye.png' },
  { name: 'Jupiter', logo: '/logos/jupiter.png' },
  { name: 'Staking Rewards', logo: '/logos/stakingrewards.png' },
  { name: 'HelloMoon', logo: '/logos/hellomoon.png' },
  { name: 'Arkham', logo: '/logos/arkham.png' },
  { name: '0x', logo: '/logos/0x.png' },
  { name: 'Moralis', logo: '/logos/moralis.png' },
  { name: 'Helius', logo: '/logos/helius.png' },
  { name: 'Bubblemaps', logo: '/logos/bubblemaps.png' },
  { name: 'Twitter', logo: '/logos/x.png' },
  { name: 'Raydium', logo: '/logos/raydium.png' },
];

const CARD_HEIGHT = 48; // px
const CARD_GAP = 20; // px
const ICON_SIZE = 32; // px
const ANIMATION_SPEED = 1.2; // px per frame

export default function ApiCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // Duplicate the list for infinite scroll effect
  const items = [...apiServices, ...apiServices];

  useEffect(() => {
    let totalWidth = 0;
    cardsRef.current.forEach((card, index) => {
      if (index < apiServices.length) { // Only measure original items
        totalWidth += card.offsetWidth + CARD_GAP;
      }
    });

    let offset = 0;
    const animate = () => {
      if (containerRef.current) {
        offset += ANIMATION_SPEED;
        if (offset >= totalWidth) {
          offset = 0;
        }
        containerRef.current.style.transform = `translateX(-${offset}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center pt-16 pb-8">
      <div className="mb-6 text-2xl font-bold text-brand-600 text-center">
        Supported Services
      </div>
      <div className="relative overflow-hidden w-full max-w-5xl mx-auto" style={{ height: CARD_HEIGHT + 16 }}>
        {/* Fading edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10" style={{background: 'linear-gradient(90deg, var(--gradient-start) 60%, transparent 100%)'}} />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10" style={{background: 'linear-gradient(270deg, var(--gradient-start) 60%, transparent 100%)'}} />
        
        <div
          ref={containerRef}
          className="flex gap-6 will-change-transform relative z-[1]"
          style={{ transition: "none" }}
        >
          {items.map((service, idx) => (
            <div
              key={idx + service.name}
              ref={el => {
                if (el) cardsRef.current[idx] = el;
              }}
              className="flex items-center border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-xl shadow-lg px-6 py-3"
              style={{
                height: CARD_HEIGHT,
              }}
            >
              <div className="relative" style={{ width: ICON_SIZE, height: ICON_SIZE, minWidth: ICON_SIZE, minHeight: ICON_SIZE, marginRight: 12 }}>
                <Image
                  src={service.logo}
                  alt={service.name}
                  fill
                  className="object-contain rounded dark:invert-[.15]"
                  sizes="32px"
                />
              </div>
              <span className="text-base font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {service.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 