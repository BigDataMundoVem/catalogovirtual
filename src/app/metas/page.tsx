'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Target, Phone, FileText, ShoppingBag, Plus, Calendar, ChevronLeft, ChevronRight, X, Save, AlertCircle, Users, Search, Lock, Check, CheckCircle2 } from 'lucide-react'
import { isAuthenticated, getCurrentUser, isLocalMode, isAdmin } from '@/lib/auth'
import { getUserPerformance, getLeaderboardData, UserPerformance, LeaderboardEntry, getWeeklyLogs, upsertPerformanceLog, PerformanceLog } from '@/lib/goals'
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
  
  // Weekly Timesheet State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [weeklyLogs, setWeeklyLogs] = useState<PerformanceLog[]>([])
  const [expandedDay, setExpandedDay] = useState<string | null>(null) // Date string YYYY-MM-DD
  const [dayForm, setDayForm] = useState({
    contacts: 0,
    quotes: 0,
    orders: 0
  })
  const [savingDay, setSavingDay] = useState<string | null>(null)

  function getMonday(d: Date) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekDays(startDate: Date) {
    const days = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      days.push(d)
    }
    return days
  }

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
      if (userIsAdmin) {
        loadLeaderboard()
      } else {
        loadWeeklyData()
      }
    }
  }, [userId, currentDate, currentWeekStart, userIsAdmin])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      if (isLocal) {
        // Mock data
        setLeaderboard([]) 
      } else {
        const data = await getLeaderboardData(currentDate.getMonth() + 1, currentDate.getFullYear())
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyData = async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Load monthly summary for header
      const performance = await getUserPerformance(userId, currentDate.getMonth() + 1, currentDate.getFullYear())
      setCurrentUserEntry({
        user: { id: userId, full_name: 'Me', email: '', role: 'viewer', avatar_url: null },
        goals: performance.goals,
        realized: performance.realized
      })

      // Load weekly logs
      const weekDays = getWeekDays(currentWeekStart)
      const startStr = weekDays[0].toISOString().split('T')[0]
      const endStr = weekDays[4].toISOString().split('T')[0]
      
      if (isLocal) {
        setWeeklyLogs([])
      } else {
        const logs = await getWeeklyLogs(userId, startStr, endStr)
        setWeeklyLogs(logs)
      }
    } catch (error) {
      console.error('Error loading weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDayClick = (dateStr: string, existingLog?: PerformanceLog) => {
    // Check if future date
    if (new Date(dateStr) > new Date()) return

    if (expandedDay === dateStr) {
      setExpandedDay(null)
    } else {
      setExpandedDay(dateStr)
      setDayForm({
        contacts: existingLog?.contacts_done || 0,
        quotes: existingLog?.quotes_done || 0,
        orders: existingLog?.orders_done || 0
      })
    }
  }

  const handleSaveDay = async (dateStr: string) => {
    if (!userId) return
    setSavingDay(dateStr)

    if (isLocal) {
      alert('Modo local não salva dados.')
      setSavingDay(null)
      return
    }

    const result = await upsertPerformanceLog(userId, {
      date: dateStr,
      contacts: dayForm.contacts,
      quotes: dayForm.quotes,
      orders: dayForm.orders
    })

    if (result.success) {
      await loadWeeklyData()
      setExpandedDay(null)
    } else {
      alert('Erro ao salvar: ' + result.error)
    }
    setSavingDay(null)
  }

  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + (offset * 7))
    setCurrentWeekStart(newStart)
    // Also update month if the week crosses month boundary significantly? 
    // Ideally keep them separate or sync them. For simplicity, we keep month selector independent for summary.
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const weekRangeStr = `${currentWeekStart.getDate()} ${currentWeekStart.toLocaleString('pt-BR', { month: 'short' })} - ${new Date(currentWeekStart.getTime() + 4 * 86400000).getDate()} ${new Date(currentWeekStart.getTime() + 4 * 86400000).toLocaleString('pt-BR', { month: 'short' })}`

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

  // Helper for Table Cell
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
                <h1 className="text-xl font-bold">Metas</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userIsAdmin ? 'Gestão de Equipe' : 'Minha Produção'}</p>    
              </div>
            </div>
          </div>
          
          {userIsAdmin && (
            <div className="flex items-center gap-2">
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLocal && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5" />
            <span>Modo Demonstração (Local). Os dados exibidos são fictícios.</span>
          </div>
        )}

        {/* --- VIEW FOR ADMIN: LEADERBOARD TABLE --- */}
        {userIsAdmin ? (
          <>
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
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-4 sm:col-span-3">Usuário</div>
                  <div className="col-span-8 sm:col-span-3 text-center sm:text-left">Contatos</div>
                  <div className="col-span-6 sm:col-span-3 hidden sm:block">Orçamentos</div>
                  <div className="col-span-6 sm:col-span-3 hidden sm:block">Pedidos</div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum registro encontrado para este mês.
                    </div>
                  ) : (
                    leaderboard.map((entry) => (
                      <div key={entry.user.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
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
                            </p>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">{entry.user.role}</p>
                          </div>
                        </div>
                        <div className="col-span-8 sm:col-span-3 flex justify-center sm:justify-start">     
                          <KPICell current={entry.realized.contacts} target={entry.goals?.target_contacts || 0} icon={Phone} />
                        </div>
                        <div className="col-span-6 sm:col-span-3 hidden sm:flex">
                          <KPICell current={entry.realized.quotes} target={entry.goals?.target_quotes || 0} icon={FileText} />
                        </div>
                        <div className="col-span-6 sm:col-span-3 hidden sm:flex">
                          <KPICell current={entry.realized.orders} target={entry.goals?.target_orders || 0} icon={ShoppingBag} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* --- VIEW FOR SELLER: WEEKLY TIMESHEET --- */
          <>
            {/* Scoreboard Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold capitalize">{monthName}</h2>
                  <p className="text-blue-100 text-sm">Resumo Mensal</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {currentUserEntry?.realized.contacts}/{currentUserEntry?.goals?.target_contacts || '-'}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {currentUserEntry?.realized.quotes}/{currentUserEntry?.goals?.target_quotes || '-'}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    {currentUserEntry?.realized.orders}/{currentUserEntry?.goals?.target_orders || '-'}
                  </div>
                </div>
              </div>
              {/* Master Progress Bar (Average of all 3?) -> Just showing one for visual flair or sum */}
              <div className="w-full bg-black/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div> 
              </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="font-semibold text-gray-700 dark:text-gray-200">
                {weekRangeStr}
              </div>
              <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekly Grid/Accordion */}
            <div className="space-y-3">
              {getWeekDays(currentWeekStart).map((day) => {
                const dateStr = day.toISOString().split('T')[0]
                const log = weeklyLogs.find(l => l.entry_date === dateStr)
                const isExpanded = expandedDay === dateStr
                const isFuture = day > new Date()
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                const hasData = log && (log.contacts_done > 0 || log.quotes_done > 0 || log.orders_done > 0)

                return (
                  <div 
                    key={dateStr}
                    className={`
                      bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 overflow-hidden
                      ${isExpanded ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm'}
                      ${isFuture ? 'opacity-60 grayscale' : ''}
                    `}
                  >
                    {/* Card Header (Always Visible) */}
                    <button
                      onClick={() => handleDayClick(dateStr, log)}
                      disabled={isFuture}
                      className="w-full flex items-center justify-between p-4 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold
                          ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                        `}>
                          <span>{day.getDate()}</span>
                          <span className="text-[10px] font-normal uppercase">{day.toLocaleString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
                        </div>
                        
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {day.toLocaleString('pt-BR', { weekday: 'long' })}
                          </h3>
                          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {hasData ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Registrado
                              </span>
                            ) : (
                              <span>Sem registros</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isFuture ? <Lock className="h-5 w-5 text-gray-400" /> : 
                         hasData ? <div className="text-sm font-medium text-gray-900 dark:text-white">{log?.contacts_done} • {log?.quotes_done} • {log?.orders_done}</div> :
                         <Plus className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Expandable Input Area */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="grid grid-cols-3 gap-3 py-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Contatos
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.contacts}
                              onChange={(e) => setDayForm({...dayForm, contacts: parseInt(e.target.value) || 0})}
                              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Orçamentos
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.quotes}
                              onChange={(e) => setDayForm({...dayForm, quotes: parseInt(e.target.value) || 0})}
                              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" /> Pedidos
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.orders}
                              onChange={(e) => setDayForm({...dayForm, orders: parseInt(e.target.value) || 0})}
                              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSaveDay(dateStr)}
                          disabled={!!savingDay}
                          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          {savingDay === dateStr ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Dia</>}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}