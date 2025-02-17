'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo, useSpring } from 'framer-motion'
import { TabsList } from '@/components/ui'
import { cn } from '@/lib/utils'

interface DraggableTabsListProps extends React.ComponentProps<typeof TabsList> {
  onScrollToTab?: (value: string) => void;
  selectedTab?: string;
}

const DraggableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  DraggableTabsListProps
>(({ className, children, onScrollToTab, selectedTab, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })
  const x = useMotionValue(0)
  const springX = useSpring(x, {
    damping: 20,
    stiffness: 400,
    mass: 0.2
  })

  const updateConstraints = () => {
    if (containerRef.current && tabsListRef.current) {
      const container = containerRef.current
      const tabsList = tabsListRef.current
      const containerWidth = container.offsetWidth
      const tabsWidth = Array.from(tabsList.children).reduce((total, child) => total + child.clientWidth, 0)
      
      setConstraints({
        left: 0,
        right: Math.min(0, containerWidth - tabsWidth)
      })
    }
  }

  useEffect(() => {
    updateConstraints()
    const resizeObserver = new ResizeObserver(updateConstraints)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [children])

  const scrollToCenter = (element: HTMLElement) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    
    const targetX = Math.min(
      0,
      Math.max(
        constraints.right,
        -(elementRect.left - containerRect.left - (containerRect.width - elementRect.width) / 2)
      )
    )

    animate(x, targetX, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.2
    })
  }

  useEffect(() => {
    if (selectedTab && containerRef.current && !isDragging) {
      const container = containerRef.current
      const selectedElement = container.querySelector(`[data-state="active"]`) as HTMLElement
      if (selectedElement) {
        scrollToCenter(selectedElement)
      }
    }
  }, [selectedTab, constraints.right, x, isDragging])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (containerRef.current) {
      const currentX = x.get()
      const newX = Math.min(
        0,
        Math.max(
          constraints.right,
          currentX - e.deltaX - e.deltaY
        )
      )
      
      x.set(newX)
    }
  }

  const handleDragStart = () => setIsDragging(true)
  
  const handleDrag = (_: any, info: PanInfo) => {
    const currentX = x.get()
    const newX = Math.min(
      0,
      Math.max(
        constraints.right,
        currentX + info.delta.x
      )
    )
    x.set(newX)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (containerRef.current) {
      const container = containerRef.current
      const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))
      let closestTab: HTMLElement | null = null
      let minDistance = Infinity

      tabs.forEach((tab) => {
        const rect = tab.getBoundingClientRect()
        const tabCenter = rect.left + rect.width / 2
        const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2
        const distance = Math.abs(tabCenter - containerCenter)
        
        if (distance < minDistance) {
          minDistance = distance
          closestTab = tab
        }
      })

      if (closestTab) {
        scrollToCenter(closestTab)
      }
    }
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative overflow-hidden w-full touch-none"
      onWheel={handleWheel}
    >
      <motion.div
        drag="x"
        dragConstraints={constraints}
        dragElastic={0}
        dragMomentum={false}
        dragTransition={{ power: 0.3, timeConstant: 200 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x: springX }}
        className="cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <TabsList
          ref={(el) => {
            if (typeof ref === 'function') ref(el)
            else if (ref) ref.current = el
            tabsListRef.current = el as HTMLDivElement
          }}
          className={cn(
            "p-0 h-fit justify-start bg-neutral-100 dark:bg-neutral-700 inline-flex rounded-none flex-nowrap gap-0 select-none",
            className
          )}
          {...props}
        >
          {children}
        </TabsList>
      </motion.div>
    </motion.div>
  )
})

DraggableTabsList.displayName = 'DraggableTabsList'

export default DraggableTabsList 