import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFranquiaId } from "./useFranquiaId";

export function useSkillToggles() {
  const franquiaId = useFranquiaId();
  const queryClient = useQueryClient();

  const { data: toggles = {}, isLoading } = useQuery({
    queryKey: ["skill-toggles", franquiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_toggles" as any)
        .select("skill_id, enabled")
        .eq("franquia_id", franquiaId);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data as any[])?.forEach((r: any) => { map[r.skill_id] = r.enabled; });
      return map;
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ skillId, enabled }: { skillId: string; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("skill_toggles" as any)
        .upsert(
          { skill_id: skillId, enabled, franquia_id: franquiaId, updated_by: user?.id, updated_at: new Date().toISOString() } as any,
          { onConflict: "skill_id" }
        );
      if (error) throw error;
    },
    onMutate: async ({ skillId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["skill-toggles", franquiaId] });
      const prev = queryClient.getQueryData<Record<string, boolean>>(["skill-toggles", franquiaId]);
      queryClient.setQueryData(["skill-toggles", franquiaId], { ...prev, [skillId]: enabled });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["skill-toggles", franquiaId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-toggles", franquiaId] });
    },
  });

  return { toggles, isLoading, toggle: toggleMutation.mutate };
}
