import { useState } from "react";
import { useAdminEstablishments, useUpdateEstablishment, type AdminEstablishment } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Search, Building2, Settings2, AlertTriangle, Phone, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active (Pagante)' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Cancelado / Bloqueado' },
];

const PLAN_OPTIONS = [
  { value: 'basico', label: 'Básico (R$ 19,90)' },
  { value: 'essencial', label: 'Essencial (R$ 49,90)' },
  { value: 'studio', label: 'Studio (R$ 99,90)' },
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

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar estabelecimentos</p>
      </div>
    );
  }

  const trialDate = editForm.trial_ends_at ? new Date(editForm.trial_ends_at + 'T00:00:00') : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estabelecimentos</h1>
        <p className="text-muted-foreground text-sm">Gerencie todos os salões cadastrados na plataforma</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug ou e-mail..."
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
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissionais</TableHead>
                  <TableHead>Fim Trial</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.establishments.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{est.name}</p>
                        <p className="text-xs text-muted-foreground">/{est.slug} · {est.owner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{est.owner_email}</span>
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
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(est)} className="gap-1.5">
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fim do Trial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.trial_ends_at && "text-muted-foreground"
                    )}
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
                    onSelect={(date) =>
                      setEditForm({
                        ...editForm,
                        trial_ends_at: date ? format(date, 'yyyy-MM-dd') : '',
                      })
                    }
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Clique para selecionar ou alterar a data de expiração do trial</p>
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
