import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Trash2, Shield, Crown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  user_id: string;
  level: string;
  created_at: string;
}

export default function AdminAdmins() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminLevel, setNewAdminLevel] = useState<string>("standard");
  const [createIfMissing, setCreateIfMissing] = useState(false);
  const queryClient = useQueryClient();

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AdminUser[];
    },
  });

  const addAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-add-user", {
        body: {
          email: newAdminEmail.trim(),
          level: newAdminLevel,
          createIfMissing,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.message || "Erro desconhecido");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsDialogOpen(false);
      setNewAdminEmail("");
      setNewAdminLevel("standard");
      setCreateIfMissing(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      if (admins && admins.length <= 1) {
        throw new Error("Não é possível remover o último administrador");
      }
      const { error } = await supabase.from("admin_users").delete().eq("id", adminId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin removido");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administradores</h1>
          <p className="text-muted-foreground">Gerencie os administradores do sistema</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Administrador</DialogTitle>
              <DialogDescription>
                Apenas admin MASTER pode adicionar novos administradores.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Nível</Label>
                <Select value={newAdminLevel} onValueChange={setNewAdminLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createIfMissing"
                  checked={createIfMissing}
                  onCheckedChange={(checked) => setCreateIfMissing(checked === true)}
                />
                <Label htmlFor="createIfMissing" className="text-sm">
                  Criar usuário se não existir
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addAdmin.mutate()}
                disabled={!newAdminEmail.trim() || addAdmin.isPending}
              >
                {addAdmin.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {addAdmin.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Gerenciamento de Admins</p>
              <p className="text-sm text-muted-foreground">
                Apenas admin <strong>MASTER</strong> pode adicionar/remover outros administradores.
                Admins <strong>standard</strong> só podem visualizar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : admins?.length ? (
        <div className="space-y-3">
          {admins.map((admin) => {
            const isMaster = admin.level === "master";
            return (
              <Card key={admin.id} className={isMaster ? "border-primary/30" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isMaster ? "bg-primary/20" : "bg-muted"
                      }`}>
                        {isMaster ? (
                          <Crown className="h-5 w-5 text-primary" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {isMaster ? "MASTER" : "Admin Standard"}
                          </p>
                          {isMaster && (
                            <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-semibold">
                              MASTER
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {admin.user_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Desde {format(new Date(admin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAdmin.mutate(admin.id)}
                        disabled={removeAdmin.isPending || (admins.length <= 1)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum administrador encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
