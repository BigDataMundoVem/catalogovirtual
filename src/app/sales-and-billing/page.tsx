'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, ChevronLeft, ChevronRight, Loader2, Shield, Sun, Moon } from 'lucide-react'
import { ChannelName, UserEntry, useSalesCalculations } from '@/components/sales/useSalesCalculations'
import { TableHeaderGrouped, ChannelRow, ChannelFooter, ChannelRowMobile, ChannelFooterMobile } from '@/components/sales/ChannelComponents'
import { useIsMobile } from '@/hooks/useResponsive'
import { UserFormModal } from '@/components/sales/UserFormModal'
import { Tabs } from '@/components/Tabs'
import { isAuthenticated, isAdmin, getCurrentUserChannel, SalesChannel } from '@/lib/auth'
import { useTheme } from '@/lib/ThemeContext'
import {
  loadSalesData,
  saveSalesUser,
  deleteSalesUser,
  getCurrentYearMonth,
  formatMonthYear,
  saveAllSalesData,
} from '@/lib/salesData'

type ChannelKey = 'consumo' | 'revenda' | 'cozinhas'

const CHANNELS: { key: ChannelKey; label: ChannelName }[] = [
  { key: 'consumo', label: 'Consumo' },
  { key: 'revenda', label: 'Revenda' },
  { key: 'cozinhas', label: 'Cozinhas Industriais' },
]

type ChannelState = Record<ChannelKey, UserEntry[]>

