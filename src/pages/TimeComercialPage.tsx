import { TimeComercialTab } from "@/components/admin/TimeComercialTab";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function TimeComercialPage() {
  const { userRole, loading } = useAuth();

  if (loading) return null;

  // Allow super_admin, diretor, gerente
  const allowed = ["super_admin", "diretor", "gerente"];
  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Comercial</h1>
        <p className="text-sm text-muted-foreground">Gestão de vendedores e equipe comercial</p>
      </div>
      <TimeComercialTab />
    </div>
  );
}
