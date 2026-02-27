import { useState } from "react";
import { useAdminEstablishments, useUpdateEstablishmentPlan, useToggleEstablishment } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Search, Building2, Users, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminEstablishments() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] = useState<{
    id: string;
    name: string;
    currentPlan: string;
  } | null>(null);
  const [newPlan, setNewPlan] = useState("");

  const { data, isLoading, error } = useAdminEstablishments(debouncedSearch || undefined);
  const updatePlan = useUpdateEstablishmentPlan();
  const toggleEstablishment = useToggleEstablishment();

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  const handleUpdatePlan = async () => {
    if (!selectedEstablishment || !newPlan) return;

    try {
      await updatePlan.mutateAsync({
        establishmentId: selectedEstablishment.id,
        newPlanCode: newPlan,
      });
      toast.success("Plano atualizado com sucesso");
      setSelectedEstablishment(null);
      setNewPlan("");
    } catch (err) {
      toast.error("Erro ao atualizar plano");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleEstablishment.mutateAsync({
        establishmentId: id,
        active: !currentStatus,
      });
      toast.success(currentStatus ? "Estabelecimento desativado" : "Estabelecimento ativado");
    } catch (err) {
      toast.error("Erro ao alterar status");
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "studio":
        return "default";
      case "essential":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar estabelecimentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estabelecimentos</h1>
        <p className="text-muted-foreground">Gerencie todos os estabelecimentos do sistema</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, slug ou email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} estabelecimento(s) encontrado(s)
        </p>
      )}

      {/* Establishments Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : data?.establishments?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.establishments.map((est) => (
            <Card key={est.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{est.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{est.slug}</p>
                  </div>
                  <Badge variant={getPlanBadgeVariant(est.subscription?.plan_code || "basic")}>
                    {est.subscription?.plan_code || "basic"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">{est.owner_email}</div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{est.professionals_count} prof.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{est.appointments_this_month} agend.</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Criado em {format(new Date(est.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEstablishment({
                        id: est.id,
                        name: est.name,
                        currentPlan: est.subscription?.plan_code || "basic",
                      });
                      setNewPlan(est.subscription?.plan_code || "basic");
                    }}
                  >
                    Alterar Plano
                  </Button>
                  <Button
                    variant={est.booking_enabled ? "ghost" : "secondary"}
                    size="sm"
                    onClick={() => handleToggle(est.id, est.booking_enabled)}
                  >
                    {est.booking_enabled ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" />
                        Inativo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={!!selectedEstablishment} onOpenChange={() => setSelectedEstablishment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterando plano do estabelecimento: {selectedEstablishment?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">Novo Plano</label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="essential">Essencial</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEstablishment(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePlan}
              disabled={updatePlan.isPending || newPlan === selectedEstablishment?.currentPlan}
            >
              {updatePlan.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
