import { supabase, isSupabaseConfigured } from './supabase'
import { User, Session } from '@supabase/supabase-js'

// ============ LOCAL STORAGE FALLBACK ============
const AUTH_KEY = 'catalogo_auth'
const AUTH_ROLE_KEY = 'catalogo_auth_role'
const CREDENTIALS_KEY = 'catalogo_credentials'
const LOGIN_HISTORY_KEY = 'catalogo_login_history'
const LAST_LOGIN_NAME_KEY = 'catalogo_last_username'

const DEFAULT_ADMIN_USER = 'admin'
const DEFAULT_ADMIN_PASS = 'admin123'
const DEFAULT_VIEWER_USER = 'viewer'
const DEFAULT_VIEWER_PASS = 'viewer123'

export type UserRole = 'admin' | 'viewer' | 'blocked'

interface LocalCredentials {
  username: string
  password: string
  role: UserRole
}

interface LocalLoginHistory {
  id: string
  user_id: string
  user_email: string
  logged_in_at: string
  user_agent: string | null
}

function getLocalCredentials(): LocalCredentials[] {
  if (typeof window === 'undefined') {
    return [
      { username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS, role: 'admin' },
      { username: DEFAULT_VIEWER_USER, password: DEFAULT_VIEWER_PASS, role: 'viewer' },
    ]
  }
  const stored = localStorage.getItem(CREDENTIALS_KEY)
  if (stored) return JSON.parse(stored)
  return [
    { username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS, role: 'admin' },
    { username: DEFAULT_VIEWER_USER, password: DEFAULT_VIEWER_PASS, role: 'viewer' },
  ]
}

function recordLocalLogin(email: string) {
  const history = JSON.parse(localStorage.getItem(LOGIN_HISTORY_KEY) || '[]')
  history.unshift({
    id: Date.now().toString(),
    user_id: 'local',
    user_email: email,
    logged_in_at: new Date().toISOString(),
    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
  })
  localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 100)))
}

// ============ SUPABASE FUNCTIONS ============
async function recordSupabaseLogin(user: User) {
  if (!supabase) return
  try {
    await (supabase as any).from('login_history').insert({
      user_id: user.id,
      user_email: user.email || '',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    })
  } catch (error) {
    console.error('Error recording login:', error)
  }
}

async function getUserRole(userId: string): Promise<UserRole> {
  if (!supabase) return 'viewer'

  const { data } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  return (data?.role as UserRole) || 'viewer'
}

// ============ EXPORTED FUNCTIONS ============

// Login
export async function login(emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> {
  if (!isSupabaseConfigured) {
    // Local mode
    const credentials = getLocalCredentials()
    const user = credentials.find(c => c.username === emailOrUsername && c.password === password)

    if (user) {
      localStorage.setItem(AUTH_KEY, 'true')
      localStorage.setItem(AUTH_ROLE_KEY, user.role)
      localStorage.setItem(LAST_LOGIN_NAME_KEY, emailOrUsername)
      recordLocalLogin(emailOrUsername)
      return { success: true, role: user.role }
    }
    return { success: false, error: 'Usuário ou senha incorretos' }
  }

  // Supabase mode
  const { data, error } = await supabase!.auth.signInWithPassword({
    email: emailOrUsername,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_LOGIN_NAME_KEY, emailOrUsername)
    }
    await recordSupabaseLogin(data.user)
    const role = await getUserRole(data.user.id)
    if (role === 'blocked') {
      await supabase!.auth.signOut()
      return { success: false, error: 'Usuário bloqueado, contate o administrador.' }
    }
    return { success: true, role }
  }

  return { success: true, role: 'viewer' }
}

// Logout
export async function logout(): Promise<void> {
  if (!isSupabaseConfigured) {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    localStorage.removeItem(LAST_LOGIN_NAME_KEY)
    return
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LAST_LOGIN_NAME_KEY)
  }
  await supabase!.auth.signOut()
}

// Check authentication
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (!isSupabaseConfigured) {
    return localStorage.getItem(AUTH_KEY) === 'true'
  }

  const { data: { session } } = await supabase!.auth.getSession()
  return !!session
}

// Get current role
export async function getCurrentRole(): Promise<UserRole | null> {
  if (typeof window === 'undefined') return null

  if (!isSupabaseConfigured) {
    const role = localStorage.getItem(AUTH_ROLE_KEY)
    return role as UserRole | null
  }

  const { data: { user } } = await supabase!.auth.getUser()
  if (!user) return null

  return await getUserRole(user.id)
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentRole()
  return role === 'admin'
}

// Check if user is sales active
export async function isSalesActive(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user || !('id' in user)) return false

  if (!isSupabaseConfigured) return true // Local mode defaults to true

  const { data } = await (supabase as any)
    .from('profiles')
    .select('is_sales_active')
    .eq('id', user.id)
    .single()

  // Se for nulo (não configurado), assume true para não bloquear indevidamente
  return data?.is_sales_active ?? true 
}

// Get session
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null
  const { data: { session } } = await supabase!.auth.getSession()
  return session
}

