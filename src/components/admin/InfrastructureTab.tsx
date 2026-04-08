import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server } from "lucide-react";

const EDGE_FUNCTIONS = [
  { name: "sync-make-datastores", purpose: "Sincroniza DataStores Make → tabelas _sync no Supabase", trigger: "pg_cron + manual", auth: "anon/service_role" },
  { name: "cron-sync", purpose: "Orquestra sync multi-tenant: leads, métricas, equipe, cenários, heartbeat, erros", trigger: "pg_cron (5 min)", auth: "anon/service_role" },
  { name: "fetch-make-heartbeat", purpose: "Coleta status de execução dos cenários Make (heartbeat)", trigger: "pg_cron via cron-sync", auth: "service_role" },
  { name: "fetch-make-errors", purpose: "Coleta erros de execução dos cenários Make", trigger: "pg_cron via cron-sync", auth: "service_role" },
  { name: "fetch-make-data", purpose: "Busca dados genéricos de DataStores Make (legado)", trigger: "Manual", auth: "Bearer JWT" },
  { name: "fetch-make-comercial", purpose: "Busca dados comerciais do Make (legado)", trigger: "Manual", auth: "Bearer JWT" },
  { name: "sol-actions", purpose: "Executa ações SOL: qualificar, desqualificar, reprocessar, follow-up", trigger: "UI (usuário)", auth: "Bearer JWT" },
  { name: "make-action", purpose: "Proxy para API Make: retry/discard execuções com erro", trigger: "UI (admin)", auth: "Bearer JWT + super_admin" },
  { name: "executive-summary", purpose: "Gera resumo executivo via IA (Lovable AI)", trigger: "UI (usuário)", auth: "Bearer JWT" },
  { name: "generate-report", purpose: "Gera e envia relatórios WhatsApp via templates", trigger: "UI (usuário)", auth: "Bearer JWT" },
  { name: "manage-users", purpose: "CRUD de usuários: criar, deletar, reset senha, force change", trigger: "UI (admin)", auth: "Bearer JWT + super_admin" },
  { name: "impersonate-user", purpose: "Gera token de impersonação para super_admin", trigger: "UI (admin)", auth: "Bearer JWT + super_admin" },
  { name: "track-session", purpose: "Rastreia login/logout/validate de sessões", trigger: "Auth flow", auth: "Bearer JWT" },
  { name: "turnstile-verify", purpose: "Valida Cloudflare Turnstile no login", trigger: "Auth flow", auth: "Público" },
  { name: "notify-ticket-whatsapp", purpose: "Notifica abertura de chamado via WhatsApp", trigger: "UI (chamados)", auth: "Bearer JWT" },
  { name: "send-whatsapp-alert", purpose: "Envia alertas WhatsApp genéricos", trigger: "Edge Functions", auth: "service_role" },
  { name: "sync-time-comercial", purpose: "Sincroniza time comercial Make → profiles (legado)", trigger: "Manual", auth: "Bearer JWT" },
  { name: "webhook-campaign-data", purpose: "Recebe dados de campanhas via webhook externo", trigger: "Webhook (Make)", auth: "WEBHOOK_SECRET" },
  { name: "auth-email-hook", purpose: "Customiza templates de email (signup, recovery, etc.)", trigger: "Auth hook", auth: "Interno Supabase" },
];

const CRON_JOBS = [
  { schedule: "*/5 * * * *", interval: "5 min", function: "cron-sync", tables: "sol_leads_sync, sol_qualificacao_sync, sol_conversions_sync, make_heartbeat, make_errors", note: "Dados operacionais em tempo quase-real" },
  { schedule: "*/15 * * * *", interval: "15 min", function: "cron-sync", tables: "sol_metricas_sync, sol_propostas", note: "Métricas e eventos SM" },
  { schedule: "0 * * * *", interval: "1 hora", function: "cron-sync", tables: "sol_config_sync, sol_equipe_sync, sol_funis_sync", note: "Configurações (baixa frequência)" },
];

const SYNC_TABLES = [
  { table: "sol_leads_sync", ds_make: "sol_leads (87418)", records: "~16", mode: "READ", sync: "5 min", purpose: "Leads do Agente SDR SOL" },
  { table: "sol_qualificacao_sync", ds_make: "sol_qualificacao (87715)", records: "~7", mode: "READ", sync: "5 min", purpose: "Dados de qualificação por lead" },
  { table: "sol_conversions_sync", ds_make: "sol_conversions (87775)", records: "~0", mode: "READ", sync: "5 min", purpose: "Eventos CAPI/Google Ads" },
  { table: "sol_metricas_sync", ds_make: "sol_metricas (87422)", records: "~2", mode: "READ", sync: "15 min", purpose: "Métricas diárias do robô" },
  { table: "sol_propostas", ds_make: "sol_projetos (87423)", records: "~79", mode: "READ", sync: "15 min", purpose: "Eventos SM (ganho/perdido/etapa)" },
  { table: "sol_config_sync", ds_make: "sol_config (87419)", records: "~16", mode: "READ+WRITE", sync: "1 hora", purpose: "Prompts, variáveis, config do agente" },
  { table: "sol_equipe_sync", ds_make: "sol_equipe (87420)", records: "~5", mode: "READ+WRITE", sync: "1 hora", purpose: "Closers e SDRs ativos" },
  { table: "sol_funis_sync", ds_make: "sol_funis (87421)", records: "~1", mode: "READ+WRITE", sync: "1 hora", purpose: "Funis e etapas SM mapeadas" },
];

