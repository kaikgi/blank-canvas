import { useState } from "react";
import { useAdminEstablishments, useUpdateEstablishment, type AdminEstablishment } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Building2, Pencil, Ban, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active (Pagante)' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Canceled / Bloqueado' },
];

const PLAN_OPTIONS = [
  { value: 'basico', label: 'Básico (R$ 19,90)' },
  { value: 'essencial', label: 'Essencial (R$ 49,90)' },
  { value: 'studio', label: 'Studio (R$ 99,90)' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
    case 'trial': return <Badge variant="secondary">Trial</Badge>;
    case 'past_due': return <Badge variant="destructive">Past Due</Badge>;
    case 'canceled': return <Badge variant="destructive">Canceled</Badge>;
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
  const [editEst, setEditEst] = useState<AdminEstablishment | null>(null);
  const [editForm, setEditForm] = useState({ status: '', plano: '', trial_ends_at: '' });

  const { data, isLoading, error } = useAdminEstablishments(debouncedSearch || undefined);
  const updateEstablishment = useUpdateEstablishment();

  let debounceTimer: ReturnType<typeof setTimeout>;
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setDebouncedSearch(value), 400);
  };

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

  const handleBlock = async (est: AdminEstablishment) => {
    if (!confirm(`Bloquear acesso de "${est.name}"?`)) return;
    try {
      await updateEstablishment.mutateAsync({
        establishment_id: est.id,
        status: 'canceled',
      });
      toast.success(`${est.name} bloqueado`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao bloquear");
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar estabelecimentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estabelecimentos</h1>
        <p className="text-muted-foreground">Gerencie todos os estabelecimentos cadastrados</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {data && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {data.total} resultado{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data?.establishments?.length ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail do Dono</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissionais</TableHead>
                  <TableHead>Fim Trial</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.establishments.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{est.name}</p>
                        <p className="text-xs text-muted-foreground">/{est.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{est.owner_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanLabel(est)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(est.status)}</TableCell>
                    <TableCell className="tabular-nums">{est.professionals_count}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {est.trial_ends_at
                        ? format(new Date(est.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenEdit(est)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {est.status !== 'canceled' && (
                          <Button variant="ghost" size="icon" title="Bloquear" onClick={() => handleBlock(est)}
                            className="text-destructive hover:text-destructive">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
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
            <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editEst} onOpenChange={() => setEditEst(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Estabelecimento</DialogTitle>
            <DialogDescription>{editEst?.name} — /{editEst?.slug}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editForm.plano} onValueChange={(v) => setEditForm({ ...editForm, plano: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fim do Trial</Label>
              <Input
                type="date"
                value={editForm.trial_ends_at}
                onChange={(e) => setEditForm({ ...editForm, trial_ends_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para remover a data de trial</p>
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
    </div>
  );
}
