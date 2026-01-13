'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Target, FileSpreadsheet, Home } from 'lucide-react'

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  // Esconder menu ao rolar para baixo, mostrar ao rolar para cima
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Não mostrar em páginas de login/admin
  const hiddenPaths = ['/login', '/admin']
  if (hiddenPaths.some(p => pathname?.startsWith(p))) {
    return null
  }

  if (!isMobile) {
    return null
  }

  const getActiveItem = () => {
    if (pathname === '/') return 'inicio'
    if (pathname?.startsWith('/catalogo')) return 'catalogo'
    if (pathname?.startsWith('/metas')) return 'metas'
    if (pathname?.startsWith('/sales-and-billing')) return 'vendas'
    return ''
  }

  const activeItem = getActiveItem()

  return (
    <>
      {/* Espaçador para evitar que conteúdo fique atrás do menu */}
      <div className="h-20 md:hidden" />
      
      {/* Menu inferior fixo */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-50 md:hidden
          bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700
          shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around h-16">
          {/* Início */}
          <Link
            href="/"
            className={`
              flex flex-col items-center justify-center flex-1 px-1 py-2 relative
              transition-all duration-200 active:scale-95
              ${activeItem === 'inicio' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {activeItem === 'inicio' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
            )}
            <span className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
              transition-all duration-200
              ${activeItem === 'inicio' ? 'bg-blue-100 dark:bg-blue-900/40 scale-110' : ''}
            `}>
              <Home className="h-5 w-5" />
            </span>
            <span className={`text-[10px] font-medium ${activeItem === 'inicio' ? 'font-semibold' : ''}`}>
              Início
            </span>
          </Link>

          {/* Catálogo */}
          <Link
            href="/catalogo"
            className={`
              flex flex-col items-center justify-center flex-1 px-1 py-2 relative
              transition-all duration-200 active:scale-95
              ${activeItem === 'catalogo' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {activeItem === 'catalogo' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
            )}
            <span className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
              transition-all duration-200
              ${activeItem === 'catalogo' ? 'bg-blue-100 dark:bg-blue-900/40 scale-110' : ''}
            `}>
              <Package className="h-5 w-5" />
            </span>
            <span className={`text-[10px] font-medium ${activeItem === 'catalogo' ? 'font-semibold' : ''}`}>
              Catálogo
            </span>
          </Link>

          {/* Metas */}
          <Link
            href="/metas"
            className={`
              flex flex-col items-center justify-center flex-1 px-1 py-2 relative
              transition-all duration-200 active:scale-95
              ${activeItem === 'metas' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {activeItem === 'metas' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
            )}
            <span className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
              transition-all duration-200
              ${activeItem === 'metas' ? 'bg-blue-100 dark:bg-blue-900/40 scale-110' : ''}
            `}>
              <Target className="h-5 w-5" />
            </span>
            <span className={`text-[10px] font-medium ${activeItem === 'metas' ? 'font-semibold' : ''}`}>
              Metas
            </span>
          </Link>

          {/* Vendas */}
          <Link
            href="/sales-and-billing"
            className={`
              flex flex-col items-center justify-center flex-1 px-1 py-2 relative
              transition-all duration-200 active:scale-95
              ${activeItem === 'vendas' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {activeItem === 'vendas' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
            )}
            <span className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
              transition-all duration-200
              ${activeItem === 'vendas' ? 'bg-blue-100 dark:bg-blue-900/40 scale-110' : ''}
            `}>
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <span className={`text-[10px] font-medium ${activeItem === 'vendas' ? 'font-semibold' : ''}`}>
              Vendas
            </span>
          </Link>
        </div>
      </nav>
    </>
  )
}
