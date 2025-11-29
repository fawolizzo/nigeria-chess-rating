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
      audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          meta_json: Json | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          meta_json?: Json | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta_json?: Json | null
        }
        Relationships: []
      }
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
      pairings: {
        Row: {
          black_player_id: string | null
          black_rating_after: number | null
          black_rating_before: number | null
          board_number: number
          created_at: string | null
          id: string
          result: string | null
          round_id: string
          updated_at: string | null
          white_player_id: string | null
          white_rating_after: number | null
          white_rating_before: number | null
        }
        Insert: {
          black_player_id?: string | null
          black_rating_after?: number | null
          black_rating_before?: number | null
          board_number: number
          created_at?: string | null
          id?: string
          result?: string | null
          round_id: string
          updated_at?: string | null
          white_player_id?: string | null
          white_rating_after?: number | null
          white_rating_before?: number | null
        }
        Update: {
          black_player_id?: string | null
          black_rating_after?: number | null
          black_rating_before?: number | null
          board_number?: number
          created_at?: string | null
          id?: string
          result?: string | null
          round_id?: string
          updated_at?: string | null
          white_player_id?: string | null
          white_rating_after?: number | null
          white_rating_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pairings_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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
          blitz_games: number | null
          blitz_games_played: number | null
          blitz_rating: number | null
          city: string | null
          classical_games: number | null
          classical_rating: number | null
          club: string | null
          created_at: string
          email: string
          fide_id: string | null
          full_name: string | null
          games_played: number
          gender: string | null
          has_rating_bonus: boolean | null
          id: string
          name: string
          phone: string | null
          player_number: number
          rapid_games: number | null
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
          blitz_games?: number | null
          blitz_games_played?: number | null
          blitz_rating?: number | null
          city?: string | null
          classical_games?: number | null
          classical_rating?: number | null
          club?: string | null
          created_at?: string
          email: string
          fide_id?: string | null
          full_name?: string | null
          games_played?: number
          gender?: string | null
          has_rating_bonus?: boolean | null
          id?: string
          name: string
          phone?: string | null
          player_number: number
          rapid_games?: number | null
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
          blitz_games?: number | null
          blitz_games_played?: number | null
          blitz_rating?: number | null
          city?: string | null
          classical_games?: number | null
          classical_rating?: number | null
          club?: string | null
          created_at?: string
          email?: string
          fide_id?: string | null
          full_name?: string | null
          games_played?: number
          gender?: string | null
          has_rating_bonus?: boolean | null
          id?: string
          name?: string
          phone?: string | null
          player_number?: number
          rapid_games?: number | null
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
      rating_jobs: {
        Row: {
          created_at: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string | null
          summary_json: Json | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          summary_json?: Json | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          summary_json?: Json | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rating_jobs_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_officers: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_officers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          round_number: number
          start_time: string | null
          status: string
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          round_number: number
          start_time?: string | null
          status?: string
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          round_number?: number
          start_time?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
      tournament_organizers: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          arbiter_name: string | null
          city: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          current_round: number | null
          description: string | null
          end_date: string
          entry_fee: number | null
          format: string
          id: string
          location: string | null
          max_players: number | null
          name: string
          notes: string | null
          organizer_id: string | null
          pairing_system: string | null
          pairings: Json | null
          participants: number | null
          players: Json | null
          prize_fund: number | null
          public_registration_open: boolean | null
          rating_system: string | null
          registration_deadline: string | null
          registration_open: boolean | null
          results: Json | null
          rounds_completed: number | null
          rounds_total: number | null
          start_date: string
          state: string
          status: string
          time_control: string | null
          tournament_type: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          arbiter_name?: string | null
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_round?: number | null
          description?: string | null
          end_date: string
          entry_fee?: number | null
          format?: string
          id?: string
          location?: string | null
          max_players?: number | null
          name?: string
          notes?: string | null
          organizer_id?: string | null
          pairing_system?: string | null
          pairings?: Json | null
          participants?: number | null
          players?: Json | null
          prize_fund?: number | null
          public_registration_open?: boolean | null
          rating_system?: string | null
          registration_deadline?: string | null
          registration_open?: boolean | null
          results?: Json | null
          rounds_completed?: number | null
          rounds_total?: number | null
          start_date: string
          state: string
          status: string
          time_control?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          arbiter_name?: string | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_round?: number | null
          description?: string | null
          end_date?: string
          entry_fee?: number | null
          format?: string
          id?: string
          location?: string | null
          max_players?: number | null
          name?: string
          notes?: string | null
          organizer_id?: string | null
          pairing_system?: string | null
          pairings?: Json | null
          participants?: number | null
          players?: Json | null
          prize_fund?: number | null
          public_registration_open?: boolean | null
          rating_system?: string | null
          registration_deadline?: string | null
          registration_open?: boolean | null
          results?: Json | null
          rounds_completed?: number | null
          rounds_total?: number | null
          start_date?: string
          state?: string
          status?: string
          time_control?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      calculate_expected_score: {
        Args: { rating_a: number; rating_b: number }
        Returns: number
      }
      generate_player_number: { Args: never; Returns: number }
      get_k_factor: {
        Args: {
          current_rating?: number
          player_id: string
          tournament_format: string
        }
        Returns: number
      }
      result_to_score: {
        Args: { game_result: string; player_color: string }
        Returns: number
      }
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
