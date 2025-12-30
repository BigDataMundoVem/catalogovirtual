import { supabase, isSupabaseConfigured } from './supabase'

export interface MonthlyGoal {
  id: string
  user_id: string
  month: number
  year: number
  target_contacts: number
  target_quotes: number
  target_orders: number
}

export interface PerformanceLog {
  id: string
  user_id: string
  entry_date: string
  contacts_done: number
  quotes_done: number
  orders_done: number
  notes?: string
}

export interface UserPerformance {
  goals: MonthlyGoal | null
  realized: {
    contacts: number
    quotes: number
    orders: number
  }
}

export async function getMonthlyGoal(userId: string, month: number, year: number) {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await (supabase as any)
    .from('monthly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error fetching goals:', error)
  }

  return data as MonthlyGoal | null
}

export async function getPerformanceLogs(userId: string, month: number, year: number) {
  if (!isSupabaseConfigured || !supabase) return []

  // Construct date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data, error } = await (supabase as any)
    .from('performance_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false })

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  return data as PerformanceLog[]
}

export async function addPerformanceLog(
  userId: string,
  data: { contacts: number; quotes: number; orders: number; notes?: string; date?: string }
) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' }

  const { error } = await (supabase as any).from('performance_logs').insert({
    user_id: userId,
    contacts_done: data.contacts,
    quotes_done: data.quotes,
    orders_done: data.orders,
    notes: data.notes,
    entry_date: data.date || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error adding log:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getWeeklyLogs(userId: string, startDate: string, endDate: string) {
  if (!isSupabaseConfigured || !supabase) return []

  const { data, error } = await (supabase as any)
    .from('performance_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: true })

  if (error) {
    console.error('Error fetching weekly logs:', error)
    return []
  }

  return data as PerformanceLog[]
}

export async function upsertPerformanceLog(
  userId: string,
  data: { contacts: number; quotes: number; orders: number; notes?: string; date: string }
) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' }

  const { error } = await (supabase as any).from('performance_logs').upsert({
    user_id: userId,
    contacts_done: data.contacts,
    quotes_done: data.quotes,
    orders_done: data.orders,
    notes: data.notes,
    entry_date: data.date
  }, { onConflict: 'user_id, entry_date' })

  if (error) {
    console.error('Error upserting log:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getUserPerformance(userId: string, month: number, year: number): Promise<UserPerformance> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      goals: null,
      realized: { contacts: 0, quotes: 0, orders: 0 }
    }
  }

  const [goal, logs] = await Promise.all([
    getMonthlyGoal(userId, month, year),
    getPerformanceLogs(userId, month, year)
  ])

  const realized = logs.reduce(
    (acc, log) => ({
      contacts: acc.contacts + (log.contacts_done || 0),
      quotes: acc.quotes + (log.quotes_done || 0),
      orders: acc.orders + (log.orders_done || 0)
    }),
    { contacts: 0, quotes: 0, orders: 0 }
  )

  return {
    goals: goal,
    realized
  }
}

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

export interface LeaderboardEntry {
  user: UserProfile
  goals: MonthlyGoal | null
  realized: {
    contacts: number
    quotes: number
    orders: number
  }
}

// ... existing code ...

export async function getLeaderboardData(month: number, year: number): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) return []

  // 1. Fetch all profiles (or simulate if user_roles/auth is tricky to join directly without backend functions)
  // Ideally, we query the 'profiles' table we just created.
  const { data: profiles, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')

  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    // Fallback: try to get users from our local auth helper logic or return empty if strict
    return []
  }

  // 2. Fetch all goals for the month
  const { data: goals } = await (supabase as any)
    .from('monthly_goals')
    .select('*')
    .eq('month', month)
    .eq('year', year)

  // 3. Fetch all logs for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data: logs } = await (supabase as any)
    .from('performance_logs')
    .select('*')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)

  // 4. Aggregate data
  const leaderboard: LeaderboardEntry[] = profiles.map((profile: any) => {
    const userGoal = goals?.find((g: any) => g.user_id === profile.id) || null
    const userLogs = logs?.filter((l: any) => l.user_id === profile.id) || []

    const realized = userLogs.reduce(
      (acc: any, log: any) => ({
        contacts: acc.contacts + (log.contacts_done || 0),
        quotes: acc.quotes + (log.quotes_done || 0),
        orders: acc.orders + (log.orders_done || 0)
      }),
      { contacts: 0, quotes: 0, orders: 0 }
    )

    return {
      user: {
        id: profile.id,
        full_name: profile.full_name || profile.email?.split('@')[0] || 'Usuário',
        email: profile.email,
        role: profile.role,
        avatar_url: profile.avatar_url
      },
      goals: userGoal,
      realized
    }
  })

  return leaderboard
}

// Admin Functions
export async function setMonthlyGoal(
  userId: string,
  month: number,
  year: number,
  targets: { contacts: number; quotes: number; orders: number }
) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' }

  // Check if goal exists to update or insert
  const existing = await getMonthlyGoal(userId, month, year)

  let error
  if (existing) {
    const { error: updateError } = await (supabase as any)
      .from('monthly_goals')
      .update({
        target_contacts: targets.contacts,
        target_quotes: targets.quotes,
        target_orders: targets.orders,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    error = updateError
  } else {
    const { error: insertError } = await (supabase as any)
      .from('monthly_goals')
      .insert({
        user_id: userId,
        month,
        year,
        target_contacts: targets.contacts,
        target_quotes: targets.quotes,
        target_orders: targets.orders
      })
    error = insertError
  }

  if (error) {
    console.error('Error setting goals:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
