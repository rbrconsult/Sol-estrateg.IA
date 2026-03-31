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
      ads_google_campaigns_daily: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          ad_group_status: string | null
          ad_id: string | null
          ad_status: string | null
          all_conversions: number | null
          all_conversions_value: number | null
          campaign_id: string
          campaign_name: string | null
          campaign_status: string | null
          clicks: number | null
          company_id: string
          conversion_value: number | null
          conversions: number | null
          cost: number | null
          cost_per_conversion: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          customer_id: string
          date: string
          dispositivo: string | null
          engagements: number | null
          franquia_id: string
          id: string
          impressions: number | null
          inserted_at: string | null
          objetivo: string | null
          orcamento_campanha: number | null
          raw_payload: Json | null
          rede: string | null
          roas: number | null
          updated_at: string | null
          video_view_rate: number | null
          video_views: number | null
        }
        Insert: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          ad_group_status?: string | null
          ad_id?: string | null
          ad_status?: string | null
          all_conversions?: number | null
          all_conversions_value?: number | null
          campaign_id: string
          campaign_name?: string | null
          campaign_status?: string | null
          clicks?: number | null
          company_id: string
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          customer_id?: string
          date: string
          dispositivo?: string | null
          engagements?: number | null
          franquia_id?: string
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          objetivo?: string | null
          orcamento_campanha?: number | null
          raw_payload?: Json | null
          rede?: string | null
          roas?: number | null
          updated_at?: string | null
          video_view_rate?: number | null
          video_views?: number | null
        }
        Update: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          ad_group_status?: string | null
          ad_id?: string | null
          ad_status?: string | null
          all_conversions?: number | null
          all_conversions_value?: number | null
          campaign_id?: string
          campaign_name?: string | null
          campaign_status?: string | null
          clicks?: number | null
          company_id?: string
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          customer_id?: string
          date?: string
          dispositivo?: string | null
          engagements?: number | null
          franquia_id?: string
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          objetivo?: string | null
          orcamento_campanha?: number | null
          raw_payload?: Json | null
          rede?: string | null
          roas?: number | null
          updated_at?: string | null
          video_view_rate?: number | null
          video_views?: number | null
        }
        Relationships: []
      }
      ads_meta_campaigns_daily: {
        Row: {
          ad_id: string
          ad_name: string | null
          ad_status: string | null
          adset_id: string | null
          adset_name: string | null
          adset_status: string | null
          campaign_id: string
          campaign_name: string | null
          campaign_status: string | null
          capi_agendado_enviado: boolean | null
          capi_fechado_enviado: boolean | null
          capi_lead_enviado: boolean | null
          capi_qualificado_enviado: boolean | null
          clicks: number | null
          company_id: string
          cpc: number | null
          cpl: number | null
          cpl_agendado: number | null
          cpl_qualificado: number | null
          cpm: number | null
          creative_id: string | null
          creative_name: string | null
          ctr: number | null
          date: string
          dispositivo: string | null
          external_account_id: string
          franquia_id: string
          frequency: number | null
          id: string
          impressions: number | null
          inserted_at: string | null
          leads: number | null
          leads_agendados: number | null
          leads_fechados: number | null
          leads_qualificados: number | null
          objetivo: string | null
          orcamento_diario: number | null
          orcamento_total: number | null
          publico_alvo: string | null
          raw_payload: Json | null
          reach: number | null
          receita_gerada: number | null
          roas: number | null
          spend: number | null
          taxa_agendamento: number | null
          taxa_fechamento: number | null
          taxa_qualificacao: number | null
          updated_at: string | null
        }
        Insert: {
          ad_id: string
          ad_name?: string | null
          ad_status?: string | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          campaign_id: string
          campaign_name?: string | null
          campaign_status?: string | null
          capi_agendado_enviado?: boolean | null
          capi_fechado_enviado?: boolean | null
          capi_lead_enviado?: boolean | null
          capi_qualificado_enviado?: boolean | null
          clicks?: number | null
          company_id: string
          cpc?: number | null
          cpl?: number | null
          cpl_agendado?: number | null
          cpl_qualificado?: number | null
          cpm?: number | null
          creative_id?: string | null
          creative_name?: string | null
          ctr?: number | null
          date: string
          dispositivo?: string | null
          external_account_id?: string
          franquia_id?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          objetivo?: string | null
          orcamento_diario?: number | null
          orcamento_total?: number | null
          publico_alvo?: string | null
          raw_payload?: Json | null
          reach?: number | null
          receita_gerada?: number | null
          roas?: number | null
          spend?: number | null
          taxa_agendamento?: number | null
          taxa_fechamento?: number | null
          taxa_qualificacao?: number | null
          updated_at?: string | null
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          ad_status?: string | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          campaign_id?: string
          campaign_name?: string | null
          campaign_status?: string | null
          capi_agendado_enviado?: boolean | null
          capi_fechado_enviado?: boolean | null
          capi_lead_enviado?: boolean | null
          capi_qualificado_enviado?: boolean | null
          clicks?: number | null
          company_id?: string
          cpc?: number | null
          cpl?: number | null
          cpl_agendado?: number | null
          cpl_qualificado?: number | null
          cpm?: number | null
          creative_id?: string | null
          creative_name?: string | null
          ctr?: number | null
          date?: string
          dispositivo?: string | null
          external_account_id?: string
          franquia_id?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          objetivo?: string | null
          orcamento_diario?: number | null
          orcamento_total?: number | null
          publico_alvo?: string | null
          raw_payload?: Json | null
          reach?: number | null
          receita_gerada?: number | null
          roas?: number | null
          spend?: number | null
          taxa_agendamento?: number | null
          taxa_fechamento?: number | null
          taxa_qualificacao?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_ga4_daily: {
        Row: {
          campaign: string | null
          company_id: string
          conversions: number | null
          date: string
          engaged_sessions: number | null
          franquia_id: string
          id: string
          inserted_at: string | null
          landing_page: string | null
          medium: string | null
          new_users: number | null
          property_id: string
          raw_payload: Json | null
          revenue: number | null
          sessions: number | null
          source: string | null
          updated_at: string | null
          users: number | null
        }
        Insert: {
          campaign?: string | null
          company_id: string
          conversions?: number | null
          date: string
          engaged_sessions?: number | null
          franquia_id?: string
          id?: string
          inserted_at?: string | null
          landing_page?: string | null
          medium?: string | null
          new_users?: number | null
          property_id: string
          raw_payload?: Json | null
          revenue?: number | null
          sessions?: number | null
          source?: string | null
          updated_at?: string | null
          users?: number | null
        }
        Update: {
          campaign?: string | null
          company_id?: string
          conversions?: number | null
          date?: string
          engaged_sessions?: number | null
          franquia_id?: string
          id?: string
          inserted_at?: string | null
          landing_page?: string | null
          medium?: string | null
          new_users?: number | null
          property_id?: string
          raw_payload?: Json | null
          revenue?: number | null
          sessions?: number | null
          source?: string | null
          updated_at?: string | null
          users?: number | null
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
      campaign_metrics: {
        Row: {
          ad_name: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpl: number | null
          created_at: string | null
          ctr: number | null
          data_referencia: string
          id: string
          impressions: number | null
          leads: number | null
          organization_id: string | null
          plataforma: string
          raw_data: Json | null
          receita: number | null
          roas: number | null
          spend: number | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          ad_name?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          created_at?: string | null
          ctr?: number | null
          data_referencia: string
          id?: string
          impressions?: number | null
          leads?: number | null
          organization_id?: string | null
          plataforma: string
          raw_data?: Json | null
          receita?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_name?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          created_at?: string | null
          ctr?: number | null
          data_referencia?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          organization_id?: string | null
          plataforma?: string
          raw_data?: Json | null
          receita?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ga4_metrics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          campaign: string | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          data_referencia: string
          events: Json | null
          id: string
          landing_page: string | null
          medium: string | null
          new_users: number | null
          organization_id: string | null
          pages_per_session: number | null
          raw_data: Json | null
          sessions: number | null
          source: string | null
          synced_at: string | null
          updated_at: string | null
          users_count: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          campaign?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          data_referencia: string
          events?: Json | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          new_users?: number | null
          organization_id?: string | null
          pages_per_session?: number | null
          raw_data?: Json | null
          sessions?: number | null
          source?: string | null
          synced_at?: string | null
          updated_at?: string | null
          users_count?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          campaign?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          data_referencia?: string
          events?: Json | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          new_users?: number | null
          organization_id?: string | null
          pages_per_session?: number | null
          raw_data?: Json | null
          sessions?: number | null
          source?: string | null
          synced_at?: string | null
          updated_at?: string | null
          users_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ga4_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_runs: {
        Row: {
          company_id: string | null
          error_message: string | null
          finished_at: string | null
          franquia_id: string | null
          id: string
          integration_name: string
          meta: Json | null
          rows_received: number | null
          rows_upserted: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          company_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          franquia_id?: string | null
          id?: string
          integration_name: string
          meta?: Json | null
          rows_received?: number | null
          rows_upserted?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          company_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          franquia_id?: string | null
          id?: string
          integration_name?: string
          meta?: Json | null
          rows_received?: number | null
          rows_upserted?: number | null
          started_at?: string | null
          status?: string
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
          acrescimo_carga: string | null
          aguardando_conta_luz: boolean | null
          campanha: string | null
          canal_origem: string | null
          chat_id: string | null
          cidade: string | null
          closer_atribuido: string | null
          codigo_status: string | null
          contact_id: string | null
          created_at: string | null
          custo_elevenlabs: number | null
          custo_openai: number | null
          custo_total_usd: number | null
          data_agendamento: string | null
          data_entrada: string | null
          data_fechamento: string | null
          data_proposta: string | null
          data_qualificacao: string | null
          ds_source: string | null
          email: string | null
          etapa: string | null
          etapa_sm: string | null
          followup_count: number | null
          forma_pagamento: string | null
          id: string
          imovel: string | null
          interesse_detectado: string | null
          last_followup_date: string | null
          nome: string | null
          organization_id: string | null
          potencia_sistema: number | null
          prazo_decisao: string | null
          preferencia_contato: string | null
          project_id: string | null
          qualificado_por: string | null
          representante: string | null
          respondeu: boolean | null
          responsavel: string | null
          resumo_conversa: string | null
          robo: string | null
          score: number | null
          sentimento_resposta: string | null
          status: string | null
          status_proposta: string | null
          synced_at: string | null
          telefone: string
          temperatura: string | null
          tempo_resposta_seg: number | null
          total_audios_enviados: number | null
          total_mensagens_ia: number | null
          transferido_comercial: boolean | null
          updated_at: string | null
          valor_conta: string | null
          valor_proposta: number | null
        }
        Insert: {
          acrescimo_carga?: string | null
          aguardando_conta_luz?: boolean | null
          campanha?: string | null
          canal_origem?: string | null
          chat_id?: string | null
          cidade?: string | null
          closer_atribuido?: string | null
          codigo_status?: string | null
          contact_id?: string | null
          created_at?: string | null
          custo_elevenlabs?: number | null
          custo_openai?: number | null
          custo_total_usd?: number | null
          data_agendamento?: string | null
          data_entrada?: string | null
          data_fechamento?: string | null
          data_proposta?: string | null
          data_qualificacao?: string | null
          ds_source?: string | null
          email?: string | null
          etapa?: string | null
          etapa_sm?: string | null
          followup_count?: number | null
          forma_pagamento?: string | null
          id?: string
          imovel?: string | null
          interesse_detectado?: string | null
          last_followup_date?: string | null
          nome?: string | null
          organization_id?: string | null
          potencia_sistema?: number | null
          prazo_decisao?: string | null
          preferencia_contato?: string | null
          project_id?: string | null
          qualificado_por?: string | null
          representante?: string | null
          respondeu?: boolean | null
          responsavel?: string | null
          resumo_conversa?: string | null
          robo?: string | null
          score?: number | null
          sentimento_resposta?: string | null
          status?: string | null
          status_proposta?: string | null
          synced_at?: string | null
          telefone: string
          temperatura?: string | null
          tempo_resposta_seg?: number | null
          total_audios_enviados?: number | null
          total_mensagens_ia?: number | null
          transferido_comercial?: boolean | null
          updated_at?: string | null
          valor_conta?: string | null
          valor_proposta?: number | null
        }
        Update: {
          acrescimo_carga?: string | null
          aguardando_conta_luz?: boolean | null
          campanha?: string | null
          canal_origem?: string | null
          chat_id?: string | null
          cidade?: string | null
          closer_atribuido?: string | null
          codigo_status?: string | null
          contact_id?: string | null
          created_at?: string | null
          custo_elevenlabs?: number | null
          custo_openai?: number | null
          custo_total_usd?: number | null
          data_agendamento?: string | null
          data_entrada?: string | null
          data_fechamento?: string | null
          data_proposta?: string | null
          data_qualificacao?: string | null
          ds_source?: string | null
          email?: string | null
          etapa?: string | null
          etapa_sm?: string | null
          followup_count?: number | null
          forma_pagamento?: string | null
          id?: string
          imovel?: string | null
          interesse_detectado?: string | null
          last_followup_date?: string | null
          nome?: string | null
          organization_id?: string | null
          potencia_sistema?: number | null
          prazo_decisao?: string | null
          preferencia_contato?: string | null
          project_id?: string | null
          qualificado_por?: string | null
          representante?: string | null
          respondeu?: boolean | null
          responsavel?: string | null
          resumo_conversa?: string | null
          robo?: string | null
          score?: number | null
          sentimento_resposta?: string | null
          status?: string | null
          status_proposta?: string | null
          synced_at?: string | null
          telefone?: string
          temperatura?: string | null
          tempo_resposta_seg?: number | null
          total_audios_enviados?: number | null
          total_mensagens_ia?: number | null
          transferido_comercial?: boolean | null
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
      media_performance_daily: {
        Row: {
          cac: number | null
          campaign_id: string | null
          campaign_name: string | null
          channel: string
          clicks: number | null
          company_id: string
          conversions: number | null
          cpl: number | null
          date: string
          franquia_id: string
          id: string
          impressions: number | null
          inserted_at: string | null
          landing_page: string | null
          leads: number | null
          leads_agendados: number | null
          leads_fechados: number | null
          leads_qualificados: number | null
          medium: string | null
          revenue: number | null
          roas: number | null
          sessions: number | null
          source: string | null
          spend: number | null
          updated_at: string | null
          users: number | null
        }
        Insert: {
          cac?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          channel: string
          clicks?: number | null
          company_id: string
          conversions?: number | null
          cpl?: number | null
          date: string
          franquia_id?: string
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          landing_page?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          medium?: string | null
          revenue?: number | null
          roas?: number | null
          sessions?: number | null
          source?: string | null
          spend?: number | null
          updated_at?: string | null
          users?: number | null
        }
        Update: {
          cac?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          channel?: string
          clicks?: number | null
          company_id?: string
          conversions?: number | null
          cpl?: number | null
          date?: string
          franquia_id?: string
          id?: string
          impressions?: number | null
          inserted_at?: string | null
          landing_page?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          medium?: string | null
          revenue?: number | null
          roas?: number | null
          sessions?: number | null
          source?: string | null
          spend?: number | null
          updated_at?: string | null
          users?: number | null
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
          must_change_password: boolean
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
          must_change_password?: boolean
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
          must_change_password?: boolean
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
          copia_telefone: string | null
          created_at: string
          created_by: string | null
          destinatario: string
          destinatario_roles: string[] | null
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
          copia_telefone?: string | null
          created_at?: string
          created_by?: string | null
          destinatario?: string
          destinatario_roles?: string[] | null
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
          copia_telefone?: string | null
          created_at?: string
          created_by?: string | null
          destinatario?: string
          destinatario_roles?: string[] | null
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
      sol_config_sync: {
        Row: {
          counter: number | null
          key: string
          synced_at: string | null
          updated_at: string | null
          updated_by: string | null
          valor_text: string | null
        }
        Insert: {
          counter?: number | null
          key: string
          synced_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_text?: string | null
        }
        Update: {
          counter?: number | null
          key?: string
          synced_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_text?: string | null
        }
        Relationships: []
      }
      sol_conversions_sync: {
        Row: {
          canal: string | null
          capi_response: string | null
          capi_sent: boolean | null
          event_name: string | null
          fbclid: string | null
          gclid: string | null
          google_response: string | null
          google_sent: boolean | null
          key: string
          project_id: string | null
          synced_at: string | null
          telefone: string | null
          ts_enviado: string | null
          ts_evento: string | null
          value: number | null
        }
        Insert: {
          canal?: string | null
          capi_response?: string | null
          capi_sent?: boolean | null
          event_name?: string | null
          fbclid?: string | null
          gclid?: string | null
          google_response?: string | null
          google_sent?: boolean | null
          key: string
          project_id?: string | null
          synced_at?: string | null
          telefone?: string | null
          ts_enviado?: string | null
          ts_evento?: string | null
          value?: number | null
        }
        Update: {
          canal?: string | null
          capi_response?: string | null
          capi_sent?: boolean | null
          event_name?: string | null
          fbclid?: string | null
          gclid?: string | null
          google_response?: string | null
          google_sent?: boolean | null
          key?: string
          project_id?: string | null
          synced_at?: string | null
          telefone?: string | null
          ts_enviado?: string | null
          ts_evento?: string | null
          value?: number | null
        }
        Relationships: []
      }
      sol_equipe_sync: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          franquia_id: string | null
          horario_pico_fim: string | null
          horario_pico_inicio: string | null
          key: string
          krolik_ativo: boolean | null
          krolik_id: string | null
          krolik_setor_id: string | null
          leads_hoje: number | null
          leads_mes: number | null
          nome: string | null
          sm_id: number | null
          synced_at: string | null
          taxa_conversao: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          franquia_id?: string | null
          horario_pico_fim?: string | null
          horario_pico_inicio?: string | null
          key: string
          krolik_ativo?: boolean | null
          krolik_id?: string | null
          krolik_setor_id?: string | null
          leads_hoje?: number | null
          leads_mes?: number | null
          nome?: string | null
          sm_id?: number | null
          synced_at?: string | null
          taxa_conversao?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          franquia_id?: string | null
          horario_pico_fim?: string | null
          horario_pico_inicio?: string | null
          key?: string
          krolik_ativo?: boolean | null
          krolik_id?: string | null
          krolik_setor_id?: string | null
          leads_hoje?: number | null
          leads_mes?: number | null
          nome?: string | null
          sm_id?: number | null
          synced_at?: string | null
          taxa_conversao?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      sol_funis_sync: {
        Row: {
          etapas: Json | null
          franquia_id: string
          funil_id: number | null
          funil_nome: string | null
          sm_etiqueta_robo: string | null
          sm_robo_id: number | null
          synced_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          etapas?: Json | null
          franquia_id: string
          funil_id?: number | null
          funil_nome?: string | null
          sm_etiqueta_robo?: string | null
          sm_robo_id?: number | null
          synced_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          etapas?: Json | null
          franquia_id?: string
          funil_id?: number | null
          funil_nome?: string | null
          sm_etiqueta_robo?: string | null
          sm_robo_id?: number | null
          synced_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      sol_insights: {
        Row: {
          acao_sugerida: string | null
          categoria: string | null
          created_at: string | null
          dados: Json | null
          descricao: string
          expires_at: string | null
          franquia_id: string
          id: string
          robo: string | null
          severidade: string | null
          tipo: string
          titulo: string
          visualizado: boolean | null
        }
        Insert: {
          acao_sugerida?: string | null
          categoria?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao: string
          expires_at?: string | null
          franquia_id?: string
          id?: string
          robo?: string | null
          severidade?: string | null
          tipo: string
          titulo: string
          visualizado?: boolean | null
        }
        Update: {
          acao_sugerida?: string | null
          categoria?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string
          expires_at?: string | null
          franquia_id?: string
          id?: string
          robo?: string | null
          severidade?: string | null
          tipo?: string
          titulo?: string
          visualizado?: boolean | null
        }
        Relationships: []
      }
      sol_leads_sync: {
        Row: {
          acrescimo_carga: string | null
          aguardando_conta_luz: boolean | null
          canal_origem: string | null
          chat_id: string | null
          cidade: string | null
          closer_nome: string | null
          closer_sm_id: string | null
          contact_id: string | null
          custo_elevenlabs: number | null
          custo_openai: number | null
          custo_total_usd: number | null
          email: string | null
          etapa_funil: string | null
          forma_pagamento: string | null
          franquia_id: string | null
          fup_followup_count: number | null
          identificador: string | null
          nome: string | null
          prazo_decisao: string | null
          preferencia_contato: string | null
          project_id: string | null
          qualificado_por: string | null
          resumo_conversa: string | null
          resumo_qualificacao: string | null
          score: string | null
          status: string | null
          synced_at: string | null
          telefone: string
          temperatura: string | null
          tipo_imovel: string | null
          tipo_telhado: string | null
          total_audios_enviados: number | null
          total_mensagens_ia: number | null
          transferido_comercial: boolean | null
          ts_cadastro: string | null
          ts_desqualificado: string | null
          ts_pedido_conta_luz: string | null
          ts_qualificado: string | null
          ts_transferido: string | null
          ts_ultima_interacao: string | null
          ts_ultimo_fup: string | null
          valor_conta: string | null
          valor_conta_confirmado_ocr: string | null
        }
        Insert: {
          acrescimo_carga?: string | null
          aguardando_conta_luz?: boolean | null
          canal_origem?: string | null
          chat_id?: string | null
          cidade?: string | null
          closer_nome?: string | null
          closer_sm_id?: string | null
          contact_id?: string | null
          custo_elevenlabs?: number | null
          custo_openai?: number | null
          custo_total_usd?: number | null
          email?: string | null
          etapa_funil?: string | null
          forma_pagamento?: string | null
          franquia_id?: string | null
          fup_followup_count?: number | null
          identificador?: string | null
          nome?: string | null
          prazo_decisao?: string | null
          preferencia_contato?: string | null
          project_id?: string | null
          qualificado_por?: string | null
          resumo_conversa?: string | null
          resumo_qualificacao?: string | null
          score?: string | null
          status?: string | null
          synced_at?: string | null
          telefone: string
          temperatura?: string | null
          tipo_imovel?: string | null
          tipo_telhado?: string | null
          total_audios_enviados?: number | null
          total_mensagens_ia?: number | null
          transferido_comercial?: boolean | null
          ts_cadastro?: string | null
          ts_desqualificado?: string | null
          ts_pedido_conta_luz?: string | null
          ts_qualificado?: string | null
          ts_transferido?: string | null
          ts_ultima_interacao?: string | null
          ts_ultimo_fup?: string | null
          valor_conta?: string | null
          valor_conta_confirmado_ocr?: string | null
        }
        Update: {
          acrescimo_carga?: string | null
          aguardando_conta_luz?: boolean | null
          canal_origem?: string | null
          chat_id?: string | null
          cidade?: string | null
          closer_nome?: string | null
          closer_sm_id?: string | null
          contact_id?: string | null
          custo_elevenlabs?: number | null
          custo_openai?: number | null
          custo_total_usd?: number | null
          email?: string | null
          etapa_funil?: string | null
          forma_pagamento?: string | null
          franquia_id?: string | null
          fup_followup_count?: number | null
          identificador?: string | null
          nome?: string | null
          prazo_decisao?: string | null
          preferencia_contato?: string | null
          project_id?: string | null
          qualificado_por?: string | null
          resumo_conversa?: string | null
          resumo_qualificacao?: string | null
          score?: string | null
          status?: string | null
          synced_at?: string | null
          telefone?: string
          temperatura?: string | null
          tipo_imovel?: string | null
          tipo_telhado?: string | null
          total_audios_enviados?: number | null
          total_mensagens_ia?: number | null
          transferido_comercial?: boolean | null
          ts_cadastro?: string | null
          ts_desqualificado?: string | null
          ts_pedido_conta_luz?: string | null
          ts_qualificado?: string | null
          ts_transferido?: string | null
          ts_ultima_interacao?: string | null
          ts_ultimo_fup?: string | null
          valor_conta?: string | null
          valor_conta_confirmado_ocr?: string | null
        }
        Relationships: []
      }
      sol_metricas: {
        Row: {
          custo_elevenlabs_usd: number | null
          custo_make_usd: number | null
          custo_openai_usd: number | null
          custo_total_usd: number | null
          data: string
          franquia_id: string
          id: string
          leads_desqualificados: number | null
          leads_novos: number | null
          leads_qualificados: number | null
          robo: string
          synced_at: string | null
          total_audios: number | null
          total_mensagens: number | null
        }
        Insert: {
          custo_elevenlabs_usd?: number | null
          custo_make_usd?: number | null
          custo_openai_usd?: number | null
          custo_total_usd?: number | null
          data: string
          franquia_id?: string
          id: string
          leads_desqualificados?: number | null
          leads_novos?: number | null
          leads_qualificados?: number | null
          robo?: string
          synced_at?: string | null
          total_audios?: number | null
          total_mensagens?: number | null
        }
        Update: {
          custo_elevenlabs_usd?: number | null
          custo_make_usd?: number | null
          custo_openai_usd?: number | null
          custo_total_usd?: number | null
          data?: string
          franquia_id?: string
          id?: string
          leads_desqualificados?: number | null
          leads_novos?: number | null
          leads_qualificados?: number | null
          robo?: string
          synced_at?: string | null
          total_audios?: number | null
          total_mensagens?: number | null
        }
        Relationships: []
      }
      sol_metricas_sync: {
        Row: {
          custo_total: number | null
          data: string | null
          franquia_id: string | null
          key: string
          leads_novos: number | null
          leads_qualificados: number | null
          leads_transferidos: number | null
          robo: string | null
          synced_at: string | null
        }
        Insert: {
          custo_total?: number | null
          data?: string | null
          franquia_id?: string | null
          key: string
          leads_novos?: number | null
          leads_qualificados?: number | null
          leads_transferidos?: number | null
          robo?: string | null
          synced_at?: string | null
        }
        Update: {
          custo_total?: number | null
          data?: string | null
          franquia_id?: string | null
          key?: string
          leads_novos?: number | null
          leads_qualificados?: number | null
          leads_transferidos?: number | null
          robo?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      sol_projetos_sync: {
        Row: {
          etapa: string | null
          evento: string | null
          franquia_id: string | null
          identificador: string | null
          key: string
          project_id: string | null
          synced_at: string | null
          ts_evento: string | null
        }
        Insert: {
          etapa?: string | null
          evento?: string | null
          franquia_id?: string | null
          identificador?: string | null
          key: string
          project_id?: string | null
          synced_at?: string | null
          ts_evento?: string | null
        }
        Update: {
          etapa?: string | null
          evento?: string | null
          franquia_id?: string | null
          identificador?: string | null
          key?: string
          project_id?: string | null
          synced_at?: string | null
          ts_evento?: string | null
        }
        Relationships: []
      }
      sol_qualificacao_sync: {
        Row: {
          acao: string | null
          dados_qualificacao: Json | null
          franquia_id: string | null
          modelo_negocio: string | null
          resumo_qualificacao: string | null
          score: number | null
          synced_at: string | null
          telefone: string
          temperatura: string | null
          ts_primeira_qualificacao: string | null
          ts_ultima_atualizacao: string | null
        }
        Insert: {
          acao?: string | null
          dados_qualificacao?: Json | null
          franquia_id?: string | null
          modelo_negocio?: string | null
          resumo_qualificacao?: string | null
          score?: number | null
          synced_at?: string | null
          telefone: string
          temperatura?: string | null
          ts_primeira_qualificacao?: string | null
          ts_ultima_atualizacao?: string | null
        }
        Update: {
          acao?: string | null
          dados_qualificacao?: Json | null
          franquia_id?: string | null
          modelo_negocio?: string | null
          resumo_qualificacao?: string | null
          score?: number | null
          synced_at?: string | null
          telefone?: string
          temperatura?: string | null
          ts_primeira_qualificacao?: string | null
          ts_ultima_atualizacao?: string | null
        }
        Relationships: []
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
      whatsapp_conversations_daily: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          company_id: string
          conversations_replied: number | null
          conversations_started: number | null
          cpl: number | null
          date: string
          franquia_id: string
          id: string
          inserted_at: string | null
          leads: number | null
          leads_agendados: number | null
          leads_fechados: number | null
          leads_qualificados: number | null
          raw_payload: Json | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          campaign_name?: string | null
          company_id: string
          conversations_replied?: number | null
          conversations_started?: number | null
          cpl?: number | null
          date: string
          franquia_id?: string
          id?: string
          inserted_at?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          raw_payload?: Json | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          campaign_name?: string | null
          company_id?: string
          conversations_replied?: number | null
          conversations_started?: number | null
          cpl?: number | null
          date?: string
          franquia_id?: string
          id?: string
          inserted_at?: string | null
          leads?: number | null
          leads_agendados?: number | null
          leads_fechados?: number | null
          leads_qualificados?: number | null
          raw_payload?: Json | null
          updated_at?: string | null
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
      app_role:
        | "super_admin"
        | "admin"
        | "user"
        | "diretor"
        | "gerente"
        | "closer"
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
      app_role: [
        "super_admin",
        "admin",
        "user",
        "diretor",
        "gerente",
        "closer",
      ],
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
