export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string
          image: string
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category_id: string
          image: string
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category_id?: string
          image?: string
          images?: string[] | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
      }
      login_history: {
        Row: {
          id: string
          user_id: string
          user_email: string
          logged_in_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          logged_in_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          logged_in_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      sales_monthly_data: {
        Row: {
          id: string
          user_id: string
          nome: string
          codigo: string | null
          setor: string
          canal: string
          meta_mensal: number
          valor_realizado: number
          pedidos_em_aberto: number
          ano: number
          mes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          codigo?: string | null
          setor: string
          canal: string
          meta_mensal?: number
          valor_realizado?: number
          pedidos_em_aberto?: number
          ano: number
          mes: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          codigo?: string | null
          setor?: string
          canal?: string
          meta_mensal?: number
          valor_realizado?: number
          pedidos_em_aberto?: number
          ano?: number
          mes?: number
          updated_at?: string
        }
      }
    }
  }
}

// Tipos auxiliares para uso na aplicação
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export type LoginHistory = Database['public']['Tables']['login_history']['Row']
