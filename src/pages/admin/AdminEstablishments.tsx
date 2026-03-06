import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminEstablishments, useUpdateEstablishment, type AdminEstablishment } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Building2, Settings2, AlertTriangle, CalendarIcon, Filter, Trash2,
  Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Ban, Play, Users,
  ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, Scissors, UserCheck, CalendarDays,
  TrendingUp, ShieldAlert,
} from "lucide-react";
import { format, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

// --- Constants ---

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'suspended', label: 'Suspenso' },
];

const PLAN_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'studio', label: 'Studio' },
  { value: 'pro', label: 'Pro' },
  { value: 'trial', label: 'Trial' },
];

const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

const PAGE_SIZE = 20;
type SortKey = 'name' | 'status' | 'plano' | 'professionals_count' | 'services_count' | 'customers_count' | 'appointments_count' | 'created_at';

// --- Badge Components ---

function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt?: string | null }) {
  const isTrialExpired = status === 'trial' && trialEndsAt && new Date(trialEndsAt) < new Date();
  if (isTrialExpired) {
    return (
      <Badge className="bg-red-600/15 text-red-700 border-red-600/30">
        <XCircle className="h-3 w-3 mr-1" /> Trial Expirado
      </Badge>
    );
  }
  switch (status) {
    case 'active': return (
      <Badge className="bg-green-600/15 text-green-700 border-green-600/30">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
      </Badge>
    );
    case 'trial': return (
      <Badge className="bg-blue-600/15 text-blue-700 border-blue-600/30">
        <Clock className="h-3 w-3 mr-1" /> Trial
      </Badge>
    );
    case 'past_due': return (
      <Badge className="bg-amber-600/15 text-amber-700 border-amber-600/30">
        <AlertCircle className="h-3 w-3 mr-1" /> Past Due
      </Badge>
    );
    case 'canceled': return (
      <Badge className="bg-red-600/15 text-red-700 border-red-600/30">
        <XCircle className="h-3 w-3 mr-1" /> Cancelado
      </Badge>
    );
    case 'suspended': return (
      <Badge className="bg-orange-600/15 text-orange-700 border-orange-600/30">
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
    case 'trial': return <Badge className="bg-blue-600/15 text-blue-700 border-blue-600/30 font-semibold">Trial</Badge>;
    default: return <Badge variant="outline">{plan || 'Nenhum'}</Badge>;
  }
}

function CycleBadge({ cycle }: { cycle: string | undefined }) {
  switch ((cycle || '').toLowerCase()) {
    case 'yearly': return <Badge variant="outline" className="text-xs font-normal">Anual</Badge>;
    case 'quarterly': return <Badge variant="outline" className="text-xs font-normal">Trimestral</Badge>;
    case 'monthly': return <Badge variant="outline" className="text-xs font-normal">Mensal</Badge>;
    default: return <span className="text-xs text-muted-foreground">—</span>;
  }
}

function getPlanCode(est: AdminEstablishment): string {
  return est.subscription?.plan_code || est.plano || 'nenhum';
}

function getCycle(est: AdminEstablishment): string {
  return est.subscription?.billing_cycle || '';
}

// --- Metric Card ---

function MetricCard({ title, value, icon: Icon, color, loading, subtitle }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; loading: boolean; subtitle?: string;
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
          <div className="p-2 rounded-lg bg-muted/50">
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
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => onSort(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-foreground' : 'text-muted-foreground/40'}`} />
      </div>
    </TableHead>
  );
}

// --- Info Row ---

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

// === MAIN COMPONENT ===

export default function AdminEstablishments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  // Delete modal
  const [deleteEst, setDeleteEst] = useState<AdminEstablishment | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAuthUser, setDeleteAuthUser] = useState(false);
  const [deleteStorageFiles, setDeleteStorageFiles] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, error } = useAdminEstablishments(debouncedSearch || undefined);
  const queryClient = useQueryClient();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  }, [sortKey]);

  // --- Navigate to detail page ---
  const handleOpenManage = (est: AdminEstablishment) => {
    navigate(`/admin/estabelecimentos/${est.id}`);
  };

  // --- Delete ---
  const handleOpenDelete = (est: AdminEstablishment) => {
    setDeleteEst(est);
    setDeleteConfirmText("");
    setDeleteAuthUser(false);
    setDeleteStorageFiles(false);
  };

  const handleDelete = async () => {
    if (!deleteEst || deleteConfirmText !== "EXCLUIR") return;
    setDeleting(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("admin-delete-establishment", {
        body: { establishment_id: deleteEst.id, delete_auth_user: deleteAuthUser, delete_storage_files: deleteStorageFiles },
      });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      toast.success(`"${deleteEst.name}" excluído permanentemente`);
      setDeleteEst(null);
      queryClient.invalidateQueries({ queryKey: ["admin-establishments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  // --- Filter, Sort, Paginate ---
  const { metrics, paginatedData, totalFiltered, totalPages } = useMemo(() => {
    const establishments = data?.establishments || [];

    // Metrics
    const now = new Date();
    const monthStart = startOfMonth(now);
    const total = establishments.length;
    const active = establishments.filter(e => e.status === 'active').length;
    const trial = establishments.filter(e => e.status === 'trial' && (!e.trial_ends_at || new Date(e.trial_ends_at) >= now)).length;
    const trialExpired = establishments.filter(e => e.status === 'trial' && e.trial_ends_at && new Date(e.trial_ends_at) < now).length;
    const canceled = establishments.filter(e => e.status === 'canceled').length;
    const pastDue = establishments.filter(e => e.status === 'past_due').length;
    const newThisMonth = establishments.filter(e => isAfter(new Date(e.created_at), monthStart)).length;

    // Filter
    let filtered = establishments.filter((est) => {
      if (statusFilter !== 'all' && est.status !== statusFilter) return false;
      const plan = getPlanCode(est);
      if (planFilter !== 'all' && plan !== planFilter) return false;
      const cycle = getCycle(est);
      if (cycleFilter !== 'all' && cycle !== cycleFilter) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      if (sortKey === 'plano') {
        aVal = getPlanCode(a).toLowerCase();
        bVal = getPlanCode(b).toLowerCase();
      } else {
        aVal = (a as any)[sortKey] ?? '';
        bVal = (b as any)[sortKey] ?? '';
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const paginatedData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return {
      metrics: { total, active, trial, trialExpired, canceled, pastDue, newThisMonth },
      paginatedData,
      totalFiltered,
      totalPages,
    };
  }, [data, statusFilter, planFilter, cycleFilter, sortKey, sortDir, page]);

  // --- Diagnostics ---
  const diagnostics = useMemo(() => {
    if (!data?.establishments) return [];
    const issues: { est: AdminEstablishment; issue: string }[] = [];
    for (const est of data.establishments) {
      const plan = getPlanCode(est);
      // Active but no subscription
      if (est.status === 'active' && !est.subscription) {
        issues.push({ est, issue: 'Ativo sem assinatura' });
      }
      // Plan mismatch between establishment and subscription
      if (est.subscription && est.plano && est.subscription.plan_code !== est.plano && est.plano !== 'trial' && est.plano !== 'nenhum') {
        issues.push({ est, issue: `Plano divergente: est=${est.plano} vs sub=${est.subscription.plan_code}` });
      }
      // Trial expired but still showing as trial
      if (est.status === 'trial' && est.trial_ends_at && new Date(est.trial_ends_at) < new Date()) {
        issues.push({ est, issue: 'Trial expirado (não migrado)' });
      }
      // Solo plan with more than 1 professional
      if (plan === 'solo' && est.professionals_count > 1) {
        issues.push({ est, issue: `Solo com ${est.professionals_count} profissionais` });
      }
      // Studio plan with more than 4 professionals
      if (plan === 'studio' && est.professionals_count > 4) {
        issues.push({ est, issue: `Studio com ${est.professionals_count} profissionais` });
      }
    }
    return issues;
  }, [data]);

  const canDelete = deleteConfirmText === "EXCLUIR";
  const canDelete = deleteConfirmText === "EXCLUIR";

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar estabelecimentos</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estabelecimentos</h1>
        <p className="text-muted-foreground text-sm">Centro de controle de todos os estabelecimentos</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <MetricCard title="Total" value={String(metrics.total)} icon={Building2} color="text-foreground" loading={isLoading} />
        <MetricCard title="Ativos" value={String(metrics.active)} icon={CheckCircle2} color="text-green-600" loading={isLoading} />
        <MetricCard title="Trial" value={String(metrics.trial)} icon={Clock} color="text-blue-600" loading={isLoading} subtitle={metrics.trialExpired > 0 ? `${metrics.trialExpired} expirado(s)` : undefined} />
        <MetricCard title="Past Due" value={String(metrics.pastDue)} icon={AlertCircle} color="text-amber-600" loading={isLoading} />
        <MetricCard title="Cancelados" value={String(metrics.canceled)} icon={XCircle} color="text-red-600" loading={isLoading} />
        <MetricCard title="Novos (mês)" value={String(metrics.newThisMonth)} icon={TrendingUp} color="text-emerald-600" loading={isLoading} />
        {diagnostics.length > 0 && (
          <MetricCard title="Inconsistências" value={String(diagnostics.length)} icon={ShieldAlert} color="text-orange-600" loading={isLoading} />
        )}
      </div>

      {/* Diagnostics Alert */}
      {diagnostics.length > 0 && (
        <Card className="border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">Diagnóstico: {diagnostics.length} inconsistência(s)</span>
            </div>
            <div className="space-y-1">
              {diagnostics.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.est.name} ({d.est.slug})</span>
                  <span className="text-orange-600 font-medium">{d.issue}</span>
                </div>
              ))}
              {diagnostics.length > 5 && (
                <p className="text-xs text-muted-foreground">...e mais {diagnostics.length - 5}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-md flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, slug ou e-mail..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10" />
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
                    <SortableHeader label="Estabelecimento" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Plano" sortKey="plano" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <TableHead>Ciclo</TableHead>
                    <SortableHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Profissionais" sortKey="professionals_count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Serviços" sortKey="services_count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Clientes" sortKey="customers_count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Agendamentos" sortKey="appointments_count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Criado em" sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((est) => (
                    <TableRow key={est.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{est.name}</p>
                          <p className="text-[11px] text-muted-foreground">/{est.slug} · {est.owner_email}</p>
                        </div>
                      </TableCell>
                      <TableCell><PlanBadge plan={getPlanCode(est)} /></TableCell>
                      <TableCell><CycleBadge cycle={getCycle(est)} /></TableCell>
                      <TableCell><StatusBadge status={est.status} trialEndsAt={est.trial_ends_at} /></TableCell>
                      <TableCell className="tabular-nums text-center">{est.professionals_count}</TableCell>
                      <TableCell className="tabular-nums text-center">{est.services_count}</TableCell>
                      <TableCell className="tabular-nums text-center">{est.customers_count}</TableCell>
                      <TableCell className="tabular-nums text-center">{est.appointments_count}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {format(new Date(est.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleOpenManage(est)} className="gap-1.5">
                            <Settings2 className="h-3.5 w-3.5" /> Gerenciar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(est)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
              <p className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</p>
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
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' || planFilter !== 'all' || cycleFilter !== 'all'
                ? 'Nenhum estabelecimento encontrado com esses filtros'
                : 'Nenhum estabelecimento cadastrado'}
            </p>
          </CardContent>
        </Card>
      )}


      {/* Hard Delete Modal */}
      <AlertDialog open={!!deleteEst} onOpenChange={() => !deleting && setDeleteEst(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{deleteEst?.name}</strong> (/{deleteEst?.slug}).
              Esta ação é <strong>irreversível</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-auth" checked={deleteAuthUser} onCheckedChange={(c) => setDeleteAuthUser(!!c)} />
                <Label htmlFor="delete-auth" className="text-sm">Também excluir usuário (auth)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-storage" checked={deleteStorageFiles} onCheckedChange={(c) => setDeleteStorageFiles(!!c)} />
                <Label htmlFor="delete-storage" className="text-sm">Também remover arquivos (storage)</Label>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm text-destructive font-semibold">Digite EXCLUIR para confirmar:</Label>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="EXCLUIR" className="font-mono border-destructive/30 focus-visible:ring-destructive/30" autoComplete="off" />
            </div>
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteEst(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? "Excluindo..." : "🔥 Excluir Permanentemente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
