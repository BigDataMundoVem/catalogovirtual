import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se Supabase está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Criar cliente apenas se configurado
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null

// Helper para upload de imagem
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string | null> {
  if (!supabase) {
    // Fallback: converter para base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Helper para deletar imagem
export async function deleteImage(url: string, bucket: string = 'products'): Promise<boolean> {
  if (!supabase) return true // No-op for localStorage mode

  try {
    const fileName = url.split('/').pop()
    if (!fileName) return false

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    return !error
  } catch {
    return false
  }
}
