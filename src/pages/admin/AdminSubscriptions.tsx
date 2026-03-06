import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckCircle2, Clock, XCircle, AlertCircle, DollarSign, TrendingUp,
  ArrowUpDown, ChevronLeft, ChevronRight, History, Ban, Play,
  RefreshCw, Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { PLANS } from "@/lib/hardcodedPlans";

// --- Types ---

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

interface SubscriptionEvent {
  id: string;
  establishment_id: string;
  plan: string;
  billing_cycle: string;
  event_type: string;
  amount_cents: number | null;
  provider: string | null;
  provider_ref: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

// --- Constants ---

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'trial', label: 'Trial' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'suspended', label: 'Suspenso' },
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

const PROVIDER_OPTIONS = [
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'admin', label: 'Admin' },
  { value: 'internal', label: 'Internal' },
];

const PAGE_SIZE = 20;

type SortKey = 'establishment_name' | 'plan_code' | 'status' | 'billing_cycle' | 'current_period_end' | 'created_at' | 'updated_at';

// --- Badge Components ---

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
    case 'suspended': return (
      <Badge className="bg-orange-600/15 text-orange-700 border-orange-600/30 hover:bg-orange-600/20">
        <Ban className="h-3 w-3 mr-1" /> Suspenso
      </Badge>
    );
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function PlanBadge({ plan }: { plan: string }) {
  const n = (plan || '').toLowerCase();
  switch (n) {
    case 'pro': return <Badge className="bg-purple-600/15 text-purple-700 border-purple-600/30 font-semibold">Pro</Badge>;
    case 'studio': return <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">Studio</Badge>;
    case 'solo': return <Badge className="bg-zinc-600/15 text-zinc-700 border-zinc-600/30 font-semibold">Solo</Badge>;
    default: return <Badge variant="outline">{plan}</Badge>;
  }
}

function CycleBadge({ cycle }: { cycle: string }) {
  switch ((cycle || '').toLowerCase()) {
    case 'yearly': return <Badge variant="outline" className="text-xs font-normal">Anual</Badge>;
    case 'quarterly': return <Badge variant="outline" className="text-xs font-normal">Trimestral</Badge>;
    case 'monthly': return <Badge variant="outline" className="text-xs font-normal">Mensal</Badge>;
    default: return <Badge variant="outline" className="text-xs font-normal">{cycle || '—'}</Badge>;
  }
}

function ProviderBadge({ provider }: { provider: string | null }) {
  const p = (provider || '').toLowerCase();
  switch (p) {
    case 'kiwify': return <span className="text-xs font-medium text-emerald-600">Kiwify</span>;
    case 'admin': return <span className="text-xs font-medium text-amber-600">Admin</span>;
    case 'internal': return <span className="text-xs font-medium text-muted-foreground">Internal</span>;
    default: return <span className="text-xs text-muted-foreground">{provider || '—'}</span>;
  }
}

// --- MRR Calculation ---

function calculateMRR(subscriptions: EnrichedSubscription[]): number {
  let mrr = 0;
  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;
    const planCode = (sub.plan_code || sub.plan || '').toLowerCase();
    const plan = PLANS.find(p => p.code === planCode);
    if (!plan) continue;
    // Normalize to monthly
    const cycle = (sub.billing_cycle || 'monthly').toLowerCase();
    switch (cycle) {
      case 'yearly': mrr += plan.prices.yearly / 12; break;
      case 'quarterly': mrr += plan.prices.quarterly / 3; break;
      default: mrr += plan.prices.monthly; break;
    }
  }
  return mrr;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

// --- Event Type Labels ---

