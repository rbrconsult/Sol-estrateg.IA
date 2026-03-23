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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      lead_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          lead_id: string
          metadata: Json | null
          new_etapa: string | null
          new_status: string
          old_etapa: string | null
          old_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          new_etapa?: string | null
          new_status: string
          old_etapa?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          new_etapa?: string | null
          new_status?: string
          old_etapa?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_consolidados"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_consolidados: {
        Row: {
          campanha: string | null
          canal_origem: string | null
          cidade: string | null
          codigo_status: string | null
          created_at: string | null
          data_agendamento: string | null
          data_entrada: string | null
          data_fechamento: string | null
          data_proposta: string | null
          data_qualificacao: string | null
          email: string | null
          etapa: string | null
          followup_count: number | null
          id: string
          imovel: string | null
          interesse_detectado: string | null
          last_followup_date: string | null
          nome: string | null
          organization_id: string | null
          project_id: string | null
          respondeu: boolean | null
          responsavel: string | null
          robo: string | null
          score: number | null
          sentimento_resposta: string | null
          status: string | null
          synced_at: string | null
          telefone: string
          temperatura: string | null
          tempo_resposta_seg: number | null
          updated_at: string | null
          valor_conta: string | null
          valor_proposta: number | null
        }
        Insert: {
          campanha?: string | null
          canal_origem?: string | null
          cidade?: string | null
          codigo_status?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_entrada?: string | null
          data_fechamento?: string | null
          data_proposta?: string | null
          data_qualificacao?: string | null
          email?: string | null
          etapa?: string | null
          followup_count?: number | null
          id?: string
          imovel?: string | null
          interesse_detectado?: string | null
          last_followup_date?: string | null
          nome?: string | null
          organization_id?: string | null
          project_id?: string | null
          respondeu?: boolean | null
          responsavel?: string | null
          robo?: string | null
          score?: number | null
          sentimento_resposta?: string | null
          status?: string | null
          synced_at?: string | null
          telefone: string
          temperatura?: string | null
          tempo_resposta_seg?: number | null
          updated_at?: string | null
          valor_conta?: string | null
          valor_proposta?: number | null
        }
        Update: {
          campanha?: string | null
          canal_origem?: string | null
          cidade?: string | null
          codigo_status?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_entrada?: string | null
          data_fechamento?: string | null
          data_proposta?: string | null
          data_qualificacao?: string | null
          email?: string | null
          etapa?: string | null
          followup_count?: number | null
          id?: string
          imovel?: string | null
          interesse_detectado?: string | null
          last_followup_date?: string | null
          nome?: string | null
          organization_id?: string | null
          project_id?: string | null
          respondeu?: boolean | null
          responsavel?: string | null
          robo?: string | null
          score?: number | null
          sentimento_resposta?: string | null
          status?: string | null
          synced_at?: string | null
          telefone?: string
          temperatura?: string | null
          tempo_resposta_seg?: number | null
          updated_at?: string | null
          valor_conta?: string | null
          valor_proposta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_consolidados_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      make_errors: {
        Row: {
          attempts: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          error_type: string | null
          execution_duration_seconds: number | null
          execution_id: string
          execution_status: string
          failed_module_index: number | null
          flow_category: string | null
          id: string
          module_app: string | null
          module_name: string | null
          occurred_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          scenario_id: number | null
          scenario_name: string | null
          status: string
          total_modules: number | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          execution_duration_seconds?: number | null
          execution_id: string
          execution_status?: string
          failed_module_index?: number | null
          flow_category?: string | null
          id?: string
          module_app?: string | null
          module_name?: string | null
          occurred_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scenario_id?: number | null
          scenario_name?: string | null
          status?: string
          total_modules?: number | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          execution_duration_seconds?: number | null
          execution_id?: string
          execution_status?: string
          failed_module_index?: number | null
          flow_category?: string | null
          id?: string
          module_app?: string | null
          module_name?: string | null
          occurred_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scenario_id?: number | null
          scenario_name?: string | null
          status?: string
          total_modules?: number | null
        }
        Relationships: []
      }
      make_heartbeat: {
        Row: {
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          execution_id: string
          id: string
          ops_count: number | null
          scenario_id: number
          scenario_name: string
          started_at: string
          status: string
          transfer_bytes: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          ops_count?: number | null
          scenario_id: number
          scenario_name: string
          started_at: string
          status?: string
          transfer_bytes?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          ops_count?: number | null
          scenario_id?: number
          scenario_name?: string
          started_at?: string
          status?: string
          transfer_bytes?: number | null
        }
        Relationships: []
      }
      organization_configs: {
        Row: {
          config_category: string
          config_key: string
          config_value: string
          created_at: string | null
          id: string
          is_secret: boolean
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          config_category?: string
          config_key: string
          config_value?: string
          created_at?: string | null
          id?: string
          is_secret?: boolean
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          config_category?: string
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
          is_secret?: boolean
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          ativo: boolean
          canal: string
          conteudo: string
          created_at: string
          created_by: string | null
          destinatario: string
          destinatario_telefone: string | null
          icon: string
          id: string
          ordem: number
          organization_id: string | null
          periodicidade: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          canal?: string
          conteudo?: string
          created_at?: string
          created_by?: string | null
          destinatario?: string
          destinatario_telefone?: string | null
          icon?: string
          id?: string
          ordem?: number
          organization_id?: string | null
          periodicidade?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          canal?: string
          conteudo?: string
          created_at?: string
          created_by?: string | null
          destinatario?: string
          destinatario_telefone?: string | null
          icon?: string
          id?: string
          ordem?: number
          organization_id?: string | null
          periodicidade?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          categoria: Database["public"]["Enums"]["ticket_category"]
          cliente_nome: string | null
          cliente_telefone: string | null
          closed_at: string | null
          created_at: string
          descricao: string
          detalhes: string | null
          first_response_at: string | null
          fluxo: string | null
          id: string
          notification_phone: string | null
          organization_id: string | null
          plataforma: string | null
          prioridade: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          sla_deadline: string
          sla_paused_at: string | null
          sla_paused_total_ms: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: number
          titulo: string
          updated_at: string
          user_id: string
          work_hours: number | null
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          categoria?: Database["public"]["Enums"]["ticket_category"]
          cliente_nome?: string | null
          cliente_telefone?: string | null
          closed_at?: string | null
          created_at?: string
          descricao: string
          detalhes?: string | null
          first_response_at?: string | null
          fluxo?: string | null
          id?: string
          notification_phone?: string | null
          organization_id?: string | null
          plataforma?: string | null
          prioridade?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline: string
          sla_paused_at?: string | null
          sla_paused_total_ms?: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          titulo: string
          updated_at?: string
          user_id: string
          work_hours?: number | null
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          categoria?: Database["public"]["Enums"]["ticket_category"]
          cliente_nome?: string | null
          cliente_telefone?: string | null
          closed_at?: string | null
          created_at?: string
          descricao?: string
          detalhes?: string | null
          first_response_at?: string | null
          fluxo?: string | null
          id?: string
          notification_phone?: string | null
          organization_id?: string | null
          plataforma?: string | null
          prioridade?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline?: string
          sla_paused_at?: string | null
          sla_paused_total_ms?: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          titulo?: string
          updated_at?: string
          user_id?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          source: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          source?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          source?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          ticket_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_comercial: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          email: string | null
          franquia_id: string
          id: string
          krolic: boolean | null
          krolik_id: string | null
          krolik_setor_id: string | null
          nome: string
          sm_id: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          franquia_id: string
          id?: string
          krolic?: boolean | null
          krolik_id?: string | null
          krolik_setor_id?: string | null
          nome: string
          sm_id?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          franquia_id?: string
          id?: string
          krolic?: boolean | null
          krolik_id?: string | null
          krolik_setor_id?: string | null
          nome?: string
          sm_id?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_session_token: { Args: { token: string }; Returns: string }
      invalidate_other_sessions: {
        Args: { p_current_session: string; p_user_id: string }
        Returns: undefined
      }
      is_session_valid: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      ticket_category: "bug" | "duvida" | "melhoria" | "urgencia"
      ticket_priority: "baixa" | "media" | "alta" | "critica"
      ticket_status:
        | "aberto"
        | "em_andamento"
        | "resolvido"
        | "fechado"
        | "aguardando_usuario"
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
      app_role: ["super_admin", "admin", "user"],
      ticket_category: ["bug", "duvida", "melhoria", "urgencia"],
      ticket_priority: ["baixa", "media", "alta", "critica"],
      ticket_status: [
        "aberto",
        "em_andamento",
        "resolvido",
        "fechado",
        "aguardando_usuario",
      ],
    },
  },
} as const
