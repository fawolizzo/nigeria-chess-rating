export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      organizers: {
        Row: {
          certifications: string[] | null
          created_at: string
          email: string
          experience_years: number | null
          id: string
          name: string
          organization: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string
          email: string
          experience_years?: number | null
          id: string
          name: string
          organization?: string | null
          phone?: string | null
          role?: string
          status: string
          updated_at?: string | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string
          email?: string
          experience_years?: number | null
          id?: string
          name?: string
          organization?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      "Player's Table": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      players: {
        Row: {
          birth_year: number | null
          blitz_games_played: number | null
          blitz_rating: number | null
          city: string | null
          club: string | null
          created_at: string
          email: string
          fide_id: string | null
          games_played: number
          gender: string | null
          id: string
          name: string
          phone: string | null
          rapid_games_played: number | null
          rapid_rating: number | null
          rating: number | null
          state: string | null
          status: string
          title: string | null
          title_verified: boolean | null
        }
        Insert: {
          birth_year?: number | null
          blitz_games_played?: number | null
          blitz_rating?: number | null
          city?: string | null
          club?: string | null
          created_at?: string
          email: string
          fide_id?: string | null
          games_played?: number
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          rapid_games_played?: number | null
          rapid_rating?: number | null
          rating?: number | null
          state?: string | null
          status?: string
          title?: string | null
          title_verified?: boolean | null
        }
        Update: {
          birth_year?: number | null
          blitz_games_played?: number | null
          blitz_rating?: number | null
          city?: string | null
          club?: string | null
          created_at?: string
          email?: string
          fide_id?: string | null
          games_played?: number
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          rapid_games_played?: number | null
          rapid_rating?: number | null
          rating?: number | null
          state?: string | null
          status?: string
          title?: string | null
          title_verified?: boolean | null
        }
        Relationships: []
      }
      "Rounds Table": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      "Tournament Table": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      tournament_players: {
        Row: {
          created_at: string
          player_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          player_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          player_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          city: string
          created_at: string
          current_round: number | null
          description: string | null
          end_date: string
          id: string
          location: string
          name: string
          organizer_id: string
          participants: number | null
          registration_open: boolean | null
          rounds: number
          start_date: string
          state: string
          status: string
          time_control: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          current_round?: number | null
          description?: string | null
          end_date: string
          id?: string
          location: string
          name: string
          organizer_id: string
          participants?: number | null
          registration_open?: boolean | null
          rounds: number
          start_date: string
          state: string
          status: string
          time_control: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          current_round?: number | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          name?: string
          organizer_id?: string
          participants?: number | null
          registration_open?: boolean | null
          rounds?: number
          start_date?: string
          state?: string
          status?: string
          time_control?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          state: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role: string
          state?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          state?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