const DB_FUNCTIONS = [
  { name: "handle_new_user()", trigger: "auth.users INSERT", purpose: "Cria profile + role 'user' + org padrão ao cadastrar usuário" },
  { name: "has_role(uuid, app_role)", trigger: "RLS policies", purpose: "Verifica se usuário tem determinada role (SECURITY DEFINER)" },
  { name: "is_session_valid(uuid, text)", trigger: "RLS policies", purpose: "Valida sessão ativa por token hash" },
  { name: "hash_session_token(text)", trigger: "Functions internas", purpose: "SHA-256 do token de sessão" },
  { name: "get_user_org(uuid)", trigger: "RLS policies", purpose: "Retorna organization_id do usuário" },
  { name: "invalidate_other_sessions(uuid, text)", trigger: "Login flow", purpose: "Invalida sessões anteriores ao novo login" },
  { name: "update_updated_at_column()", trigger: "UPDATE triggers", purpose: "Atualiza coluna updated_at automaticamente" },
];

const SECRETS = [
  { name: "MAKE_API_KEY", usage: "cron-sync, fetch-make-*", purpose: "Autenticação na API Make.com" },
  { name: "MAKE_TEAM_ID", usage: "cron-sync", purpose: "ID do time Make para listar cenários" },
  { name: "MAKE_DATASTORE_ID", usage: "sync-make-datastores (legado)", purpose: "ID do DS principal (legado)" },
  { name: "MAKE_COMERCIAL_DATASTORE_ID", usage: "fetch-make-comercial (legado)", purpose: "ID do DS comercial (legado)" },
  { name: "GOOGLE_API_KEY", usage: "executive-summary", purpose: "Chave API Google (se necessário)" },
  { name: "GOOGLE_SERVICE_ACCOUNT_EMAIL", usage: "Integração Sheets", purpose: "Email da service account Google" },
  { name: "GOOGLE_SERVICE_ACCOUNT_KEY", usage: "Integração Sheets", purpose: "Chave privada da service account" },
  { name: "GOOGLE_PRIVATE_KEY", usage: "Integração Sheets", purpose: "Private key Google (alternativa)" },
  { name: "GOOGLE_SHEET_ID", usage: "Integração Sheets", purpose: "ID da planilha Google" },
  { name: "TURNSTILE_SITE_KEY", usage: "Frontend (login)", purpose: "Chave pública Cloudflare Turnstile" },
  { name: "TURNSTILE_SECRET_KEY", usage: "turnstile-verify", purpose: "Chave secreta Cloudflare Turnstile" },
  { name: "WEBHOOK_SECRET", usage: "webhook-campaign-data", purpose: "Validação de webhooks externos" },
  { name: "LOVABLE_API_KEY", usage: "executive-summary", purpose: "Chave Lovable AI para geração de conteúdo" },
];

const VPS_MIGRATION_NOTES = [
  "1. Exportar todas as tabelas do Supabase (pg_dump) — schema + dados",
  "2. Recriar as Edge Functions como endpoints Express/Fastify no Node.js ou Deno Deploy",
  "3. Substituir pg_cron por node-cron ou crontab do sistema operacional",
  "4. Configurar variáveis de ambiente (.env) com todos os secrets listados acima",
  "5. Configurar Nginx/Caddy como reverse proxy com SSL (Let's Encrypt)",
  "6. Manter a mesma estrutura de auth (JWT + bcrypt) ou migrar para Passport.js",
  "7. Storage: migrar bucket 'ticket-attachments' para S3/MinIO",
  "8. Substituir Supabase Realtime por Socket.io ou SSE se necessário",
  "9. DNS: apontar domínio para IP do VPS",
  "10. Monitoramento: PM2 + logs centralizados (Loki/Grafana ou similar)",
];

const denseTh = "h-7 px-1.5 py-0 text-[10px] font-medium";
const denseTd = "px-1.5 py-1 text-[10px] align-top";

