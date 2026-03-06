import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientAppointments } from '@/hooks/useClientAppointments';

const statusLabels: Record<string, string> = {
  booked: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não compareceu',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  booked: 'outline',
  confirmed: 'default',
  completed: 'secondary',
  canceled: 'destructive',
  no_show: 'destructive',
};

export default function ClientHistory() {
  const { data: appointments = [], isLoading } = useClientAppointments();

  // Filter to only show completed/canceled/no_show appointments
  const historyAppointments = appointments.filter((apt) =>
    ['completed', 'canceled', 'no_show'].includes(apt.status)
  );

  // Group by month/year
  const groupedByMonth = historyAppointments.reduce((acc, apt) => {
    const date = new Date(apt.start_at);
    const key = format(date, 'MMMM yyyy', { locale: ptBR });
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(apt);
    return acc;
  }, {} as Record<string, typeof historyAppointments>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground">Agendamentos finalizados e cancelados</p>
      </div>

      {historyAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Nenhum histórico ainda</h3>
            <p className="text-sm text-muted-foreground">
              Seus agendamentos finalizados aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, apts]) => (
            <div key={month}>
              <h2 className="text-lg font-semibold mb-4 capitalize">{month}</h2>
              <div className="space-y-3">
                {apts.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {apt.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{apt.service.name}</h3>
                            <Badge variant={statusVariants[apt.status]}>
                              {statusLabels[apt.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {apt.establishment.name} • {apt.professional.name}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {format(new Date(apt.start_at), 'dd/MM/yyyy')}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(apt.start_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {historyAppointments.length > 0 && (
        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{historyAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {historyAppointments.filter((a) => a.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {historyAppointments.filter((a) => a.status === 'canceled').length}
                </p>
                <p className="text-sm text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
