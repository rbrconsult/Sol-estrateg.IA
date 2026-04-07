/** Rótulos PT-BR para `app_role` (tabela `user_roles`) — alinhar Admin, Módulos e wizards. */
export const APP_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  user: "Usuário",
  diretor: "Diretor",
  gerente: "Gerente",
  closer: "Closer",
};

export function appRoleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return APP_ROLE_LABELS[role] ?? role;
}
