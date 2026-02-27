import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HeartbeatEntry {
  id: string;
  scenario_id: number;
  scenario_name: string;
  execution_id: string;
  status: string;
  duration_seconds: number | null;
  ops_count: number | null;
  transfer_bytes: number | null;
  error_message: string | null;
  started_at: string;
  created_at: string;
}

export interface ScenarioHealth {
  scenario_id: number;
  scenario_name: string;
  total: number;
  success: number;
  errors: number;
  warnings: number;
  uptime: number;
  lastSuccess: string | null;
  lastError: string | null;
  avgDuration: number | null;
  timeline: { time: string; status: "success" | "error" | "warning" | "empty" }[];
}

/** Scenario IDs in display order */
const PRINCIPAL_SCENARIO_ORDER: number[] = [
  // Robô Sol
  3716678,
  // Robô FUP FRIO
  4015856,
  // Fluxo 1 - Captura Meta Ads
  3416132, 3724157, 3672582,
  // Fluxo 2 - Captura Site/Landing
  3576316, 3567830, 3403261, 3724150,
  // Autenticações
  3616676, 3415205,
];
const PRINCIPAL_SCENARIO_IDS = new Set(PRINCIPAL_SCENARIO_ORDER);

function buildTimeline(entries: HeartbeatEntry[]): ScenarioHealth["timeline"] {
  const now = new Date();
  const buckets: ScenarioHealth["timeline"] = [];
  const BUCKET_MINUTES = 30;
  const BUCKET_COUNT = 48; // 24h

  for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
    const bucketStart = new Date(now.getTime() - (i + 1) * BUCKET_MINUTES * 60 * 1000);
    const bucketEnd = new Date(now.getTime() - i * BUCKET_MINUTES * 60 * 1000);

    const inBucket = entries.filter((e) => {
      const t = new Date(e.started_at).getTime();
      return t >= bucketStart.getTime() && t < bucketEnd.getTime();
    });

    if (inBucket.length === 0) {
      buckets.push({ time: bucketStart.toISOString(), status: "empty" });
    } else if (inBucket.some((e) => e.status === "error")) {
      buckets.push({ time: bucketStart.toISOString(), status: "error" });
    } else if (inBucket.some((e) => e.status === "warning")) {
      buckets.push({ time: bucketStart.toISOString(), status: "warning" });
    } else {
      buckets.push({ time: bucketStart.toISOString(), status: "success" });
    }
  }
  return buckets;
}

function computeHealth(entries: HeartbeatEntry[]): ScenarioHealth[] {
  const byScenario = new Map<number, HeartbeatEntry[]>();
  for (const e of entries) {
    const arr = byScenario.get(e.scenario_id) || [];
    arr.push(e);
    byScenario.set(e.scenario_id, arr);
  }

  const result: ScenarioHealth[] = [];
  for (const [scenarioId, scenarioEntries] of byScenario) {
    const sorted = scenarioEntries.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const total = sorted.length;
    const success = sorted.filter((e) => e.status === "success").length;
    const errors = sorted.filter((e) => e.status === "error").length;
    const warnings = sorted.filter((e) => e.status === "warning").length;
    const uptime = total > 0 ? (success / total) * 100 : 100;
    const lastSuccess = sorted.find((e) => e.status === "success")?.started_at ?? null;
    const lastError = sorted.find((e) => e.status === "error")?.started_at ?? null;
    const durations = sorted.filter((e) => e.duration_seconds != null).map((e) => e.duration_seconds!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

    result.push({
      scenario_id: scenarioId,
      scenario_name: sorted[0].scenario_name,
      total,
      success,
      errors,
      warnings,
      uptime,
      lastSuccess,
      lastError,
      avgDuration,
      timeline: buildTimeline(sorted),
    });
  }

  // Only keep principal scenarios with recent activity (48h)
  const cutoff48h = Date.now() - 48 * 60 * 60 * 1000;
  const active = result.filter((s) => {
    if (!PRINCIPAL_SCENARIO_IDS.has(s.scenario_id)) return false;
    const lastExec = s.lastSuccess || s.lastError;
    return lastExec && new Date(lastExec).getTime() >= cutoff48h;
  });

  // Sort by defined order
  return active.sort((a, b) => {
    const ai = PRINCIPAL_SCENARIO_ORDER.indexOf(a.scenario_id);
    const bi = PRINCIPAL_SCENARIO_ORDER.indexOf(b.scenario_id);
    return ai - bi;
  });
}

export function useMakeHeartbeat() {
  const queryClient = useQueryClient();

  const heartbeatQuery = useQuery({
    queryKey: ["make-heartbeat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("make_heartbeat" as any)
        .select("*")
        .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as unknown as HeartbeatEntry[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const healthData = heartbeatQuery.data ? computeHealth(heartbeatQuery.data) : [];

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-make-heartbeat");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["make-heartbeat"] });
      toast.success(
        `Heartbeat sincronizado: ${data.success} ok, ${data.errors} erros, ${data.warnings} avisos`
      );
    },
    onError: (err: Error) => {
      toast.error(`Erro no heartbeat: ${err.message}`);
    },
  });

  return { heartbeatQuery, healthData, syncMutation };
}
