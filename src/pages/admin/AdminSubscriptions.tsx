import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CreditCard, AlertTriangle, Search, Filter, Settings2, Loader2,
  CheckCircle2, Clock, XCircle, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface EnrichedSubscription {
  id: string;
  plan_code: string;
  plan: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  provider: string | null;
  provider_ref: string | null;
  buyer_email: string | null;
  cancel_at_period_end: boolean;
  owner_user_id: string;
  establishment_id: string | null;
  created_at: string;
  updated_at: string;
  establishment_name: string;
  establishment_slug: string;
  owner_email: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'trial', label: 'Trial' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Cancelado' },
];

const PLAN_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'studio', label: 'Studio' },
  { value: 'pro', label: 'Pro' },
];

const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active': return (
      <Badge className="bg-green-600/15 text-green-700 border-green-600/30 hover:bg-green-600/20">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
      </Badge>
    );
    case 'trial': return (
      <Badge className="bg-blue-600/15 text-blue-700 border-blue-600/30 hover:bg-blue-600/20">
        <Clock className="h-3 w-3 mr-1" /> Trial
      </Badge>
    );
    case 'past_due': return (
      <Badge className="bg-amber-600/15 text-amber-700 border-amber-600/30 hover:bg-amber-600/20">
        <AlertCircle className="h-3 w-3 mr-1" /> Past Due
      </Badge>
    );
    case 'canceled': return (
      <Badge className="bg-red-600/15 text-red-700 border-red-600/30 hover:bg-red-600/20">
        <XCircle className="h-3 w-3 mr-1" /> Cancelado
      </Badge>
    );
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function PlanBadge({ plan }: { plan: string }) {
  const normalized = (plan || '').toLowerCase();
  switch (normalized) {
    case 'pro': return <Badge className="bg-purple-600/15 text-purple-700 border-purple-600/30 font-semibold">Pro</Badge>;
    case 'studio': return <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">Studio</Badge>;
    case 'solo': return <Badge className="bg-zinc-600/15 text-zinc-700 border-zinc-600/30 font-semibold">Solo</Badge>;
    default: return <Badge variant="outline">{plan}</Badge>;
  }
}

function CycleBadge({ cycle }: { cycle: string }) {
  switch ((cycle || '').toLowerCase()) {
    case 'yearly': return <span className="text-xs text-muted-foreground">Anual</span>;
    case 'quarterly': return <span className="text-xs text-muted-foreground">Trimestral</span>;
    case 'monthly': return <span className="text-xs text-muted-foreground">Mensal</span>;
    default: return <span className="text-xs text-muted-foreground">{cycle || '—'}</span>;
  }
}

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");

  // Edit modal
  const [editSub, setEditSub] = useState<EnrichedSubscription | null>(null);
  const [editForm, setEditForm] = useState({ plan_code: '', status: '', billing_cycle: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-subscriptions-enriched"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'list_subscriptions' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.subscriptions as EnrichedSubscription[];
    },
    staleTime: 15000,
  });

  const updateSubscription = useMutation({
    mutationFn: async (params: { subscription_id: string; plan_code?: string; status?: string; billing_cycle?: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'update_subscription', ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-enriched"] });
      queryClient.invalidateQueries({ queryKey: ["admin-establishments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const handleOpenEdit = (sub: EnrichedSubscription) => {
    setEditSub(sub);
    setEditForm({
      plan_code: sub.plan_code || sub.plan || 'solo',
      status: sub.status,
      billing_cycle: sub.billing_cycle || 'monthly',
    });
  };

  const handleSaveEdit = async () => {
    if (!editSub) return;
    try {
      await updateSubscription.mutateAsync({
        subscription_id: editSub.id,
        plan_code: editForm.plan_code,
        status: editForm.status,
        billing_cycle: editForm.billing_cycle,
      });
      toast.success("Assinatura atualizada com sucesso");
      setEditSub(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar assinatura");
    }
  };

  // Filter
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (planFilter !== 'all' && (sub.plan_code || sub.plan) !== planFilter) return false;
      if (cycleFilter !== 'all' && sub.billing_cycle !== cycleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (sub.establishment_name || '').toLowerCase().includes(q) ||
          (sub.establishment_slug || '').toLowerCase().includes(q) ||
          (sub.owner_email || '').toLowerCase().includes(q) ||
          (sub.buyer_email || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, statusFilter, planFilter, cycleFilter, search]);

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar assinaturas</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  // Summary counts
  const totalCount = data?.length ?? 0;
  const activeCount = data?.filter(s => s.status === 'active').length ?? 0;
  const trialCount = data?.filter(s => s.status === 'trial').length ?? 0;
  const canceledCount = data?.filter(s => s.status === 'canceled').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assinaturas</h1>
        <p className="text-muted-foreground text-sm">Gerencie todas as assinaturas da plataforma</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold tabular-nums">{totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-blue-600">{trialCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Trial</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-red-600">{canceledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-sm flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[110px] h-9 text-xs">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos planos</SelectItem>
              {PLAN_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cycleFilter} onValueChange={setCycleFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Ciclo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ciclos</SelectItem>
              {CYCLE_OPTIONS.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Válida até</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sub.establishment_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.owner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell><PlanBadge plan={sub.plan_code || sub.plan} /></TableCell>
                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                    <TableCell><CycleBadge cycle={sub.billing_cycle} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.provider || '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {sub.current_period_end
                        ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {format(new Date(sub.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(sub)} className="gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>
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
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' || planFilter !== 'all' || cycleFilter !== 'all'
                ? 'Nenhuma assinatura encontrada com esses filtros'
                : 'Nenhuma assinatura cadastrada'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Subscription Modal */}
      <Dialog open={!!editSub} onOpenChange={() => setEditSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Editar Assinatura
            </DialogTitle>
            <DialogDescription>
              {editSub?.establishment_name} — {editSub?.owner_email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano</Label>
              <Select value={editForm.plan_code} onValueChange={(v) => setEditForm({ ...editForm, plan_code: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ciclo de Cobrança</Label>
              <Select value={editForm.billing_cycle} onValueChange={(v) => setEditForm({ ...editForm, billing_cycle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CYCLE_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editSub && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{editSub.provider || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider Ref</span>
                  <span className="font-mono text-xs">{editSub.provider_ref || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Válida até</span>
                  <span className="tabular-nums">{editSub.current_period_end ? format(new Date(editSub.current_period_end), "dd/MM/yyyy", { locale: ptBR }) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer Email</span>
                  <span>{editSub.buyer_email || '—'}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateSubscription.isPending}>
              {updateSubscription.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {updateSubscription.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
