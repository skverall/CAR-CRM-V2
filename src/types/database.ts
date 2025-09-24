export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'owner' | 'investor' | 'assistant'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'owner' | 'investor' | 'assistant'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'investor' | 'assistant'
          created_at?: string
          updated_at?: string
        }
      }
      cars: {
        Row: {
          id: string
          vin: string
          brand: string
          model: string
          year: number
          status: 'active' | 'sold'
          purchase_price: number | null
          purchase_date: string | null
          sale_price: number | null
          sale_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vin: string
          brand: string
          model: string
          year: number
          status?: 'active' | 'sold'
          purchase_price?: number | null
          purchase_date?: string | null
          sale_price?: number | null
          sale_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vin?: string
          brand?: string
          model?: string
          year?: number
          status?: 'active' | 'sold'
          purchase_price?: number | null
          purchase_date?: string | null
          sale_price?: number | null
          sale_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          currency: string
          exchange_rate: number
          amount_usd: number
          description: string | null
          date: string
          car_id: string | null
          user_id: string
          is_personal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'income' | 'expense'
          category: string
          amount: number
          currency?: string
          exchange_rate?: number
          amount_usd: number
          description?: string | null
          date: string
          car_id?: string | null
          user_id: string
          is_personal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          currency?: string
          exchange_rate?: number
          amount_usd?: number
          description?: string | null
          date?: string
          car_id?: string | null
          user_id?: string
          is_personal?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      capital: {
        Row: {
          id: string
          total_capital: number
          investor_share: number
          owner_share: number
          assistant_share: number
          updated_at: string
        }
        Insert: {
          id?: string
          total_capital: number
          investor_share: number
          owner_share: number
          assistant_share: number
          updated_at?: string
        }
        Update: {
          id?: string
          total_capital?: number
          investor_share?: number
          owner_share?: number
          assistant_share?: number
          updated_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          currency: string
          rate_to_usd: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          currency: string
          rate_to_usd: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          currency?: string
          rate_to_usd?: number
          date?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'owner' | 'investor' | 'assistant'
      car_status: 'active' | 'sold'
      transaction_type: 'income' | 'expense'
    }
  }
}
