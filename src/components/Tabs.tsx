'use client'

import React, { useRef, useEffect, useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // Detectar mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll para a aba ativa quando mudar
  useEffect(() => {
    if (isMobile && activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const activeButton = activeTabRef.current
      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()
      
      const scrollLeft = buttonRect.left - containerRect.left + container.scrollLeft - (containerRect.width / 2) + (buttonRect.width / 2)
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }
  }, [activeTab, isMobile])

  if (!tabs || tabs.length === 0) {
    return null
  }

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: '44px' }}>
      {/* Container com scroll horizontal em mobile */}
      <div
        ref={scrollContainerRef}
        className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 hide-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onChange(tab.id)}
              type="button"
              className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 relative z-0 min-h-[44px]
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02] sm:scale-105 font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95'
                }
              `}
              style={{ display: 'flex' }}
            >
              {tab.icon && (
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 min-w-[20px] text-center
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {tab.count}
                </span>
              )}
              {/* Indicador de aba ativa (linha inferior) */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Indicador de scroll em mobile (gradiente nas bordas) */}
      {isMobile && (
        <>
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent pointer-events-none z-10" />
        </>
      )}
    </div>
  )
}

