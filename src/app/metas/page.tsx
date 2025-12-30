'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Target, Phone, FileText, ShoppingBag, Plus, Calendar, ChevronLeft, ChevronRight, X, Save, AlertCircle, Users, Search } from 'lucide-react'
import { isAuthenticated, getCurrentUser, isLocalMode, isAdmin } from '@/lib/auth'
import { getUserPerformance, addPerformanceLog, getLeaderboardData, UserPerformance, LeaderboardEntry } from '@/lib/goals'
import Link from 'next/link'
import Image from 'next/image'

export default function GoalsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  
  // Data State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [logForm, setLogForm] = useState({
    contacts: 0,
    quotes: 0,
    orders: 0,
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      setIsLocal(isLocalMode())
      const user = await getCurrentUser()
      if (user) {
        setUserId(user.id)
      }
      
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
      
      setMounted(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId, currentDate])

  const loadData = async () => {
    setLoading(true)
    try {
      if (isLocal) {
        // Mock data for local mode with multiple users
        const mockEntries: LeaderboardEntry[] = [
          {
            user: { id: userId!, full_name: 'Você', email: 'voce@exemplo.com', role: 'vendedor', avatar_url: null },
            goals: { id: '1', user_id: userId!, month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), target_contacts: 100, target_quotes: 20, target_orders: 5 },
            realized: { contacts: 45, quotes: 8, orders: 2 }
          },
          {
            user: { id: 'user2', full_name: 'João Silva', email: 'joao@exemplo.com', role: 'vendedor', avatar_url: null },
            goals: { id: '2', user_id: 'user2', month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), target_contacts: 120, target_quotes: 30, target_orders: 8 },
            realized: { contacts: 90, quotes: 25, orders: 6 }
          },
          {
            user: { id: 'user3', full_name: 'Maria Souza', email: 'maria@exemplo.com', role: 'vendedor', avatar_url: null },
            goals: { id: '3', user_id: 'user3', month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), target_contacts: 80, target_quotes: 15, target_orders: 4 },
            realized: { contacts: 20, quotes: 2, orders: 0 }
          }
        ]
        setLeaderboard(mockEntries)
        setCurrentUserEntry(mockEntries.find(e => e.user.id === userId) || null)
      } else {
        const data = await getLeaderboardData(currentDate.getMonth() + 1, currentDate.getFullYear())
        setLeaderboard(data)
        if (userId) {
          const myEntry = data.find(e => e.user.id === userId)
          setCurrentUserEntry(myEntry || null)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSubmitting(true)
    
    if (isLocal) {
      alert('Modo local: Dados não serão salvos no banco.')
      setSubmitting(false)
      setIsModalOpen(false)
      return
    }

    const result = await addPerformanceLog(userId, {
      contacts: logForm.contacts,
      quotes: logForm.quotes,
      orders: logForm.orders,
      notes: logForm.notes
    })

    if (result.success) {
      await loadData()
      setLogForm({ contacts: 0, quotes: 0, orders: 0, notes: '' })
      setIsModalOpen(false)
    } else {
      alert('Erro ao salvar: ' + result.error)
    }
    setSubmitting(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // Progress Bar Logic
  const calculateProgress = (current: number, target: number) => {
    if (!target) return { percent: 0, color: 'bg-gray-200 dark:bg-gray-700' }
    const rawPercent = (current / target) * 100
    const percent = Math.min(rawPercent, 100)
    
    let color = 'bg-red-500'
    if (rawPercent >= 40 && rawPercent < 80) color = 'bg-yellow-500'
    if (rawPercent >= 80 && rawPercent < 100) color = 'bg-blue-500'
    if (rawPercent >= 100) color = 'bg-green-500'
    
    return { percent, color }
  }

  // Component for Table Cell
  const KPICell = ({ current, target, icon: Icon }: { current: number, target: number, icon: any }) => {
    const { percent, color } = calculateProgress(current, target)
    return (
      <div className="flex flex-col gap-1 w-full max-w-[140px]">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-900 dark:text-white">{current}</span>
          </div>
          <span className="text-xs text-gray-400">/{target || '-'}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${color}`} 
            style={{ width: `${percent}%` }} 
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Metas do Mês</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Acompanhamento de Equipe</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userIsAdmin && (
              <Link href="/admin" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Users className="h-4 w-4" />
                Gerenciar Equipe
              </Link>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Lançar Produção</span>
              <span className="sm:hidden">Lançar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLocal && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5" />
            <span>Modo Demonstração (Local). Os dados exibidos são fictícios.</span>
          </div>
        )}

        {/* Month Selector */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 font-semibold capitalize px-6 min-w-[200px] justify-center">
              <Calendar className="h-5 w-5 text-gray-500" />
              {monthName}
            </div>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-4 sm:col-span-3">Usuário</div>
              <div className="col-span-8 sm:col-span-3 text-center sm:text-left">Contatos</div>
              <div className="col-span-6 sm:col-span-3 hidden sm:block">Orçamentos</div>
              <div className="col-span-6 sm:col-span-3 hidden sm:block">Pedidos</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhum registro encontrado para este mês.
                </div>
              ) : (
                leaderboard.map((entry) => (
                  <div key={entry.user.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${entry.user.id === userId ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                    {/* User Column */}
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500">
                        {entry.user.avatar_url ? (
                          <img src={entry.user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold">{entry.user.full_name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                          {entry.user.full_name}
                          {entry.user.id === userId && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">(Você)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate hidden sm:block">{entry.user.role}</p>
                      </div>
                    </div>

                    {/* Contatos - Visible on Mobile */}
                    <div className="col-span-8 sm:col-span-3 flex justify-center sm:justify-start">
                      <KPICell current={entry.realized.contacts} target={entry.goals?.target_contacts || 0} icon={Phone} />
                    </div>

                    {/* Orçamentos - Hidden on Mobile */}
                    <div className="col-span-6 sm:col-span-3 hidden sm:flex">
                      <KPICell current={entry.realized.quotes} target={entry.goals?.target_quotes || 0} icon={FileText} />
                    </div>

                    {/* Pedidos - Hidden on Mobile */}
                    <div className="col-span-6 sm:col-span-3 hidden sm:flex">
                      <KPICell current={entry.realized.orders} target={entry.goals?.target_orders || 0} icon={ShoppingBag} />
                    </div>

                    {/* Mobile Only: Extra Row for Quotes/Orders if needed, or keeping it simple */}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Produção</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Contatos</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Plus className="h-4 w-4" />
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        value={logForm.contacts}
                        onChange={e => setLogForm({...logForm, contacts: parseInt(e.target.value) || 0})}
                        className="w-full pl-8 pr-3 py-2 text-center border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Orçamentos</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Plus className="h-4 w-4" />
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        value={logForm.quotes}
                        onChange={e => setLogForm({...logForm, quotes: parseInt(e.target.value) || 0})}
                        className="w-full pl-8 pr-3 py-2 text-center border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Pedidos</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Plus className="h-4 w-4" />
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        value={logForm.orders}
                        onChange={e => setLogForm({...logForm, orders: parseInt(e.target.value) || 0})}
                        className="w-full pl-8 pr-3 py-2 text-center border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações (Opcional)</label>
                  <textarea 
                    rows={3}
                    value={logForm.notes}
                    onChange={e => setLogForm({...logForm, notes: e.target.value})}
                    placeholder="Ex: Fechei com cliente X..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Salvar Lançamento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
