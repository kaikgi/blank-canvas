import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Shield, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionIcons: Record<string, typeof Shield> = {
  admin_add: Shield,
  danger_zone_preview: AlertTriangle,
  danger_zone_execute: Trash2,
  danger_zone_error: AlertTriangle,
};

const actionLabels: Record<string, string> = {
  admin_add: "Admin adicionado",
  danger_zone_preview: "Danger Zone (prévia)",
  danger_zone_execute: "Danger Zone (execução)",
  danger_zone_error: "Danger Zone (erro)",
};

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Logs de Auditoria
        </h1>
        <p className="text-muted-foreground">Registro imutável de ações administrativas</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : logs?.length ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const Icon = actionIcons[log.action] || ScrollText;
            const label = actionLabels[log.action] || log.action;
            const isDanger = log.action.startsWith("danger_zone");

            return (
              <Card key={log.id} className={isDanger ? "border-destructive/30" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      isDanger ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <Icon className={`h-5 w-5 ${isDanger ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{label}</p>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.request_hash}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </p>
                      {log.details && (
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum log de auditoria encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
