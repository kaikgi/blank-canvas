import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Crown,
  Loader2,
  Search,
  MoreHorizontal,
  Copy,
  ArrowUpDown,
  ScrollText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface VAdminUser {
  user_id: string;
  email: string | null;
  level: string | null;
  user_created_at: string | null;
}

function useMyAdminLevel() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-admin-level", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("admin_get_my_level" as any);
      if (error) throw error;
      return (data as string) ?? "none";
    },
    enabled: !!user,
  });
}

export default function AdminAdmins() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLevel, setNewLevel] = useState("standard");
  const [createIfMissing, setCreateIfMissing] = useState(false);

  // Confirm action state
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "promote" | "demote";
    userId: string;
    email: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { data: myLevel, isLoading: myLevelLoading, error: myLevelError } = useMyAdminLevel();
  const isMaster = myLevel === "master";

  // Fetch admins from view
  const {
    data: admins,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-users-view"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_admin_users" as any);
      console.log("[AdminAdmins] get_admin_users data:", data);
      console.log("[AdminAdmins] get_admin_users error:", error);
      if (error) throw error;
      return (data || []) as VAdminUser[];
    },
  });

  // Fetch audit logs (master only)
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit-logs-tab"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: isMaster,
  });

  // Filtered admins
  const filtered = useMemo(() => {
    if (!admins) return [];
    if (!search.trim()) return admins;
    const q = search.toLowerCase();
    return admins.filter(
      (a) =>
        a.email?.toLowerCase().includes(q) ||
        a.user_id?.toLowerCase().includes(q)
    );
  }, [admins, search]);

  // Add admin via edge function
  const addAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-add-user", {
        body: { email: newEmail.trim(), level: newLevel, createIfMissing },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.message || "Erro desconhecido");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users-view"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs-tab"] });
      setIsAddOpen(false);
      setNewEmail("");
      setNewLevel("standard");
      setCreateIfMissing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update level
  const updateLevel = useMutation({
    mutationFn: async ({ userId, newLvl }: { userId: string; newLvl: string }) => {
      const { error } = await supabase
        .from("admin_users")
        .update({ level: newLvl })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nível atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-users-view"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Remove admin
  const removeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      if (admins && admins.length <= 1) {
        throw new Error("Não é possível remover o último administrador");
      }
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin removido");
      queryClient.invalidateQueries({ queryKey: ["admin-users-view"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs-tab"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copiado");
  };

  if (myLevelLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (myLevelError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-sm text-destructive font-medium">Erro ao verificar nível de admin</p>
          <p className="text-xs text-muted-foreground">{(myLevelError as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  const actionLabels: Record<string, string> = {
    admin_add: "Admin adicionado",
    danger_zone_preview: "Danger Zone (prévia)",
    danger_zone_execute: "Danger Zone (execução)",
    danger_zone_error: "Danger Zone (erro)",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Administradores
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os administradores do sistema
          </p>
        </div>

        {isMaster && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@exemplo.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nível</Label>
                  <Select value={newLevel} onValueChange={setNewLevel}>
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
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => addAdmin.mutate()}
                  disabled={!newEmail.trim() || addAdmin.isPending}
                >
                  {addAdmin.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {addAdmin.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Info */}
      {!isMaster && (
        <Card className="bg-muted/50 border-muted">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Você é admin <strong>standard</strong>. Ações de gerenciamento são restritas ao nível Master.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="admins">
        <TabsList>
          <TabsTrigger value="admins">
            <Users className="h-4 w-4 mr-1.5" />
            Administradores
          </TabsTrigger>
          {isMaster && (
            <TabsTrigger value="audit">
              <ScrollText className="h-4 w-4 mr-1.5" />
              Auditoria
            </TabsTrigger>
          )}
        </TabsList>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Error */}
          {error && (
            <Card className="border-destructive/30">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-destructive">{(error as Error).message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {search ? "Nenhum admin encontrado para essa busca" : "Nenhum administrador cadastrado"}
                </p>
                {isMaster && !search && (
                  <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Admin
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Table */}
          {!isLoading && !error && filtered.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead className="hidden md:table-cell">ID</TableHead>
                      <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                      {isMaster && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((admin) => {
                      const isM = admin.level === "master";
                      return (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium">
                            {admin.email || "—"}
                          </TableCell>
                          <TableCell>
                            {isM ? (
                              <Badge className="bg-primary text-primary-foreground">
                                <Crown className="h-3 w-3 mr-1" />
                                MASTER
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Shield className="h-3 w-3 mr-1" />
                                Standard
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <button
                              onClick={() => copyId(admin.user_id)}
                              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                              title="Copiar ID"
                            >
                              {admin.user_id.substring(0, 8)}…
                              <Copy className="h-3 w-3" />
                            </button>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {admin.user_created_at
                              ? format(new Date(admin.user_created_at), "dd/MM/yyyy", { locale: ptBR })
                              : "—"}
                          </TableCell>
                          {isMaster && (
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {isM ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmAction({
                                          type: "demote",
                                          userId: admin.user_id,
                                          email: admin.email || admin.user_id,
                                        })
                                      }
                                    >
                                      <ArrowUpDown className="h-4 w-4 mr-2" />
                                      Tornar Standard
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmAction({
                                          type: "promote",
                                          userId: admin.user_id,
                                          email: admin.email || admin.user_id,
                                        })
                                      }
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Tornar Master
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "remove",
                                        userId: admin.user_id,
                                        email: admin.email || admin.user_id,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Audit Tab */}
        {isMaster && (
          <TabsContent value="audit" className="space-y-4">
            {auditLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : auditLogs?.length ? (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead className="hidden md:table-cell">Admin</TableHead>
                        <TableHead className="hidden lg:table-cell">Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => {
                        const isDanger = log.action.startsWith("danger_zone");
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isDanger ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {isDanger && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {actionLabels[log.action] || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                              {log.admin_user_id?.substring(0, 8)}…
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {log.metadata && Object.keys(log.metadata as object).length > 0 ? (
                                <pre className="text-xs max-w-xs truncate text-muted-foreground">
                                  {JSON.stringify(log.metadata)}
                                </pre>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum log de auditoria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "remove"
                ? "Remover Administrador"
                : confirmAction?.type === "promote"
                ? "Promover a Master"
                : "Rebaixar a Standard"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "remove"
                ? `Tem certeza que deseja remover ${confirmAction.email} como administrador? Esta ação não pode ser desfeita.`
                : confirmAction?.type === "promote"
                ? `Tem certeza que deseja promover ${confirmAction?.email} a MASTER? Ele terá acesso total ao painel.`
                : `Tem certeza que deseja rebaixar ${confirmAction?.email} a Standard? Ele perderá permissões de gerenciamento.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === "remove" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "remove") {
                  removeAdmin.mutate(confirmAction.userId);
                } else {
                  updateLevel.mutate({
                    userId: confirmAction.userId,
                    newLvl: confirmAction.type === "promote" ? "master" : "standard",
                  });
                }
              }}
            >
              {(removeAdmin.isPending || updateLevel.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
