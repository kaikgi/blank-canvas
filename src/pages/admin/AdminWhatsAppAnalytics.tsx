import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MessageSquare, ShieldAlert, MousePointerClick, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppEvent {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  status: string;
  block_reason: string | null;
}

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const masked = user.length > 2 ? user[0] + "***" + user[user.length - 1] : "***";
  return `${masked}@${domain}`;
}

function useWhatsAppMetrics() {
  return useQuery({
    queryKey: ["admin-whatsapp-metrics"],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = subDays(today, 7);
      const thirtyDaysAgo = subDays(today, 30);

      // Get all events from last 30 days
      const { data: events, error } = await supabase
        .from("contact_whatsapp_events")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allEvents = (events || []) as WhatsAppEvent[];

      // Compute metrics
      const todayEvents = allEvents.filter(e => new Date(e.created_at) >= today);
      const weekEvents = allEvents.filter(e => new Date(e.created_at) >= sevenDaysAgo);

      const totalToday = todayEvents.length;
      const totalWeek = weekEvents.length;
      const totalMonth = allEvents.length;

      const blockedMonth = allEvents.filter(e => e.status === "blocked").length;
      const blockRate = totalMonth > 0 ? ((blockedMonth / totalMonth) * 100).toFixed(1) : "0";

      // Block reasons
      const reasonCounts: Record<string, number> = {};
      allEvents
        .filter(e => e.block_reason)
        .forEach(e => {
          reasonCounts[e.block_reason!] = (reasonCounts[e.block_reason!] || 0) + 1;
        });

      // Daily chart data (last 30 days)
      const dailyMap: Record<string, { day: string; clicked: number; blocked: number; failed: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = subDays(today, i);
        const key = format(d, "yyyy-MM-dd");
        dailyMap[key] = { day: format(d, "dd/MM"), clicked: 0, blocked: 0, failed: 0 };
      }
      allEvents.forEach(e => {
        const key = format(new Date(e.created_at), "yyyy-MM-dd");
        if (dailyMap[key]) {
          if (e.status === "clicked") dailyMap[key].clicked++;
          else if (e.status === "blocked") dailyMap[key].blocked++;
          else dailyMap[key].failed++;
        }
      });
      const chartData = Object.values(dailyMap);

      // Recent events (50)
      const recent = allEvents.slice(0, 50);

      return {
        totalToday,
        totalWeek,
        totalMonth,
        blockRate,
        reasonCounts,
        chartData,
        recent,
      };
    },
  });
}

export default function AdminWhatsAppAnalytics() {
  const { data, isLoading, error } = useWhatsAppMetrics();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar métricas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Métricas WhatsApp</h1>
        <p className="text-muted-foreground">Análise de contatos via WhatsApp e proteção anti-abuso</p>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data?.totalToday}</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data?.totalWeek}</p>
                  <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data?.totalMonth}</p>
                  <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{data?.blockRate}%</p>
                  <p className="text-sm text-muted-foreground">Taxa bloqueio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Block Reasons */}
      {data && Object.keys(data.reasonCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivos de Bloqueio (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.reasonCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, count]) => (
                  <div key={reason} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                    <Badge variant="outline">{reason}</Badge>
                    <span className="font-semibold text-sm">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {isLoading ? (
        <Skeleton className="h-72" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume diário (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicked" name="Enviados" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="blocked" name="Bloqueados" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Data/Hora</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent.map((evt) => (
                    <tr key={evt.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {format(new Date(evt.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-2 pr-4">{maskEmail(evt.email)}</td>
                      <td className="py-2 pr-4">
                        {evt.status === "clicked" && <Badge className="bg-primary/10 text-primary border-0">Enviado</Badge>}
                        {evt.status === "blocked" && <Badge variant="destructive">Bloqueado</Badge>}
                        {evt.status === "failed" && <Badge variant="secondary">Falha</Badge>}
                      </td>
                      <td className="py-2 text-muted-foreground">{evt.block_reason || "—"}</td>
                    </tr>
                  ))}
                  {(!data?.recent || data.recent.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum evento registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
