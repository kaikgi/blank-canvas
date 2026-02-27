import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, CreditCard, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatCard({ title, value, icon: Icon, loading, variant }: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-destructive',
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[variant || 'default']}`} />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-16" /> : (
          <div className="text-3xl font-bold tabular-nums">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar estatísticas</p>
        <p className="text-sm text-muted-foreground">Verifique se você tem permissão de admin.</p>
      </div>
    );
  }

  const trialCount = stats?.trial_active ?? 0;
  const activeCount = stats?.by_status?.active ?? 0;
  const pastDueCount = (stats?.by_status?.past_due ?? 0) + (stats?.by_status?.canceled ?? 0);
  const trialExpiredCount = stats?.trial_expired ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Painel de controle do Agendali</p>
      </div>

      {/* Top-level metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Estabelecimentos"
          value={stats?.total_establishments ?? 0}
          icon={Building2}
          loading={isLoading}
        />
        <StatCard
          title="Em Trial (ativo)"
          value={trialCount}
          icon={Clock}
          loading={isLoading}
          variant="warning"
        />
        <StatCard
          title="Pagantes (Active)"
          value={activeCount}
          icon={CheckCircle2}
          loading={isLoading}
          variant="success"
        />
        <StatCard
          title="Bloqueados / Cancelados"
          value={pastDueCount + trialExpiredCount}
          icon={XCircle}
          loading={isLoading}
          variant="danger"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total de Clientes"
          value={stats?.total_customers ?? 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats?.active_subscriptions ?? 0}
          icon={CreditCard}
          loading={isLoading}
          variant="success"
        />
        <StatCard
          title="Trials Expirados"
          value={trialExpiredCount}
          icon={AlertTriangle}
          loading={isLoading}
          variant="danger"
        />
      </div>

      {/* Status Breakdown */}
      {stats?.by_status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge variant={
                    status === 'active' ? 'default' :
                    status === 'trial' ? 'secondary' :
                    'destructive'
                  }>
                    {status}
                  </Badge>
                  <span className="text-lg font-semibold tabular-nums">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Establishments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estabelecimentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stats?.recent_establishments?.length ? (
            <div className="divide-y">
              {stats.recent_establishments.map((est) => (
                <div key={est.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{est.name}</p>
                    <p className="text-xs text-muted-foreground">{est.owner_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={est.status === 'active' ? 'default' : est.status === 'trial' ? 'secondary' : 'destructive'}>
                      {est.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(est.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4 text-sm">Nenhum estabelecimento ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
