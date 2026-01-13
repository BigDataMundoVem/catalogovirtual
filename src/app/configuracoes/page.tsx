'use client'

import Link from 'next/link'
import { ArrowLeft, Settings, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'

export default function ConfiguracoesPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Configurações</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Preferências da aplicação</p>
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Aparência</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Altere rapidamente o tema do sistema.
          </p>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Alternar tema
          </button>
        </div>
      </main>
    </div>
  )
}


