import { useState, useRef, useCallback } from "react";
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
import { Search, Building2, Settings2, AlertTriangle, CalendarIcon, Filter, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active (Pagante)' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Cancelado / Bloqueado' },
];

const PLAN_OPTIONS = [
  { value: 'solo', label: 'Solo (1 profissional)' },
  { value: 'studio', label: 'Studio (até 4 profissionais)' },
  { value: 'pro', label: 'Pro (ilimitado)' },
  { value: 'trial', label: 'Trial' },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active': return <Badge className="bg-green-600 hover:bg-green-700 text-white">Ativo</Badge>;
    case 'trial': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Trial</Badge>;
    case 'past_due': return <Badge variant="destructive">Past Due</Badge>;
    case 'canceled': return <Badge variant="destructive">Cancelado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function getPlanLabel(est: AdminEstablishment) {
  const planCode = est.subscription?.plan_code || est.plano || 'nenhum';
  switch (planCode) {
    case 'basico': return 'Básico';
    case 'essencial': return 'Essencial';
    case 'studio': return 'Studio';
    default: return planCode;
  }
}

export default function AdminEstablishments() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [editEst, setEditEst] = useState<AdminEstablishment | null>(null);
  const [editForm, setEditForm] = useState({ status: '', plano: '', trial_ends_at: '' });

  // Delete modal state
  const [deleteEst, setDeleteEst] = useState<AdminEstablishment | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAuthUser, setDeleteAuthUser] = useState(false);
  const [deleteStorageFiles, setDeleteStorageFiles] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, error } = useAdminEstablishments(debouncedSearch || undefined);
  const updateEstablishment = useUpdateEstablishment();
  const queryClient = useQueryClient();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, []);

  const handleOpenEdit = (est: AdminEstablishment) => {
    setEditEst(est);
    setEditForm({
      status: est.status,
      plano: est.subscription?.plan_code || est.plano || 'basico',
      trial_ends_at: est.trial_ends_at ? est.trial_ends_at.split('T')[0] : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editEst) return;
    try {
      await updateEstablishment.mutateAsync({
        establishment_id: editEst.id,
        status: editForm.status,
        plano: editForm.plano,
        trial_ends_at: editForm.trial_ends_at ? new Date(editForm.trial_ends_at).toISOString() : undefined,
      });
      toast.success(`${editEst.name} atualizado com sucesso`);
      setEditEst(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar");
    }
  };

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
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "admin-delete-establishment",
        {
          body: {
            establishment_id: deleteEst.id,
            delete_auth_user: deleteAuthUser,
            delete_storage_files: deleteStorageFiles,
          },
        }
      );
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      toast.success(`"${deleteEst.name}" excluído permanentemente`, {
        description: (result?.steps || []).join(", "),
      });
      setDeleteEst(null);
      queryClient.invalidateQueries({ queryKey: ["adminestablishments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir estabelecimento");
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar estabelecimentos</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Verifique sua conexão.'}</p>
      </div>
    );
  }

  const filtered = (data?.establishments || []).filter((est) => {
    if (statusFilter !== 'all' && est.status !== statusFilter) return false;
    const estPlan = est.subscription?.plan_code || est.plano || 'nenhum';
    if (planFilter !== 'all' && estPlan !== planFilter) return false;
    return true;
  });

  const trialDate = editForm.trial_ends_at ? new Date(editForm.trial_ends_at + 'T00:00:00') : undefined;
  const canDelete = deleteConfirmText === "EXCLUIR";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estabelecimentos</h1>
        <p className="text-muted-foreground text-sm">Gerencie todos os salões cadastrados na plataforma</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-md flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug ou e-mail..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
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
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos planos</SelectItem>
              {PLAN_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data && (
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {filtered.length} de {data.total}
          </span>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissionais</TableHead>
                  <TableHead>Fim Trial</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{est.name}</p>
                        <p className="text-xs text-muted-foreground">/{est.slug} · {est.owner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanLabel(est)}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={est.status} /></TableCell>
                    <TableCell className="tabular-nums">{est.professionals_count}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {est.trial_ends_at
                        ? format(new Date(est.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {format(new Date(est.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(est)} className="gap-1.5">
                          <Settings2 className="h-3.5 w-3.5" />
                          Gerenciar
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
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' || planFilter !== 'all'
                ? 'Nenhum estabelecimento encontrado com esses filtros'
                : 'Nenhum estabelecimento cadastrado'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editEst} onOpenChange={() => setEditEst(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Gerenciar Estabelecimento
            </DialogTitle>
            <DialogDescription>{editEst?.name} — /{editEst?.slug}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano</Label>
              <Select value={editForm.plano} onValueChange={(v) => setEditForm({ ...editForm, plano: v })}>
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fim do Trial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !editForm.trial_ends_at && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.trial_ends_at
                      ? format(new Date(editForm.trial_ends_at + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
                      : "Sem data definida"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={trialDate}
                    onSelect={(date) => setEditForm({ ...editForm, trial_ends_at: date ? format(date, 'yyyy-MM-dd') : '' })}
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEst(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateEstablishment.isPending}>
              {updateEstablishment.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Modal */}
      <AlertDialog open={!!deleteEst} onOpenChange={() => !deleting && setDeleteEst(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{deleteEst?.name}</strong> (/{deleteEst?.slug}).
              Esta ação é <strong>irreversível</strong> e removerá todos os dados: agendamentos, profissionais, clientes, serviços e configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-auth"
                  checked={deleteAuthUser}
                  onCheckedChange={(c) => setDeleteAuthUser(!!c)}
                />
                <Label htmlFor="delete-auth" className="text-sm">
                  Também excluir usuário (auth)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-storage"
                  checked={deleteStorageFiles}
                  onCheckedChange={(c) => setDeleteStorageFiles(!!c)}
                />
                <Label htmlFor="delete-storage" className="text-sm">
                  Também remover arquivos (storage)
                </Label>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm text-destructive font-semibold">
                Digite EXCLUIR para confirmar:
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="font-mono border-destructive/30 focus-visible:ring-destructive/30"
                autoComplete="off"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteEst(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? "Excluindo..." : "🔥 Excluir Permanentemente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
