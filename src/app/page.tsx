'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Target, LogOut, Settings, Sun, Moon, User, FileSpreadsheet } from 'lucide-react'
import { isAuthenticated, isAdmin, logout, getCurrentUser, isSalesActive } from '@/lib/auth'
import { useTheme } from '@/lib/ThemeContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userIsSales, setUserIsSales] = useState(false)
  const [userName, setUserName] = useState('')
  const [userFullName, setUserFullName] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)

      const salesStatus = await isSalesActive()
      setUserIsSales(salesStatus)
      
      const user = await getCurrentUser()
      if (user && 'email' in user && user.email) {
        const emailName = user.email.split('@')[0]
        setUserName(emailName)
        
        // Buscar nome completo do perfil no Supabase
        if (isSupabaseConfigured && supabase && 'id' in user) {
          try {
            const { data: profile } = await (supabase as any)
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single()
            
            if (profile?.full_name) {
              setUserFullName(profile.full_name)
            } else {
              // Capitaliza o nome do email como fallback
              setUserFullName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
            }
          } catch {
            setUserFullName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
          }
        } else {
          setUserFullName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
        }
      }
      
      setMounted(true)
    }
    
    checkAuth()
  }, [router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Image src="/Logo.png" alt="Logo" width={28} height={28} className="object-contain flex-shrink-0 sm:w-8 sm:h-8" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Portal de Acompanhamento</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span className="capitalize truncate max-w-[100px]">{userName}</span>
              </div>

              {userIsAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Admin"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden lg:inline text-sm">Admin</span>
                </Link>
              )}
              
              <button
                onClick={async () => {
                  await logout()
                  router.push('/login')
                }}
                className="flex items-center gap-1 p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Dashboard Cards */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 lg:p-8">
        {/* Mensagem de Boas-Vindas */}
        <div className="w-full max-w-5xl mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Bem-vindo(a) de volta!</p>
                <h2 className="text-white text-lg sm:text-xl lg:text-2xl font-bold capitalize">{userFullName || userName}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Card Catálogo */}
          <Link 
            href="/catalogo"
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center min-h-[160px] sm:h-48 lg:h-56"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3 sm:mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-1.5">Catálogo de Produtos</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">Acesse todo o portfólio de produtos, fotos e detalhes técnicos.</p>
            </div>
          </Link>

          {/* Card Metas - Apenas se for Admin ou Comercial */}
          {(userIsAdmin || userIsSales) && (
            <Link 
              href="/metas"
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center min-h-[160px] sm:h-48 lg:h-56"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3 sm:mb-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">      
                  <Target className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-1.5">Acompanhamento</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">Contatos, Orçamentos e Pedidos</p>
              </div>
            </Link>
          )}

          {/* Card Vendas & Faturamento */}
          <Link 
            href="/sales-and-billing"
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center min-h-[160px] sm:h-48 lg:h-56"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3 sm:mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-1.5">Vendas &amp; Faturamento</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">Consumo, Revenda e Cozinhas Industriais em uma única visão.</p>
            </div>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        &copy; {new Date().getFullYear()} Plataforma de Vendas.
      </footer>
    </div>
  )
}