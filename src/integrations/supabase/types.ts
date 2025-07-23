export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action_type: string;
          entity_type: string;
          entity_id: string;
          meta_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action_type: string;
          entity_type: string;
          entity_id: string;
          meta_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action_type?: string;
          entity_type?: string;
          entity_id?: string;
          meta_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_user_id_fkey';
            columns: ['actor_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      config: {
        Row: {
          key: string;
          value_json: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_json: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value_json?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      pairings: {
        Row: {
          id: string;
          round_id: string;
          board_number: number;
          white_player_id: string;
          black_player_id: string | null;
          result: Database['public']['Enums']['game_result'] | null;
          result_entered_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          board_number: number;
          white_player_id: string;
          black_player_id?: string | null;
          result?: Database['public']['Enums']['game_result'] | null;
          result_entered_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          board_number?: number;
          white_player_id?: string;
          black_player_id?: string | null;
          result?: Database['public']['Enums']['game_result'] | null;
          result_entered_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pairings_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'rounds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairings_white_player_id_fkey';
            columns: ['white_player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairings_black_player_id_fkey';
            columns: ['black_player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairings_result_entered_by_fkey';
            columns: ['result_entered_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          full_name: string;
          state: string | null;
          gender: string | null;
          status: Database['public']['Enums']['player_status'];
          classical_rating: number;
          rapid_rating: number;
          blitz_rating: number;
          classical_games: number;
          rapid_games: number;
          blitz_games: number;
          has_rating_bonus: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          state?: string | null;
          gender?: string | null;
          status?: Database['public']['Enums']['player_status'];
          classical_rating?: number;
          rapid_rating?: number;
          blitz_rating?: number;
          classical_games?: number;
          rapid_games?: number;
          blitz_games?: number;
          has_rating_bonus?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          state?: string | null;
          gender?: string | null;
          status?: Database['public']['Enums']['player_status'];
          classical_rating?: number;
          rapid_rating?: number;
          blitz_rating?: number;
          classical_games?: number;
          rapid_games?: number;
          blitz_games?: number;
          has_rating_bonus?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'players_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      rating_jobs: {
        Row: {
          id: string;
          tournament_id: string;
          started_at: string | null;
          finished_at: string | null;
          status: Database['public']['Enums']['rating_job_status'];
          summary_json: Json | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          started_at?: string | null;
          finished_at?: string | null;
          status?: Database['public']['Enums']['rating_job_status'];
          summary_json?: Json | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          started_at?: string | null;
          finished_at?: string | null;
          status?: Database['public']['Enums']['rating_job_status'];
          summary_json?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rating_jobs_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: true;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      rounds: {
        Row: {
          id: string;
          tournament_id: string;
          number: number;
          status: Database['public']['Enums']['round_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          number: number;
          status?: Database['public']['Enums']['round_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          number?: number;
          status?: Database['public']['Enums']['round_status'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rounds_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      tournament_players: {
        Row: {
          id: string;
          tournament_id: string;
          player_id: string;
          seed_rating: number;
          score: number;
          tie_break_1: number | null;
          tie_break_2: number | null;
          tie_break_3: number | null;
          withdrawn: boolean;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          player_id: string;
          seed_rating: number;
          score?: number;
          tie_break_1?: number | null;
          tie_break_2?: number | null;
          tie_break_3?: number | null;
          withdrawn?: boolean;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          player_id?: string;
          seed_rating?: number;
          score?: number;
          tie_break_1?: number | null;
          tie_break_2?: number | null;
          tie_break_3?: number | null;
          withdrawn?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'tournament_players_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tournament_players_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          state: string | null;
          city: string | null;
          format: Database['public']['Enums']['tournament_format'];
          rounds_total: number;
          status: Database['public']['Enums']['tournament_status'];
          organizer_id: string;
          public_registration_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          state?: string | null;
          city?: string | null;
          format?: Database['public']['Enums']['tournament_format'];
          rounds_total?: number;
          status?: Database['public']['Enums']['tournament_status'];
          organizer_id: string;
          public_registration_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          state?: string | null;
          city?: string | null;
          format?: Database['public']['Enums']['tournament_format'];
          rounds_total?: number;
          status?: Database['public']['Enums']['tournament_status'];
          organizer_id?: string;
          public_registration_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tournaments_organizer_id_fkey';
            columns: ['organizer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: Database['public']['Enums']['user_role'];
          state: string | null;
          status: Database['public']['Enums']['user_status'];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: Database['public']['Enums']['user_role'];
          state?: string | null;
          status?: Database['public']['Enums']['user_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: Database['public']['Enums']['user_role'];
          state?: string | null;
          status?: Database['public']['Enums']['user_status'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_tournament_standings: {
        Args: {
          tournament_id: string;
        };
        Returns: {
          rank: number;
          player_id: string;
          player_name: string;
          score: number;
          tie_break_1: number | null;
          tie_break_2: number | null;
          tie_break_3: number | null;
        }[];
      };
      rpc_generate_round1: {
        Args: {
          tournament_id: string;
        };
        Returns: Json;
      };
      rpc_mark_round_complete: {
        Args: {
          round_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      game_result:
        | 'white_win'
        | 'black_win'
        | 'draw'
        | 'white_forfeit'
        | 'black_forfeit'
        | 'double_forfeit'
        | 'bye';
      player_status: 'pending' | 'active';
      rating_job_status: 'pending' | 'running' | 'completed' | 'failed';
      round_status: 'pending' | 'published' | 'completed';
      tournament_format: 'classical' | 'rapid' | 'blitz';
      tournament_status:
        | 'draft'
        | 'active'
        | 'ongoing'
        | 'completed'
        | 'ratings_processed';
      user_role: 'RO' | 'TO';
      user_status: 'pending' | 'active' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      game_result: [
        'white_win',
        'black_win',
        'draw',
        'white_forfeit',
        'black_forfeit',
        'double_forfeit',
        'bye',
      ],
      player_status: ['pending', 'active'],
      rating_job_status: ['pending', 'running', 'completed', 'failed'],
      round_status: ['pending', 'published', 'completed'],
      tournament_format: ['classical', 'rapid', 'blitz'],
      tournament_status: [
        'draft',
        'active',
        'ongoing',
        'completed',
        'ratings_processed',
      ],
      user_role: ['RO', 'TO'],
      user_status: ['pending', 'active', 'rejected'],
    },
  },
} as const;
