'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Target, Phone, FileText, ShoppingBag, Plus, Calendar, ChevronLeft, ChevronRight, X, Save, AlertCircle } from 'lucide-react'
import { isAuthenticated, getCurrentUser, isLocalMode } from '@/lib/auth'
import { getUserPerformance, addPerformanceLog, UserPerformance } from '@/lib/goals'
import Link from 'next/link'

export default function GoalsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState<UserPerformance | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)

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
      setMounted(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (userId) {
      loadPerformance()
    }
  }, [userId, currentDate])

  const loadPerformance = async () => {
    if (!userId) return
    setLoading(true)
    try {
      if (isLocal) {
        // Mock data for local mode
        setPerformance({
          goals: {
            id: 'local',
            user_id: userId,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            target_contacts: 100,
            target_quotes: 20,
            target_orders: 5
          },
          realized: {
            contacts: 45,
            quotes: 8,
            orders: 2
          }
        })
      } else {
        const data = await getUserPerformance(userId, currentDate.getMonth() + 1, currentDate.getFullYear())
        setPerformance(data)
      }
    } catch (error) {
      console.error('Error loading performance:', error)
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
      await loadPerformance()
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

  const calculateProgress = (current: number, target: number) => {
    if (!target) return { percent: 0, color: 'bg-gray-300 dark:bg-gray-600' }
    const percent = Math.min((current / target) * 100, 100)
    
    let color = 'bg-red-500'
    if (percent >= 30 && percent < 70) color = 'bg-yellow-500'
    if (percent >= 70 && percent < 100) color = 'bg-blue-500'
    if (percent >= 100) color = 'bg-green-500'
    
    return { percent, color }
  }

  const KPICard = ({ 
    title, 
    icon: Icon, 
    current, 
    target, 
    colorClass,
    bgClass 
  }: { 
    title: string, 
    icon: any, 
    current: number, 
    target: number,
    colorClass: string,
    bgClass: string
  }) => {
    const { percent, color } = calculateProgress(current, target)
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold dark:text-white">{current}</span>
            <span className="text-gray-400 text-sm ml-1">/ {target || '-'}</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${color}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right">
          {Math.round((current / (target || 1)) * 100)}% realizado
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold">Minhas Metas</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLocal && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5" />
            <span>Você está visualizando dados de demonstração (Modo Local). Configure o Supabase para persistir dados.</span>
          </div>
        )}

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold capitalize text-lg">
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard 
                title="Contatos" 
                icon={Phone} 
                current={performance?.realized.contacts || 0} 
                target={performance?.goals?.target_contacts || 0}
                bgClass="bg-blue-100 dark:bg-blue-900/30"
                colorClass="text-blue-600 dark:text-blue-400"
              />
              <KPICard 
                title="Orçamentos" 
                icon={FileText} 
                current={performance?.realized.quotes || 0} 
                target={performance?.goals?.target_quotes || 0}
                bgClass="bg-purple-100 dark:bg-purple-900/30"
                colorClass="text-purple-600 dark:text-purple-400"
              />
              <KPICard 
                title="Pedidos" 
                icon={ShoppingBag} 
                current={performance?.realized.orders || 0} 
                target={performance?.goals?.target_orders || 0}
                bgClass="bg-green-100 dark:bg-green-900/30"
                colorClass="text-green-600 dark:text-green-400"
              />
            </div>

            {/* Action Button */}
            {!performance?.goals ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Metas não definidas</h3>
                <p className="text-gray-500 dark:text-gray-400">Solicite ao administrador para definir suas metas para este mês.</p>
              </div>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium text-lg mx-auto"
              >
                <Plus className="h-6 w-6" />
                Lançar Produção do Dia
              </button>
            )}
          </>
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