function getEventLabel(eventType: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    trial_created: { label: 'Trial criado', color: 'text-blue-600' },
    payment_confirmed: { label: 'Pagamento confirmado', color: 'text-green-600' },
    plan_changed: { label: 'Plano alterado', color: 'text-purple-600' },
    cycle_changed: { label: 'Ciclo alterado', color: 'text-indigo-600' },
    renewed: { label: 'Renovação', color: 'text-green-600' },
    canceled: { label: 'Cancelamento', color: 'text-red-600' },
    suspended: { label: 'Suspensão', color: 'text-orange-600' },
    reactivated: { label: 'Reativação', color: 'text-green-600' },
    payment_failed: { label: 'Falha no pagamento', color: 'text-red-600' },
    refunded: { label: 'Reembolso', color: 'text-amber-600' },
    update_subscription: { label: 'Atualização admin', color: 'text-amber-600' },
  };
  return map[eventType] || { label: eventType, color: 'text-muted-foreground' };
}

// --- Metric Card ---

function MetricCard({ title, value, icon: Icon, color, subtitle, loading }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; subtitle?: string; loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
              </>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-muted/50`}>
            <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Sortable Header ---

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  label: string; sortKey: SortKey; currentSort: SortKey; currentDir: 'asc' | 'desc'; onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-foreground' : 'text-muted-foreground/40'}`} />
      </div>
    </TableHead>
  );
}