/** Referência técnica compacta (abas + scroll interno) — para não ocupar a página inteira. */
export function InfrastructureReferenceContent() {
  return (
    <Card className="border-dashed">
      <CardHeader className="py-2 px-3 space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
          Referência de infraestrutura
        </CardTitle>
        <CardDescription className="text-[11px] leading-snug">
          Documentação estática (Make → cron-sync → _sync → React). Uma aba por tópico; rolagem só dentro da tabela.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 pt-0">
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="h-7 flex-wrap gap-0.5 bg-muted/50 p-0.5 mb-2 w-full justify-start">
            <TabsTrigger value="resumo" className="text-[10px] px-2 py-0 h-6">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="cron" className="text-[10px] px-2 py-0 h-6">
              Cron
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-[10px] px-2 py-0 h-6">
              Tabelas _sync
            </TabsTrigger>
            <TabsTrigger value="edges" className="text-[10px] px-2 py-0 h-6">
              Edge ({EDGE_FUNCTIONS.length})
            </TabsTrigger>
            <TabsTrigger value="db" className="text-[10px] px-2 py-0 h-6">
              DB
            </TabsTrigger>
            <TabsTrigger value="secrets" className="text-[10px] px-2 py-0 h-6">
              Secrets
            </TabsTrigger>
            <TabsTrigger value="vps" className="text-[10px] px-2 py-0 h-6">
              VPS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-0">
            <p className="text-[10px] text-muted-foreground mb-2">{EDGE_FUNCTIONS.length} edge functions · {CRON_JOBS.length} crons · {SYNC_TABLES.length} tabelas _sync</p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <Badge variant="outline" className="font-normal">Make → Edge → Supabase</Badge>
              <Badge variant="outline" className="font-normal">Auth JWT + RLS</Badge>
            </div>
          </TabsContent>

          <TabsContent value="cron" className="mt-0 max-h-48 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={denseTh}>Schedule</TableHead>
                  <TableHead className={denseTh}>Int.</TableHead>
                  <TableHead className={denseTh}>Fn</TableHead>
                  <TableHead className={denseTh}>Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CRON_JOBS.map((job, i) => (
                  <TableRow key={i}>
                    <TableCell className={`${denseTd} font-mono whitespace-nowrap`}>{job.schedule}</TableCell>
                    <TableCell className={denseTd}>{job.interval}</TableCell>
                    <TableCell className={`${denseTd} font-mono`}>{job.function}</TableCell>
                    <TableCell className={`${denseTd} text-muted-foreground`}>{job.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="sync" className="mt-0 max-h-48 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={denseTh}>Tabela</TableHead>
                  <TableHead className={denseTh}>DS</TableHead>
                  <TableHead className={denseTh}>Sync</TableHead>
                  <TableHead className={denseTh}>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SYNC_TABLES.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className={`${denseTd} font-mono`}>{t.table}</TableCell>
                    <TableCell className={`${denseTd} font-mono max-w-[100px] truncate`} title={t.ds_make}>
                      {t.ds_make}
                    </TableCell>
                    <TableCell className={denseTd}>{t.sync}</TableCell>
                    <TableCell className={`${denseTd} text-muted-foreground`}>{t.purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="edges" className="mt-0 max-h-52 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={denseTh}>Nome</TableHead>
                  <TableHead className={denseTh}>Propósito</TableHead>
                  <TableHead className={denseTh}>Auth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EDGE_FUNCTIONS.map((fn, i) => (
                  <TableRow key={i}>
                    <TableCell className={`${denseTd} font-mono whitespace-nowrap`}>{fn.name}</TableCell>
                    <TableCell className={denseTd}>{fn.purpose}</TableCell>
                    <TableCell className={`${denseTd} text-muted-foreground`}>{fn.auth}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="db" className="mt-0 max-h-44 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={denseTh}>Função</TableHead>
                  <TableHead className={denseTh}>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DB_FUNCTIONS.map((fn, i) => (
                  <TableRow key={i}>
                    <TableCell className={`${denseTd} font-mono`}>{fn.name}</TableCell>
                    <TableCell className={`${denseTd} text-muted-foreground`}>{fn.purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="secrets" className="mt-0 max-h-44 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={denseTh}>Secret</TableHead>
                  <TableHead className={denseTh}>Onde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SECRETS.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className={`${denseTd} font-mono`}>{s.name}</TableCell>
                    <TableCell className={`${denseTd} text-muted-foreground`}>{s.usage} — {s.purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="vps" className="mt-0 max-h-40 overflow-y-auto text-[10px] text-muted-foreground space-y-1 pl-1 border rounded-md p-2">
            {VPS_MIGRATION_NOTES.map((note, i) => (
              <p key={i}>{note.replace(/^\d+\.\s*/, "")}</p>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function InfrastructureTab() {
  return (
    <div className="space-y-6">
      <InfrastructureReferenceContent />
    </div>
  );
}
