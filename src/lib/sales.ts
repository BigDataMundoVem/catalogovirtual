import { supabase, isSupabaseConfigured } from './supabase'

export interface SaleEntry {
  id: string
  user_id: string
  entry_date: string
  client: string
  origin: string
  status: string
  order_number: string
  amount_sold: number
  amount_invoiced: number
  observation?: string | null
  created_at?: string
  user_name?: string | null
  user_email?: string | null
}

export async function createSaleEntry(entry: Omit<SaleEntry, 'id' | 'created_at' | 'user_name' | 'user_email'>) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase não configurado' }
  }

  const { error } = await (supabase as any).from('sales_entries').insert(entry)
  if (error) {
    console.error('Error creating sale entry:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function listSaleEntries(options: { admin: boolean; userId: string | null }) {
  if (!isSupabaseConfigured || !supabase) return []

  let query = (supabase as any)
    .from('sales_entries')
    .select('*, profiles:profiles(id, full_name, email)')
    .order('entry_date', { ascending: false })

  if (!options.admin && options.userId) {
    query = query.eq('user_id', options.userId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error listing sale entries:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    ...row,
    user_name: row.profiles?.full_name || row.profiles?.email || null,
    user_email: row.profiles?.email || null,
  })) as SaleEntry[]
}


