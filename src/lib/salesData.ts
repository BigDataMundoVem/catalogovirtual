import { supabase, isSupabaseConfigured } from './supabase'
import { ChannelName, UserEntry } from '@/components/sales/useSalesCalculations'

// Helper para acessar tabela sales_monthly_data (evita erros de tipo quando tabela não existe)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const salesTable = () => supabase?.from('sales_monthly_data' as any) as any

/* ==========================================================================
   TIPOS PARA DADOS DE VENDAS MENSAIS
   ========================================================================== */

export interface SalesUserData {
  id: string
  user_id: string
  nome: string
  codigo: number | string
  setor: ChannelName
  canal: 'consumo' | 'revenda' | 'cozinhas'
  meta_mensal: number
  valor_realizado: number
  pedidos_em_aberto: number
  ano: number
  mes: number
  created_at?: string
  updated_at?: string
}

/* ==========================================================================
   FUNÇÕES AUXILIARES
   ========================================================================== */

/** Retorna ano e mês atuais */
export function getCurrentYearMonth(): { ano: number; mes: number } {
  const now = new Date()
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 }
}

/** Formata mês/ano para exibição */
export function formatMonthYear(ano: number, mes: number): string {
  const date = new Date(ano, mes - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/** Converte UserEntry para SalesUserData */
function userEntryToSalesData(
  user: UserEntry,
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Omit<SalesUserData, 'created_at' | 'updated_at'> {
  return {
    id: user.id,
    user_id: user.id,
    nome: user.nome,
    codigo: user.codigo,
    setor: user.setor,
    canal,
    meta_mensal: user.metaMensal,
    valor_realizado: user.valorRealizado,
    pedidos_em_aberto: user.pedidosEmAberto,
    ano,
    mes,
  }
}

/** Converte SalesUserData para UserEntry */
function salesDataToUserEntry(data: SalesUserData): UserEntry {
  return {
    id: data.user_id,
    nome: data.nome,
    codigo: data.codigo,
    setor: data.setor,
    metaMensal: data.meta_mensal,
    valorRealizado: data.valor_realizado,
    pedidosEmAberto: data.pedidos_em_aberto,
  }
}

/* ==========================================================================
   LOCAL STORAGE FALLBACK (quando Supabase não está configurado)
   ========================================================================== */

const STORAGE_KEY = 'sales_monthly_data'

function getLocalData(): Record<string, SalesUserData[]> {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : {}
}

function setLocalData(data: Record<string, SalesUserData[]>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getLocalKey(canal: string, ano: number, mes: number): string {
  return `${canal}-${ano}-${mes}`
}

/* ==========================================================================
   FUNÇÕES CRUD - LEITURA
   ========================================================================== */

/** Carrega dados de vendas de um canal/mês específico */
export async function loadSalesData(
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Promise<UserEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback localStorage
    const data = getLocalData()
    const key = getLocalKey(canal, ano, mes)
    const records = data[key] || []
    return records.map(salesDataToUserEntry)
  }

  try {
    const { data, error } = await salesTable()
      .select('*')
      .eq('canal', canal)
      .eq('ano', ano)
      .eq('mes', mes)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar dados de vendas:', error)
      // Fallback para localStorage se tabela não existe
      const localData = getLocalData()
      const key = getLocalKey(canal, ano, mes)
      const records = localData[key] || []
      return records.map(salesDataToUserEntry)
    }

    return (data || []).map(salesDataToUserEntry)
  } catch (err) {
    console.error('Erro ao carregar dados de vendas:', err)
    return []
  }
}

/** Verifica se existem dados para um mês específico */
export async function hasDataForMonth(
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const data = getLocalData()
    const key = getLocalKey(canal, ano, mes)
    return (data[key] || []).length > 0
  }

  try {
    const { count, error } = await salesTable()
      .select('*', { count: 'exact', head: true })
      .eq('canal', canal)
      .eq('ano', ano)
      .eq('mes', mes)

    if (error) return false
    return (count || 0) > 0
  } catch {
    return false
  }
}

/* ==========================================================================
   FUNÇÕES CRUD - ESCRITA
   ========================================================================== */

/** Salva ou atualiza um usuário no mês */
export async function saveSalesUser(
  user: UserEntry,
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Promise<boolean> {
  const salesData = userEntryToSalesData(user, canal, ano, mes)

  if (!isSupabaseConfigured || !supabase) {
    // Fallback localStorage
    const data = getLocalData()
    const key = getLocalKey(canal, ano, mes)
    const records = data[key] || []
    const existingIndex = records.findIndex((r) => r.user_id === user.id)
    
    if (existingIndex >= 0) {
      records[existingIndex] = { ...salesData, updated_at: new Date().toISOString() }
    } else {
      records.push({ ...salesData, created_at: new Date().toISOString() })
    }
    
    data[key] = records
    setLocalData(data)
    return true
  }

  try {
    // Upsert: atualiza se existe, insere se não existe
    const { error } = await salesTable()
      .upsert(
        {
          user_id: salesData.user_id,
          nome: salesData.nome,
          codigo: String(salesData.codigo),
          setor: salesData.setor,
          canal: salesData.canal,
          meta_mensal: salesData.meta_mensal,
          valor_realizado: salesData.valor_realizado,
          pedidos_em_aberto: salesData.pedidos_em_aberto,
          ano: salesData.ano,
          mes: salesData.mes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,canal,ano,mes' }
      )

    if (error) {
      console.error('Erro ao salvar dados de vendas:', error)
      // Fallback para localStorage
      const data = getLocalData()
      const key = getLocalKey(canal, ano, mes)
      const records = data[key] || []
      const existingIndex = records.findIndex((r) => r.user_id === user.id)
      if (existingIndex >= 0) {
        records[existingIndex] = { ...salesData, updated_at: new Date().toISOString() }
      } else {
        records.push({ ...salesData, created_at: new Date().toISOString() })
      }
      data[key] = records
      setLocalData(data)
      return true
    }

    return true
  } catch (err) {
    console.error('Erro ao salvar dados de vendas:', err)
    return false
  }
}

/** Salva todos os usuários de um canal no mês */
export async function saveAllSalesData(
  users: UserEntry[],
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback localStorage
    const data = getLocalData()
    const key = getLocalKey(canal, ano, mes)
    data[key] = users.map((u) => ({
      ...userEntryToSalesData(u, canal, ano, mes),
      updated_at: new Date().toISOString(),
    }))
    setLocalData(data)
    return true
  }

  try {
    const records = users.map((u) => ({
      user_id: u.id,
      nome: u.nome,
      codigo: String(u.codigo),
      setor: u.setor,
      canal,
      meta_mensal: u.metaMensal,
      valor_realizado: u.valorRealizado,
      pedidos_em_aberto: u.pedidosEmAberto,
      ano,
      mes,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await salesTable()
      .upsert(records, { onConflict: 'user_id,canal,ano,mes' })

    if (error) {
      console.error('Erro ao salvar dados de vendas:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Erro ao salvar dados de vendas:', err)
    return false
  }
}

/** Exclui um usuário do mês */
export async function deleteSalesUser(
  userId: string,
  canal: 'consumo' | 'revenda' | 'cozinhas',
  ano: number,
  mes: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const data = getLocalData()
    const key = getLocalKey(canal, ano, mes)
    data[key] = (data[key] || []).filter((r) => r.user_id !== userId)
    setLocalData(data)
    return true
  }

  try {
    const { error } = await salesTable()
      .delete()
      .eq('user_id', userId)
      .eq('canal', canal)
      .eq('ano', ano)
      .eq('mes', mes)

    if (error) {
      console.error('Erro ao excluir usuário:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Erro ao excluir usuário:', err)
    return false
  }
}

/* ==========================================================================
   FUNÇÕES DE MIGRAÇÃO / INICIALIZAÇÃO
   ========================================================================== */

/** Copia dados de um mês anterior para o mês atual (zerando valores) */
export async function initializeNewMonth(
  canal: 'consumo' | 'revenda' | 'cozinhas',
  fromAno: number,
  fromMes: number,
  toAno: number,
  toMes: number
): Promise<UserEntry[]> {
  const previousData = await loadSalesData(canal, fromAno, fromMes)
  
  // Cria novos registros com valores zerados, mantendo nome/código/setor/meta
  const newData: UserEntry[] = previousData.map((u) => ({
    ...u,
    id: `${canal}-${toAno}${toMes}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    valorRealizado: 0,
    pedidosEmAberto: 0,
  }))

  // Salva os novos dados
  if (newData.length > 0) {
    await saveAllSalesData(newData, canal, toAno, toMes)
  }

  return newData
}

/** Lista meses disponíveis com dados */
export async function listAvailableMonths(
  canal: 'consumo' | 'revenda' | 'cozinhas'
): Promise<{ ano: number; mes: number }[]> {
  if (!isSupabaseConfigured || !supabase) {
    const data = getLocalData()
    const months: { ano: number; mes: number }[] = []
    
    Object.keys(data).forEach((key) => {
      if (key.startsWith(`${canal}-`) && data[key].length > 0) {
        const [, ano, mes] = key.split('-')
        months.push({ ano: parseInt(ano), mes: parseInt(mes) })
      }
    })
    
    return months.sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes))
  }

  try {
    const { data, error } = await salesTable()
      .select('ano, mes')
      .eq('canal', canal)

    if (error || !data) return []

    // Remove duplicatas
    const unique = new Map<string, { ano: number; mes: number }>()
    data.forEach((d: { ano: number; mes: number }) => {
      unique.set(`${d.ano}-${d.mes}`, { ano: d.ano, mes: d.mes })
    })

    return Array.from(unique.values()).sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes))
  } catch {
    return []
  }
}

