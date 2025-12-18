import { supabase, isSupabaseConfigured } from './supabase'
import { User, Session } from '@supabase/supabase-js'

// ============ LOCAL STORAGE FALLBACK ============
const AUTH_KEY = 'catalogo_auth'
const CREDENTIALS_KEY = 'catalogo_credentials'
const LOGIN_HISTORY_KEY = 'catalogo_login_history'

const DEFAULT_USER = 'admin'
const DEFAULT_PASS = 'admin123'

interface LocalCredentials {
  username: string
  password: string
}

interface LocalLoginHistory {
  id: string
  user_id: string
  user_email: string
  logged_in_at: string
  user_agent: string | null
}

function getLocalCredentials(): LocalCredentials {
  if (typeof window === 'undefined') {
    return { username: DEFAULT_USER, password: DEFAULT_PASS }
  }
  const stored = localStorage.getItem(CREDENTIALS_KEY)
  if (stored) return JSON.parse(stored)
  return { username: DEFAULT_USER, password: DEFAULT_PASS }
}

function setLocalCredentials(credentials: LocalCredentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
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
    await supabase.from('login_history').insert({
      user_id: user.id,
      user_email: user.email || '',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    })
  } catch (error) {
    console.error('Error recording login:', error)
  }
}

// ============ EXPORTED FUNCTIONS ============

// Login
export async function login(emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    // Local mode
    const credentials = getLocalCredentials()
    if (emailOrUsername === credentials.username && password === credentials.password) {
      localStorage.setItem(AUTH_KEY, 'true')
      recordLocalLogin(emailOrUsername)
      return { success: true }
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
    await recordSupabaseLogin(data.user)
  }

  return { success: true }
}

// Logout
export async function logout(): Promise<void> {
  if (!isSupabaseConfigured) {
    localStorage.removeItem(AUTH_KEY)
    return
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

// Get session
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null
  const { data: { session } } = await supabase!.auth.getSession()
  return session
}

// Get current user
export async function getCurrentUser(): Promise<User | { email: string } | null> {
  if (!isSupabaseConfigured) {
    if (typeof window === 'undefined') return null
    if (localStorage.getItem(AUTH_KEY) === 'true') {
      return { email: getLocalCredentials().username }
    }
    return null
  }

  const { data: { user } } = await supabase!.auth.getUser()
  return user
}

// Create user
export async function createUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado. Configure para criar múltiplos usuários.' }
  }

  const { error } = await supabase!.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Update password
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const credentials = getLocalCredentials()
    setLocalCredentials({ ...credentials, password: newPassword })
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

  const { data, error } = await supabase!
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
