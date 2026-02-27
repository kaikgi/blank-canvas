import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Skull, Loader2, CheckCircle2, XCircle, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminEstablishments, useUpdateEstablishment } from "@/hooks/useAdmin";

export default function AdminDangerZone() {
  // Block expired trials
  const [blockingTrials, setBlockingTrials] = useState(false);
  const [blockResult, setBlockResult] = useState<{ count: number } | null>(null);
  const updateEstablishment = useUpdateEstablishment();

  // Delete establishment
  const [deleteSlug, setDeleteSlug] = useState("");
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [deletingEst, setDeletingEst] = useState(false);

  const { data: estData } = useAdminEstablishments();

  const handleBlockExpiredTrials = async () => {
    setBlockingTrials(true);
    setBlockResult(null);
    try {
      const establishments = estData?.establishments || [];
      const now = new Date();
      const expired = establishments.filter(
        (e) => e.status === "trial" && e.trial_ends_at && new Date(e.trial_ends_at) < now
      );

      let count = 0;
      for (const est of expired) {
        await updateEstablishment.mutateAsync({
          establishment_id: est.id,
          status: "canceled",
        });
        count++;
      }
      setBlockResult({ count });
      toast.success(`${count} estabelecimento(s) bloqueado(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao bloquear trials");
    } finally {
      setBlockingTrials(false);
    }
  };

  const targetEstablishment = estData?.establishments?.find(
    (e) => e.slug === deleteSlug.trim().toLowerCase()
  );

  const canDelete =
    targetEstablishment &&
    confirmDeleteName.trim().toLowerCase() === targetEstablishment.name.trim().toLowerCase();

  const handleDeleteEstablishment = async () => {
    if (!canDelete || !targetEstablishment) return;
    setDeletingEst(true);
    try {
      // For now, we mark as canceled (permanent delete would require service_role)
      await updateEstablishment.mutateAsync({
        establishment_id: targetEstablishment.id,
        status: "canceled",
      });
      toast.success(`"${targetEstablishment.name}" foi bloqueado permanentemente`);
      setDeleteSlug("");
      setConfirmDeleteName("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao deletar");
    } finally {
      setDeletingEst(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-destructive flex items-center gap-2">
          <Skull className="h-6 w-6" />
          Danger Zone
        </h1>
        <p className="text-muted-foreground">
          Operações de impacto profundo. Use com extrema cautela.
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Área restrita — Operações irreversíveis</p>
              <p className="text-sm text-muted-foreground mt-1">
                As ações abaixo podem causar perda permanente de dados. Confirme cada operação antes de executar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block All Expired Trials */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Bloquear todos os trials vencidos
          </CardTitle>
          <CardDescription>
            Marca como "cancelado" todos os estabelecimentos em trial cuja data de expiração já passou.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
            onClick={handleBlockExpiredTrials}
            disabled={blockingTrials}
          >
            {blockingTrials && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {blockingTrials ? "Processando..." : "Bloquear Trials Vencidos"}
          </Button>

          {blockResult && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700">{blockResult.count} estabelecimento(s) bloqueado(s) com sucesso.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Establishment */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deletar Estabelecimento permanentemente
          </CardTitle>
          <CardDescription>
            Bloqueia permanentemente um estabelecimento. Esta ação não pode ser desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-slug">Slug do estabelecimento</Label>
            <Input
              id="delete-slug"
              value={deleteSlug}
              onChange={(e) => setDeleteSlug(e.target.value)}
              placeholder="ex: meu-salao"
              className="font-mono"
            />
          </div>

          {targetEstablishment && (
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20 space-y-3">
              <p className="text-sm">
                Encontrado: <strong>{targetEstablishment.name}</strong> — Status: <strong>{targetEstablishment.status}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-name" className="text-destructive">
                  Digite o nome "{targetEstablishment.name}" para confirmar:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmDeleteName}
                  onChange={(e) => setConfirmDeleteName(e.target.value)}
                  placeholder={targetEstablishment.name}
                  className="font-mono border-destructive/30"
                />
              </div>
            </div>
          )}

          {deleteSlug && !targetEstablishment && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              Nenhum estabelecimento encontrado com esse slug.
            </div>
          )}

          <Button
            variant="destructive"
            onClick={handleDeleteEstablishment}
            disabled={!canDelete || deletingEst}
            className="w-full"
          >
            {deletingEst && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {deletingEst ? "Deletando..." : "🔥 Deletar Permanentemente"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