// Get current user
export async function getCurrentUser(): Promise<User | { id: string; email: string } | null> {
  if (!isSupabaseConfigured) {
    if (typeof window === 'undefined') return null
    if (localStorage.getItem(AUTH_KEY) === 'true') {
      return { id: 'local-user', email: 'local-user' }
    }
    return null
  }

  const { data: { user } } = await supabase!.auth.getUser()
  return user
}

// Create user (admin only)
export async function createUser(email: string, password: string, role: UserRole = 'viewer', fullName: string = '', isSalesActive: boolean = true): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado. Configure para criar múltiplos usuários.' }
  }

  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Add role to user_roles table
  if (data.user) {
    // 1. Define Role
    await (supabase as any).from('user_roles').insert({
      user_id: data.user.id,
      role: role,
    })

    // 2. Create Public Profile
    await (supabase as any).from('profiles').insert({
      id: data.user.id,
      email: email,
      full_name: fullName || email.split('@')[0], // Usa o nome fornecido ou parte do email
      role: role,
      is_sales_active: isSalesActive
    })
  }

  return { success: true }
}

// Update password
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    // Local mode - update local credentials
    return { success: true }
  }

  const { error } = await supabase!.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get login history
export async function getLoginHistory(limit: number = 50): Promise<LocalLoginHistory[]> {
  if (!isSupabaseConfigured) {
    const history = JSON.parse(localStorage.getItem(LOGIN_HISTORY_KEY) || '[]')
    return history.slice(0, limit)
  }

  const { data, error } = await (supabase as any)
    .from('login_history')
    .select('*')
    .order('logged_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching login history:', error)
    return []
  }

  return data
}

// Get all users (admin only)
export async function getUsers(): Promise<{ id: string; email: string; role: string; full_name?: string | null; is_sales_active?: boolean | null }[]> {
  if (!isSupabaseConfigured) {
    // Local mode mock
    return [
      { id: '1', email: DEFAULT_ADMIN_USER, role: 'admin' },
      { id: '2', email: DEFAULT_VIEWER_USER, role: 'viewer' }
    ]
  }

  // Fetch roles
  const { data: rolesData, error: rolesError } = await (supabase as any)
    .from('user_roles')
    .select('*')

  if (rolesError) {
    console.error('Error fetching roles:', rolesError)
    return []
  }

  // Fetch profiles to get name/email/is_sales_active
  const { data: profilesData } = await (supabase as any)
    .from('profiles')
    .select('*')

  const users = rolesData.map((role: any) => {
    const profile = profilesData?.find((p: any) => p.id === role.user_id)
    return {
      id: role.user_id,
      role: role.role,
      email: profile?.email || 'Email desconhecido',
      full_name: profile?.full_name || null,
      is_sales_active: profile?.is_sales_active
    }
  })

  return users
}

// Auth state change listener
export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!isSupabaseConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }

  return supabase!.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

// Check if using local mode
export function isLocalMode(): boolean {
  return !isSupabaseConfigured
}

// Update user role and profile (admin only)
export async function updateUserProfile(userId: string, params: { role?: UserRole; fullName?: string; isSalesActive?: boolean }): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado para edição de usuário' }
  }

  try {
    if (params.role) {
      // Upsert role
      const { error: roleError } = await (supabase as any)
        .from('user_roles')
        .upsert({ user_id: userId, role: params.role }, { onConflict: 'user_id' })
      if (roleError) throw roleError
    }

    if (params.fullName !== undefined || params.isSalesActive !== undefined) {
      const payload: any = {}
      if (params.fullName !== undefined) payload.full_name = params.fullName
      if (params.isSalesActive !== undefined) payload.is_sales_active = params.isSalesActive

      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update(payload)
        .eq('id', userId)
      if (profileError) throw profileError
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error?.message || 'Erro ao atualizar usuário' }
  }
}

// Delete user profile/role (nota: não remove o auth.user pois requer chave service role)
export async function deleteUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado para exclusão de usuário' }
  }

  try {
    // Remove dados de metas/performance para evitar aparecer em dashboards
    await (supabase as any).from('performance_logs').delete().eq('user_id', userId)
    await (supabase as any).from('monthly_goals').delete().eq('user_id', userId)

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (roleError) throw roleError

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (profileError) throw profileError

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user profile:', error)
    return { success: false, error: error?.message || 'Erro ao excluir usuário' }
  }
}

// Block or unblock user (admin only) - sets role to 'blocked' or 'viewer' and optional is_sales_active false
export async function blockUser(userId: string, blocked: boolean): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado para bloquear usuário' }
  }
  try {
    const newRole: UserRole = blocked ? 'blocked' : 'viewer'

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' })
    if (roleError) throw roleError

    if (blocked) {
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ is_sales_active: false })
        .eq('id', userId)
      if (profileError) throw profileError
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error blocking user:', error)
    return { success: false, error: error?.message || 'Erro ao bloquear usuário' }
  }
}

// Get last login name for UI display (local or supabase)
export function getLastLoginName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LAST_LOGIN_NAME_KEY)
}
