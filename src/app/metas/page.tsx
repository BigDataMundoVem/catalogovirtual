'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Target, Phone, Mail, FileText, ShoppingBag, Plus, Calendar, ChevronLeft, ChevronRight, X, Save, AlertCircle, Users, Search, Lock, Check, CheckCircle2, Sun, Moon } from 'lucide-react'
import { isAuthenticated, getCurrentUser, isLocalMode, isAdmin, isSalesActive } from '@/lib/auth'
import { useTheme } from '@/lib/ThemeContext'
import { getUserPerformance, getLeaderboardData, UserPerformance, LeaderboardEntry, getWeeklyLogs, upsertPerformanceLog, PerformanceLog } from '@/lib/goals'
import { useIsMobile } from '@/hooks/useResponsive'
import Link from 'next/link'
import Image from 'next/image'

export default function GoalsPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  
  // Data State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null)
  const [userLastWeekData, setUserLastWeekData] = useState<Record<string, { contacts: number; emails: number; quotes: number; orders: number }>>({})
  const [userTodayData, setUserTodayData] = useState<Record<string, { contacts: number; emails: number; quotes: number; orders: number }>>({})
  
  // Weekly Timesheet State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [weeklyLogs, setWeeklyLogs] = useState<PerformanceLog[]>([])
  const [expandedDay, setExpandedDay] = useState<string | null>(null) // Date string YYYY-MM-DD
  const [dayForm, setDayForm] = useState({
    contacts: 0,
    emails: 0,
    quotes: 0,
    orders: 0
  })
  const [savingDay, setSavingDay] = useState<string | null>(null)
  const [lastWeekSummary, setLastWeekSummary] = useState<{ contacts: number; emails: number; quotes: number; orders: number } | null>(null)

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
      
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)

      // Access Control
      if (!adminStatus) {
        const salesActive = await isSalesActive()
        if (!salesActive) {
          router.push('/') // Redirect if not allowed
          return
        }
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
      if (userIsAdmin) {
        loadLeaderboard()
        loadLastWeekSummary(userId) // Also load last week summary for admin
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
        setUserLastWeekData({})
        setUserTodayData({})
      } else {
        const data = await getLeaderboardData(currentDate.getMonth() + 1, currentDate.getFullYear())
        setLeaderboard(data)
        
        // Load last week data for each user
        const lastWeekDataMap: Record<string, { contacts: number; emails: number; quotes: number; orders: number }> = {}
        
        // Calculate last week dates
        const today = new Date()
        const currentDay = today.getDay()
        let daysToSubtract = currentDay === 0 ? 6 : currentDay + 6
        const lastWeekMonday = new Date(today)
        lastWeekMonday.setDate(today.getDate() - daysToSubtract)
        lastWeekMonday.setHours(0, 0, 0, 0)
        const lastWeekFriday = new Date(lastWeekMonday)
        lastWeekFriday.setDate(lastWeekMonday.getDate() + 4)
        lastWeekFriday.setHours(23, 59, 59, 999)
        const startStr = lastWeekMonday.toISOString().split('T')[0]
        const endStr = lastWeekFriday.toISOString().split('T')[0]
        
        // Load last week data and today data for each user in parallel
        const todayDataMap: Record<string, { contacts: number; emails: number; quotes: number; orders: number }> = {}
        const todayStr = new Date().toISOString().split('T')[0]
        
        await Promise.all(
          data.map(async (entry) => {
            try {
              // Load last week data
              const logs = await getWeeklyLogs(entry.user.id, startStr, endStr)
              const summary = logs.reduce((acc, log) => ({
                contacts: acc.contacts + (log.contacts_done || 0),
                emails: acc.emails + (log.emails_done || 0),
                quotes: acc.quotes + (log.quotes_done || 0),
                orders: acc.orders + (log.orders_done || 0)
              }), { contacts: 0, emails: 0, quotes: 0, orders: 0 })
              lastWeekDataMap[entry.user.id] = summary
              
              // Load today data
              const todayLogs = await getWeeklyLogs(entry.user.id, todayStr, todayStr)
              const todaySummary = todayLogs.reduce((acc, log) => ({
                contacts: acc.contacts + (log.contacts_done || 0),
                emails: acc.emails + (log.emails_done || 0),
                quotes: acc.quotes + (log.quotes_done || 0),
                orders: acc.orders + (log.orders_done || 0)
              }), { contacts: 0, emails: 0, quotes: 0, orders: 0 })
              todayDataMap[entry.user.id] = todaySummary
            } catch (error) {
              console.error(`Error loading data for user ${entry.user.id}:`, error)
              lastWeekDataMap[entry.user.id] = { contacts: 0, emails: 0, quotes: 0, orders: 0 }
              todayDataMap[entry.user.id] = { contacts: 0, emails: 0, quotes: 0, orders: 0 }
            }
          })
        )
        
        setUserLastWeekData(lastWeekDataMap)
        setUserTodayData(todayDataMap)
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
        setLastWeekSummary({ contacts: 0, emails: 0, quotes: 0, orders: 0 })
      } else {
        const logs = await getWeeklyLogs(userId, startStr, endStr)
        setWeeklyLogs(logs)
        
        // Load last week summary
        await loadLastWeekSummary(userId)
      }
    } catch (error) {
      console.error('Error loading weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLastWeekSummary = async (userId: string) => {
    try {
      // Calculate last week (Monday to Friday)
      const today = new Date()
      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate days to subtract to get to last Monday
      // If today is Monday (1), we want the previous Monday, so subtract 7 days
      // If today is Sunday (0), we want the Monday before last, so subtract 6 days
      let daysToSubtract = currentDay === 0 ? 6 : currentDay + 6
      
      const lastWeekMonday = new Date(today)
      lastWeekMonday.setDate(today.getDate() - daysToSubtract)
      lastWeekMonday.setHours(0, 0, 0, 0)
      
      const lastWeekFriday = new Date(lastWeekMonday)
      lastWeekFriday.setDate(lastWeekMonday.getDate() + 4) // Friday is 4 days after Monday
      lastWeekFriday.setHours(23, 59, 59, 999)
      
      const startStr = lastWeekMonday.toISOString().split('T')[0]
      const endStr = lastWeekFriday.toISOString().split('T')[0]
      
      if (isLocal) {
        setLastWeekSummary({ contacts: 0, emails: 0, quotes: 0, orders: 0 })
      } else {
        const logs = await getWeeklyLogs(userId, startStr, endStr)
        const summary = logs.reduce((acc, log) => ({
          contacts: acc.contacts + (log.contacts_done || 0),
          emails: acc.emails + (log.emails_done || 0),
          quotes: acc.quotes + (log.quotes_done || 0),
          orders: acc.orders + (log.orders_done || 0)
        }), { contacts: 0, emails: 0, quotes: 0, orders: 0 })
        setLastWeekSummary(summary)
      }
    } catch (error) {
      console.error('Error loading last week summary:', error)
      setLastWeekSummary({ contacts: 0, emails: 0, quotes: 0, orders: 0 })
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
        emails: existingLog?.emails_done || 0,
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
      emails: dayForm.emails,
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
  const KPICell = ({ current, target, icon: Icon, lastWeek, today }: { current: number, target: number, icon: any, lastWeek?: number, today?: number }) => {
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
        <div className="flex flex-col gap-0.5">
          {today !== undefined && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Hoje: {today}
            </div>
          )}
          {lastWeek !== undefined && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              Semana: {lastWeek}
            </div>
          )}
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/" className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-green-100 dark:bg-green-900/50 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">Metas</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{userIsAdmin ? 'Gestão de Equipe' : 'Minha Produção'}</p>    
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de tema */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
            
            {userIsAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
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
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="flex items-center bg-white dark:bg-gray-800 p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full sm:w-auto max-w-sm">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"     
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2 font-semibold capitalize px-3 sm:px-6 min-w-0 flex-1 sm:flex-initial justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{monthName}</span>
                </div>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"     
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Last Week Summary for Admin */}
            {lastWeekSummary && userId && (
              <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Minha Última Semana</h2>
                    <p className="text-green-100 text-xs sm:text-sm">Resumo Semanal</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.contacts}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.emails}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.quotes}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.orders}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : isMobile ? (
              // Versão Mobile: Cards Compactos
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    Nenhum registro encontrado para este mês.
                  </div>
                ) : (
                  leaderboard.map((entry) => (
                    <div key={entry.user.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3">
                      {/* Header do Card - Nome e Avatar */}
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold">
                          {entry.user.avatar_url ? (
                            <img src={entry.user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            entry.user.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {entry.user.full_name}
                          </p>
                          <p className="text-[10px] text-gray-500">{entry.user.role}</p>
                        </div>
                      </div>
                      
                      {/* KPIs em Grid Compacto - 4 colunas */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {/* Telefone */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 mb-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-medium">Telefone</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {entry.realized.contacts}/{entry.goals?.target_contacts || '-'}
                          </p>
                          <div className="flex flex-col items-center text-[9px] leading-tight">
                            {userTodayData[entry.user.id] && (
                              <span className="text-blue-600 dark:text-blue-400">H:{userTodayData[entry.user.id].contacts}</span>
                            )}
                            {userLastWeekData[entry.user.id] && (
                              <span className="text-green-600 dark:text-green-400">S:{userLastWeekData[entry.user.id].contacts}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (entry.realized.contacts / (entry.goals?.target_contacts || 1)) * 100 >= 100 ? 'bg-green-500' :
                                (entry.realized.contacts / (entry.goals?.target_contacts || 1)) * 100 >= 80 ? 'bg-blue-500' :
                                (entry.realized.contacts / (entry.goals?.target_contacts || 1)) * 100 >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((entry.realized.contacts / (entry.goals?.target_contacts || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Emails */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 mb-0.5">
                            <Mail className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-medium">Emails</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {entry.realized.emails}/{entry.goals?.target_emails || '-'}
                          </p>
                          <div className="flex flex-col items-center text-[9px] leading-tight">
                            {userTodayData[entry.user.id] && (
                              <span className="text-blue-600 dark:text-blue-400">H:{userTodayData[entry.user.id].emails}</span>
                            )}
                            {userLastWeekData[entry.user.id] && (
                              <span className="text-green-600 dark:text-green-400">S:{userLastWeekData[entry.user.id].emails}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (entry.realized.emails / (entry.goals?.target_emails || 1)) * 100 >= 100 ? 'bg-green-500' :
                                (entry.realized.emails / (entry.goals?.target_emails || 1)) * 100 >= 80 ? 'bg-blue-500' :
                                (entry.realized.emails / (entry.goals?.target_emails || 1)) * 100 >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((entry.realized.emails / (entry.goals?.target_emails || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Orçamentos */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 mb-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-medium">Orçam.</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {entry.realized.quotes}/{entry.goals?.target_quotes || '-'}
                          </p>
                          <div className="flex flex-col items-center text-[9px] leading-tight">
                            {userTodayData[entry.user.id] && (
                              <span className="text-blue-600 dark:text-blue-400">H:{userTodayData[entry.user.id].quotes}</span>
                            )}
                            {userLastWeekData[entry.user.id] && (
                              <span className="text-green-600 dark:text-green-400">S:{userLastWeekData[entry.user.id].quotes}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (entry.realized.quotes / (entry.goals?.target_quotes || 1)) * 100 >= 100 ? 'bg-green-500' :
                                (entry.realized.quotes / (entry.goals?.target_quotes || 1)) * 100 >= 80 ? 'bg-blue-500' :
                                (entry.realized.quotes / (entry.goals?.target_quotes || 1)) * 100 >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((entry.realized.quotes / (entry.goals?.target_quotes || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Pedidos */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 mb-0.5">
                            <ShoppingBag className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-medium">Pedidos</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {entry.realized.orders}/{entry.goals?.target_orders || '-'}
                          </p>
                          <div className="flex flex-col items-center text-[9px] leading-tight">
                            {userTodayData[entry.user.id] && (
                              <span className="text-blue-600 dark:text-blue-400">H:{userTodayData[entry.user.id].orders}</span>
                            )}
                            {userLastWeekData[entry.user.id] && (
                              <span className="text-green-600 dark:text-green-400">S:{userLastWeekData[entry.user.id].orders}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (entry.realized.orders / (entry.goals?.target_orders || 1)) * 100 >= 100 ? 'bg-green-500' :
                                (entry.realized.orders / (entry.goals?.target_orders || 1)) * 100 >= 80 ? 'bg-blue-500' :
                                (entry.realized.orders / (entry.goals?.target_orders || 1)) * 100 >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((entry.realized.orders / (entry.goals?.target_orders || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Versão Desktop: Tabela com 5 colunas
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Header com título agrupador "Contatos" */}
                <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  {/* Linha superior: título agrupador */}
                  <div className="grid grid-cols-5 gap-2 px-4 sm:px-6 pt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <div></div>
                    <div className="col-span-2 text-center border-b border-blue-200 dark:border-blue-700 pb-1">Contatos</div>
                    <div></div>
                    <div></div>
                  </div>
                  {/* Linha inferior: colunas */}
                  <div className="grid grid-cols-5 gap-2 px-4 sm:px-6 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div>Usuário</div>
                    <div className="text-center">Telefone</div>
                    <div className="text-center">Emails</div>
                    <div className="text-center">Orçamentos</div>
                    <div className="text-center">Pedidos</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum registro encontrado para este mês.
                    </div>
                  ) : (
                    leaderboard.map((entry) => (
                      <div key={entry.user.id} className="grid grid-cols-5 gap-2 px-4 sm:px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-9 w-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
                            {entry.user.avatar_url ? (
                              <img src={entry.user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold">{entry.user.full_name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                              {entry.user.full_name}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{entry.user.role}</p>
                          </div>
                        </div>
                        <div className="flex justify-center">     
                          <KPICell 
                            current={entry.realized.contacts} 
                            target={entry.goals?.target_contacts || 0} 
                            icon={Phone}
                            today={userTodayData[entry.user.id]?.contacts}
                            lastWeek={userLastWeekData[entry.user.id]?.contacts}
                          />
                        </div>
                        <div className="flex justify-center">
                          <KPICell 
                            current={entry.realized.emails} 
                            target={entry.goals?.target_emails || 0} 
                            icon={Mail}
                            today={userTodayData[entry.user.id]?.emails}
                            lastWeek={userLastWeekData[entry.user.id]?.emails}
                          />
                        </div>
                        <div className="flex justify-center">
                          <KPICell 
                            current={entry.realized.quotes} 
                            target={entry.goals?.target_quotes || 0} 
                            icon={FileText}
                            today={userTodayData[entry.user.id]?.quotes}
                            lastWeek={userLastWeekData[entry.user.id]?.quotes}
                          />
                        </div>
                        <div className="flex justify-center">
                          <KPICell 
                            current={entry.realized.orders} 
                            target={entry.goals?.target_orders || 0} 
                            icon={ShoppingBag}
                            today={userTodayData[entry.user.id]?.orders}
                            lastWeek={userLastWeekData[entry.user.id]?.orders}
                          />
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold capitalize">{monthName}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm">Resumo Mensal</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {currentUserEntry?.realized.contacts}/{currentUserEntry?.goals?.target_contacts || '-'}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {currentUserEntry?.realized.quotes}/{currentUserEntry?.goals?.target_quotes || '-'}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {currentUserEntry?.realized.orders}/{currentUserEntry?.goals?.target_orders || '-'}
                  </div>
                </div>
              </div>
              {/* Master Progress Bar */}
              <div className="w-full bg-black/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div> 
              </div>
            </div>

            {/* Last Week Summary */}
            {lastWeekSummary && (
              <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Última Semana</h2>
                    <p className="text-green-100 text-xs sm:text-sm">Resumo Semanal</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.contacts}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.emails}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.quotes}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center sm:justify-start">
                      <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                      {lastWeekSummary.orders}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 text-center px-2">
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
                      className="w-full flex items-center justify-between p-3 sm:p-4 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`
                          w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0
                          ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                        `}>
                          <span>{day.getDate()}</span>
                          <span className="text-[9px] sm:text-[10px] font-normal uppercase">{day.toLocaleString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
                        </div>
                        
                        <div className="text-left min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white capitalize truncate">
                            {day.toLocaleString('pt-BR', { weekday: 'long' })}
                          </h3>
                          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {hasData ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> <span className="hidden sm:inline">Registrado</span>
                              </span>
                            ) : (
                              <span>Sem registros</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {isFuture ? <Lock className="h-5 w-5 text-gray-400" /> : 
                         hasData ? <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{log?.contacts_done} • {log?.quotes_done} • {log?.orders_done}</div> :
                         <Plus className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Expandable Input Area */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-3 sm:py-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> <span>Telefone</span>
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.contacts}
                              onChange={(e) => setDayForm({...dayForm, contacts: parseInt(e.target.value) || 0})}
                              className="w-full p-2 sm:p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" /> <span>Emails</span>
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.emails}
                              onChange={(e) => setDayForm({...dayForm, emails: parseInt(e.target.value) || 0})}
                              className="w-full p-2 sm:p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> <span>Orçam.</span>
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.quotes}
                              onChange={(e) => setDayForm({...dayForm, quotes: parseInt(e.target.value) || 0})}
                              className="w-full p-2 sm:p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" /> <span>Pedidos</span>
                            </label>
                            <input 
                              type="number" min="0" 
                              value={dayForm.orders}
                              onChange={(e) => setDayForm({...dayForm, orders: parseInt(e.target.value) || 0})}
                              className="w-full p-2 sm:p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSaveDay(dateStr)}
                          disabled={!!savingDay}
                          className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {savingDay === dateStr ? 'Salvando...' : <><Save className="h-4 w-4" /> <span>Salvar Dia</span></>}
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