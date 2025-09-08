export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          address: string | null
          agent_code: string
          city: string | null
          commission_rate: number | null
          company_name: string
          contact_person: string
          country: string | null
          created_at: string
          email: string
          id: string
          phone: string
          pincode: string | null
          state: string | null
          status: Database["public"]["Enums"]["agent_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agent_code: string
          city?: string | null
          commission_rate?: number | null
          company_name: string
          contact_person: string
          country?: string | null
          created_at?: string
          email: string
          id?: string
          phone: string
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agent_code?: string
          city?: string | null
          commission_rate?: number | null
          company_name?: string
          contact_person?: string
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          phone?: string
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          adult_count: number | null
          agent_id: string
          booking_details: Json | null
          booking_reference: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          child_count: number | null
          commission_amount: number
          created_at: string
          departure_date: string | null
          from_location: string | null
          id: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          return_date: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          to_location: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          adult_count?: number | null
          agent_id: string
          booking_details?: Json | null
          booking_reference: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          child_count?: number | null
          commission_amount: number
          created_at?: string
          departure_date?: string | null
          from_location?: string | null
          id?: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          to_location?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          adult_count?: number | null
          agent_id?: string
          booking_details?: Json | null
          booking_reference?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          child_count?: number | null
          commission_amount?: number
          created_at?: string
          departure_date?: string | null
          from_location?: string | null
          id?: string
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          to_location?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          agent_id: string
          amount: number
          booking_id: string
          created_at: string
          id: string
          payment_date: string | null
          payment_method: string
          payment_status: string | null
          transaction_id: string | null
        }
        Insert: {
          agent_id: string
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_method: string
          payment_status?: string | null
          transaction_id?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_agent_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_booking_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "pending" | "active" | "suspended"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      booking_type: "flight" | "bus" | "hotel"
      user_role: "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["pending", "active", "suspended"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      booking_type: ["flight", "bus", "hotel"],
      user_role: ["admin", "agent"],
    },
  },
} as const
