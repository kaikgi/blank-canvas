import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Scissors, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PortalAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_duration: number;
  customer_notes: string | null;
}

const statusColors: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-muted text-muted-foreground border-border',
  no_show: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  booked: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  no_show: 'Não compareceu',
  canceled: 'Cancelado',
};

interface ProfessionalAppointmentDialogProps {
  appointment: PortalAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onStatusChanged: () => void;
}

export function ProfessionalAppointmentDialog({
  appointment,
  open,
  onOpenChange,
  token,
  onStatusChanged,
}: ProfessionalAppointmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  if (!appointment) return null;

  const canAct = ['booked', 'confirmed'].includes(appointment.status);

  const handleAction = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      const { data, error } = await (supabase.rpc as any)('professional_update_appointment_status', {
        p_token: token,
        p_appointment_id: appointment.id,
        p_new_status: newStatus,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; message?: string; error?: string };
      if (!result.success) throw new Error(result.error);

      toast({ title: result.message || 'Status atualizado' });
      onStatusChanged();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <DialogDescription>
            {format(parseISO(appointment.start_at), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn('text-xs', statusColors[appointment.status])}>
              {statusLabels[appointment.status]}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">
                  {format(parseISO(appointment.start_at), 'HH:mm')} - {format(parseISO(appointment.end_at), 'HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">{appointment.service_duration} minutos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{appointment.customer_name}</p>
                <p className="text-sm text-muted-foreground">{appointment.customer_phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="font-medium">{appointment.service_name}</p>
            </div>

            {appointment.customer_notes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm">{appointment.customer_notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {canAct && (
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => handleAction('canceled')}
              disabled={!!loading}
            >
              {loading === 'canceled' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('no_show')}
              disabled={!!loading}
            >
              {loading === 'no_show' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Não compareceu
            </Button>
            <Button
              onClick={() => handleAction('completed')}
              disabled={!!loading}
            >
              {loading === 'completed' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Concluir
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