// === MAIN COMPONENT ===

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(0);

  // Manage modal
  const [manageSub, setManageSub] = useState<EnrichedSubscription | null>(null);
  const [manageTab, setManageTab] = useState('details');
  const [editForm, setEditForm] = useState({
    plan_code: '', status: '', billing_cycle: '',
    current_period_end: '', provider_ref: '',
  });

  // --- Data Query ---
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

  // --- Events Query (per subscription) ---
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-subscription-events", manageSub?.establishment_id],
    queryFn: async () => {
      if (!manageSub?.establishment_id) return [];
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'list_subscription_events', establishment_id: manageSub.establishment_id },
      });
      if (error) throw error;
      return (data?.events || []) as SubscriptionEvent[];
    },
    enabled: !!manageSub?.establishment_id,
    staleTime: 10000,
  });

  // --- Mutation ---
  const updateSubscription = useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-events"] });
    },
  });

  // --- Handlers ---
  const handleOpenManage = (sub: EnrichedSubscription) => {
    setManageSub(sub);
    setManageTab('details');
    setEditForm({
      plan_code: sub.plan_code || sub.plan || 'solo',
      status: sub.status,
      billing_cycle: sub.billing_cycle || 'monthly',
      current_period_end: sub.current_period_end ? sub.current_period_end.slice(0, 10) : '',
      provider_ref: sub.provider_ref || '',
    });
  };

  const handleSave = async () => {
    if (!manageSub) return;
    try {
      await updateSubscription.mutateAsync({
        subscription_id: manageSub.id,
        plan_code: editForm.plan_code,
        status: editForm.status,
        billing_cycle: editForm.billing_cycle,
        skip_period_reset: true,
      });
      toast.success("Assinatura atualizada com sucesso");
      setManageSub(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar assinatura");
    }
  };

  const handleQuickAction = async (action: 'suspend' | 'reactivate' | 'cancel') => {
    if (!manageSub) return;
    const statusMap = { suspend: 'suspended', reactivate: 'active', cancel: 'canceled' };
    try {
      await updateSubscription.mutateAsync({
        subscription_id: manageSub.id,
        status: statusMap[action],
        skip_period_reset: action === 'reactivate' ? undefined : true,
      });
      toast.success(`Assinatura ${action === 'suspend' ? 'suspensa' : action === 'reactivate' ? 'reativada' : 'cancelada'}`);
      setManageSub(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro na ação");
    }
  };

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }, [sortKey]);

  // --- Filter + Sort + Paginate ---
  const { filtered, totalFiltered, totalPages, paginatedData } = useMemo(() => {
    if (!data) return { filtered: [], totalFiltered: 0, totalPages: 0, paginatedData: [] };
    
    let result = data.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (planFilter !== 'all' && (sub.plan_code || sub.plan) !== planFilter) return false;
      if (cycleFilter !== 'all' && sub.billing_cycle !== cycleFilter) return false;
      if (providerFilter !== 'all' && (sub.provider || '') !== providerFilter) return false;
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

    // Sort
    result.sort((a, b) => {
      let aVal = (a as any)[sortKey] || '';
      let bVal = (b as any)[sortKey] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalFiltered = result.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const paginatedData = result.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return { filtered: result, totalFiltered, totalPages, paginatedData };
  }, [data, statusFilter, planFilter, cycleFilter, providerFilter, search, sortKey, sortDir, page]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    if (!data) return null;
    const total = data.length;
    const active = data.filter(s => s.status === 'active').length;
    const trial = data.filter(s => s.status === 'trial').length;
    const canceled = data.filter(s => s.status === 'canceled').length;
    const pastDue = data.filter(s => s.status === 'past_due').length;
    const expired = data.filter(s => {
      if (s.status !== 'trial') return false;
      return s.current_period_end && new Date(s.current_period_end) < new Date();
    }).length;
    const mrr = calculateMRR(data);
    return { total, active, trial, canceled, pastDue, expired, mrr };
  }, [data]);

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar assinaturas</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assinaturas</h1>
        <p className="text-muted-foreground text-sm">Gerencie todas as assinaturas da plataforma</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Total" value={String(metrics?.total ?? 0)} icon={CreditCard} color="text-foreground" loading={isLoading} />
        <MetricCard title="Ativas" value={String(metrics?.active ?? 0)} icon={CheckCircle2} color="text-green-600" loading={isLoading} />
        <MetricCard title="Trial" value={String(metrics?.trial ?? 0)} icon={Clock} color="text-blue-600" loading={isLoading} subtitle={metrics?.expired ? `${metrics.expired} expirado(s)` : undefined} />
        <MetricCard title="Canceladas" value={String(metrics?.canceled ?? 0)} icon={XCircle} color="text-red-600" loading={isLoading} />
        <MetricCard title="Past Due" value={String(metrics?.pastDue ?? 0)} icon={AlertCircle} color="text-amber-600" loading={isLoading} />
        <MetricCard title="MRR Estimado" value={metrics ? formatBRL(metrics.mrr) : '—'} icon={TrendingUp} color="text-emerald-600" loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-sm flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos planos</SelectItem>
              {PLAN_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cycleFilter} onValueChange={(v) => { setCycleFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Ciclo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ciclos</SelectItem>
              {CYCLE_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos providers</SelectItem>
              {PROVIDER_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
          {totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : paginatedData.length > 0 ? (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Estabelecimento" sortKey="establishment_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Plano" sortKey="plan_code" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Ciclo" sortKey="billing_cycle" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <TableHead>Provider</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Início</TableHead>
                    <SortableHeader label="Próx. Cobrança" sortKey="current_period_end" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Criada em" sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Atualizada" sortKey="updated_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((sub) => (
                    <TableRow key={sub.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sub.establishment_name}</p>
                          <p className="text-[11px] text-muted-foreground">{sub.establishment_slug}</p>
                        </div>
                      </TableCell>
                      <TableCell><PlanBadge plan={sub.plan_code || sub.plan} /></TableCell>
                      <TableCell><StatusBadge status={sub.status} /></TableCell>
                      <TableCell><CycleBadge cycle={sub.billing_cycle} /></TableCell>
                      <TableCell><ProviderBadge provider={sub.provider} /></TableCell>
                      <TableCell>
                        <div className="max-w-[160px]">
                          <p className="text-xs truncate">{sub.buyer_email || sub.owner_email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {sub.current_period_start ? format(new Date(sub.current_period_start), "dd/MM/yy", { locale: ptBR }) : '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {format(new Date(sub.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {format(new Date(sub.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenManage(sub)} className="gap-1.5">
                          <Settings2 className="h-3.5 w-3.5" />
                          Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' || planFilter !== 'all' || cycleFilter !== 'all' || providerFilter !== 'all'
                ? 'Nenhuma assinatura encontrada com esses filtros'
                : 'Nenhuma assinatura cadastrada'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manage Subscription Modal */}
      <Dialog open={!!manageSub} onOpenChange={() => setManageSub(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Gerenciar Assinatura
            </DialogTitle>
            <DialogDescription>
              {manageSub?.establishment_name} — {manageSub?.owner_email}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={manageTab} onValueChange={setManageTab} className="flex-1 min-h-0">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Plano" value={<PlanBadge plan={manageSub?.plan_code || manageSub?.plan || ''} />} />
                <InfoRow label="Status" value={<StatusBadge status={manageSub?.status || ''} />} />
                <InfoRow label="Ciclo" value={<CycleBadge cycle={manageSub?.billing_cycle || ''} />} />
                <InfoRow label="Provider" value={<ProviderBadge provider={manageSub?.provider || null} />} />
                <InfoRow label="Provider Ref" value={<span className="font-mono text-xs">{manageSub?.provider_ref || '—'}</span>} />
                <InfoRow label="Buyer Email" value={<span className="text-xs">{manageSub?.buyer_email || '—'}</span>} />
                <InfoRow label="Início do período" value={
                  manageSub?.current_period_start
                    ? format(new Date(manageSub.current_period_start), "dd/MM/yyyy", { locale: ptBR })
                    : '—'
                } />
                <InfoRow label="Próxima cobrança" value={
                  manageSub?.current_period_end
                    ? format(new Date(manageSub.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                    : '—'
                } />
                <InfoRow label="Criada em" value={
                  manageSub?.created_at
                    ? format(new Date(manageSub.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : '—'
                } />
                <InfoRow label="Atualizada" value={
                  manageSub?.updated_at
                    ? format(new Date(manageSub.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : '—'
                } />
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações Rápidas</p>
                <div className="flex flex-wrap gap-2">
                  {manageSub?.status !== 'canceled' && (
                    <Button variant="destructive" size="sm" onClick={() => handleQuickAction('cancel')} disabled={updateSubscription.isPending}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                    </Button>
                  )}
                  {manageSub?.status === 'active' && (
                    <Button variant="outline" size="sm" onClick={() => handleQuickAction('suspend')} disabled={updateSubscription.isPending} className="text-orange-600 border-orange-300 hover:bg-orange-50">
                      <Ban className="h-3.5 w-3.5 mr-1" /> Suspender
                    </Button>
                  )}
                  {(manageSub?.status === 'canceled' || manageSub?.status === 'suspended' || manageSub?.status === 'past_due') && (
                    <Button variant="outline" size="sm" onClick={() => handleQuickAction('reactivate')} disabled={updateSubscription.isPending} className="text-green-600 border-green-300 hover:bg-green-50">
                      <Play className="h-3.5 w-3.5 mr-1" /> Reativar
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano</Label>
                  <Select value={editForm.plan_code} onValueChange={(v) => setEditForm({ ...editForm, plan_code: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ciclo de Cobrança</Label>
                  <Select value={editForm.billing_cycle} onValueChange={(v) => setEditForm({ ...editForm, billing_cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CYCLE_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider Ref</Label>
                  <Input
                    value={editForm.provider_ref}
                    onChange={(e) => setEditForm({ ...editForm, provider_ref: e.target.value })}
                    placeholder="Referência do provider"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setManageSub(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={updateSubscription.isPending}>
                  {updateSubscription.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {updateSubscription.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-[340px] pr-3">
                {eventsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="relative pl-6 space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                    {events.map((ev, idx) => {
                      const { label, color } = getEventLabel(ev.event_type);
                      return (
                        <div key={ev.id} className="relative pb-5 last:pb-0">
                          {/* Timeline dot */}
                          <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 bg-background border-border flex items-center justify-center`}>
                            <div className={`h-2 w-2 rounded-full ${color.replace('text-', 'bg-')}`} />
                          </div>
                          <div className="bg-muted/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${color}`}>{label}</span>
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {format(new Date(ev.occurred_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <PlanBadge plan={ev.plan} />
                              <CycleBadge cycle={ev.billing_cycle} />
                              {ev.amount_cents ? (
                                <span className="font-medium">{formatBRL(ev.amount_cents)}</span>
                              ) : null}
                              {ev.provider && <span>via {ev.provider}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Info Row Helper ---

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
