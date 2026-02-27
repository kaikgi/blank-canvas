import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Skull, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PreviewData {
  establishments_to_delete: number;
  appointments_to_delete: number;
  professionals_to_delete: number;
  customers_to_delete: number;
  services_to_delete: number;
  profiles_to_delete: number;
  keep_slugs: string[];
  allowlist_count: number;
  preview_token: string;
}

export default function AdminDangerZone() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [typedSlugs, setTypedSlugs] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const KEEP_SLUGS = ["ishowbarber", "barbershop1"];

  const handlePreview = async () => {
    setLoadingPreview(true);
    setError(null);
    setPreview(null);
    setResult(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('admin-danger-zone-preview', {
        body: { keep_slugs: KEEP_SLUGS },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (!data?.ok) throw new Error(data?.message || 'Erro desconhecido');

      setPreview(data.data as PreviewData);
      toast.success("Prévia gerada com sucesso");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const canExecute =
    preview &&
    confirmPhrase === "DELETE ALL EXCEPT TWO" &&
    typedSlugs.trim().toLowerCase().split(",").map(s => s.trim()).sort().join(",") ===
      KEEP_SLUGS.sort().join(",");

  const handleExecute = async () => {
    if (!canExecute || !preview) return;

    setLoadingExecute(true);
    setError(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('admin-danger-zone-execute', {
        body: {
          keep_slugs: KEEP_SLUGS,
          confirm_phrase: confirmPhrase,
          typed_slugs: typedSlugs.trim().toLowerCase(),
          preview_token: preview.preview_token,
        },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (!data?.ok) throw new Error(data?.message || 'Erro desconhecido');

      setResult(data.data.deleted_counts);
      setPreview(null);
      setConfirmPhrase("");
      setTypedSlugs("");
      toast.success("Danger Zone executada com sucesso!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoadingExecute(false);
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
          Limpeza completa do banco, mantendo apenas os estabelecimentos protegidos.
        </p>
      </div>

      {/* Warning */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-destructive">ATENÇÃO: Operação irreversível</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esta operação irá deletar TODOS os dados exceto os estabelecimentos{" "}
                <strong>{KEEP_SLUGS.join(" e ")}</strong>, seus donos e todos os administradores.
                Usuários do auth serão removidos permanentemente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3 flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etapa 1 — Gerar Prévia</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loadingPreview || loadingExecute}
          >
            {loadingPreview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Gerar Prévia
          </Button>

          {preview && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="font-semibold">Serão removidos:</p>
              <ul className="text-sm space-y-1">
                <li>🏢 Estabelecimentos: <strong>{preview.establishments_to_delete}</strong></li>
                <li>📅 Agendamentos: <strong>{preview.appointments_to_delete}</strong></li>
                <li>👤 Profissionais: <strong>{preview.professionals_to_delete}</strong></li>
                <li>👥 Clientes: <strong>{preview.customers_to_delete}</strong></li>
                <li>🛠 Serviços: <strong>{preview.services_to_delete}</strong></li>
                <li>📋 Perfis: <strong>{preview.profiles_to_delete}</strong></li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Allowlist (protegidos): {preview.allowlist_count} usuários
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Confirmation & Execution */}
      {preview && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg">Etapa 2 — Confirmar e Executar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phrase">Frase de confirmação</Label>
              <Input
                id="phrase"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder='Digite: DELETE ALL EXCEPT TWO'
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="slugs">
                Digite os slugs a manter (separados por vírgula)
              </Label>
              <Input
                id="slugs"
                value={typedSlugs}
                onChange={(e) => setTypedSlugs(e.target.value)}
                placeholder={KEEP_SLUGS.join(",")}
                className="mt-1 font-mono"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleExecute}
              disabled={!canExecute || loadingExecute}
              className="w-full"
            >
              {loadingExecute && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loadingExecute ? "Executando..." : "🔥 Executar Danger Zone"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold text-green-600">Execução concluída com sucesso</p>
                <ul className="text-sm mt-2 space-y-1">
                  {Object.entries(result).map(([key, count]) => (
                    <li key={key}>
                      {key}: <strong>{count}</strong> removidos
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
