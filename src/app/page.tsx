'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Target, LogOut, Settings, Sun, Moon, User } from 'lucide-react'
import { isAuthenticated, isAdmin, logout, getCurrentUser } from '@/lib/auth'
import { useTheme } from '@/lib/ThemeContext'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
      
      const user = await getCurrentUser()
      if (user && 'email' in user && user.email) {
        setUserName(user.email.split('@')[0])
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portal de Vendas</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span className="capitalize">{userName}</span>
              </div>

              {userIsAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 p-2 sm:p-0 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              
              <button
                onClick={async () => {
                  await logout()
                  router.push('/login')
                }}
                className="flex items-center gap-1 p-2 sm:p-0 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Dashboard Cards */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Card Catálogo */}
          <Link 
            href="/catalogo"
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 sm:p-12 text-center h-64 sm:h-80"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Catálogo de Produtos</h2>
              <p className="text-gray-500 dark:text-gray-400">Acesse todo o portfólio de produtos, fotos e detalhes técnicos.</p>
            </div>
          </Link>

          {/* Card Metas */}
          <Link 
            href="/metas"
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 sm:p-12 text-center h-64 sm:h-80"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Minhas Metas</h2>
              <p className="text-gray-500 dark:text-gray-400">Acompanhe seu desempenho mensal, KPIs e lance sua produção diária.</p>
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