// Dados iniciais para demonstração (usados apenas na primeira vez)
const DEMO_DATA: ChannelState = {
  consumo: [
    { id: 'c1', nome: 'Renata', codigo: 65, setor: 'Consumo', metaMensal: 280000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c2', nome: 'Andrey', codigo: 67, setor: 'Consumo', metaMensal: 150000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c3', nome: 'Glaucia', codigo: 66, setor: 'Consumo', metaMensal: 50000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c4', nome: 'Amadeu', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c5', nome: 'Aparecido', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c6', nome: 'Luiz', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c7', nome: 'Carlos', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c8', nome: 'Abilio', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
  ],
  revenda: [
    { id: 'r1', nome: 'Marcio', codigo: 18, setor: 'Revenda', metaMensal: 300000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'r2', nome: 'Sergio', codigo: 19, setor: 'Revenda', metaMensal: 100000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'r3', nome: 'Jose Geraldo', codigo: 22, setor: 'Revenda', metaMensal: 50000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'r4', nome: 'Fernanda', codigo: 63, setor: 'Revenda', metaMensal: 200000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'r5', nome: 'Glaucia', codigo: 66, setor: 'Revenda', metaMensal: 50000, valorRealizado: 0, pedidosEmAberto: 0 },
  ],
  cozinhas: [
    { id: 'i1', nome: 'Livia - Sodexo', codigo: 16, setor: 'Cozinhas Industriais', metaMensal: 450000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'i2', nome: 'Marcelo - GRSA', codigo: 17, setor: 'Cozinhas Industriais', metaMensal: 400000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'i3', nome: 'Sapore', codigo: 3, setor: 'Cozinhas Industriais', metaMensal: 340000, valorRealizado: 0, pedidosEmAberto: 0 },
  ],
}

export default function SalesAndBillingPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { theme, toggleTheme } = useTheme()
  
  // Estado do mês/ano selecionado
  const [selectedYear, setSelectedYear] = useState<number>(() => getCurrentYearMonth().ano)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => getCurrentYearMonth().mes)

  // Estado dos dados e UI
  const [activeTab, setActiveTab] = useState<ChannelKey>('consumo')
  const [data, setData] = useState<ChannelState>({ consumo: [], revenda: [], cozinhas: [] })
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<{ channel: ChannelKey; user: UserEntry | null }>({ channel: 'consumo', user: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userChannel, setUserChannel] = useState<SalesChannel>('all')

  // Mês atual para comparação
  const currentYearMonth = useMemo(() => getCurrentYearMonth(), [])
  const isCurrentMonth = selectedYear === currentYearMonth.ano && selectedMonth === currentYearMonth.mes

  // Cálculos da tabela
  const { ranked, totals } = useSalesCalculations(data[activeTab])

  // Canais disponíveis baseados no canal do usuário
  const availableChannels = useMemo(() => {
    if (userChannel === 'all') {
      return CHANNELS
    }
    return CHANNELS.filter((c) => c.key === userChannel)
  }, [userChannel])

  // Label do canal ativo
  const channelLabel = useMemo(() => CHANNELS.find((c) => c.key === activeTab)?.label || 'Consumo', [activeTab])

  // Verifica autenticação e permissões
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
      
      // Obtém o canal do usuário
      const channel = await getCurrentUserChannel()
      setUserChannel(channel)
      
      // Se o usuário tem um canal específico, define como tab ativa
      if (channel !== 'all') {
        setActiveTab(channel as ChannelKey)
      }
      
      setMounted(true)
    }
    checkAuth()
  }, [router])

  // Carrega dados do mês selecionado
  const loadMonthData = useCallback(async () => {
    setLoading(true)
    try {
      let [consumo, revenda, cozinhas] = await Promise.all([
        loadSalesData('consumo', selectedYear, selectedMonth),
        loadSalesData('revenda', selectedYear, selectedMonth),
        loadSalesData('cozinhas', selectedYear, selectedMonth),
      ])

      // Se é o mês atual e algum canal está vazio, inicializa com dados demo
      if (isCurrentMonth) {
        const promises: Promise<void>[] = []
        
        if (consumo.length === 0) {
          promises.push(
            saveAllSalesData(DEMO_DATA.consumo, 'consumo', selectedYear, selectedMonth)
              .then(() => { consumo = DEMO_DATA.consumo })
          )
        }
        if (revenda.length === 0) {
          promises.push(
            saveAllSalesData(DEMO_DATA.revenda, 'revenda', selectedYear, selectedMonth)
              .then(() => { revenda = DEMO_DATA.revenda })
          )
        }
        if (cozinhas.length === 0) {
          promises.push(
            saveAllSalesData(DEMO_DATA.cozinhas, 'cozinhas', selectedYear, selectedMonth)
              .then(() => { cozinhas = DEMO_DATA.cozinhas })
          )
        }
        
        if (promises.length > 0) {
          await Promise.all(promises)
        }
      }

      setData({ consumo, revenda, cozinhas })
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, isCurrentMonth])

  // Carrega dados quando mês/ano muda
  useEffect(() => {
    loadMonthData()
  }, [loadMonthData])

  // Navega para mês anterior
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  // Navega para próximo mês
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  // Volta para mês atual
  const goToCurrentMonth = () => {
    setSelectedYear(currentYearMonth.ano)
    setSelectedMonth(currentYearMonth.mes)
  }

  // Salva um usuário
  const handleSaveUser = async (payload: Omit<UserEntry, 'id'> & { valorRealizado: number; pedidosEmAberto: number }) => {
    if (!userIsAdmin) {
      console.warn('Apenas administradores podem editar dados')
      return
    }
    
    setSaving(true)
    try {
      const isEditing = !!editUser.user
      const userId = isEditing ? editUser.user!.id : `${activeTab}-${selectedYear}${selectedMonth}-${Date.now()}`
      
      const user: UserEntry = {
        id: userId,
        nome: payload.nome,
        codigo: payload.codigo,
        setor: payload.setor,
        metaMensal: payload.metaMensal,
        valorRealizado: payload.valorRealizado,
        pedidosEmAberto: payload.pedidosEmAberto,
      }

      // Salva no banco
      await saveSalesUser(user, activeTab, selectedYear, selectedMonth)

      // Atualiza estado local
      setData((prev) => {
        const list = prev[activeTab]
        if (isEditing) {
          return {
            ...prev,
            [activeTab]: list.map((u) => (u.id === userId ? user : u)),
          }
        }
        return { ...prev, [activeTab]: [...list, user] }
      })
    } catch (err) {
      console.error('Erro ao salvar usuário:', err)
    } finally {
      setSaving(false)
      setModalOpen(false)
      setEditUser({ channel: activeTab, user: null })
    }
  }

  // Exclui um usuário
  const handleDeleteUser = async (id: string) => {
    if (!userIsAdmin) {
      console.warn('Apenas administradores podem excluir dados')
      alert('Apenas administradores podem excluir usuários.')
      return
    }
    
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    setSaving(true)
    try {
      const success = await deleteSalesUser(id, activeTab, selectedYear, selectedMonth)
      
      if (success) {
        // Atualiza o estado local apenas se a exclusão no banco foi bem-sucedida
        setData((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((u) => u.id !== id) }))
        console.log('Usuário excluído com sucesso do Supabase')
      } else {
        alert('Erro ao excluir usuário. Verifique o console para mais detalhes.')
        console.error('Falha ao excluir usuário do Supabase')
      }
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      alert('Erro ao excluir usuário. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Header fixo */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3">
          {/* Linha 1: Título e botão voltar */}
          <div className="flex items-center justify-between mb-3 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-bold">Vendas &amp; Faturamento</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Dashboard executivo de acompanhamento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botão de tema */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
              
              {userIsAdmin && !isMobile && (
                <button
                  onClick={() => {
                    setEditUser({ channel: activeTab, user: null })
                    setModalOpen(true)
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Novo usuário</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              )}
            </div>
          </div>

          {/* Linha 2: Seletor de mês/ano e botão novo (mobile) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex-1 sm:flex-initial">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 flex-1 justify-center">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                <span className="text-xs sm:text-sm font-medium text-center">
                  {formatMonthYear(selectedYear, selectedMonth)}
                </span>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors whitespace-nowrap"
              >
                Mês atual
              </button>
            )}

            {userIsAdmin && isMobile && (
              <button
                onClick={() => {
                  setEditUser({ channel: activeTab, user: null })
                  setModalOpen(true)
                }}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Novo usuário
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Aviso para não-admins */}
        {!userIsAdmin && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <strong>Modo visualização:</strong> Apenas administradores podem editar os dados de vendas e faturamento.
            </p>
          </div>
        )}

        {/* Indicador de mês histórico */}
        {!isCurrentMonth && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
              <strong>Visualizando dados históricos:</strong> {formatMonthYear(selectedYear, selectedMonth)}
            </p>
          </div>
        )}

        {/* Abas dos canais - só mostra se usuário tiver acesso a mais de um canal */}
        {availableChannels.length > 1 && (
        <div className="mb-3 sm:mb-4">
          <Tabs
            tabs={availableChannels.map((ch) => ({
              id: ch.key,
              label: ch.label,
              count: data[ch.key]?.length || 0,
            }))}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as ChannelKey)}
          />
        </div>
        )}

        {/* Indicador de canal único para usuários com acesso restrito */}
        {availableChannels.length === 1 && (
          <div className="mb-3 sm:mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Canal:</span> {availableChannels[0].label}
            </p>
          </div>
        )}

        {/* Card da tabela */}
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Cabeçalho do card */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">{channelLabel}</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                Ranking por % realizado • {formatMonthYear(selectedYear, selectedMonth)}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {saving && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                </div>
              )}
              <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {ranked.length} usuário{ranked.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-slate-500">Carregando dados...</span>
              </div>
            ) : ranked.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <p className="mb-2">Nenhum usuário cadastrado para este mês.</p>
                <button
                  onClick={() => {
                    setEditUser({ channel: activeTab, user: null })
                    setModalOpen(true)
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Adicionar primeiro usuário
                </button>
              </div>
            ) : isMobile ? (
              // Versão Mobile: Cards
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {ranked.map((u, idx) => (
                  <ChannelRowMobile
                    key={u.id}
                    user={u}
                    index={idx}
                    onEdit={(user) => {
                      setEditUser({ channel: activeTab, user })
                      setModalOpen(true)
                    }}
                    onDelete={handleDeleteUser}
                    userIsAdmin={userIsAdmin}
                  />
                ))}
                <ChannelFooterMobile totals={totals} />
              </div>
            ) : (
              // Versão Desktop: Tabela
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <TableHeaderGrouped />
                  <tbody>
                    {ranked.map((u, idx) => (
                      <ChannelRow
                        key={u.id}
                        user={u}
                        index={idx}
                        onEdit={(user) => {
                          setEditUser({ channel: activeTab, user })
                          setModalOpen(true)
                        }}
                        onDelete={handleDeleteUser}
                        userIsAdmin={userIsAdmin}
                      />
                    ))}
                  </tbody>
                  <ChannelFooter totals={totals} />
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de criação/edição */}
      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditUser({ channel: activeTab, user: null })
        }}
        onSave={handleSaveUser}
        initial={editUser.user}
        channel={channelLabel}
      />

    </div>
  )
}
