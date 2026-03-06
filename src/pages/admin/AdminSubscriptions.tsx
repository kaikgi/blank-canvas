import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function AdminSubscriptions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <p className="text-muted-foreground">Gerencie as assinaturas Kiwify</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            As assinaturas são gerenciadas automaticamente via webhook da Kiwify.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Para visualizar detalhes, acesse a aba Estabelecimentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
