import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active': return <Badge className="bg-green-600 hover:bg-green-700 text-white">Ativo</Badge>;
    case 'trial': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Trial</Badge>;
    case 'past_due': return <Badge variant="destructive">Past Due</Badge>;
    case 'canceled': return <Badge variant="destructive">Cancelado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminSubscriptions() {
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 15000,
  });

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar assinaturas</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  const activeCount = subscriptions?.filter(s => s.status === 'active').length ?? 0;
  const trialCount = subscriptions?.filter(s => s.status === 'trial').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <p className="text-muted-foreground">Todas as assinaturas do sistema</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{subscriptions?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{trialCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Trial</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : subscriptions && subscriptions.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Email Comprador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {sub.plan_code || sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                    <TableCell className="text-sm">{sub.billing_cycle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sub.provider || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sub.buyer_email || '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {sub.current_period_end
                        ? format(new Date(sub.current_period_end), "dd/MM/yy", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {format(new Date(sub.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
