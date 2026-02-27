import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Calendar, MessageSquare, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema Agendali</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estabelecimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_establishments || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_subscriptions_active || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos (Mês)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.appointments_this_month || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions by Plan */}
      {stats?.subscriptions_by_plan && (
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {Object.entries(stats.subscriptions_by_plan).map(([plan, count]) => (
                <div key={plan} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{plan}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* New Messages Alert */}
        {stats?.new_contact_messages && stats.new_contact_messages > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader className="flex flex-row items-center gap-3">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle className="text-base">Novas Mensagens</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {stats.new_contact_messages} mensagem(ns) aguardando resposta
                </p>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Recent Establishments */}
        <Card>
          <CardHeader>
            <CardTitle>Estabelecimentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recent_establishments?.length ? (
              <div className="space-y-3">
                {stats.recent_establishments.map((est) => (
                  <div
                    key={est.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{est.name}</p>
                      <p className="text-sm text-muted-foreground">{est.owner_email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(est.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum estabelecimento ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
